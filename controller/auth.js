const jwt = require('jsonwebtoken')
const User = require('../model/user').User
const fs = require('fs')
const path = require('path')
const privateKey = fs.readFileSync(path.resolve(__dirname, '../private.key'), 'utf-8')
const bcrypt = require('bcrypt')
const { sendEmail } = require('../utils/sendEmail');
const { generateOTP } = require('../utils/generateToken');


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
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    // OTP verified successfully, clear OTP and expiry
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err });
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


exports.createUser = async (req, res) => {
  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already taken' });
    }
   

    // Create a new user instance
    const user = new User(req.body);

    // Hash the password
    const hash = bcrypt.hashSync(req.body.password, 5);
    user.password = hash;
    user.confirmPassword = hash;

    // Generate JWT token
    user.token = jwt.sign({ email: req.body.email }, privateKey, { algorithm: 'RS256' });

    // Save the user to the database
    // await user.save();
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    // Send OTP to the user's email
    

    // Send success response
    res.status(201).json({ success: true, description: 'User created successfully' });
    await sendEmail(user.email, 'Email Verification OTP', `Your OTP is ${otp}`);
  } catch (err) {
    // console.error('Error saving user:', err);
    if (err.code === 11000) {
      // Handling duplicate key error
      const field = Object.keys(err.keyValue)[0]; // Get the field causing the error
      return res.status(400).json({
        success: false,
        message: `The ${field} "${err.keyValue[field]}" is already taken.`,
      });
    }
    // Handle other errors
    res.status(500).json({ success: false, message: err});
  }
  // res.status(400).json({ success: false, description: 'Error creating user', error: err });
};

exports.login = async (req, res) => {
  try {
    const doc = await User.findOne({ email: req.body.email })
      if(doc){
        const isAuthenticated = bcrypt.compareSync(req.body.password, doc.password)
        if (doc.lockUntil==undefined||Date.now() >= doc.lockUntil){
          if (isAuthenticated) {
            const token = jwt.sign({ email: req.body.email }, privateKey, { algorithm: 'RS256' })
            doc.token = token
            doc.loginAttempts = 0;
            doc.lockUntil = undefined;
            doc.save()
            res.status(200).json({ token,success: true })
          } else {
            doc.loginAttempts += 1;
    
            // Lock account if login attempts exceed 3
            if (doc.loginAttempts >= 3) {
              doc.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
              await doc.save();
              return res.status(403).json({
                success: false,
                message: `Account locked due to too many failed attempts. Try again after 15 minutes.`
              });
            }
    
            await doc.save();
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
          }
        }
        else{
          return res.status(403).json({
            result: 'fail',
            message: `Account locked due to too many failed attempts. Try again after 15 minutes.`
          });
        }
      }
      else{
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
  }
  catch (err) {
    res.status(401).json(err)
  }
};
