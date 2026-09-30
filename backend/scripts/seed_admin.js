const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Admin } = require('./db');
dotenv.config();

async function seedAdmin() {
    try {
        console.log("Connecting to Database...");
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
        console.log("Connected.");

        const email = 'aipgis@gmail.com';
        const password = 'Aipgis@0911'; // Will be hashed by pre-save hook

        let admin = await Admin.findOne({ email });

        if (admin) {
            console.log("Admin already exists. Updating credentials to ensure they are correct...");
            admin.password = password; // Trigger pre-save hash
            admin.name = "ALKA";
            await admin.save();
            console.log("Admin credentials updated.");
        } else {
            console.log("Creating Super Admin...");
            await Admin.create({
                name: "ALKA",
                email: email,
                password: password,
                role: 'admin',
                phone: '9999999999' // Dummy phone for validation
            });
            console.log("Super Admin Created Successfully.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Admin Seeding Failed:", error);
        process.exit(1);
    }
}

seedAdmin();
