const express = require('express');
const router = express.Router();
const invitationController = require('../controller/invitationController');
const authMiddleware = require('../middleware/authmiddleware');

router.use(authMiddleware);


router.get('/search', invitationController.searchUsers);


router.post('/sendinvitation', invitationController.sendInvitation);


router.patch('/respondinvitation/:senderId', invitationController.respondToInvitation);
router.post('/deleteinvitation', invitationController.deleteInvitation);
router.post('/checkinvitation', invitationController.checkInvitation);
router.get('/getsentinvitation', invitationController.getSentInvitations);
router.get('/getreceiveinvitation', invitationController.getReceivedInvitations);
router.get('/friends', authMiddleware, invitationController.getFriends);



module.exports = router;
