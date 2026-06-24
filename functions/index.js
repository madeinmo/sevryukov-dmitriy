const nodemailer = require('nodemailer');

// Yandex Cloud Function Entry Point
module.exports.handler = async function (event, context) {
    try {
        // Handle preflight CORS request
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: ''
            };
        }

        // Only allow POST
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Method Not Allowed' })
            };
        }

        const body = event.isBase64Encoded 
            ? JSON.parse(Buffer.from(event.body, 'base64').toString('utf8'))
            : JSON.parse(event.body);

        // Check honeypot field (bot protection)
        if (body.bot_field) {
            console.log('Bot detected via honeypot');
            // Return success to fool the bot
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true })
            };
        }

        // Validate required fields
        const { name, phone, service } = body;
        if (!name || !phone) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Name and phone are required' })
            };
        }

        // Setup Nodemailer transport using Yandex Postbox or any SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.yandex.ru',
            port: process.env.SMTP_PORT || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Email HTML template
        const htmlContent = `
            <h2>Новая заявка с сайта sevryukov-osteo.ru</h2>
            <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
                <tr>
                    <td style="background-color: #f5f5f5; width: 30%;"><strong>Имя пациента:</strong></td>
                    <td>${name}</td>
                </tr>
                <tr>
                    <td style="background-color: #f5f5f5;"><strong>Телефон:</strong></td>
                    <td><a href="tel:${phone}">${phone}</a></td>
                </tr>
                <tr>
                    <td style="background-color: #f5f5f5;"><strong>Услуга:</strong></td>
                    <td>${service || 'Не указана'}</td>
                </tr>
            </table>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">Это автоматическое уведомление. Пожалуйста, не отвечайте на него.</p>
        `;

        // Send email
        await transporter.sendMail({
            from: `"Сайт Севрюков Д.И." <${process.env.SMTP_USER}>`,
            to: process.env.DOCTOR_EMAIL,
            subject: 'Новая заявка на прием',
            html: htmlContent,
        });

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
