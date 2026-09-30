require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');

const logFile = 'email_log.txt';
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

log('Script started at ' + new Date().toISOString());

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to self
    subject: 'Test Email from GrievanceAI Debugger',
    text: 'If you see this, your email configuration is working correctly!'
};

log('Attempting to send email...');
log(`User: ${process.env.EMAIL_USER}`);
// Masking password for log safety
log(`Pass: ${process.env.EMAIL_PASS ? '********' : 'Not Set'}`);

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        log('Error sending email: ' + error);
    } else {
        log('Email sent successfully: ' + info.response);
    }
});
