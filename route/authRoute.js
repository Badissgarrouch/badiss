
const router =require ('express').Router();
const {signup,login,verifyOtp, forgotPassword, verifyPasswordResetOtp, resetPassword} = require('../controller/authController');
router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/verify-otp').post(verifyOtp);
router.route('/forgot-password').post(forgotPassword);
router.route('/verify-password-reset-otp').post(verifyPasswordResetOtp);
router.route('/reset-password').post(resetPassword);
module.exports = router;