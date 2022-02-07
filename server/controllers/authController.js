const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { attachCookiesToResponse, createTokenUser } = require('../utils');

const register = async (req, res) => {
   const { email, name, password } = req.body;

   const emailAlreadyExists = await User.findOne({ email });
   if (emailAlreadyExists) {
      throw new CustomError.BadRequestError('Email already exists');
   }

   // first registered user is an admin
   const isFirstAccount = (await User.countDocuments({})) === 0;
   const role = isFirstAccount ? 'admin' : 'user';

   const verificationToken = 'fake token';

   const user = await User.create({
      name,
      email,
      password,
      role,
      verificationToken,
   });

   // send verification token back only while testing in postman!!!
   res.status(StatusCodes.CREATED).json({
      msg: 'Success!, please check your email to verify your account',
      verificationToken: user.verificationToken,
   });
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
   attachCookiesToResponse({ res, user: tokenUser });

   res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
   res.cookie('token', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now() + 1000),
   });
   res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};

module.exports = {
   register,
   login,
   logout,
};
