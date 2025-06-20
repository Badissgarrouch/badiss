const db = require('../models');
const { Op } = require('sequelize');


exports.submitEvaluation = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const senderId = req.user.id;
    const { receiverFirstName, receiverLastName, creditCommunicationStars, paymentTimelinessStars, transactionProfessionalismStars } = req.body;

    // Validate input
    if (!receiverFirstName || !receiverLastName || !creditCommunicationStars || !paymentTimelinessStars || !transactionProfessionalismStars) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'fail',
        message: 'Tous les champs sont requis : prénom, nom, et évaluations par étoiles',
      });
    }

    // Validate star ratings
    const stars = [creditCommunicationStars, paymentTimelinessStars, transactionProfessionalismStars];
    for (const star of stars) {
      if (!Number.isInteger(star) || star < 1 || star > 5) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'fail',
          message: 'Les évaluations par étoiles doivent être des entiers entre 1 et 5',
        });
      }
    }

    // Find receiver by firstName and lastName
    const receiver = await db.user.findOne({
      where: {
        firstName: receiverFirstName,
        lastName: receiverLastName,
      },
      transaction,
    });

    if (!receiver) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur destinataire non trouvé',
      });
    }

    const receiverId = receiver.id;

    // Prevent self-evaluation
    if (senderId === receiverId) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'fail',
        message: 'Vous ne pouvez pas vous évaluer vous-même',
      });
    }

    // Check for accepted invitation
    const invitation = await db.Invitation.findOne({
      where: {
        status: 'accepted',
        [Op.or]: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      transaction,
    });

    if (!invitation) {
      await transaction.rollback();
      return res.status(403).json({
        status: 'fail',
        message: "Une invitation acceptée est requise pour soumettre une évaluation",
      });
    }

    // Calculate total and average stars
    const totalStars = stars.reduce((sum, star) => sum + star, 0);
    const averageStars = totalStars / stars.length;

    // Determine satisfaction status
    let satisfactionStatus;
    if (averageStars < 3) {
      satisfactionStatus = 'not_satisfied';
    } else if (averageStars >= 3 && averageStars < 4) {
      satisfactionStatus = 'normal';
    } else if (averageStars >= 4 && averageStars <= 5) {
      satisfactionStatus = 'satisfied';
    }

    // Create evaluation
    const evaluation = await db.evaluation.create({
      senderId,
      receiverId,
      creditCommunicationStars,
      paymentTimelinessStars,
      transactionProfessionalismStars,
      totalStars,
      averageStars,
      satisfactionStatus,
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      status: 'success',
      message: 'Évaluation soumise avec succès',
      data: { evaluation },
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Submit Evaluation Error:', error);
    return res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur lors de la soumission de l\'évaluation',
    });
  }
};

exports.getReceivedEvaluations = async (req, res) => {
  try {
    const userId = req.user.id;

    const evaluations = await db.evaluation.findAll({
      where: { receiverId: userId },
      include: [
        {
          model: db.user,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      status: 'success',
      results: evaluations.length,
      data: { evaluations },
    });
  } catch (error) {
    console.error('Get Received Evaluations Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des évaluations reçues',
    });
  }
};

