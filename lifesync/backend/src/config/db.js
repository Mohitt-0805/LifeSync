import mongoose from "mongoose";

const connectDB = async () => {
  if (process.env.USE_MOCK_DB === "true") {
    console.log(`\n⚠️  Running in mock in-memory DB mode (no local MongoDB connection required)`);
    return;
  }
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/lifesync");
    console.log(`\n MongoDB Connected! DB Host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("MONGODB connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
