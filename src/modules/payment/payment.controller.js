import axios from "axios";
import Enrollment from "../../../DB/models/enrollment.js";
import Student from "../../../DB/models/student.js";
import User from "../../../DB/models/user.js";
import { success, notFound, error } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/apiError.js";

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
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
  enrollmentId,
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
async function getPaymobPaymentKey(token, amountCents, orderId, user) {
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
      integration_id: PAYMOB_INTEGRATION_ID,
    }
  );
  return data.token;
}

export const initiatePayment = asyncHandler(async (req, res) => {
  // --- 0. Extract and validate input ---
  const { enrollmentId } = req.body;

  // --- 1. Validate enrollment and student ---
  const user = await User.findById(req.user._id);
  if (!user) return notFound(res, "User not found");

  const student = await Student.findOne({ userId: user._id }).select("_id userId");
  if (!student) return notFound(res, "Student profile not found");

  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) return notFound(res, "Enrollment not found");
  if (enrollment.status !== "pending_payment")
    return error(res, "Enrollment is not pending payment", 400);


  // --- 3. Prepare payment details ---
  // Use totalPrice, pricePerStudent, or pricePerSession (in that order)
  const amountCents = Math.round(
    (enrollment.snapshot.totalPrice ||
      enrollment.snapshot.pricePerStudent ||
      enrollment.snapshot.pricePerSession) * 100
  );

  try {
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
        enrollment._id.toString(),
        // user.email
      );
      console.log("Paymob Order registered:", order);
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
      user
    );

    // Build payment URL (iframe) https://accept.paymob.com/api
    const paymentUrl = `${PAYMOB_BASE_URL}/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    // --- 4. Return payment URL and details to client ---
    return success(
      res,
      { paymentUrl, paymentKey, orderId },
      "Payment initiated successfully"
    );
  } catch (err) {
    // --- 5. Handle errors gracefully ---
    return error(
      res,
      "Failed to initiate payment",
      500,
      err?.response?.data || err.message
    );
  }
});
