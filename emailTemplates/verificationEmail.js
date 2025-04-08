module.exports = (otpCode) => ({
    subject: 'Vérification de votre compte',
    text: `Bonjour,
  
  Pour finaliser votre inscription, veuillez utiliser le code de vérification suivant :
  
  ${otpCode}
  
  Ce code est valable pendant 10 minutes.
  
  Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.
  
  Cordialement,
  L'équipe de [Votre Plateforme]`,
    
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Vérification de votre compte</h2>
      <p>Bonjour,</p>
      
      <p>Pour finaliser votre inscription, veuillez utiliser le code de vérification suivant :</p>
      
      <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; 
                  font-size: 24px; font-weight: bold; text-align: center;">
        ${otpCode}
      </div>
      
      <p>Ce code est valable pendant <strong>10 minutes</strong>.</p>
      
      <p style="font-size: 12px; color: #7f8c8d;">
        Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.
      </p>
      
      <p>Cordialement,<br>L'équipe de  Plateforme</p>
    </div>`
  });