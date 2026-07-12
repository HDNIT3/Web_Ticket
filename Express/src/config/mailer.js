require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, text, html = null) => {
    const mailOptions = {
        from: `"Movie App" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text
    };
    if (html) mailOptions.html = html;
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;