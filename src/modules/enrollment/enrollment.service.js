export class EnrollmentService {
  static invitationPopulation = {
    path: "halaka",
    select: "title description schedule teacher",
    populate: {
      path: "teacher",
      select: "userId bio",
      populate: {
        path: "userId",
        select: "firstName lastName profilePicture",
      },
    },
  };

  static formatInvitation = (enrollment) => {
    const halaka = enrollment.halaka;
    const teacher = halaka && halaka.teacher && halaka.teacher.userId;
    const teacherBio = halaka && halaka.teacher && halaka.teacher.bio;
    return {
      _id: enrollment._id,
      status: enrollment.status,
      snapshot: enrollment.snapshot,
      halakaDetails: halaka
        ? {
            _id: halaka._id,
            title: halaka.title,
            description: halaka.description,
            schedule: halaka.schedule,
          }
        : null,
      teacherDetails: teacher
        ? {
            name: `${teacher.firstName} ${teacher.lastName}`,
            avatar: teacher.profilePicture,
            bio: teacherBio || "",
          }
        : null,
    };
  };

  static async sendTeacherNotification(enrollment, action) {
    const teacherUser = enrollment.halaka?.teacher?.userId;
    const halakaTitle = enrollment.halaka?.title;

    if (!teacherUser?._id || !halakaTitle) {
      console.warn("Missing teacher or halaka info for notification");
      return;
    }

    const notificationConfig = {
      accept: {
        message: `تم قبول دعوة الحلقة (${halakaTitle}) من قبل الطالب. يمكنك متابعة إجراءات الدفع.`,
      },
      reject: {
        message: `تم رفض دعوة الحلقة (${halakaTitle}) من قبل الطالب.`,
      },
    };

    const { message } = notificationConfig[action];
    const { sendNotification } = await import(
      "../../services/notification.service.js"
    );

    await sendNotification({
      recipient: teacherUser._id,
      type: "private_halaka_invitation",
      message,
      link: `/halakat/${enrollment.halaka._id}`,
    });
  }
}
