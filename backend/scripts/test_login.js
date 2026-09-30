const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login for citizen@test.com with password123...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'citizen@test.com',
            password: 'password123'
        });
        console.log('Login Success:', response.data.token ? 'YES' : 'NO');
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
    }
}

testLogin();
