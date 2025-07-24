import axios from "axios";
import Enrollment from "../../../DB/models/enrollment.js";
import Student from "../../../DB/models/student.js";
import User from "../../../DB/models/user.js";
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
async function getPaymobPaymentKey(token, amountCents, orderId, user, integrationId) {
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
  const { data } = await axios.post(`${PAYMOB_BASE_URL}/acceptance/payments/pay`, {
    source: {
      identifier: phoneNumber,
      subtype: "WALLET"
    },
    payment_token: paymentKey
  });
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
    if (paymentMethod === 'wallet') {
        integrationId = PAYMOB_WALLET_INTEGRATION_ID;
    } else { // Default to card payment
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
    let paymentUrl;
    if (paymentMethod === 'wallet') {
        // For wallets, we need to get a redirect URL
        await triggerWalletPayment(paymentKey, walletPhoneNumber);
        responseData.paymentUrl = null; // Wallets don't use an iframe
        responseData.message = "تم إرسال طلب الدفع إلى هاتفك المحمول. يرجى التأكيد.";
    } else {
        // For cards, we build the iframe URL
        paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;
    }

    // --- 4. Return payment URL and details to client ---
    return success(
      res,
      responseData,
      "تم إنشاء رابط الدفع بنجاح"
    );
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

  if (!transactionDetails) {
    // If no data is received, send an error
    return error(res, "Invalid payload", 400);
  }

  // --- Step 1: HMAC Signature Validation (Security) ---
  // This is the most critical security step to ensure the request is from Paymob and hasn't been tampered with.
  const hmac = req.query.hmac;
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

  // Paymob specifies a particular order for the fields used to create the signature.
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

  // We create our own signature using the same secret key to compare it.
  const calculatedHmac = crypto
    .createHmac("sha512", hmacSecret)
    .update(hmacFields)
    .digest("hex");

  if (calculatedHmac !== hmac) {
    // If the signatures don't match, reject the request immediately.
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

    // We find the enrollment in our database.
    const enrollment = await Enrollment.findById(enrollmentId).populate({
      path: "halaka",
      select: "teacher totalSessions title",
    });

    // --- Step 3: Idempotency Check ---
    // We ensure that we haven't processed this payment before.
    if (enrollment && enrollment.status === "pending_payment") {
      // a. Update enrollment status and session balance
      enrollment.status = "active";
      if (enrollment.halaka && enrollment.halaka.totalSessions) {
        enrollment.sessionsRemaining = enrollment.halaka.totalSessions;
      }
      await enrollment.save();

      // b. Create a permanent transaction record
      const amount = transactionDetails.amount_cents / 100;
      const platformFee = amount * 0.05; // 5% platform fee
      const netAmount = amount - platformFee;

      await Transaction.create({
        user: enrollment.student, // This should be the Student Profile ID
        teacher: enrollment.halaka.teacher,
        enrollment: enrollment._id,
        // type: enrollment.snapshot.totalPrice ? "package_purchase" : "group_course_payment",
        type: "package_purchase",
        amount,
        platformFee,
        netAmount,
        gatewayTransactionId: transactionDetails.id.toString(),
        status: "completed",
      });

      // c. Update the teacher's wallet
      await TeacherWallet.findOneAndUpdate(
        { teacher: enrollment.halaka.teacher },
        { $inc: { balance: netAmount } },
        { upsert: true, new: true } // upsert: true creates a new wallet if it doesn't exist
      );

      // d. Send success notifications
      const studentProfile = await Student.findById(enrollment.student).select(
        "userId"
      );
      if (studentProfile) {
        await sendNotification({
          recipient: studentProfile.userId,
          type: "payment_success",
          message: `Your payment for the halaka "${enrollment.snapshot.halakaTitle}" was successful.`,
          link: `/my-courses/${enrollment.halaka._id}`,
        });
      }
      // You can add a notification for the teacher here in the same way

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
