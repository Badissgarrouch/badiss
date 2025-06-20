
const router =require ('express').Router();
const {signup,login,verifyOtp, forgotPassword, verifyPasswordResetOtp, resetPassword,checkUserExistence,getUserInfo,updateUserInfo} = require('../controller/authController');
router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/verify-otp').post(verifyOtp);
router.route('/forgot-password').post(forgotPassword);
router.route('/verify-password-reset-otp').post(verifyPasswordResetOtp);
router.route('/reset-password').post(resetPassword);
router.route('/check-user').post(checkUserExistence);
router.route('/getuserinfo/:userId').get(getUserInfo);
router.route('/updateinfo').put(updateUserInfo);
module.exports = router;

