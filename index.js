import express from "express";
import dotenv from "dotenv";
import connectionDB from "./DB/connection.js";
import { appRouter } from "./src/app.router.js";
import { redis } from "./src/utils/redisClient.js";

dotenv.config();
const app = express();

// connect to DB
connectionDB();

appRouter(app, express);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Server is running on PORT ${port}`);
});
