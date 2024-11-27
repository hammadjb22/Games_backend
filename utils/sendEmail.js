const nodemailer = require('nodemailer');

exports.sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'hammadjb22@gmail.com', // Replace with your email
      pass: 'echg nkjl euth hdwc',       // Replace with your password
    },
  });

  const mailOptions = {
    from: 'hammadjb22@gmail.com',
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};
