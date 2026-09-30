const express = require('express');
const router = express.Router();
const { Grievance, Notification } = require('../db');
const auth = require('../middleware/auth');

const upload = require('multer')(); // Memory storage

// Create grievance with optional image
router.get('/ping', (req, res) => res.json({ status: 'ok', message: 'Grievance routes are reachable' }));

// DEBUG ONLY: Publicly expose all grievances to verify saving
router.get('/debug-dump', async (req, res) => {
    try {
        const grievances = await Grievance.find({}).sort({ createdAt: -1 });
        res.json(grievances);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        let aiAnalysis = {};

        // Prepare data for ML service (Text + Image)
        const mlPayload = {
            description: req.body.description,
            tags: typeof req.body.keywords === 'string' ? JSON.parse(req.body.keywords) : req.body.keywords
        };

        if (req.file) {
            // Convert buffer to base64 to send to ML service
            mlPayload.image = req.file.buffer.toString('base64');
            console.log("Image received, size:", req.file.size);
        }

        // Check if frontend already sent AI data (only if NO image, or if frontend analyzed image too?? 
        // Frontend likely won't analyze image locally. So if image exists, we must call ML service 
        // unless frontend did a separate preview call with image)

        if (req.body.priority && req.body.urgencyScore && req.body.sentiment) {
            console.log("Using provided AI analysis from frontend");

            let keywords = req.body.keywords;
            if (typeof keywords === 'string') {
                try {
                    keywords = JSON.parse(keywords);
                } catch (e) {
                    keywords = keywords.split(',').map(k => k.trim());
                }
            }

            aiAnalysis = {
                category: req.body.category,
                priority: req.body.priority,
                urgencyScore: Number(req.body.urgencyScore),
                sentiment: req.body.sentiment,
                keywords: keywords
            };
        } else {
            console.log("Calling ML service (Text + Image)...");
            try {
                const axios = require('axios');
                const response = await axios.post('http://localhost:8000/analyze', mlPayload, { timeout: 15000 });
                aiAnalysis = response.data;
            } catch (mlError) {
                console.error('ML Service unreachable:', mlError.message);
            }
        }

        const grievance = new Grievance({
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            district: req.body.district,
            locationArea: req.body.locationArea,
            accuracy: req.body.accuracy,
            coordinates: req.body.coordinates ? JSON.parse(req.body.coordinates) : null,
            citizenName: req.body.citizenName,
            citizenPhone: req.body.citizenPhone,

            // Store image if present (as base64 string for simplicity in this demo, usually S3 URL)
            imageUrl: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null,

            // AI Enriched Fields - Prioritize aiAnalysis
            category: aiAnalysis.category || req.body.category || 'Other',
            priority: (aiAnalysis.priority || req.body.priority || 'low').toLowerCase(),
            urgencyScore: aiAnalysis.urgencyScore || req.body.urgencyScore || 3,
            sentiment: (aiAnalysis.sentiment || req.body.sentiment || 'neutral').toLowerCase(),
            keywords: aiAnalysis.keywords || req.body.keywords || [],
            detectedObjects: aiAnalysis.detectedObjects || [],
            clusterId: aiAnalysis.clusterId,
            assignedDepartment: aiAnalysis.department || aiAnalysis.category || req.body.assignedDepartment || 'General',

            citizenId: req.user.id,
            timeline: [{
                status: 'submitted',
                timestamp: new Date(),
                message: 'Grievance received and indexed in the neural registry.'
            }]
        });
        await grievance.save();

        // Create notification for citizen
        const notification = new Notification({
            userId: req.user.id,
            title: 'Grievance Submitted',
            message: `Your grievance "${grievance.title}" has been submitted. AI categorized it as ${grievance.category} (${grievance.priority} priority) and assigned to ${grievance.assignedDepartment}.`,
            type: 'success'
        });
        await notification.save();

        res.status(201).json(grievance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Preview AI analysis before submission
router.post('/analyze-preview', auth, upload.single('image'), async (req, res) => {
    try {
        const { description, category, tags } = req.body;
        const mlPayload = {
            description: description || "",
            category: category,
            tags: typeof tags === 'string' ? JSON.parse(tags) : tags
        };

        console.log(`Analyzing Preview: ${description?.substring(0, 50)}...`);
        if (req.file) {
            console.log(`Image attached: ${req.file.originalname} (${req.file.size} bytes)`);
            mlPayload.image = req.file.buffer.toString('base64');
        } else {
            console.log("No image in preview request");
        }

        console.log(`Sending to ML Service: Chars=${mlPayload.description.length}, Category=${mlPayload.category || 'None'}`);

        let aiAnalysis = {};
        try {
            const axios = require('axios');
            // Increased timeout for image processing
            const response = await axios.post('http://localhost:8000/analyze', mlPayload, { timeout: 60000 });
            aiAnalysis = response.data;
        } catch (mlError) {
            console.error('ML Service Failed:', mlError.message);
            if (mlError.response) console.error('ML Response:', mlError.response.data);
            // Fallback mock response if ML service is down
            aiAnalysis = {
                category: "Other",
                priority: "low",
                urgencyScore: 3,
                sentiment: "neutral",
                keywords: [],
                clusterId: null
            };
        }
        res.json(aiAnalysis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get public grievances for dashboard feed
router.get('/public', auth, async (req, res) => {
    try {
        // Fetch last 10 grievances globally, hiding sensitive citizen info for privacy
        const publicGrievances = await Grievance.find({})
            .select('title category status createdAt location district priority urgencyScore sentiment authorityUpdates')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(publicGrievances);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get grievances based on role
router.get('/', auth, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'citizen') {
            query = { citizenId: req.user.id };
        } else if (req.user.role === 'authority') {
            // AUTHORITIES CAN NOW VIEW GLOBAL REGISTRY (As requested)
            // They can filter by department on the frontend, but we send all relevant data
            query = {};
        }
        // Admin gets all by default

        const grievances = await Grievance.find(query).sort({ createdAt: -1 });
        res.json(grievances);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update grievance status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        console.log('Update Status Request:', req.params.id, req.body);
        const { status, resolutionNotes } = req.body;
        const grievance = await Grievance.findById(req.params.id);

        if (!grievance) {
            console.log('Grievance not found');
            return res.status(404).json({ message: 'Grievance not found' });
        }

        console.log('Found Grievance, current status:', grievance.status);
        grievance.status = status;
        if (resolutionNotes) grievance.resolutionNotes = resolutionNotes;
        if (status === 'resolved') grievance.resolvedAt = Date.now();
        if (req.user.role === 'authority') grievance.assignedTo = req.user.id;

        // Record the event in timeline
        const statusMap = {
            'pending': 'Triage complete. Awaiting resource allocation.',
            'in-progress': 'Active resolution node engaged. Department working on the case.',
            'resolved': 'Sequence completed. Issue resolved and verified.',
            'rejected': 'Case voided. Please review policy guidelines.'
        };

        grievance.timeline.push({
            status: status,
            timestamp: new Date(),
            message: statusMap[status] || `Status updated to ${status}`
        });

        await grievance.save();

        // Notify citizen of the progress update
        const notification = new Notification({
            userId: grievance.citizenId,
            title: status === 'resolved' ? 'Case Resolved' : 'Case Progress Updated',
            message: status === 'resolved'
                ? `Authority has resolved your grievance: "${grievance.title}". See resolution notes for details.`
                : `Your grievance "${grievance.title}" is now ${status.toUpperCase()}. The department is actively working on it.`,
            type: status === 'resolved' ? 'success' : 'info'
        });
        await notification.save();

        res.json(grievance);
    } catch (error) {
        console.error('STATUS UPDATE ERROR:', error);
        res.status(400).json({ message: error.message });
    }
});

// Add feedback/rating
router.patch('/:id/feedback', auth, async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const grievance = await Grievance.findOneAndUpdate(
            { _id: req.params.id, citizenId: req.user.id },
            { rating, feedback },
            { new: true }
        );
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
        res.json(grievance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Add authority update
router.post('/:id/updates', auth, async (req, res) => {
    try {
        if (req.user.role !== 'authority' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only authorities can post updates' });
        }
        const { message } = req.body;
        const grievance = await Grievance.findById(req.params.id);
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

        grievance.authorityUpdates.push({ message, timestamp: new Date() });
        await grievance.save();

        // Create notification for citizen
        const notification = new Notification({
            userId: grievance.citizenId,
            title: 'New Update from Authority',
            message: `An official has posted an update on your grievance: "${grievance.title}"`,
            type: 'info'
        });
        await notification.save();

        res.status(201).json(grievance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// React to authority update
router.post('/:id/updates/:updateId/react', auth, async (req, res) => {
    try {
        const { emoji } = req.body;
        const grievance = await Grievance.findById(req.params.id);
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

        const update = grievance.authorityUpdates.id(req.params.updateId);
        if (!update) return res.status(404).json({ message: 'Update not found' });

        // Check if user already reacted with this emoji to this update
        const existingReactionIndex = update.reactions.findIndex(
            r => r.userId.toString() === req.user.id.toString() && r.emoji === emoji
        );

        if (existingReactionIndex > -1) {
            // Remove reaction if it exists
            update.reactions.splice(existingReactionIndex, 1);
        } else {
            // Add new reaction
            update.reactions.push({ emoji, userId: req.user.id });
        }

        await grievance.save();
        res.json(grievance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Award points for a specific grievance
router.post('/:id/award-points', auth, async (req, res) => {
    try {
        if (req.user.role !== 'authority' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: Only authorities can award points.' });
        }

        const { points } = req.body;
        if (![10, 25].includes(points)) {
            return res.status(400).json({ message: 'Invalid point allocation. Only 10 and 25 points are allowed.' });
        }

        const grievance = await Grievance.findById(req.params.id);
        if (!grievance) return res.status(404).json({ message: 'Grievance not found.' });

        if (grievance.pointsAwarded) {
            return res.status(400).json({ message: 'Registry Error: Points already awarded for this node.' });
        }

        const { Citizen } = require('../db');
        const citizen = await Citizen.findById(grievance.citizenId);
        if (!citizen) return res.status(404).json({ message: 'Citizen not found.' });

        citizen.points = (citizen.points || 0) + points;
        await citizen.save();

        grievance.pointsAwarded = true;
        await grievance.save();

        // Notify citizen
        const notification = new Notification({
            userId: grievance.citizenId,
            title: 'Civic Excellence Awarded',
            message: `You have been awarded ${points} Social Service Points for your contribution: "${grievance.title}". Keep up the civic spirit!`,
            type: 'success'
        });
        await notification.save();

        res.json({ success: true, points: citizen.points, grievance });
    } catch (error) {
        console.error('Point Award Error:', error);
        res.status(500).json({ message: 'Neural link interrupted: Server error.' });
    }
});

module.exports = router;
