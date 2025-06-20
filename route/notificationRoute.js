const express = require('express');
const { getNotifications, markNotificationAsRead } = require('../controller/notificationContoller');
const authMiddleware = require('../middleware/authmiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/:notificationId/read', markNotificationAsRead);

module.exports = router;