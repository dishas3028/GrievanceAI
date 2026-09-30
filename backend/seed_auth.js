const mongoose = require('mongoose');
const { Authority } = require('./db');

async function check() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grievanceDB');
        console.log('Connected');

        const count = await Authority.countDocuments();
        console.log('Authority Count:', count);

        const testAuth = new Authority({
            name: "Test Authority",
            email: "testauth@example.com",
            phone: "9876543210",
            password: "Password@123",
            role: "authority",
            department: "Roads & Infrastructure",
            isVerified: true
        });

        await testAuth.save();
        console.log('Test Authority Saved');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
