const nodemailer = require('nodemailer');
const nodemailerConfig = require('./nodemailerConfig');

// con Etherial
const sendEmail = async ({ to, subject, html }) => {
   // esta es de nodemailer
   let testAccount = await nodemailer.createTestAccount();

   // esta de ethereal
   const transporter = nodemailer.createTransport(nodemailerConfig);

   // esta de nodemailer
   return transporter.sendMail({
      from: '"A-rielox" <arielox.ag@gmail.com>', // sender address
      to,
      subject,
      html,
   });
};

module.exports = sendEmail;
