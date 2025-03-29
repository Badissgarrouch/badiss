module.exports = (otpCode) => ({
    subject: 'Réinitialisation de votre mot de passe',
    text: `Bonjour,
  
  Vous avez demandé à réinitialiser votre mot de passe. Voici votre code de vérification :
  
  ${otpCode}
  
  Ce code est valable pendant 10 minutes.
  
  Si vous n'avez pas initié cette demande, veuillez contacter immédiatement notre support.
  
  Cordialement,
  L'équipe de [Votre Plateforme]`,
    
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">Réinitialisation de mot de passe</h2>
      <p>Bonjour,</p>
      
      <p>Vous avez demandé à réinitialiser votre mot de passe. Voici votre code de vérification :</p>
      
      <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; 
                  font-size: 24px; font-weight: bold; text-align: center; color: #e74c3c;">
        ${otpCode}
      </div>
      
      <p>Ce code est valable pendant <strong>10 minutes</strong>.</p>
      
      <p style="font-size: 12px; color: #7f8c8d;">
        Si vous n'avez pas initié cette demande, veuillez contacter immédiatement notre support.
      </p>
      
      <p>Cordialement,<br>L'équipe de [Votre Plateforme]</p>
    </div>`
  });