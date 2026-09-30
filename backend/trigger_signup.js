const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth/signup';

const testUser = {
    name: "Debug User",
    email: process.env.EMAIL_USER || "debug_test_123@gmail.com", // Use the env email if possible to ensure validity, or a dummy one
    password: "Password@123",
    phone: "9876543210",
    role: "citizen"
};

console.log(`Attempting to signup with email: ${testUser.email}`);

axios.post(API_URL, testUser)
    .then(response => {
        console.log('Response:', response.data);
    })
    .catch(error => {
        if (error.response) {
            console.log('Error Response:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    });
