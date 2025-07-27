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
                                        <h1 style="margin: 10px 0 5px 0; font-size: 32px; color: #ffffff; font-weight: 300; letter-spacing: 2px;">مُعِين
</h1>
                                        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); letter-spacing: 1px;">نظام تعلم القرآن</p>
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
                                "وقل رب زدني علما" - طه 20:114
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td align="center" style="padding: 30px 40px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td>
                                        <h2 style="margin: 0 0 20px 0; color: #0f4c75; font-size: 24px; text-align: center; font-weight: 600;">مرحبًا بك في رحلتك القرآنية</h2>
                                        <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 26px; color: #495057; text-align: center;">
                                            السلام عليكم! شكرًا لانضمامك إلى معين، منصة تعلم القرآن الشاملة الخاصة بك. يرجى تفعيل عنوان بريدك الإلكتروني لبدء رحلتك الروحية مع القرآن الكريم.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 25px 0;">
                                                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                                                                <a href="${link}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                                                                    ✨ تفعيل الحساب ✨
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Features Preview -->
                                        <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border-left: 4px solid #0f4c75;">
                                            <h3 style="margin: 0 0 15px 0; color: #0f4c75; font-size: 18px; text-align: center;">ماذا ينتظرك:</h3>
                                            <ul style="margin: 0; padding: 0; list-style: none; text-align: center;">
                                                <li style="margin: 8px 0; color: #495057;">📈 تتبع التقدم</li>
                                                <li style="margin: 8px 0; color: #495057;">لوحة تحكم الطلاب</li>
                                                <li style="margin: 8px 0; color: #495057;">لوحة تحكم المدرسين</li>
                                                <li style="margin: 8px 0; color: #495057;">محادثات فورية</li>
                                                <li style="margin: 8px 0; color: #495057;">حلقات قرآنية</li>
                                                <li style="margin: 8px 0; color: #495057;">جلسات تعليمية</li>
                                            </ul>
                                        </div>
                                        
                                        <!-- Fallback Text Link -->
                                        <p style="margin: 25px 0 0 0; font-size: 14px; line-height: 22px; color: #6c757d; text-align: center;">
                                            إذا لم يعمل الزر، انسخ والصق هذا الرابط في متصفحك:
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
                                            <strong>هل تحتاج مساعدة؟</strong><br>
                                            إذا لم تطلب هذا التفعيل أو كنت بحاجة إلى مساعدة، يرجى الاتصال بفريق الدعم لدينا. نحن هنا لمساعدتك في رحلتك القرآنية.
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
                                بارك الله في رحلتك مع القرآن
                            </p>
                            <p style="margin: 0; font-size: 12px; line-height: 18px; color: rgba(255,255,255,0.7);">
                                &copy; 2025 معين - نظام تعلم القرآن. جميع الحقوق محفوظة.
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

export function resetPasswordTemp(userName, code) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); overflow: hidden;">
          
          <!-- Header (same as activation) -->
          <tr>
            <td align="center" style="padding: 40px 30px 30px 30px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.1); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: inline-block; margin-bottom: 15px; line-height: 74px; text-align: center; color: white; font-weight: bold; font-size: 28px; backdrop-filter: blur(10px);">م</div>
                    <h1 style="margin: 10px 0 5px 0; font-size: 32px; color: #ffffff; font-weight: 300; letter-spacing: 2px;">معين</h1>
                    <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); letter-spacing: 1px;">نظام تعلم القرآن</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- Message -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <h2 style="margin: 0 0 20px 0; color: #0f4c75; font-size: 24px; font-weight: 600;">إعادة تعيين كلمة المرور</h2>
              <p style="font-size: 16px; color: #495057; line-height: 1.7;">
                السلام عليكم <strong>${userName}</strong>،<br><br>
                لقد طلبت مؤخرًا إعادة تعيين كلمة المرور الخاصة بك.<br>استخدم الرمز أدناه للمتابعة:
              </p>

              <!-- Reset Code Box -->
              <div style="margin: 30px auto; background: #f4f6f9; border: 2px dashed #0f4c75; border-radius: 12px; padding: 25px 35px; display: inline-block;">
                <p style="margin: 0; font-size: 14px; color: #777;">رمز إعادة التعيين</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 6px; font-family: monospace; color: #0f4c75;">${code}</div>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; color: #6c757d;">
                هذا الرمز صالح لمدة <strong>15 دقيقة</strong>. يرجى عدم مشاركته مع أي شخص.
              </p>
            </td>
          </tr>

          <!-- Help Note -->
          <tr>
            <td align="center" style="padding: 20px 40px;">
              <div style="padding: 18px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; line-height: 22px; color: #856404;">
                  لم تطلب إعادة تعيين كلمة مرور؟<br>يمكنك تجاهل هذا البريد الإلكتروني أو <a href="#" style="color: #0f4c75; text-decoration: underline;">الاتصال بفريق الدعم لدينا</a> إذا كنت بحاجة إلى مساعدة.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 25px 20px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 20px; color: rgba(255,255,255,0.9);">
                بارك الله في رحلتك مع القرآن
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: rgba(255,255,255,0.7);">
                &copy; 2025 معين - نظام تعلم القرآن. جميع الحقوق محفوظة.
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

