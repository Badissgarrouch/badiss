// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { user } = require('../models');

module.exports = async (req, res, next) => {
  try {
    // 1. Vérifier si le token existe
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    // 2. Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    // 3. Vérifier que l'utilisateur existe toujours
    const currentUser = await user.findByPk(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    // 4. Ajouter l'utilisateur à la requête
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Session invalide',
      error: error.message 
    });
  }
};