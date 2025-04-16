const db = require('../models');
const user= db.user;
const invitation = db.Invitation;
const { Op } = require('sequelize');


// Recherche d'utilisateurs
exports.searchUsers = async (req, res) => {
  try {
    const { searchTerm, userType } = req.query; // Garder en GET avec query params
    const currentUser = req.user;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        status: 'fail',
        message: 'Provide at least 2 characters for search'
      });
    }

    // Construction de la requête (identique à votre version actuelle)
    const where = {
      id: { [Op.ne]: currentUser.id },
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${searchTerm}%` } },
        { lastName: { [Op.iLike]: `%${searchTerm}%` } },
        { businessName: { [Op.iLike]: `%${searchTerm}%` } }
      ]
    };

    if (userType) where.userType = userType;

    const users = await user.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'email', 'userType', 'businessName'],
      limit: 20
    });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users }
    });

  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Search error'
    });
  }
};


// Envoyer une invitation
// invitationController.js
exports.sendInvitation = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (Number(senderId) === Number(receiverId)) {
      return res.status(400).json({
        status: 'fail',
        message: "Vous ne pouvez pas vous inviter vous-même"
      });
    }

    const [sender, receiver] = await Promise.all([
      user.findByPk(senderId),
      user.findByPk(receiverId)
    ]);

    if (!receiver) {
      return res.status(404).json({
        status: 'fail',
        message: "Utilisateur destinataire introuvable"
      });
    }

    // Client ne peut inviter QUE commerçant
    if (sender.userType === '1' && receiver.userType !== '2') {
      return res.status(403).json({
        status: 'fail',
        message: "Les clients ne peuvent inviter que des commerçants"
      });
    }

    // Commerçant peut inviter client ou commerçant, mais pas lui-même (déjà vérifié)

    const existingInvitation = await invitation.findOne({
      where: {
        [Op.or]: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });

    if (existingInvitation) {
      return res.status(409).json({
        status: 'fail',
        message: "Une invitation existe déjà entre ces utilisateurs"
      });
    }

    const newInvitation = await invitation.create({
      senderId,
      receiverId,
      message,
      status: 'pending'
    });

    res.status(201).json({
      status: 'success',
      data: { invitation: newInvitation }
    });

  } catch (error) {
    console.error('Invitation Error:', error);
    res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : "Erreur lors de l'envoi de l'invitation"
    });
  }
};


// Répondre à une invitation
// Répondre à une invitation
// Répondre à une invitation
exports.respondToInvitation = async (req, res) => {
  try {
    const senderId = req.params.senderId;
    const receiverId = req.user.id; // Utilisateur connecté
    const { status } = req.body;

    // Vérifie que le statut est valide
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Statut invalide. Doit être "accepted" ou "rejected"'
      });
    }

    // Cherche une invitation spécifique entre ces deux utilisateurs
    const invitationToUpdate = await invitation.findOne({
      where: {
        senderId,
        receiverId,
        status: 'pending'
      }
    });

    // Vérifie si l'invitation existe et est encore en attente
    if (!invitationToUpdate) {
      return res.status(404).json({
        status: 'fail',
        message: "Aucune invitation en attente de cet utilisateur"
      });
    }

    // Met à jour le statut de l'invitation
    await invitationToUpdate.update({ status });

    res.status(200).json({
      status: 'success',
      data: { invitation: invitationToUpdate }
    });

  } catch (error) {
    console.error("Respond Error:", error);
    res.status(500).json({
      status: 'error',
      message: "Erreur lors du traitement de l'invitation"
    });
  }
};


