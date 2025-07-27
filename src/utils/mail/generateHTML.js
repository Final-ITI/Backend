export function generateActivationEmail(link) {
    return `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تفعيل حسابك في مُعِين</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); text-align: right;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
              <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); overflow: hidden;">
                      <tr>
                          <td align="center" style="padding: 40px 30px 30px 30px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                  <tr>
                                      <td align="center">
                                          <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.1); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: inline-block; margin-bottom: 15px; line-height: 74px; text-align: center; color: white; font-weight: bold; font-size: 32px; backdrop-filter: blur(10px);">م</div>
                                          <h1 style="margin: 10px 0 5px 0; font-size: 36px; color: #ffffff; font-weight: 300; letter-spacing: 2px;">مُعِين</h1>
                                          <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); letter-spacing: 1px;">منصتك لتعلم القرآن</p>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 30px 30px 20px 30px; background-color: #f8f9fa;">
                              <p style="margin: 0; font-size: 20px; color: #0f4c75; text-align: center; font-style: italic; line-height: 30px; font-family: 'Amiri', serif;">
                                  "وَقُل رَّبِّ زِدْنِي عِلْمًا"
                              </p>
                              <p style="margin: 10px 0 0 0; font-size: 14px; color: #6c757d; text-align: center;">
                                  (سورة طه: 114)
                              </p>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 30px 40px;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                  <tr>
                                      <td>
                                          <h2 style="margin: 0 0 20px 0; color: #0f4c75; font-size: 24px; text-align: center; font-weight: 600;">أهلاً بك في رحلتك القرآنية</h2>
                                          <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 28px; color: #495057; text-align: center;">
                                              السلام عليكم ورحمة الله وبركاته! نشكرك على انضمامك إلى <strong>مُعِين</strong>، منصتك الشاملة لتعلم القرآن الكريم. يرجى تفعيل بريدك الإلكتروني لبدء رحلتك الإيمانية.
                                          </p>
                                          
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
                                          
                                          <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border-right: 4px solid #0f4c75;">
                                              <h3 style="margin: 0 0 15px 0; color: #0f4c75; font-size: 18px; text-align: center;">ماذا ينتظرك في مُعِين:</h3>
                                              <ul style="margin: 0; padding: 0; list-style: none; text-align: center;">
                                                 <li style="margin: 8px 0; color: #495057;"> تتبع التقدم</li>
                                                <li style="margin: 8px 0; color: #495057;">لوحة تحكم الطلاب</li>
                                                <li style="margin: 8px 0; color: #495057;">لوحة تحكم المدرسين</li>
                                                <li style="margin: 8px 0; color: #495057;">محادثات فورية</li>
                                                <li style="margin: 8px 0; color: #495057;">حلقات قرآنية</li>
                                                <li style="margin: 8px 0; color: #495057;">جلسات تعليمية</li>
                                              </ul>
                                          </div>
                                          
                                          <p style="margin: 25px 0 0 0; font-size: 14px; line-height: 22px; color: #6c757d; text-align: center;">
                                              إذا لم يعمل الزر، يرجى نسخ الرابط التالي ولصقه في متصفحك:
                                              <br><br>
                                              <a href="${link}" style="color: #0f4c75; text-decoration: underline; word-break: break-all; font-size: 13px;">${link}</a>
                                          </p>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 20px 40px 30px 40px;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                  <tr>
                                      <td style="padding: 20px; background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 8px; border-right: 4px solid #ffc107;">
                                          <p style="margin: 0; font-size: 14px; line-height: 21px; color: #856404; text-align: center;">
                                              <strong>هل تحتاج إلى مساعدة؟</strong><br>
                                              إذا لم تطلب تفعيل هذا الحساب أو كنت بحاجة للمساعدة، يرجى التواصل مع فريق الدعم. نحن هنا لمساندتك في رحلتك القرآنية.
                                          </p>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 25px 20px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
                              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 20px; color: rgba(255,255,255,0.9);">
                                  وفقكم الله في رحلتكم مع القرآن الكريم
                              </p>
                              <p style="margin: 0; font-size: 12px; line-height: 18px; color: rgba(255,255,255,0.7);">
                                  &copy; ${new Date().getFullYear()} مُعِين - منصة تعلم القرآن. جميع الحقوق محفوظة.
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
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>إعادة تعيين كلمة المرور</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); text-align: right;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table role="presentation" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); overflow: hidden;">
            
            <tr>
              <td align="center" style="padding: 40px 30px 30px 30px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                  <tr>
                    <td align="center">
                      <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.1); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: inline-block; margin-bottom: 15px; line-height: 74px; text-align: center; color: white; font-weight: bold; font-size: 32px; backdrop-filter: blur(10px);">م</div>
                      <h1 style="margin: 10px 0 5px 0; font-size: 36px; color: #ffffff; font-weight: 300; letter-spacing: 2px;">مُعِين</h1>
                      <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); letter-spacing: 1px;">منصتك لتعلم القرآن</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
  
            <tr>
              <td style="padding: 30px 40px; text-align: center;">
                <h2 style="margin: 0 0 20px 0; color: #0f4c75; font-size: 24px; font-weight: 600;">إعادة تعيين كلمة المرور</h2>
                <p style="font-size: 16px; color: #495057; line-height: 1.7;">
                  السلام عليكم ورحمة الله، <strong>${userName}</strong>،<br><br>
                  لقد طلبت إعادة تعيين كلمة المرور لحسابك في مُعِين.<br>استخدم الرمز التالي للمتابعة:
                </p>
  
                <div style="margin: 30px auto; background: #f4f6f9; border: 2px dashed #0f4c75; border-radius: 12px; padding: 25px 35px; display: inline-block;">
                  <p style="margin: 0; font-size: 14px; color: #777;">رمز التحقق</p>
                  <div style="font-size: 36px; font-weight: bold; letter-spacing: 6px; font-family: monospace; color: #0f4c75;">${code}</div>
                </div>
  
                <p style="margin: 30px 0 0; font-size: 14px; color: #6c757d;">
                  هذا الرمز صالح لمدة <strong>15 دقيقة</strong>. يرجى عدم مشاركته مع أي شخص.
                </p>
              </td>
            </tr>
  
            <tr>
              <td align="center" style="padding: 20px 40px;">
                <div style="padding: 18px; background: #fff3cd; border-right: 4px solid #ffc107; border-radius: 8px;">
                  <p style="margin: 0; font-size: 14px; line-height: 22px; color: #856404; text-align: center;">
                    لم تطلب إعادة تعيين كلمة المرور؟<br>يمكنك تجاهل هذه الرسالة أو <a href="mailto:support@moeen.com" style="color: #0f4c75; text-decoration: underline;">التواصل مع فريق الدعم</a> إذا كنت بحاجة للمساعدة.
                  </p>
                </div>
              </td>
            </tr>
  
            <tr>
              <td align="center" style="padding: 25px 20px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
                <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 20px; color: rgba(255,255,255,0.9);">
                  وفقكم الله في رحلتكم مع القرآن الكريم
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: rgba(255,255,255,0.7);">
                  &copy; ${new Date().getFullYear()} مُعِين - منصة تعلم القرآن. جميع الحقوق محفوظة.
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

export function generateHalakaInvitationEmail(
    studentName,
    teacherName,
    halakaTitle,
    halakaDescription,
    schedule,
    price,
    enrollmentLink
) {
    const formatSchedule = (schedule) => {
        const dayNames = {
            sunday: "الأحد",
            monday: "الاثنين",
            tuesday: "الثلاثاء",
            wednesday: "الأربعاء",
            thursday: "الخميس",
            friday: "الجمعة",
            saturday: "السبت",
        };

        const days = schedule.days.map((day) => dayNames[day.toLowerCase()] || day).join("، ");
        return `${days} - ${schedule.startTime}`;
    };

    return `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>دعوة للانضمام إلى حلقة - مُعِين</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); text-align: right;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
              <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); overflow: hidden;">
                      <tr>
                          <td align="center" style="padding: 40px 30px 30px 30px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                  <tr>
                                      <td align="center">
                                          <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.1); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: inline-block; margin-bottom: 15px; line-height: 74px; text-align: center; color: white; font-weight: bold; font-size: 32px; backdrop-filter: blur(10px);">م</div>
                                          <h1 style="margin: 10px 0 5px 0; font-size: 36px; color: #ffffff; font-weight: 300; letter-spacing: 2px;">مُعِين</h1>
                                          <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); letter-spacing: 1px;">منصتك لتعلم القرآن</p>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 30px 30px 20px 30px; background-color: #f8f9fa;">
                              <p style="margin: 0; font-size: 20px; color: #0f4c75; text-align: center; font-style: italic; line-height: 30px; font-family: 'Amiri', serif;">
                                  "وَقُل رَّبِّ زِدْنِي عِلْمًا"
                              </p>
                              <p style="margin: 10px 0 0 0; font-size: 14px; color: #6c757d; text-align: center;">
                                  (سورة طه: 114)
                              </p>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 30px 40px;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                  <tr>
                                      <td>
                                          <h2 style="margin: 0 0 20px 0; color: #0f4c75; font-size: 24px; text-align: center; font-weight: 600;">دعوة للانضمام إلى حلقة</h2>
                                          <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 28px; color: #495057; text-align: center;">
                                              السلام عليكم ورحمة الله وبركاته <strong>${studentName}</strong>،<br><br>
                                              يدعوك المعلم/ة <strong>${teacherName}</strong> للانضمام إلى حلقة خاصة في منصة <strong>مُعِين</strong>.
                                          </p>
                                          
                                          <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border-right: 4px solid #0f4c75;">
                                              <h3 style="margin: 0 0 15px 0; color: #0f4c75; font-size: 18px; text-align: center;">تفاصيل الحلقة:</h3>
                                              <div style="text-align: center; line-height: 1.8;">
                                                  <p style="margin: 8px 0; color: #495057;"><strong>اسم الحلقة:</strong> ${halakaTitle}</p>
                                                  ${halakaDescription
                                                      ? `<p style="margin: 8px 0; color: #495057;"><strong>الوصف:</strong> ${halakaDescription}</p>`
                                                      : ""
                                                  }
                                                  <p style="margin: 8px 0; color: #495057;"><strong>المواعيد:</strong> ${formatSchedule(schedule)}</p>
                                                  <p style="margin: 8px 0; color: #495057;"><strong>السعر:</strong> ${price} ج.م</p>
                                              </div>
                                          </div>
                                          
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
                      
                      <tr>
                          <td align="center" style="padding: 20px 40px 30px 40px;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                  <tr>
                                      <td style="padding: 20px; background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 8px; border-right: 4px solid #ffc107;">
                                          <p style="margin: 0; font-size: 14px; line-height: 21px; color: #856404; text-align: center;">
                                              <strong>هل تحتاج مساعدة؟</strong><br>
                                              إذا كان لديك أي استفسار حول هذه الدعوة، يرجى التواصل مع فريق الدعم. نحن هنا لمساعدتك في رحلتك القرآنية.
                                          </p>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 25px 20px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
                              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 20px; color: rgba(255,255,255,0.9);">
                                  وفقكم الله في رحلتكم مع القرآن الكريم
                              </p>
                              <p style="margin: 0; font-size: 12px; line-height: 18px; color: rgba(255,255,255,0.7);">
                                  &copy; ${new Date().getFullYear()} مُعِين - منصة تعلم القرآن. جميع الحقوق محفوظة.
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

