import axios from "axios";
import Enrollment from "../../../DB/models/enrollment.js";
import Student from "../../../DB/models/student.js";
import User from "../../../DB/models/user.js";
import Halaka from "../../../DB/models/halaka.js";
import {
  success,
  notFound,
  error,
  forbidden,
} from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/apiError.js";
import TeacherWallet from "../../../DB/models/teacherWallet.js";
import { sendNotification } from "../../services/notification.service.js";
import Transaction from "../../../DB/models/transaction.js";
import { createZoomMeeting } from "../zoom/zoom.service.js";
import { getRecurrenceFromSchedule } from "../../../DB/models/halaka.js";
import mongoose from "mongoose";
import crypto from "crypto";

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_CARD_INTEGRATION_ID = process.env.PAYMOB_CARD_INTEGRATION_ID;
const PAYMOB_WALLET_INTEGRATION_ID = process.env.PAYMOB_WALLET_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_BASE_URL = "https://accept.paymob.com/api";

// --- PAYMOB 3-STEP INTEGRATION LOGIC ---

// Step 1: Authentication Request to get an auth token from Paymob
async function getPaymobToken() {
  const { data } = await axios.post(`${PAYMOB_BASE_URL}/auth/tokens`, {
    api_key: PAYMOB_API_KEY,
  });
  return data.token;
}

// Step 2: Order Registration Request
async function registerPaymobOrder(
  token,
  amountCents,
  enrollmentId
  //   userEmail
) {
  const { data } = await axios.post(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
    auth_token: token,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: "EGP",
    items: [],
    merchant_order_id: enrollmentId,
    // shipping_data: {
    //   email: userEmail,
    // },
  });
  return data;
}

// Step 3: Payment Key Request
async function getPaymobPaymentKey(
  token,
  amountCents,
  orderId,
  user,
  integrationId
) {
  const { data } = await axios.post(
    `${PAYMOB_BASE_URL}/acceptance/payment_keys`,
    {
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        email: user.email,
        first_name: user.firstName || "Student",
        last_name: user.lastName || "User",
        phone_number: user.phone || "01000000000",
        apartment: "N/A",
        floor: "N/A",
        street: "N/A",
        building: "N/A",
        city: "N/A",
        country: "EG",
        state: "N/A",
      },
      currency: "EGP",
      integration_id: integrationId,
    }
  );
  return data.token;
}
// --- Helper function to pay with wallet ---
async function triggerWalletPayment(paymentKey, phoneNumber) {
  const { data } = await axios.post(
    `${PAYMOB_BASE_URL}/acceptance/payments/pay`,
    {
      source: {
        identifier: phoneNumber,
        subtype: "WALLET",
      },
      payment_token: paymentKey,
    }
  );
  // This request triggers the payment prompt on the user's phone.
  // It doesn't typically return a redirect_url for wallets.
  return data;
}

