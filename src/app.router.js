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
  app.use("/api", contactRouter);

  app.use("/api/v1/onboarding", onboardingRouter);
  app.use("/api/v1/super-admin", superAdminRouter)

  app.use("/api/v1/zoom", zoomRouter);
  app.use("/api/v1/halaka", halkaRouter);
  app.use("/api/v1/teacher", teacherRouter);


  // 404 handler
  app.use(notFoundHandler);

  // global error handler
  app.use(globalErrorHandler);
};
