const express=require('express');
 const router=express.Router();
 exports.router=router
const authController=require('../controller/auth');
const { forgotPasswordLimiter } = require('../utils/fogotPasswordLimiter');

router.post('/register',authController.createUser)
router.post('/login',authController.login)
router.post('/logout',authController.logout)

// Forgot Password Routes
router.post('/forgotPassword',forgotPasswordLimiter, authController.forgotPassword);
router.post('/verifyOtp', authController.verifyOTP);
router.post('/resetPassword', authController.resetPassword);
// email verification
router.post('/send-email-verification-otp', authController.sendEmailVerificationOTP);