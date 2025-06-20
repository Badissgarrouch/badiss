
const jwt = require('jsonwebtoken');
const { user } = require('../models');

module.exports = async (req, res, next) => {
  try {
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentification requise' });
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
  
    const currentUser = await user.findByPk(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Session invalide',
      error: error.message 
    });
  }
};