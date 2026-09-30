const axios = require('axios');
const fs = require('fs');

async function test() {
    try {
        // First login as admin
        const loginRes = await axios.post('http://localhost:5002/api/auth/login', {
            email: 'aipgs@gmail.com',
            password: 'Aipgs@0911',
            role: 'admin'
        });

        const token = loginRes.data.token;

        // Now add authority
        const res = await axios.post('http://localhost:5002/api/auth/signup', {
            name: "Real Authority",
            email: "realauth@test.com",
            phone: "9123456789",
            password: "Password@123",
            role: "authority",
            department: "Sanitation"
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        fs.writeFileSync('test_signup_result.json', JSON.stringify(res.data, null, 2));
    } catch (err) {
        fs.writeFileSync('test_signup_result.json', JSON.stringify({
            error: err.message,
            responseData: err.response?.data
        }, null, 2));
    }
}

test();
