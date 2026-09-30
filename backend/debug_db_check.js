const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const { Citizen, Authority, Admin, Grievance } = require('./db');

        console.log('--- COUNT ---');
        console.log('Citizens:', await Citizen.countDocuments());
        console.log('Authorities:', await Authority.countDocuments());
        console.log('Admins:', await Admin.countDocuments());
        console.log('Grievances:', await Grievance.countDocuments());

        console.log('\n--- LATEST AUTHORITY ---');
        const latestAuth = await Authority.findOne().sort({ createdAt: -1 });
        console.log(latestAuth);

        console.log('\n--- LATEST GRIEVANCE ---');
        const latestGrievance = await Grievance.findOne().sort({ createdAt: -1 });
        console.log(latestGrievance);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkData();