export function generateHalakaInvitationEmail(studentName, teacherName, halakaTitle, halakaDescription, schedule, price, enrollmentLink) {
    const formatSchedule = (schedule) => {
        const dayNames = {
            sunday: "الأحد",
            monday: "الاثنين",
            tuesday: "الثلاثاء",
            wednesday: "الأربعاء",
            thursday: "الخميس",
            friday: "الجمعة",
            saturday: "السبت"
        };

        const days = schedule.days.map(day => dayNames[day] || day).join("، ");
        return `${days} - ${schedule.startTime}`;
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دعوة لحلقة - معين</title>
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
                                        <h1 style="margin: 10px 0 5px 0; font-size: 32px; color: #ffffff; font-weight: 300; letter-spacing: 2px;">معين</h1>
                                        <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); letter-spacing: 1px;">نظام تعلم القرآن</p>
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
                                "وقل رب زدني علما" - طه 20:114
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td align="center" style="padding: 30px 40px;">
                            <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td>
                                        <h2 style="margin: 0 0 20px 0; color: #0f4c75; font-size: 24px; text-align: center; font-weight: 600;">دعوة لحلقة خاصة</h2>
                                        <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 26px; color: #495057; text-align: center;">
                                            السلام عليكم ورحمة الله وبركاته <strong>${studentName}</strong>،<br><br>
                                            يدعوك المعلم <strong>${teacherName}</strong> للانضمام إلى حلقة خاصة في منصة معين.
                                        </p>
                                        
                                        <!-- Halaka Details -->
                                        <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border-left: 4px solid #0f4c75;">
                                            <h3 style="margin: 0 0 15px 0; color: #0f4c75; font-size: 18px; text-align: center;">تفاصيل الحلقة:</h3>
                                            <div style="text-align: center; line-height: 1.8;">
                                                <p style="margin: 8px 0; color: #495057;"><strong>اسم الحلقة:</strong> ${halakaTitle}</p>
                                                ${halakaDescription ? `<p style="margin: 8px 0; color: #495057;"><strong>الوصف:</strong> ${halakaDescription}</p>` : ''}
                                                <p style="margin: 8px 0; color: #495057;"><strong>المواعيد:</strong> ${formatSchedule(schedule)}</p>
                                                <p style="margin: 8px 0; color: #495057;"><strong>السعر:</strong> ${price} ج.م</p>
                                            </div>
                                        </div>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 25px 0;">
                                                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                                                                <a href="${enrollmentLink}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                                                                    ✨ انضم للحلقة ✨
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Fallback Text Link -->
                                        <p style="margin: 25px 0 0 0; font-size: 14px; line-height: 22px; color: #6c757d; text-align: center;">
                                            إذا لم يعمل الزر، انسخ والصق هذا الرابط في متصفحك:
                                            <br><br>
                                            <a href="${enrollmentLink}" style="color: #0f4c75; text-decoration: underline; word-break: break-all; font-size: 13px;">${enrollmentLink}</a>
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
                                            <strong>هل تحتاج مساعدة؟</strong><br>
                                            إذا كان لديك أي استفسار حول هذه الدعوة، يرجى التواصل مع فريق الدعم. نحن هنا لمساعدتك في رحلتك القرآنية.
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
                                بارك الله في رحلتك مع القرآن
                            </p>
                            <p style="margin: 0; font-size: 12px; line-height: 18px; color: rgba(255,255,255,0.7);">
                                &copy; 2025 معين - نظام تعلم القرآن. جميع الحقوق محفوظة.
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
