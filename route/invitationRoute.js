const express = require('express');
const router = express.Router();
const invitationController = require('../controller/invitationController');
const authMiddleware = require('../middleware/authmiddleware');

router.use(authMiddleware);

// Rechercher des utilisateurs
router.get('/search', invitationController.searchUsers);

// Envoyer une invitation
router.post('/sendinvitation', invitationController.sendInvitation);

// Répondre à une invitation en spécifiant l'ID de l'expéditeur
router.patch('/respondinvitation/:senderId', invitationController.respondToInvitation);
router.post('/deleteinvitation', invitationController.deleteInvitation);
router.post('/checkinvitation', invitationController.checkInvitation);



module.exports = router;
