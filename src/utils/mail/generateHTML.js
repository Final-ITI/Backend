export function generateActivationEmail(link) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activate Your Motqan Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 30px 30px 30px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <!-- Islamic Motif Logo -->
                                        <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.1); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: inline-block; margin-bottom: 15px; line-height: 74px; text-align: center; color: white; font-weight: bold; font-size: 28px; backdrop-filter: blur(10px);">م</div>
                                        <h1 style="margin: 10px 0 5px 0; font-size: 32px; color: #ffffff; font-weight: 300; letter-spacing: 2px;">Motqan</h1>
                                        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); letter-spacing: 1px;">Quran Learning System</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Quranic Verse -->
                    <tr>
                        <td align="center" style="padding: 30px 30px 20px 30px; background-color: #f8f9fa;">
                            <p style="margin: 0; font-size: 18px; color: #0f4c75; text-align: center; font-style: italic; line-height: 28px;">
                                "وَقُل رَّبِّ زِدْنِي عِلْمًا"
                            </p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6c757d; text-align: center;">
                                "And say: My Lord, increase me in knowledge" - Ta-Ha 20:114
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td align="center" style="padding: 30px 40px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td>
                                        <h2 style="margin: 0 0 20px 0; color: #0f4c75; font-size: 24px; text-align: center; font-weight: 600;">Welcome to Your Quranic Journey</h2>
                                        <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 26px; color: #495057; text-align: center;">
                                            Assalamu Alaikum! Thank you for joining Motqan, your comprehensive Quran learning platform. Please verify your email address to begin your spiritual journey with the Holy Quran.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 25px 0;">
                                                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                                                                <a href="${link}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                                                                    ✨ Activate Account ✨
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Features Preview -->
                                        <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border-left: 4px solid #0f4c75;">
                                            <h3 style="margin: 0 0 15px 0; color: #0f4c75; font-size: 18px; text-align: center;">What Awaits You:</h3>
                                            <ul style="margin: 0; padding: 0; list-style: none; text-align: center;">
                                                <li style="margin: 8px 0; color: #495057;">📖 Complete Quran with Translations</li>
                                                <li style="margin: 8px 0; color: #495057;">🎵 Audio Recitations by Various Qaris</li>
                                                <li style="margin: 8px 0; color: #495057;">📚 Tafsir and Commentary</li>
                                                <li style="margin: 8px 0; color: #495057;">🕌 Prayer Times and Qibla Direction</li>
                                                <li style="margin: 8px 0; color: #495057;">📈 Progress Tracking</li>
                                            </ul>
                                        </div>
                                        
                                        <!-- Fallback Text Link -->
                                        <p style="margin: 25px 0 0 0; font-size: 14px; line-height: 22px; color: #6c757d; text-align: center;">
                                            If the button doesn't work, copy and paste this link into your browser:
                                            <br><br>
                                            <a href="${link}" style="color: #0f4c75; text-decoration: underline; word-break: break-all; font-size: 13px;">${link}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Support Note -->
                    <tr>
                        <td align="center" style="padding: 20px 40px 30px 40px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td style="padding: 20px; background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 8px; border-left: 4px solid #ffc107;">
                                        <p style="margin: 0; font-size: 14px; line-height: 21px; color: #856404; text-align: center;">
                                            <strong>Need Help?</strong><br>
                                            If you didn't request this activation or need assistance, please contact our support team. We're here to help you on your Quranic journey.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 25px 20px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 20px; color: rgba(255,255,255,0.9);">
                                May Allah bless your journey with the Quran
                            </p>
                            <p style="margin: 0; font-size: 12px; line-height: 18px; color: rgba(255,255,255,0.7);">
                                &copy; 2025 Motqan - Quran Learning System. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

