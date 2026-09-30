const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { getUserModel } = require('../db');

dotenv.config();

const seedAdmin = async () => {
    try {
        const adminEmail = "aipgs@gmail.com";
        const adminPassword = "Aipgs@0911";
        const adminName = "System Admin";

        const AdminModel = getUserModel('admin');
        const existingAdmin = await AdminModel.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log("Admin account already exists.");
            // Optional: Update password if needed, but safe to leave if exists
            // To strictly enforce, we could update the password here.
            // Let's update it to ensure it matches the user's strict requirement
            existingAdmin.password = adminPassword;
            existingAdmin.isVerified = true;
            await existingAdmin.save();
            console.log("Admin credentials enforced.");
        } else {
            console.log("Creating fixed Admin account...");
            const newAdmin = new AdminModel({
                name: adminName,
                email: adminEmail,
                password: adminPassword,
                phone: "0000000000", // Placeholder
                role: 'admin',
                isVerified: true
            });
            await newAdmin.save();
            console.log("Admin account created successfully.");
        }
    } catch (error) {
        console.error("Error seeding admin:", error);
    }
};

module.exports = seedAdmin;
