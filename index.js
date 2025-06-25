import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectionDB from "./DB/connection.js";
import { apiRateLimiter } from "./src/middlwares/rateLimiter.js";
import { globalErrorHandler } from "./src/middlwares/globalErrorHandler.js";
import { notFoundHandler } from "./src/middlwares/notFound.js";
import appRouter from "./src/app.router.js";

dotenv.config();
const app = express();

// connect to DB
connectionDB();

// global middlewares
app.use(cors());
app.use(express.json());
app.use(apiRateLimiter);

// routes
app.use("/api/v1", appRouter);

// 404 handler
app.use(notFoundHandler);

// global error handler
app.use(globalErrorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Server is running on PORT ${port}`);
});
