const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Admin } = require('./db');
dotenv.config();

async function enforceSingleAdmin() {
    try {
        console.log("Connecting to Database...");
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
        console.log("Connected.");

        const targetEmail = 'aipgis@gmail.com';

        // 1. Delete all admins EXcept the target one
        const deletionResult = await Admin.deleteMany({ email: { $ne: targetEmail } });
        console.log(`Deleted ${deletionResult.deletedCount} unauthorized admin accounts.`);

        // 2. Ensure the specific admin exists and has correct credentials
        const targetAdmin = await Admin.findOne({ email: targetEmail });

        if (!targetAdmin) {
            console.log("Target Admin not found. Creating it...");
            await Admin.create({
                name: "Super Admin",
                email: targetEmail,
                password: "Aipgis@0911", // Will be hashed by pre-save
                role: "admin",
                phone: "0000000000"
            });
            console.log("Super Admin Created.");
        } else {
            console.log("Target Admin exists. Verifying integrity...");
            // customized strict enforcement could go here, but we trust the existing record from seed_admin.js
        }

        console.log("✅ ENFORCEMENT COMPLETE: Only one admin ('aipgis@gmail.com') remains.");
        process.exit(0);
    } catch (error) {
        console.error("Enforcement Failed:", error);
        process.exit(1);
    }
}

enforceSingleAdmin();