export function resetPasswordTemp(code) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your ExamApp Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); overflow: hidden;">
                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background-image: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 40px 20px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <!-- Logo Placeholder -->
                                        <div style="width: 80px; height: 80px; background-color: #ffffff; border-radius: 50%; display: inline-block; margin-bottom: 16px; line-height: 80px; text-align: center; color: #DC2626; font-weight: bold; font-size: 36px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">E</div>
                                        <h1 style="margin: 10px 0 5px 0; font-size: 28px; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">ExamApp</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td align="center" style="padding: 40px 30px 20px 30px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td>
                                        <!-- Security Icon -->
                                        <div style="width: 60px; height: 60px; background-color: #FEF2F2; border-radius: 50%; display: inline-block; margin: 0 auto 20px auto; line-height: 60px; text-align: center; color: #EF4444; font-size: 24px;">🔐</div>
                                        
                                        <h2 style="margin: 0 0 20px 0; color: #1F2937; font-size: 24px; text-align: center; font-weight: 600;">Password Reset Request</h2>
                                        <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 26px; color: #4B5563; text-align: center;">
                                            We received a request to reset your ExamApp password. Use the verification code below to complete the process.
                                        </p>
                                        
                                        <!-- Decorative Element -->
                                        <div style="width: 60px; height: 4px; background-image: linear-gradient(90deg, #EF4444, #DC2626); margin: 0 auto 30px auto; border-radius: 2px;"></div>
                                        
                                        <!-- Verification Code Box -->
                                        <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 20px 0;">
                                                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="background-color: #F9FAFB; border: 2px dashed #D1D5DB; border-radius: 12px; padding: 25px 40px;">
                                                                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280; text-align: center; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
                                                                <div style="font-size: 32px; font-weight: bold; color: #1F2937; text-align: center; letter-spacing: 4px; font-family: 'Courier New', monospace;">${code}</div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Instructions -->
                                        <p style="margin: 25px 0 0 0; font-size: 14px; line-height: 21px; color: #6B7280; text-align: center;">
                                            Enter this code in the password reset form. This code will expire in <strong>5 minutes</strong>.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Security Tips -->
                    <tr>
                        <td align="center" style="padding: 10px 30px 40px 30px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td style="padding: 0;">
                                        <h3 style="margin: 0 0 20px 0; color: #1F2937; font-size: 16px; text-align: center; font-weight: 600;">Password Security Tips</h3>
                                        <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                            <tr>
                                                <td width="33%" align="center" valign="top" style="padding: 10px;">
                                                    <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px 15px; height: 100%;">
                                                        <div style="font-size: 20px; margin-bottom: 8px;">🔒</div>
                                                        <p style="margin: 0; font-size: 13px; color: #4B5563; font-weight: 600;">Use Strong Passwords</p>
                                                    </div>
                                                </td>
                                                <td width="33%" align="center" valign="top" style="padding: 10px;">
                                                    <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px 15px; height: 100%;">
                                                        <div style="font-size: 20px; margin-bottom: 8px;">🔄</div>
                                                        <p style="margin: 0; font-size: 13px; color: #4B5563; font-weight: 600;">Change Regularly</p>
                                                    </div>
                                                </td>
                                                <td width="33%" align="center" valign="top" style="padding: 10px;">
                                                    <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px 15px; height: 100%;">
                                                        <div style="font-size: 20px; margin-bottom: 8px;">🚫</div>
                                                        <p style="margin: 0; font-size: 13px; color: #4B5563; font-weight: 600;">Don't Share Codes</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Security Notice -->
                    <tr>
                        <td align="center" style="padding: 0 30px 40px 30px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td style="padding: 20px; background-color: #FEF2F2; border-radius: 8px; border-left: 4px solid #EF4444;">
                                        <p style="margin: 0; font-size: 14px; line-height: 21px; color: #7F1D1D; text-align: center;">
                                            <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and contact our support team immediately.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #1F2937; padding: 30px 20px; border-radius: 0 0 12px 12px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 21px; color: #D1D5DB;">
                                            &copy; 2025 ExamApp. All rights reserved.
                                        </p>
                                        <p style="margin: 0; font-size: 13px; line-height: 19px; color: #9CA3AF;">
                                            Securing your educational journey
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}
