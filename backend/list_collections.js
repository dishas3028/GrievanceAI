const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function listCollections() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const { Citizen, Authority, Admin } = require('./db');
        console.log('Citizens count:', await Citizen.countDocuments());
        console.log('Authorities count:', await Authority.countDocuments());

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

listCollections();
