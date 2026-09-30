const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to Unified GrievanceAI Database'))
    .catch((err) => console.error('Connection error:', err));

const mainConn = mongoose.connection;

const userSchema = require('./models/User');
const grievanceSchema = require('./models/Grievance');
const notificationSchema = require('./models/Notification');

// Register separate models for each role to store them in distinct collections
const Citizen = mongoose.model('Citizen', userSchema, 'users.citizens');
const Authority = mongoose.model('Authority', userSchema, 'users.authorities');
const Admin = mongoose.model('Admin', userSchema, 'users.admins');

module.exports = {
    // No unified 'User' model anymore. We export distinct models.
    Citizen,
    Authority,
    Admin,
    Grievance: mongoose.model('Grievance', grievanceSchema),
    Notification: mongoose.model('Notification', notificationSchema),

    // Helper to get the correct model based on role string
    getUserModel: (role) => {
        switch (role?.toLowerCase()) {
            case 'citizen': return Citizen;
            case 'authority': return Authority;
            case 'admin': return Admin;
            default: return null;
        }
    },

    // Helper to get all user models for iteration
    getAllUserModels: () => [Citizen, Authority, Admin],

    mainConn
};
