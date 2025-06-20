const express = require('express');
const router = express.Router();
const evaluationController = require('../controller/evaluationController');
const authMiddleware = require('../middleware/authmiddleware');

router.use(authMiddleware);

router.post('/submit', evaluationController.submitEvaluation);
router.get('/received', evaluationController.getReceivedEvaluations);


module.exports = router;