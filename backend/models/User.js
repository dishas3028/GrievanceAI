const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        validate: {
            validator: function (v) {
                const isValid = /^[a-zA-Z\s]+$/.test(v);
                if (!isValid) console.warn(`Name Validation Failed: "${v}"`);
                return isValid;
            },
            message: props => `${props.value} is not a valid name! Name should only contain letters and spaces.`
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Please provide a valid email address']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function (v) {
                // Remove optional +91 prefix for validation, or enforce exactly 10 digits
                const clean = v.replace(/^\+91\s?/, '').replace(/\D/g, '');
                const isValid = /^\d{10}$/.test(clean);
                if (!isValid) console.warn(`Phone Validation Failed: "${v}" (cleaned: "${clean}")`);
                return isValid;
            },
            message: props => `${props.value} is not a valid phone number! Must be exactly 10 digits.`
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        validate: {
            validator: function (v) {
                // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
                const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(v);
                if (!isValid) console.warn(`Password Validation Failed for some user`);
                return isValid;
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
        }
    },
    role: {
        type: String,
        enum: ['citizen', 'authority', 'admin'],
        default: 'citizen'
    },
    department: {
        type: String,
        required: function () { return this.role === 'authority'; }
    },
    avatar: String,
    points: {
        type: Number,
        default: 0
    },
    otp: {
        type: String,
        select: false // Do not return OTP in queries by default
    },
    otpExpires: {
        type: Date,
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    // Safety check: Don't hash if already hashed (bcrypt hashes start with $2)
    if (this.password.startsWith('$2')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = userSchema;
