require('dotenv').config();
const sendEmail = require('./utils/email');  // adjust path if needed

(async () => {
  try {
    await sendEmail({
      email: 'uplistagency@gmail.com',
      subject: 'Test Email from Node.js',
      message: 'This is a test email to verify the sendEmail utility.'
    });
    console.log('Test email sent successfully!');
  } catch (err) {
    console.error('Test email failed:', err);
  }
})();
