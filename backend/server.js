const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger for debugging
app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth')) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
});

// Database connection
const db = require('./db');

// Routes
const authRoutes = require('./routes/auth');
const grievanceRoutes = require('./routes/grievances');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Checks
app.get('/api/ping', (req, res) => res.json({ status: 'active', timestamp: new Date() }));
app.get('/api/db-diag', async (req, res) => {
    try {
        const { Citizen, Authority, Admin, Grievance } = require('./db');
        const authorities = await Authority.find({}, 'name email isVerified role department');
        const stats = {
            counts: {
                citizens: await Citizen.countDocuments(),
                authorities: await Authority.countDocuments(),
                admins: await Admin.countDocuments(),
                grievances: await Grievance.countDocuments()
            },
            authorities: authorities,
            dbState: mongoose.connection.readyState
        };
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

app.listen(PORT, async () => {
    console.log(`========================================`);
    console.log(`  GrievanceAI Backend - Port ${PORT}`);
    console.log(`  Database: ${process.env.MONGODB_URI}`);
    console.log(`========================================`);

    // Seed Admin Account (Wait for connection)
    if (mongoose.connection.readyState === 1) {
        const seedAdmin = require('./scripts/seedAdmin');
        await seedAdmin();
    } else {
        mongoose.connection.once('open', async () => {
            const seedAdmin = require('./scripts/seedAdmin');
            await seedAdmin();
        });
    }
});