export const initiatePayment = asyncHandler(async (req, res) => {
  // --- 0. Extract and validate input ---
  const { enrollmentId, paymentMethod, walletPhoneNumber } = req.body;

  // --- 1. Validate enrollment and student ---
  const user = await User.findById(req.user._id);
  if (!user) return notFound(res, "User not found");

  const student = await Student.findOne({ userId: user._id }).select(
    "_id userId"
  );
  if (!student) return notFound(res, "الطالب غير موجود");

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) return notFound(res, "التسجيل غير موجود");
  if (enrollment.status !== "pending_payment")
    return error(res, "التسجيل ليس في انتظار الدفع", 400);

  const halaka = await Halaka.findById(enrollment.halaka);
  if (!halaka) return notFound(res, "الحلقة المرتبطة بهذا التسجيل غير موجودة");

  if (
    halaka.halqaType === "halqa" &&
    halaka.currentStudents >= halaka.maxStudents
  ) {
    return error(res, "عذرًا، لقد اكتمل عدد الطلاب في هذه الحلقة.", 409);
  }

  // --- 3. Prepare payment details ---
  // Use totalPrice, pricePerStudent, or pricePerSession (in that order)
  const amountCents = Math.round(
    (enrollment.snapshot.totalPrice ||
      enrollment.snapshot.pricePerStudent ||
      enrollment.snapshot.pricePerSession) * 100
  );

  try {
    // Determine the integration ID based on the payment method
    let integrationId;
    if (paymentMethod === "wallet") {
      integrationId = PAYMOB_WALLET_INTEGRATION_ID;
    } else {
      // Default to card payment
      integrationId = PAYMOB_CARD_INTEGRATION_ID;
    }

    // --- PAYMOB 3-STEP INTEGRATION LOGIC ---

    // Step 1: Authentication Request to get an auth token from Paymob
    const paymobToken = await getPaymobToken();

    let orderId;

    // --- CHECK FOR EXISTING ORDER ---
    if (enrollment.paymobOrderId) {
      console.log(
        `Using existing Paymob Order ID: ${enrollment.paymobOrderId}`
      );
      // This if was already registered but Operation was not completed
      orderId = enrollment.paymobOrderId;
    } else {
      console.log("Registering a new order with Paymob...");
      // Step 2: Order Registration Request (this first time student try to pay)
      const order = await registerPaymobOrder(
        paymobToken,
        amountCents,
        enrollment._id.toString()
        // user.email
      );
      orderId = order.id;

      // Save the new order ID to the enrollment for future attempts
      enrollment.paymobOrderId = orderId;
      await enrollment.save();
    }

    // Step 3: Payment Key Request
    const paymentKey = await getPaymobPaymentKey(
      paymobToken,
      amountCents,
      orderId,
      user,
      integrationId
    );

    // Build payment URL (iframe) https://accept.paymob.com/api
    let responseData = { paymentKey, orderId, paymentMethod };
    let message = "تم إنشاء رابط الدفع بنجاح";
    if (paymentMethod === "wallet") {
      // For wallets, we need to get a redirect URL
      await triggerWalletPayment(paymentKey, walletPhoneNumber);
      responseData.paymentUrl = null; // Wallets don't use an iframe
      message = "تم إرسال طلب الدفع إلى هاتفك المحمول. يرجى التأكيد.";
    } else {
      // For cards, we build the iframe URL
      responseData.paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;
    }

    // --- 4. Return payment URL and details to client ---
    return success(res, responseData, message);
  } catch (err) {
    // --- 5. Handle errors gracefully ---
    return error(
      res,
      "فشل في بدء الدفع",
      500,
      err?.response?.data || err.message
    );
  }
});

/**
 * Paymob Payment Webhook Handler
 * Receives payment notification from Paymob, verifies, and updates enrollment and teacher wallet
 */
