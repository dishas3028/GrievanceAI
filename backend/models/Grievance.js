const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    locationArea: String,
    accuracy: Number,
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    imageUrl: String,
    status: {
        type: String,
        enum: ['submitted', 'pending', 'in-progress', 'resolved', 'rejected'],
        default: 'submitted'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    urgencyScore: {
        type: Number,
        default: 3
    },
    sentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative', 'critical'],
        default: 'neutral'
    },
    clusterId: Number,
    keywords: [String],
    detectedObjects: [String],
    citizenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Citizen',
        required: true
    },
    citizenName: String,
    citizenPhone: String,
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Authority'
    },
    assignedDepartment: String,
    resolutionNotes: String,
    feedback: String,
    rating: Number,
    timeline: [
        {
            status: String,
            timestamp: { type: Date, default: Date.now },
            message: String
        }
    ],
    resolvedAt: Date,
    authorityUpdates: [
        {
            message: String,
            timestamp: { type: Date, default: Date.now },
            reactions: [
                {
                    emoji: String,
                    userId: { type: mongoose.Schema.Types.ObjectId } // Removed invalid 'User' ref
                }
            ]
        }
    ],
    pointsAwarded: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

grievanceSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = grievanceSchema;
