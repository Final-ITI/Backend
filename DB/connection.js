import mongoose from "mongoose";

export default  connectionDB = async () => {
  return await mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    })
    .then(() => console.log("DB Connected Successfully"))
    .catch((error) => {
      console.log("DB Not Connected", error);
    });
};
