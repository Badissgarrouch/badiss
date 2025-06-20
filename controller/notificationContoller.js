'use strict';

const db = require('../models');
const { Op } = require('sequelize');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await db.notification.findAll({
      where: { userId },
      include: [
        {
          model: db.user,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'userType', 'businessName'],
        },
        {
          model: db.Invitation,
          as: 'invitation',
          attributes: ['id', 'status', 'senderId', 'receiverId'],
          include: [
            {
              model: db.user,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName', 'email', 'userType', 'businessName'],
            },
            {
              model: db.user,
              as: 'receiver',
              attributes: ['id', 'firstName', 'lastName', 'email', 'userType', 'businessName'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: { notifications },
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur lors de la récupération des notifications',
    });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await db.notification.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification non trouvée',
      });
    }

    await notification.update({ read: true });

    res.status(200).json({
      status: 'success',
      data: { notification },
    });
  } catch (error) {
    console.error('Mark Notification As Read Error:', error);
    res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Erreur lors de la mise à jour de la notification',
    });
  }
};