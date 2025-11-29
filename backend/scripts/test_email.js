require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

(async function () {
    console.log('🔑 Testing Resend API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
    console.log('📧 Sender:', process.env.SENDER_EMAIL);

    try {
        const data = await resend.emails.send({
            from: 'Remesas A&M <' + (process.env.SENDER_EMAIL || 'onboarding@resend.dev') + '>',
            to: ['delivered@resend.dev'], // Correo de prueba seguro de Resend
            subject: 'Test Email from Remesas A&M',
            html: '<strong>It works!</strong>',
        });

        if (data.error) {
            console.error('❌ API Error:', data.error);
        } else {
            console.log('✅ Email sent successfully to delivered@resend.dev');
            console.log('🆔 ID:', data.data ? data.data.id : data.id);
        }
    } catch (error) {
        console.error('❌ Exception:', error.message);
    }
})();
