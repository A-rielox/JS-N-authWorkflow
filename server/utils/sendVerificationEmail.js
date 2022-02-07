const sendEmail = require('./sendEmail');

const sendVerificationEmail = async ({
   name,
   email,
   verificationToken,
   origin,
}) => {
   const verifyEmail = `${origin}/user/verify-email?token=${verificationToken}&email=${email}`;

   const message = `<p>Please confirm your email by clicking on the following link : <a href="${verifyEmail}" >Verify Email</a> </p>`;

   return sendEmail({
      to: email,
      subject: 'Email Confirmation',
      html: `<h4> Hello, ${name}</h4>
      ${message}`,
   });
};

module.exports = sendVerificationEmail;

// /user/verify-email es una ruta q existe en mi front , está en app.js , esta carga la página Verify.js q hace:

// try {
//    const { data } = await axios.post('/api/v1/auth/verify-email', {
//      verificationToken: query.get('token'),
//      email: query.get('email'),
//    });
//  } catch (error) {
//    // console.log(error.response);
//    setError(true);
//  }

// manda un req a la ruta /api/v1/auth/verify-email, q ocupa el controlador verifyEmail de controllers
