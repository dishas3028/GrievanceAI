const { Citizen, Grievance } = require('./db');
const mongoose = require('mongoose');

async function seed() {
    try {
        console.log("Waiting for database connection...");
        if (mongoose.connection.readyState !== 1) {
            await new Promise(resolve => mongoose.connection.once('open', resolve));
        }
        console.log("Database connected.");

        const email = 'gouri@gmail.com';
        let user = await Citizen.findOne({ email });

        if (!user) {
            console.log(`User ${email} not found. Creating test user...`);
            user = await Citizen.create({
                name: 'Gouri Singh',
                email: email,
                password: 'Password@123',
                phone: '9876543210',
                role: 'citizen',
                points: 50
            });
        }

        console.log(`Seeding grievances for: ${user.name} (${user._id})`);

        // Clear existing grievances for this user to avoid duplicates if run multiple times? 
        // User said "add some test data", not "replace". I'll just add.

        const complaints = [
            {
                title: "Urgent: Deep Pothole on MG Road",
                description: "A very deep pothole has formed near the metro station. Two bikes have already skidded. Needs immediate repair.",
                category: "Roads & Infrastructure",
                location: "MG Road Metro Station Gate 2",
                district: "Central",
                status: "submitted",
                priority: "high",
                urgencyScore: 88,
                sentiment: "negative",
                keywords: ["pothole", "accident risk", "urgent"],
                clusterId: 101
            },
            {
                title: "Garbage Overflow at Sector 14 Market",
                description: "The main dumpster is overflowing and blocking the walkway. The smell is unbearable and attracting stray animals.",
                category: "Sanitation",
                location: "Sector 14 Main Market",
                district: "North",
                status: "in-progress",
                priority: "critical",
                urgencyScore: 95,
                sentiment: "critical",
                keywords: ["garbage", "health hazard", "blockage"],
                assignedDepartment: "Sanitation",
                timeline: [
                    { status: 'submitted', message: 'Complaint registered', timestamp: new Date(Date.now() - 172800000) },
                    { status: 'in-progress', message: 'Clean-up crew assigned', timestamp: new Date() }
                ]
            },
            {
                title: "Street Light Flicker - Safety Issue",
                description: "Street light pole #22 near the girls' school is flickering continuously. It's pitch dark when it goes off.",
                category: "Electricity",
                location: "Girls School Road, Vasant Vihar",
                district: "South",
                status: "resolved",
                priority: "medium",
                urgencyScore: 65,
                sentiment: "negative",
                keywords: ["street light", "safety", "darkness"],
                assignedDepartment: "Electricity",
                resolvedAt: new Date(Date.now() - 86400000),
                resolutionNotes: "Bulb replaced and wiring fixed by Team A.",
                timeline: [
                    { status: 'submitted', message: 'Complaint registered', timestamp: new Date(Date.now() - 604800000) },
                    { status: 'processed', message: 'Forwarded to Electricity Dept', timestamp: new Date(Date.now() - 518400000) },
                    { status: 'resolved', message: 'Issue Fixed', timestamp: new Date(Date.now() - 86400000) }
                ]
            },
            {
                title: "Water Contamination Alert",
                description: "Tap water is coming out muddy and smelling foul since this morning. Please check the supply lines.",
                category: "Water Supply",
                location: "H-Block, Sarita Vihar",
                district: "East",
                status: "pending",
                priority: "high",
                urgencyScore: 82,
                sentiment: "negative",
                keywords: ["water quality", "contamination", "health"],
                assignedDepartment: "Water Supply"
            },
            {
                title: "Unauthorized Construction Noise",
                description: "Compliance check regarding noise levels late at night from construction site next to hospital.",
                category: "Law & Order",
                location: "City Hospital Zone",
                district: "West",
                status: "rejected",
                priority: "low",
                urgencyScore: 40,
                sentiment: "neutral",
                keywords: ["noise pollution", "construction"],
                resolutionNotes: "Site has valid permit for night work until 11 PM. Complaint rejected as activity was within permitted hours."
            }
        ];

        for (const data of complaints) {
            await Grievance.create({
                ...data,
                citizenId: user._id,
                citizenName: user.name,
                citizenPhone: user.phone,
                locationArea: data.location,
                accuracy: 90 + Math.random() * 10,
                coordinates: {
                    latitude: 28.6139 + (Math.random() * 0.1 - 0.05),
                    longitude: 77.2090 + (Math.random() * 0.1 - 0.05)
                }
            });
            console.log(`Added: ${data.title} (${data.status})`);
        }

        console.log("Seed complete. Exiting...");
        process.exit(0);

    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
}

seed();
