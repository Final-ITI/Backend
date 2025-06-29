import cors from "cors";
import { apiRateLimiter } from "./middlewares/rateLimiter.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import authRouter from "./modules/auth/auth.router.js";
import { register } from "./modules/auth/auth.controller.js";

export const appRouter = (app, express) => {
  // global middlewares
  app.use(cors());
  app.use(express.json());
  app.use(apiRateLimiter);

  app.use("/", (req, res) => {
    res.status(200).json({
      message: "Welcome to the API",
      status: "success",
    });
  });

  // Import routes
  app.use("/api/v1/auth", authRouter,register);

  // 404 handler
  app.use(notFoundHandler);

  // global error handler
  app.use(globalErrorHandler);
};