export function generateVerificationResultEmail(subject, body) {
    return `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); text-align: right;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
              <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); overflow: hidden;">
                      <tr>
                          <td align="center" style="padding: 40px 30px 30px 30px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                  <tr>
                                      <td align="center">
                                          <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.1); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: inline-block; margin-bottom: 15px; line-height: 74px; text-align: center; color: white; font-weight: bold; font-size: 32px; backdrop-filter: blur(10px);">م</div>
                                          <h1 style="margin: 10px 0 5px 0; font-size: 36px; color: #ffffff; font-weight: 300; letter-spacing: 2px;">مُعِين</h1>
                                          <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); letter-spacing: 1px;">منصتك لتعلم القرآن</p>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 30px 30px 20px 30px; background-color: #f8f9fa;">
                              <p style="margin: 0; font-size: 20px; color: #0f4c75; text-align: center; font-style: italic; line-height: 30px; font-family: 'Amiri', serif;">
                                  "وَقُل رَّبِّ زِدْنِي عِلْمًا"
                              </p>
                              <p style="margin: 10px 0 0 0; font-size: 14px; color: #6c757d; text-align: center;">
                                  (سورة طه: 114)
                              </p>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 30px 40px;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                  <tr>
                                      <td>
                                          <h2 style="margin: 0 0 20px 0; color: #0f4c75; font-size: 24px; text-align: center; font-weight: 600;">${subject}</h2>
                                          <div style="margin: 0 0 25px 0; font-size: 16px; line-height: 28px; color: #495057; text-align: center;">
                                              ${body}
                                          </div>
                                          
                                          <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                              <tr>
                                                  <td align="center" style="padding: 25px 0;">
                                                      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                                          <tr>
                                                              <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); box-shadow: 0 4px 15px rgba(15, 76, 117, 0.3);">
                                                                  <a href="${process.env.FE_URL}/teacher/dashboard" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                                                                      🏠 الذهاب للوحة التحكم
                                                                  </a>
                                                              </td>
                                                          </tr>
                                                      </table>
                                                  </td>
                                              </tr>
                                          </table>
                                          
                                          <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border-right: 4px solid #0f4c75;">
                                              <h3 style="margin: 0 0 15px 0; color: #0f4c75; font-size: 18px; text-align: center;">ما يمكنك فعله الآن:</h3>
                                              <ul style="margin: 0; padding: 0; list-style: none; text-align: center;">
                                                  <li style="margin: 8px 0; color: #495057;">📚 إنشاء حلقات تعليمية جديدة</li>
                                                  <li style="margin: 8px 0; color: #495057;">👥 إدارة الطلاب والحضور</li>
                                                  <li style="margin: 8px 0; color: #495057;">💰 تتبع المدفوعات والأرباح</li>
                                                  <li style="margin: 8px 0; color: #495057;">📊 مراجعة التقارير والإحصائيات</li>
                                                  <li style="margin: 8px 0; color: #495057;">💬 التواصل مع الطلاب</li>
                                              </ul>
                                          </div>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 20px 40px 30px 40px;">
                              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                                  <tr>
                                      <td style="padding: 20px; background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 8px; border-right: 4px solid #ffc107;">
                                          <p style="margin: 0; font-size: 14px; line-height: 21px; color: #856404; text-align: center;">
                                              <strong>هل تحتاج مساعدة؟</strong><br>
                                              إذا كان لديك أي استفسار أو تحتاج مساعدة، يرجى التواصل مع فريق الدعم. نحن هنا لمساعدتك في رحلتك التعليمية.
                                          </p>
                                      </td>
                                  </tr>
                              </table>
                          </td>
                      </tr>
                      
                      <tr>
                          <td align="center" style="padding: 25px 20px; background: linear-gradient(135deg, #0f4c75 0%, #1e3c72 100%); color: white;">
                              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 20px; color: rgba(255,255,255,0.9);">
                                  وفقكم الله في رحلتكم مع القرآن الكريم
                              </p>
                              <p style="margin: 0; font-size: 12px; line-height: 18px; color: rgba(255,255,255,0.7);">
                                  &copy; ${new Date().getFullYear()} مُعِين - منصة تعلم القرآن. جميع الحقوق محفوظة.
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