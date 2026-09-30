const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Citizen, Authority, Admin, Grievance, Notification } = require('./db');

dotenv.config();

const seedData = async () => {
    try {
        console.log('Seeding process skipped to preserve existing registry data.');
        console.log('Test credentials have been removed as requested.');

        // This script is now non-destructive.
        // To seed fresh data, use a dedicated migration or specific seed script.

        process.exit(0);
    } catch (error) {
        console.error('Migration Sync Error:', error);
        process.exit(1);
    }
};

seedData();
