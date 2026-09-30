const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

async function testAuth() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const { Authority } = require('./db');

        const email = 'test_auth_' + Date.now() + '@test.com';
        const password = 'Password@123';

        console.log('Creating authority with:', { email, password });

        const auth = new Authority({
            name: 'Test Authority',
            email: email,
            phone: '9876543210',
            password: password,
            role: 'authority',
            department: 'Roads & Infrastructure',
            isVerified: true
        });

        await auth.save();
        console.log('Authority saved. Hashed password in DB:', auth.password);

        const found = await Authority.findOne({ email });
        const match = await found.comparePassword(password);
        console.log('Password match check:', match);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

testAuth();
