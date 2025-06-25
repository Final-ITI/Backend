import express from "express";
import dotenv from "dotenv";
import connectionDB from "./DB/connection.js";

dotenv.config();
const app = express();

connectionDB();

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`);
});
