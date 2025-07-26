import cors from "cors";
import { apiRateLimiter } from "./middlewares/rateLimiter.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import authRouter from "./modules/auth/auth.router.js";
import onboardingRouter from "./modules/onboarding/onboarding.router.js";
import zoomRouter from "./modules/zoom/zoom.router.js";
import halkaRouter from "./modules/halaka/halaka.router.js";
import cookieParser from "cookie-parser";
import chatRouter from "./modules/chat/chat.router.js";
import superAdminRouter from "./modules/super-admin/super-admin.router.js";
import teacherRouter from "./modules/teacher/teacher.router.js";
import contactRouter from "./modules/contact/contact.router.js";
import webhookRouter from "./modules/webhook/webhook.router.js";
import enrollmentRouter from "./modules/enrollment/enrollment.router.js";
import notificationRouter from "./modules/notification/notification.router.js";
import reviewRouter from "./modules/review/review.router.js";
import studentRouter from "./modules/student/student.router.js";
import paymentRouter from "./modules/payment/payment.router.js";
import walletRouter from "./modules/wallet/wallet.router.js";
import cronRouter from "./test/cron/test.router.js"; // Import the test cron router

export const appRouter = (app, express) => {
  // global middlewares
  app.use(cors());
  app.use(express.json());
  // app.use(apiRateLimiter);
  app.use(cookieParser());
  app.get("/", (req, res) => {
    res.status(200).json({
      message: "Welcome to the API",
      status: "success",
    });
  });

  // Import routes
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("/api/contact", contactRouter);

  app.use("/api/v1/onboarding", onboardingRouter);
  app.use("/api/v1/super-admin", superAdminRouter);

  app.use("/api/v1/zoom", zoomRouter);
  app.use("/api/v1/halaka", halkaRouter);
  app.use("/api/v1/teacher", teacherRouter);
  app.use("/api/v1/webhook", webhookRouter);
  app.use("/api/v1/enrollments", enrollmentRouter);
  app.use("/api/v1/notifications", notificationRouter);
  app.use("/api/v1/reviews", reviewRouter);
  app.use("/api/v1/student", studentRouter);
  app.use("/api/v1/payment", paymentRouter);
  app.use("/api/v1/wallet", walletRouter);

  // ---- TEST ----
  app.use("/api/v1/test", cronRouter);

  // 404 handler
  app.use(notFoundHandler);

  // global error handler
  app.use(globalErrorHandler);
};
