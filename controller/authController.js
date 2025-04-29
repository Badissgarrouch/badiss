const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { user } = require('../models');
const nodemailer = require('nodemailer');
const verificationEmail = require('../emailTemplates/verificationEmail');
const passwordResetEmail = require('../emailTemplates/passwordResetEmail');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false } // Option de secours pour les erreurs SSL
});


// Génération du token JWT
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Génération d'un OTP à 5 chiffres
const generateOtp = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Envoi d'email
  const sendEmail = async (to, subject, text,html) => {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

// Inscription
const signup = async (req, res, next) => {
  try {
    const body = req.body;

    if (body.password !== body.confirmPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    // Validation du type d'utilisateur
    if (!['1', '2'].includes(body.userType)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Type utilisateur invalide',
      });
    }

    // Vérification de l'email existant
    const existingUser = await user.findOne({ where: { email: body.email } });
    if (existingUser) {
      if (existingUser.userType !== body.userType) {
        return res.status(400).json({
          status: 'fail',
          message: `Cet email est déjà utilisé par un ${existingUser.userType === '1' ? 'client' : 'marchand'}. Vous ne pouvez pas utiliser le même email pour les deux types.`,
        });
      }
      return res.status(400).json({
        status: 'fail',
        message: 'Cet email est déjà utilisé',
      });
    }

    // Validation pour Client (type 1)
    if (body.userType === '1' && (body.businessName || body.businessAddress || body.sectorOfActivity)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Les clients ne peuvent pas fournir d\'informations professionnelles',
      });
    }

    // Validation pour Marchand (type 2)
    if (body.userType === '2' && (!body.businessName || !body.businessAddress || !body.sectorOfActivity)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Infos proffesionnel obligatoires',
      });
    }

    // Création de l'utilisateur
    const hashedPassword = await bcrypt.hash(body.password, 8);
    const newUser = await user.create({
      userType: body.userType,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone:body.phone,
      carteCin:body.carteCin,
      password: hashedPassword,
      confirmPassword:hashedPassword,

     
      
      businessName: body.businessName,
      businessAddress: body.businessAddress,
      sectorOfActivity: body.sectorOfActivity,
    });
    //console.log(newUser);
    // Génération et envoi de l'OTP
    const otpCode = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await newUser.update({ otpCode, otpExpires });
    const verification = verificationEmail(otpCode);

    await sendEmail(
      newUser.email,
      verification.subject,
      verification.text,
      verification.html
    );

    const result = newUser.toJSON();
    delete result.password;
    delete result.deletedAt;

    return res.status(200).json({
      status: 'success',
      message: 'Inscription réussie. Veuillez vérifier votre email',
      data: {
        user: result,
      },
      userId: newUser.id
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Une erreur est survenue lors de l\'inscription',
      error: error.message,
    });
  }
};

// Vérification OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body; // Maintenant on accepte email et otpCode

    // Trouver l'utilisateur avec cet email et ce code OTP actif
    const foundUser = await user.findOne({ 
      where: { 
        email: email,
        otpCode: otpCode,
        otpExpires: { [Op.gt]: new Date() } // Vérifie que le code n'a pas expiré
      }
    });

    if (!foundUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Code OTP invalide ou expiré',
      });
    }

    // Activation du compte
    await foundUser.update({ 
      isEmailVerified: true,
      otpCode: null,
      otpExpires: null
    });

    const token = generateToken({ id: foundUser.id });

    return res.status(200).json({
      status: 'success',
      message: 'Email vérifié avec succès',
      token,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        isEmailVerified: true
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification OTP:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Une erreur est survenue lors de la vérification',
    });
  }
};
// Connexion
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email et un mot de passe requis',
      });
    }

    const foundUser = await user.findOne({ where: { email } });
    if (!foundUser || !(await bcrypt.compare(password, foundUser.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email ou mot de passe incorrect',
      });
    }

    if (!foundUser.isEmailVerified) {
      return res.status(401).json({
        status: 'fail',
        message: 'Email non vérifié',
      });
    }

    const token = generateToken({ id: foundUser.id });

    const result = foundUser.toJSON();
    delete result.password;
    delete result.deletedAt;

    return res.status(200).json({
      status: 'success',
      token,
      data: {
        user: result,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Une erreur est survenue lors de la connexion',
    });
  }
};

// Mot de passe oublié
// ... (conserver tout le code existant jusqu'à forgotPassword)

// Mot de passe oublié (version corrigée)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const foundUser = await user.findOne({ where: { email } });
    if (!foundUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'Aucun compte associé à cet email'
      });
    }

    const otpCode = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await foundUser.update({ 
      passwordResetToken: otpCode,
      passwordResetExpires: otpExpires 
    });
    const reset = passwordResetEmail(otpCode);
    const emailSent = await sendEmail(
      foundUser.email,
      reset.subject,
  reset.text,
  reset.html
    );

    if (!emailSent) throw new Error('Échec envoi email');

    const response = {
      status: 'success',
      message: 'Code OTP envoyé par email',
      userId: foundUser.id
    };

    if (process.env.NODE_ENV === 'development') {
      response.debugOtp = otpCode;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la demande de réinitialisation'
    });
  }
};

// Vérification OTP pour réinitialisation
const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    // Trouver l'utilisateur par email
    const foundUser = await user.findOne({ where: { email } });
    if (!foundUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'Aucun utilisateur trouvé avec cet email'
      });
    }

    // Vérifier si le code OTP correspond
    if (foundUser.passwordResetToken !== otpCode) {
      return res.status(400).json({
        status: 'fail',
        message: 'Code OTP incorrect'
      });
    }

    // Vérifier si le code OTP n'a pas expiré
    if (new Date() > new Date(foundUser.passwordResetExpires)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Code OTP expiré'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = jwt.sign(
      { id: foundUser.id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Code OTP validé',
      resetToken,
      userId: foundUser.id // On garde quand même l'userId dans la réponse pour la suite
    });

  } catch (error) {
    console.error('Error in verifyPasswordResetOtp:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la vérification'
    });
  }
};

// Réinitialisation mot de passe
const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    // Vérifiez d'abord le token
    if (!resetToken) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token manquant'
      });
    }

    // Puis vérifiez les mots de passe
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET_KEY);
    const userToUpdate = await user.findByPk(decoded.id);

    if (!userToUpdate) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userToUpdate.update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    return res.status(200).json({
      status: 'success',
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Error in resetPassword:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Lien de réinitialisation expiré'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la réinitialisation'
    });
  }
};

module.exports = { 
  signup, 
  login, 
  verifyOtp, 
  forgotPassword, 
  verifyPasswordResetOtp, 
  resetPassword 
};