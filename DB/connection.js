import mongoose from "mongoose";

const connectionDB = async () => {
  return await mongoose
    .connect(process.env.DB_URI)
    .then(() => console.log("DB Connected Successfully"))
    .catch(() => console.log("DB Not Connected"));
};

export default connectionDB;
