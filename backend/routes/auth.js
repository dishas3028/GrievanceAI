const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getUserModel, getAllUserModels } = require('../db');

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

function logDebug(message) {
    const logPath = path.join(__dirname, '../debug_email.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// Email Transporter (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
        logDebug('Transporter Verification Error: ' + error);
    } else {
        console.log("Server is ready to take our messages");
        logDebug('Transporter Verified Successfully');
    }
});

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, password, role, department } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Strict Role Constraints
        if (role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admin account creation is restricted.' });
        }

        if (role === 'authority') {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(403).json({ success: false, message: 'Authority accounts can only be created by an Administrator.' });
            }
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.role !== 'admin') {
                    throw new Error('Unauthorized');
                }
            } catch (err) {
                return res.status(403).json({ success: false, message: 'Unauthorized: Only Admins can create Authority nodes.' });
            }
        }

        console.log(`Signup Attempt: ${normalizedEmail} (${role})`);

        const UserModel = getUserModel(role);
        if (!UserModel) {
            return res.status(400).json({ success: false, message: 'Invalid role specified.' });
        }

        // Check if user exists in ANY collection
        const allModels = getAllUserModels();
        for (const model of allModels) {
            const exists = await model.findOne({ email: normalizedEmail });
            if (exists) {
                if (exists.isVerified) {
                    console.warn(`Signup Failed: Email already registered - ${normalizedEmail}`);
                    return res.status(400).json({ success: false, message: 'This email is already registered.' });
                } else {
                    // If user exists but NOT verified, we can overwrite or handle re-verification
                    // For now, let's allow re-signup/overwrite if unverified (simple approach) or just error
                    // Better approach: Error and ask to login/resend OTP. 
                    // Let's stick to standard "Email taken" message to avoid complexity for now, 
                    // unless we want to implement "Resend OTP for unverified account" flow in signup.
                    return res.status(400).json({ success: false, message: 'Account exists but is unverified. Please log in to verify.' });
                }
            }
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // If creator is admin and role is authority, auto-verify
        let creatorIsAdmin = false;
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.role === 'admin') creatorIsAdmin = true;
            } catch (err) { }
        }

        const user = new UserModel({
            name,
            email: normalizedEmail,
            phone,
            password,
            role,
            department,
            otp: (role === 'authority' && creatorIsAdmin) ? undefined : otp,
            otpExpires: (role === 'authority' && creatorIsAdmin) ? undefined : otpExpires,
            isVerified: (role === 'authority' && creatorIsAdmin) ? true : false
        });

        console.log(`Saving user to ${UserModel.collection.name}...`);
        try {
            await user.save();
        } catch (saveErr) {
            console.error('DATABASE SAVE ERROR:', saveErr);
            throw saveErr;
        }
        console.log(`User created. Verified: ${user.isVerified}, ID: ${user._id}`);

        if (user.isVerified) {
            return res.status(201).json({
                success: true,
                message: 'Authority Node Authorized & Active.',
                userId: user._id,
                isVerified: true
            });
        }

        // Send OTP Email (Only for unverified)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: normalizedEmail,
            subject: 'Verify Your GrievanceAI Account',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome to GrievanceAI! 🚀</h2>
                    <p>Your OTP for account verification is:</p>
                    <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
                    <p>This code is valid for 10 minutes.</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`OTP sent to ${normalizedEmail}`);
        } catch (emailErr) {
            console.warn('Email delivery failed:', emailErr.message);
            // Don't fail signup if email fails in dev, but notify
        }

        // Return Success with userId (NO TOKEN YET)
        res.status(201).json({
            success: true,
            msg: 'User created, OTP sent',
            otpRequired: true,
            userId: user._id,
            email: normalizedEmail
        });

    } catch (error) {
        console.error('Signup Route Failure:', error);
        logDebug(`Signup Error for ${req.body.email}: ${error.message}`);
        res.status(400).json({ success: false, message: error.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { userId, otp } = req.body;

        // Find user by ID (we don't know role, so search all models or pass role? 
        // passing role from frontend is easier, or we iterate models)
        // Since signup returns userId, we can just search all models or assume Citizen for public signup.
        // But better to iterate to be safe.

        const allModels = getAllUserModels();
        let user = null;

        for (const model of allModels) {
            user = await model.findById(userId).select('+otp +otpExpires');
            if (user) break;
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(200).json({ success: true, message: 'Already verified. Please login.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired. Please resend.' });
        }

        // Success: Clear OTP and Verify
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.lastLogin = new Date();
        await user.save();

        // Generate Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        const { password: _, otp: __, otpExpires: ___, ...userData } = user.toObject();

        res.json({ success: true, msg: "Account verified", token, user: userData });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ success: false, message: 'Server error during verification.' });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { userId, email } = req.body; // Can accept either

        let user = null;
        let UserModel = null;
        const allModels = getAllUserModels();

        if (userId) {
            for (const model of allModels) {
                user = await model.findById(userId);
                if (user) { UserModel = model; break; }
            }
        } else if (email) {
            for (const model of allModels) {
                user = await model.findOne({ email: email.toLowerCase() });
                if (user) { UserModel = model; break; }
            }
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Account already verified.' });
        }

        // Generate new OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Resend: Verify Your GrievanceAI Account',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>New OTP Requested 🔄</h2>
                    <p>Your new OTP code is:</p>
                    <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
                    <p>Valid for 10 minutes.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'OTP has been resent to your email.' });

    } catch (error) {
        console.error('Resend OTP Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body; // Role is optional but helpful
        const loginEmail = email.toLowerCase().trim();
        console.log(`Login Attempt: ${loginEmail} (Role hint: ${role || 'none'})`);

        let user = null;
        let UserModel = null;

        // Strategy: If role is provided, check that collection first/only.
        // If not, check all collections.

        if (role) {
            UserModel = getUserModel(role);
            if (UserModel) {
                user = await UserModel.findOne({ email: loginEmail });
            }
        } else {
            // Iterate all models to find user
            const allModels = getAllUserModels();
            for (const model of allModels) {
                user = await model.findOne({ email: loginEmail });
                if (user) {
                    UserModel = model;
                    break;
                }
            }
        }

        if (!user || !(await user.comparePassword(password))) {
            console.warn(`Login Failed: Invalid credentials for ${loginEmail}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Account verified not. Please verify your email.',
                isVerified: false,
                userId: user._id
            });
        }

        // Strict role matching if role was provided in request
        if (role && user.role !== role) {
            console.warn(`Role Mismatch: Found in ${user.role}, requested ${role}`);
            return res.status(403).json({
                success: false,
                message: `Portal Mismatch: You are registered as a ${user.role}. Please use the correct login.`
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        const { password: _, ...userData } = user.toObject();

        console.log(`Login Success: ${loginEmail} as ${user.role}`);
        res.json({ success: true, token, user: userData });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

const auth = require('../middleware/auth');

// Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const UserModel = getUserModel(req.user.role);
        if (!UserModel) {
            return res.status(404).json({ success: false, message: 'Invalid role model.' });
        }
        const user = await UserModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const { password, otp, otpExpires, ...userData } = user.toObject();
        res.json(userData);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all users (Admin only)
router.get('/users', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const allUserModels = getAllUserModels();
        let allUsers = [];

        for (const model of allUserModels) {
            const users = await model.find({}, '-password');
            allUsers = [...allUsers, ...users];
        }

        res.json(allUsers);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete user (Admin only)
router.delete('/users/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const allUserModels = getAllUserModels();
        let deleted = false;

        for (const model of allUserModels) {
            const result = await model.findByIdAndDelete(req.params.id);
            if (result) {
                deleted = true;
                break;
            }
        }

        if (deleted) {
            res.json({ success: true, message: 'User deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Award points to citizen (Authority/Admin only)
router.patch('/users/:id/points', auth, async (req, res) => {
    try {
        if (req.user.role !== 'authority' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized: Only authorities can award points.' });
        }

        const { points } = req.body;
        if (![10, 25].includes(points)) {
            return res.status(400).json({ success: false, message: 'Invalid point allocation. Only 10 and 25 points are allowed.' });
        }

        const allUserModels = getAllUserModels();
        let targetUser = null;
        let UserModel = null;

        for (const model of allUserModels) {
            targetUser = await model.findById(req.params.id);
            if (targetUser) {
                UserModel = model;
                break;
            }
        }

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Citizen node not found.' });
        }

        if (targetUser.role !== 'citizen') {
            return res.status(400).json({ success: false, message: 'Registry Error: Points can only be awarded to citizen nodes.' });
        }

        targetUser.points = (targetUser.points || 0) + points;
        await targetUser.save();

        console.log(`Points awarded: +${points} to user ${targetUser.email}`);
        res.json({ success: true, message: `Successfully transmitted ${points} points.`, points: targetUser.points });
    } catch (error) {
        console.error('Point allocation error:', error);
        res.status(500).json({ success: false, message: 'Neural link interrupted: Server error.' });
    }
});

module.exports = router;