export const paymobPaymentWebhook = asyncHandler(async (req, res) => {
  // --- Step 0: Receive Data from Paymob ---
  // Paymob sends all data in the req.body object
  const { obj: transactionDetails } = req.body;
  const { hmac } = req.query;
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

  if (!transactionDetails) {
    // If no data is received, send an error
    return error(res, "Invalid payload", 400);
  }

  // --- Step 1: HMAC Signature Validation (Security) ---
  if (!validateHmacSignature(transactionDetails, hmac, hmacSecret)) {
    console.error("HMAC validation failed. Request might be tampered with.");
    return forbidden(res, "Invalid HMAC");
  }

  // --- Step 2: Process the Request after ensuring it's secure ---

  // We check that the payment was successful and is not pending.
  if (
    transactionDetails.success === true &&
    transactionDetails.pending === false
  ) {
    // We extract the enrollment ID that we previously sent to Paymob.
    const enrollmentId = transactionDetails.order.merchant_order_id;

    // Use a transaction here to ensure all updates succeed or fail together
    const session = await mongoose.startSession();
    session.startTransaction();
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      status: "pending_payment",
    }).session(session);

    // --- Step 3: Idempotency Check ---
    // We ensure that we haven't processed this payment before.
    if (enrollment) {
      const halaka = await Halaka.findById(enrollment.halaka).session(session);
      if (!halaka)
        return notFound(res, "الحلقة المرتبطة بهذا التسجيل غير موجودة");
      // --- BEST PRACTICE: Final capacity check inside the transaction ---
      if (
        halaka.halqaType === "halqa" &&
        halaka.currentStudents >= halaka.maxStudents
      ) {
        // This is a rare race condition, but this check prevents it.
        // We need to handle this case, perhaps by refunding the user.
        await session.abortTransaction();
        return res.status(200).json({ received: true });
      }

      // a. Update enrollment status and session balance
      enrollment.status = "active";
      enrollment.sessionsRemaining = halaka.totalSessions;
      await enrollment.save({ session });
      // b. Update halaka (add student to list and increment count)
      if (halaka.halqaType === "halqa") {
        halaka.students.push(enrollment.student);
        halaka.currentStudents += 1;
        await halaka.save({ session });
      }

      // c. Create a permanent transaction record
      const amount = transactionDetails.amount_cents / 100;
      const platformFee = amount * 0.05; // 5% platform fee
      const netAmount = amount - platformFee;

      await Transaction.create(
        [
          {
            user: enrollment.student,
            teacher: halaka.teacher,
            enrollment: enrollment._id,
            type: "package_purchase",
            amount,
            platformFee,
            netAmount,
            gatewayTransactionId: transactionDetails.id.toString(),
            status: "completed",
          },
        ],
        { session }
      );

      // d. Update the teacher's wallet
      const teacherWallet = await TeacherWallet.findOneAndUpdate(
        { teacher: halaka.teacher },
        { $inc: { pendingBalance: netAmount } },
        { upsert: true, new: true, session }
      );
      console.log('Halaka:', halaka);
      if (!teacherWallet) {
        
        console.error("Failed to update or create teacher wallet for halaka");
      }

      // c. Create a Zoom meeting if the halaka has a schedule

      if (!halaka.zoomMeeting && halaka.halqaType === "private") {
        try {
          const zoomRecurrence = getRecurrenceFromSchedule(halaka.schedule);
          const zoomMeeting = await createZoomMeeting({
            topic: halaka.title,
            start_time: halaka.schedule.startDate.toISOString(),
            duration: halaka.schedule.duration,
            timezone: halaka.schedule.timezone,
            password: Math.random().toString(36).slice(-8),
            recurrence: zoomRecurrence,
          });

          halaka.zoomMeeting = zoomMeeting;
          await halaka.save({ session });
        } catch (err) {
          console.error("❌ Failed to create Zoom meeting:", err.message);
          return error(res, "Failed to create Zoom meeting", 500);
        }
      }

      // --- Activate ChatGroup integration ---
      // Add the student's userId to the halaka's chatGroup participants if not already present
      if (halaka.chatGroup) {
        const ChatGroup = (await import("../../../DB/models/chatGroup.js"))
          .default;
        const chatGroup = await ChatGroup.findById(halaka.chatGroup);
        if (chatGroup) {
          // Find the full student doc to get the userId
          const studentDoc = await Student.findById(student._id).populate(
            "userId"
          );
          if (studentDoc && studentDoc.userId) {
            const userObjectId = studentDoc.userId._id;
            if (
              !chatGroup.participants
                .map((id) => id.toString())
                .includes(userObjectId.toString())
            ) {
              chatGroup.participants.push(userObjectId);
              await chatGroup.save({ session });
            }
          }
        }
      }
      // --- END ChatGroup integration ---

      // d. Send success notifications
      const studentProfile = await Student.findById(enrollment.student).select(
        "userId"
      );
      if (studentProfile) {
        await sendNotification({
          recipient: studentProfile.userId,
          type: "payment_success",
          message: `Your payment for the halaka "${enrollment.snapshot.halakaTitle}" was successful.`,
          link: `/Student`,
        });
      }

      await session.commitTransaction();
      console.log(
        `✅ Successfully processed payment for enrollment: ${enrollmentId}`
      );
    } else {
      console.log(
        `❕ Payment for enrollment ${enrollmentId} was already processed or not found.`
      );
    }
  }

  // --- Step 4: Send a confirmation response to Paymob ---
  // We must always send a 200 OK response to let Paymob know we have successfully received the webhook.
  success(res, { received: true }, "Payment processed successfully");
});

/**
 * Validate HMAC signature from Paymob
 * @param {Object} transactionDetails - Transaction details from Paymob
 * @param {string} hmac - HMAC signature from query params
 * @param {string} hmacSecret - Secret key for HMAC validation
 * @returns {boolean} - True if valid, false otherwise
 */
function validateHmacSignature(transactionDetails, hmac, hmacSecret) {
  const hmacFields = [
    transactionDetails.amount_cents,
    transactionDetails.created_at,
    transactionDetails.currency,
    transactionDetails.error_occured,
    transactionDetails.has_parent_transaction,
    transactionDetails.id,
    transactionDetails.integration_id,
    transactionDetails.is_3d_secure,
    transactionDetails.is_auth,
    transactionDetails.is_capture,
    transactionDetails.is_refunded,
    transactionDetails.is_standalone_payment,
    transactionDetails.is_voided,
    transactionDetails.order.id,
    transactionDetails.owner,
    transactionDetails.pending,
    transactionDetails.source_data.pan,
    transactionDetails.source_data.sub_type,
    transactionDetails.source_data.type,
    transactionDetails.success,
  ].join("");

  const calculatedHmac = crypto
    .createHmac("sha512", hmacSecret)
    .update(hmacFields)
    .digest("hex");

  return calculatedHmac === hmac;
}
