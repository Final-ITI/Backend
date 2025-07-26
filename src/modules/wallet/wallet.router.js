import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validation.middleware.js";
import {
  getMyBalance,
  createPayoutRequest,
  getPayoutRequests,
  getMyBankingInfo,
  updateMyBankingInfo,
  getAllPayoutRequests,
  updatePayoutRequestStatus,
} from "./wallet.controller.js";
import {
  createPayoutRequestValidation,
  getPayoutRequestsValidation,
  updateBankingInfoValidation,
  getAllPayoutRequestsValidation,
  updatePayoutRequestStatusValidation,
} from "./wallet.validation.js";

const router = Router();

// GET /api/v1/wallet/my-balance - Get the teacher's current wallet balance
router.get("/my-balance", authenticate, authorize("teacher"), getMyBalance);

// POST /api/v1/wallet/payout-requests - Create a new payout request
router.post(
  "/payout-requests",
  authenticate,
  authorize("teacher"),
  validate(createPayoutRequestValidation),
  createPayoutRequest
);

// GET /api/v1/wallet/payout-requests - Get the history of payout requests
router.get(
  "/payout-requests",
  authenticate,
  authorize("teacher"),
  validate(getPayoutRequestsValidation),
  getPayoutRequests
);

// GET /api/v1/wallet/banking-info - Get the teacher's banking information
router.get(
  "/banking-info",
  authenticate,
  authorize("teacher"),
  getMyBankingInfo
);

//  PUT /api/v1/wallet/banking-info - Update the teacher's banking information
router.put(
  "/banking-info",
  authenticate,
  authorize("teacher"),
  validate(updateBankingInfoValidation),
  updateMyBankingInfo
);

// ---- Super Admin Routes ----
// GET /api/v1/wallet/admin/payout-requests - Get all payout requests for admin review
router.get(
  "/admin/payout-requests",
  authenticate,
  authorize("superadmin"),
  validate(getAllPayoutRequestsValidation),
  getAllPayoutRequests
);

// PATCH /api/v1/wallet/admin/payout-requests/:id - Update a payout request status (approve/reject)
router.patch(
  "/admin/payout-requests/:id",
  authenticate,
  authorize("superadmin"),
  validate(updatePayoutRequestStatusValidation),
  updatePayoutRequestStatus
);

export default router;
