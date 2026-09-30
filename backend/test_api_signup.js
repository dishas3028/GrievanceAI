const fetch = require('node-fetch');
const fs = require('fs');

async function test() {
    try {
        // First login as admin to get token
        const loginRes = await fetch('http://localhost:5002/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'aipgs@gmail.com',
                password: 'Aipgs@0911',
                role: 'admin'
            })
        });
        const loginData = await loginRes.json();
        if (!loginData.success) {
            fs.writeFileSync('test_signup_result.json', JSON.stringify({ error: 'Admin login failed', data: loginData }, null, 2));
            return;
        }

        const token = loginData.token;

        // Now attempt to add authority
        const res = await fetch('http://localhost:5002/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: "Real Authority",
                email: "realauth@test.com",
                phone: "9123456789",
                password: "Password@123",
                role: "authority",
                department: "Sanitation"
            })
        });
        const data = await res.json();
        fs.writeFileSync('test_signup_result.json', JSON.stringify(data, null, 2));
    } catch (err) {
        fs.writeFileSync('test_signup_result.json', JSON.stringify({ error: err.message }, null, 2));
    }
}

test();
