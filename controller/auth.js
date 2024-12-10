const jwt = require('jsonwebtoken')
const User = require('../model/user').User
const fs = require('fs')
const path = require('path')
const privateKey = fs.readFileSync(path.resolve(__dirname, '../private.key'), 'utf-8')
const bcrypt = require('bcrypt')
const { sendEmail } = require('../utils/sendEmail');
const { generateOTP } = require('../utils/generateToken');



exports.sendEmailVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isEmailVerified) {
      return res
        .status(400)
        .json({ success: false, message: 'Email is already verified.' });
    }

    // Generate new OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    await user.save();

    // Send OTP to user's email
    await sendEmail(user.email, 'Email Verification OTP', `Your OTP is ${otp}`);

    res
      .status(200)
      .json({ success: true, message: 'Email verification OTP sent successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send OTP.', error: err.message });
  }
};


// Step 1: Forgot Password - Request OTP
exports.forgotPassword = async (req, res) => {
  console.log(req.body)
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not valid.' });
    }
    // Generate OTP and set expiry (valid for 10 minutes)
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    // Send OTP to the user's email
    await sendEmail(email, 'Password Reset OTP', `Your OTP is ${otp}`);

    res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
  }
};

// Step 2: Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, type } = req.body; // Extract `type` from request body
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    // OTP verified successfully
    user.otp = null; // Clear OTP
    user.otpExpiry = null; // Clear OTP expiry

    if (type === 'email verification') {
      user.isEmailVerified = true; // Mark email as verified
      await user.save();
      return res.status(200).json({ success: true, message: 'Email verified successfully.' });
    } else if (type === 'forgot password') {
      await user.save();
      return res
        .status(200)
        .json({ success: true, message: 'Forgot password OTP verified successfully.' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid verification type.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Step 3: Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Hash the new password and save
    user.password = bcrypt.hashSync(password, 5);
    user.confirmPassword = bcrypt.hashSync(confirmPassword, 5);
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error processing request.' });
  }
};


const { v4: uuidv4 } = require('uuid'); // Import UUID library

exports.createUser = async (req, res) => {
  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already taken' });
    }

    // Create a new user instance
    const user = new User(req.body);

    // Generate a uniqueId
    user.uniqueId = uuidv4(); // Generates a unique UUID
    // user.profileImage="https://plus.unsplash.com/premium_photo-1689530775582-83b8abdb5020?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmFuZG9tJTIwcGVyc29ufGVufDB8fDB8fHww"
    // Hash the password
    const hash = bcrypt.hashSync(req.body.password, 5);50
    user.password = hash;
    user.confirmPassword = hash;

    // Generate JWT token
    user.token = jwt.sign({ email: req.body.email }, privateKey, { algorithm: 'RS256' });

    // Generate OTP and set expiry
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    // Save the user to the database
    await user.save();

    // Send OTP to the user's email
    await sendEmail(user.email, 'Email Verification OTP', `Your OTP is ${otp}`);

    // Send success response
    res.status(201).json({ success: true, message: 'User created successfully. Verification OTP sent to email.' });
  } catch (err) {
    if (err.code === 11000) {
      // Handling duplicate key error
      const field = Object.keys(err.keyValue)[0]; // Get the field causing the error
      return res.status(400).json({
        success: false,
        message: `The ${field} "${err.keyValue[field]}" is already taken.`,
      });
    }
    // Handle other errors
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify your email before logging in.',
      });
    }

    // Check if account is locked
    if (user.lockUntil && Date.now() < user.lockUntil) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000); // Minutes remaining
      return res.status(403).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again after ${remainingTime} minutes.`,
      });
    }

    // Verify password
    const isAuthenticated = bcrypt.compareSync(password, user.password);
    if (!isAuthenticated) {
      user.loginAttempts += 1;

      // Lock account if login attempts exceed limit
      if (user.loginAttempts >= 3) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
        await user.save();
        return res.status(403).json({
          success: false,
          message: `Account locked due to too many failed attempts. Try again after 15 minutes.`,
        });
      }

      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if user is already logged in
    if (user.isLoggedIn) {
      return res.status(403).json({
        success: false,
        message: 'User is already logged in from another session',
      });
    }

    // Generate JWT token
    const token = jwt.sign({ email }, privateKey, { algorithm: 'RS256' });

    // Reset login attempts and update user login status
    user.token = token;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.isLoggedIn = true;
    await user.save();

    return res.status(200).json({ success: true, token, user });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, message:error });
  }
};
