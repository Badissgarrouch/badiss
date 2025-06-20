const db = require('../models');
const user= db.user;
const invitation = db.Invitation;
const { Op } = require('sequelize');


// Recherche d'utilisateurs
exports.searchUsers = async (req, res) => {
  try {
    const { searchTerm, userType } = req.query;
    const currentUser = req.user;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        status: 'fail',
        message: 'Provide at least 2 characters for search'
      });
    }

    const where = {
      id: { [Op.ne]: currentUser.id },
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${searchTerm}%` } },
        { lastName: { [Op.iLike]: `%${searchTerm}%` } },
        { businessName: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } } 
      ]
    };

    if (userType) where.userType = userType;

    const users = await user.findAll({
      where,
      attributes: [
        'id', 
        'firstName', 
        'lastName', 
        'email',
        'phone',        
        'userType', 
        'businessName',
        'businessAddress',
        'sectorOfActivity', 
      ],
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





exports.sendInvitation = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;
    const io = req.app.get('io'); // Access Socket.IO instance
    const connectedUsers = req.app.get('connectedUsers'); // Access connected users map

    // Validate inputs
    if (!receiverId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Le receiverId est requis',
      });
    }

    // Prevent self-invitation
    if (Number(senderId) === Number(receiverId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vous ne pouvez pas vous inviter vous-même',
      });
    }

    // Fetch sender and receiver
    const [sender, receiver] = await Promise.all([
      db.user.findByPk(senderId), // Updated to db.user for consistency
      db.user.findByPk(receiverId),
    ]);

    if (!receiver) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur destinataire introuvable',
      });
    }

    // Check user type constraints
    if (sender.userType === '1' && receiver.userType !== '2') {
      return res.status(403).json({
        status: 'fail',
        message: 'Les clients ne peuvent inviter que des commerçants',
      });
    }

    // Check for existing invitation in either direction
    const existingInvitation = await db.invitation.findOne({
      where: {
        [Op.or]: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: { [Op.in]: ['pending', 'accepted'] },
      },
    });

    if (existingInvitation) {
      return res.status(409).json({
        status: 'fail',
        message: 'Une invitation existe déjà entre ces utilisateurs',
      });
    }

    // Create new invitation
    const newInvitation = await db.invitation.create({
      senderId,
      receiverId,
      message,
      status: 'pending',
    });

    // Create notification for the receiver
    const notification = await db.notification.create({
      userId: receiverId,
      type: 'new_invitation',
      message: `${sender.firstName} ${sender.lastName} vous a envoyé une invitation.`,
      invitationId: newInvitation.id,
      read: false,
    });

    // Emit Socket.IO event to the receiver
    const receiverSocketId = connectedUsers.get(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_notification', {
        id: notification.id,
        type: 'new_invitation',
        message: notification.message,
        invitationId: notification.invitationId,
        read: false,
        createdAt: notification.createdAt,
      });
    }

    res.status(201).json({
      status: 'success',
      data: { invitation: newInvitation },
    });
  } catch (error) {
    console.error('Invitation Error:', error);
    res.status(500).json({
      status: 'error',
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : "Erreur lors de l'envoi de l'invitation",
    });
  }
};

// Backend: checkInvitation
exports.checkInvitation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    // Validate receiverId
    if (!receiverId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Le receiverId est requis',
      });
    }

    // Prevent self-invitation check
    if (Number(senderId) === Number(receiverId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vous ne pouvez pas vérifier une invitation pour vous-même',
      });
    }

    // Check for existing invitation in either direction
    const invitation = await db.invitation.findOne({
      where: {
        [Op.or]: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: { [Op.in]: ['pending', 'accepted'] },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        hasInvitation: !!invitation,
        invitation: invitation || null, // Include invitation details if exists
      },
    });
  } catch (error) {
    console.error('Erreur vérification:', error);
    return res.status(500).json({
      status: 'error',
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : "Erreur lors de la vérification de l'invitation",
    });
  }
};



// In invitationController.js
exports.respondToInvitation = async (req, res) => {
  try {
    const senderId = req.params.senderId;
    const receiverId = req.user.id; 
    const { status } = req.body;
    const io = req.app.get('io'); // Access Socket.IO instance
    const connectedUsers = req.app.get('connectedUsers'); // Access connected users map

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Statut invalide. Doit être "accepted" ou "rejected"'
      });
    }

    const invitationToUpdate = await invitation.findOne({
      where: {
        senderId,
        receiverId,
        status: 'pending'
      }
    });

    if (!invitationToUpdate) {
      return res.status(404).json({
        status: 'fail',
        message: "Aucune invitation en attente de cet utilisateur"
      });
    }

    await invitationToUpdate.update({ status });

    // Create notification for the sender if the invitation is accepted
    if (status === 'accepted') {
      const receiver = await user.findByPk(receiverId);
      const notification = await db.notification.create({
        userId: senderId,
        type: 'invitation_accepted',
        message: `${receiver.firstName} ${receiver.lastName} a accepté votre invitation.`,
        invitationId: invitationToUpdate.id,
        read: false
      });

      // Emit Socket.IO event to the sender
      const senderSocketId = connectedUsers.get(senderId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit('new_notification', {
          id: notification.id,
          type: 'invitation_accepted',
          message: notification.message,
          invitationId: notification.invitationId,
          read: false,
          createdAt: notification.createdAt
        });
      }
    }

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


exports.deleteInvitation = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'fail',
        message: "Le receiverId est requis dans le corps de la requête"
      });
    }

    
    const deletedCount = await db.Invitation.destroy({
      where: {
        receiverId,
        [Op.or]: [
          { status: 'pending' },
          { status: 'accepted' }
        ]
      },
      force: true,
      transaction
    });

    if (deletedCount === 0) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'fail',
        message: "Aucune invitation trouvée pour ce receiverId"
      });
    }

    await transaction.commit();

    return res.status(200).json({
      status: 'success',
      message: `${deletedCount} invitation(s) supprimée(s) pour le receiverId ${receiverId}`,
      data: null
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur suppression:', error);
    return res.status(500).json({
      status: 'error',
      message: "Erreur lors de la suppression des invitations"
    });
  }
};
// Liste des invitations envoyées
exports.getSentInvitations = async (req, res) => {
  try {
    const invitations = await invitation.findAll({
      where: { senderId: req.user.id },
      include: [
        {
          model: user,
          as: 'receiver',
          attributes: [
            'id', 
            'firstName', 
            'lastName', 
            'email', 
            'phone', 
            'userType', 
            'businessName', 
            'businessAddress', 
            'sectorOfActivity'
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: invitations.length,
      data: { invitations }
    });
  } catch (error) {
    console.error('Get Sent Invitations Error:', error);
    res.status(500).json({
      status: 'error',
      message: "Erreur lors de la récupération des invitations envoyées"
    });
  }
};

// Liste des invitations reçues
exports.getReceivedInvitations = async (req, res) => {
  try {
    const userId = req.user.id; 

    const invitations = await invitation.findAll({
      where: { 
        receiverId: userId, 
        status: 'pending' 
      },
      include: [
        {
          model: db.user,
          as: 'sender',
          attributes: [
            'id', 
            'firstName', 
            'lastName', 
            'email', 
            'phone',       
            'userType', 
            'businessName', 
            'businessAddress', 
            'sectorOfActivity'
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: invitations.length,
      data: { invitations }
    });

  } catch (error) {
    console.error('Get Received Invitations Error:', error);
    res.status(500).json({
      status: 'error',
      message: "Erreur lors de la récupération des invitations reçues"
    });
  }
};

// Liste des amis (utilisateurs ayant accepté les invitations)
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    
    const acceptedInvitations = await invitation.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        {
          model: user,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType', 'businessName']
        },
        {
          model: user,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType', 'businessName']
        }
      ]
    });

    
    const friends = acceptedInvitations.map(invite => {
      return invite.senderId === userId ? invite.receiver : invite.sender;
    });

    res.status(200).json({
      status: 'success',
      results: friends.length,
      data: { friends }
    });

  } catch (error) {
    console.error('Get Friends Error:', error);
    res.status(500).json({
      status: 'error',
      message: "Erreur lors de la récupération de la liste d'amis"
    });
  }
};

exports.checkInvitationStatus = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        status: 'fail',
        message: "L'identifiant de l'autre utilisateur est requis"
      });
    }

    const invitationRecord = await invitation.findOne({
      where: {
        [Op.or]: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId }
        ]
      }
    });

    const status = invitationRecord ? invitationRecord.status : 'none';

    res.status(200).json({
      status: 'success',
      data: { invitationStatus: status }
    });
  } catch (error) {
    console.error('Erreur statut invitation:', error);
    res.status(500).json({
      status: 'error',
      message: "Erreur lors de la récupération du statut de l'invitation"
    });
  }
};
// Supprimer une amitié
// Supprimer une amitié
exports.deleteFriendship = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const currentUserId = req.user.id;
    const { friendId } = req.query; // Changé de req.body à req.query

    if (!friendId) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'fail',
        message: "L'identifiant de l'ami est requis"
      });
    }

   
    const friendship = await invitation.findOne({
      where: {
        status: 'accepted',
        [Op.or]: [
          { senderId: currentUserId, receiverId: friendId },
          { senderId: friendId, receiverId: currentUserId }
        ]
      },
      transaction
    });

    if (!friendship) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'fail',
        message: "Aucune amitié trouvée avec cet utilisateur"
      });
    }

    // Supprimer l'invitation/amitié
    await invitation.destroy({
      where: { id: friendship.id },
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: "Amitié supprimée avec succès",
      data: null
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Delete Friendship Error:', error);
    res.status(500).json({
      status: 'error',
      message: "Erreur lors de la suppression de l'amitié"
    });
  }
};
exports.getUserInvitationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [friends, sentInvitations, receivedInvitations] = await Promise.all([
      // 1. Friends (accepted invitations)
      invitation.findAll({
        where: {
          status: 'accepted',
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        attributes: ['createdAt'],
        raw: true
      }),
      // 2. Sent invitations
      invitation.findAll({
        where: {
          senderId: userId
        },
        attributes: ['createdAt'],
        raw: true
      }),
      // 3. Received invitations
      invitation.findAll({
        where: {
          receiverId: userId
        },
        attributes: ['createdAt'],
        raw: true
      })
    ]);

    // Calculate counts
    const friendCount = friends.length;
    const sentInvitationCount = sentInvitations.length;
    const receivedInvitationCount = receivedInvitations.length;

    // Send only counts in the response
    res.status(200).json({
      status: 'success',
      data: {
        friendCount,
        sentInvitationCount,
        receivedInvitationCount,
        // Include creation times in a separate field not exposed in the main data
        _internal: {
          friendsDates: friends.map(f => f.createdAt),
          sentDates: sentInvitations.map(s => s.createdAt),
          receivedDates: receivedInvitations.map(r => r.createdAt)
        }
      }
    });

  } catch (error) {
    console.error('Get Invitation Stats Error:', error);
    res.status(500).json({
      status: 'error',
      message: "Erreur lors de la récupération des statistiques"
    });
  }
};