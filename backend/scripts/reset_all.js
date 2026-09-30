const { getAllUserModels, mainConn } = require('./db');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function resetPasswords() {
    try {
        console.log('--- RESETTING ALL PASSWORDS TO "password123" ---');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const models = getAllUserModels();

        for (const model of models) {
            const result = await model.updateMany({}, {
                $set: { password: hashedPassword }
            });
            console.log(`Updated ${result.modifiedCount} users in ${model.modelName}`);
        }

        console.log('--- SUCCESS ---');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

// Wait for connection
setTimeout(resetPasswords, 2000);
