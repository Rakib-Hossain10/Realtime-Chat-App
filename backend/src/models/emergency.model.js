import mongoose from "mongoose";

const emergencySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    timestamp: { type: Date, default: Date.now },
    audioBlob: { type: Buffer }, // Audio blob as Buffer for storing in DB
  },
  { timestamps: true }
);

const Emergency = mongoose.model("Emergency", emergencySchema);

export default Emergency;