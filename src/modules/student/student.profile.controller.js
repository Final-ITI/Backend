import { success } from "../../utils/apiResponse.js";
import ApiError from "../../utils/apiError.js";
import Student from "../../../DB/models/student.js";
import User from "../../../DB/models/user.js";
import { asyncHandler } from "../../utils/apiError.js";

// Get student profile
export const getStudentProfile = asyncHandler(async (req, res) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError('لم يتم العثور على الطالب', 404);

    const user = await User.findById(student.userId);

    const data = {
        _id: student._id,
        userId: student.userId,
        fullName: user?.fullName,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        phone: user?.phone,
        birthdate: student.birthdate,
        address: user?.address,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone
    };
    return success(res, data, "تم جلب الملف الشخصي بنجاح");
});

// Update student profile
export const updateStudentProfile = asyncHandler(async (req, res) => {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError('لم يتم العثور على الطالب', 404);

    const { birthdate, guardianName, guardianPhone } = req.body;
    if (birthdate) student.birthdate = birthdate;
    if (guardianName) student.guardianName = guardianName;
    if (guardianPhone) student.guardianPhone = guardianPhone;
    await student.save();

    const user = await User.findById(student.userId);
    if (user) {
        const { address, phone, email, fullName } = req.body;
        if (address) user.address = address;
        if (phone) user.phone = phone;
        if (email) user.email = email;
        if (fullName) {
            const [firstName, ...lastName] = fullName.split(' ');
            user.firstName = firstName;
            user.lastName = lastName.join(' ');
            user.fullName = fullName;
        }
        await user.save();
    }

    const data = {
        _id: student._id,
        userId: student.userId,
        fullName: user?.fullName,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        phone: user?.phone,
        birthdate: student.birthdate,
        address: user?.address,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone
    };
    return success(res, data, "تم تحديث الملف الشخصي بنجاح");
});