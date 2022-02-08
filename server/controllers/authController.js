const User = require('../models/User');
const Token = require('../models/Token');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const {
   attachCookiesToResponse,
   createTokenUser,
   sendVerificationEmail,
} = require('../utils');
const crypto = require('crypto');

const register = async (req, res) => {
   const { email, name, password } = req.body;

   const emailAlreadyExists = await User.findOne({ email });
   if (emailAlreadyExists) {
      throw new CustomError.BadRequestError('Email already exists');
   }

   // first registered user is an admin
   const isFirstAccount = (await User.countDocuments({})) === 0;
   const role = isFirstAccount ? 'admin' : 'user';

   const verificationToken = crypto.randomBytes(40).toString('hex');

   const user = await User.create({
      name,
      email,
      password,
      role,
      verificationToken,
   });

   // 🔥🔥🔥
   // hay q cambiarlo cuando esté en producción a la dirección donde va a estar el front, como podria ser 'https://react-auth-workflow.netlify.app', o donde sea q se suba el front
   const origin = 'http://localhost:3000';

   //=====//=====//=====//=====//=====//=====//=====//=====
   //=====//=====//=====//=====//=====//=====//=====//=====
   // const originnn = req.get('origin');
   // console.log(`origin: ${originnn}`); //http://localhost:5000 de donde viene el req

   // const protocol = req.protocol;
   // console.log(`protocol: ${protocol}`); // http
   // const host = req.get('host');
   // console.log(`host: ${host}`); // localhost:5000

   // const forwardedHost = req.get('x-forwarded-host');
   // const forwardedProtocol = req.get('x-forwarded-proto');
   // console.log(`forwarded Host: ${forwardedHost}`); // localhost:3000 el q necesito
   // console.log(`forwarded Protocol: ${forwardedProtocol}`); // http
   //=====//=====//=====//=====//=====//=====//=====//=====
   //=====//=====//=====//=====//=====//=====//=====//=====

   await sendVerificationEmail({
      name: user.name,
      email: user.email,
      verificationToken: user.verificationToken,
      origin,
   });

   // send verification token back only while testing in postman!!!, despues voy a mandar el email
   res.status(StatusCodes.CREATED).json({
      msg: 'Success!, please check your email to verify your account',
   });
};

const verifyEmail = async (req, res) => {
   const { verificationToken, email } = req.body;

   const user = await User.findOne({ email });
   if (!user) {
      throw new CustomError.UnauthenticatedError('Verification Failed 🤦');
   }

   if (user.verificationToken !== verificationToken) {
      throw new CustomError.UnauthenticatedError('Verification Failed 🤦');
   }

   user.isVerified = true;
   user.verified = Date.now();
   user.verificationToken = '';

   await user.save();

   res.status(StatusCodes.OK).json({ msg: 'Email and user verified 👍' });
};

const login = async (req, res) => {
   const { email, password } = req.body;

   if (!email || !password) {
      throw new CustomError.BadRequestError(
         'Please provide email and password'
      );
   }
   const user = await User.findOne({ email });

   if (!user) {
      throw new CustomError.UnauthenticatedError('Invalid Credentials');
   }
   const isPasswordCorrect = await user.comparePassword(password);

   if (!isPasswordCorrect) {
      throw new CustomError.UnauthenticatedError('Invalid Credentials');
   }
   if (!user.isVerified) {
      throw new CustomError.UnauthenticatedError('Please verify your email');
   }

   const tokenUser = createTokenUser(user);

   // create refresh token
   let refreshToken = '';
   // check for existing token
   const existingToken = await Token.findOne({ user: user._id });

   if (existingToken) {
      const { isValid } = existingToken;
      if (!isValid) {
         throw new CustomError.UnauthenticatedError('Invalid credentials');
      }
      refreshToken = existingToken.refreshToken;

      attachCookiesToResponse({ res, user: tokenUser, refreshToken });
      res.status(StatusCodes.OK).json({ user: tokenUser });

      return;
   }

   refreshToken = crypto.randomBytes(40).toString('hex');
   const userAgent = req.headers['user-agent'];
   const ip = req.ip;
   const userToken = { refreshToken, ip, userAgent, user: user._id };
   await Token.create(userToken);

   attachCookiesToResponse({ res, user: tokenUser, refreshToken });

   res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
   // borro el token de la DB
   await Token.findOneAndDelete({ user: req.user.userId });

   // "borro" las cookies
   res.cookie('accessToken', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now()),
   });
   res.cookie('refreshToken', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now()),
   });

   res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};

module.exports = {
   register,
   login,
   logout,
   verifyEmail,
};
