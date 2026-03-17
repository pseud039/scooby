import mongoose from "mongoose";
import { CONFIG } from "../config/settings.js";
import dotenv from "dotenv";

dotenv.config();

const pageSchema = new mongoose.Schema({
  url:            { type: String, required: true, unique: true },
  title:          { type: String, default: "" },
  extracted_text: { type: String, default: "" },
  links_found:    { type: [String], default: [] },
  metadata: {
    status_code:       { type: Number, default: 0 },
    crawled_at:        { type: Date, default: Date.now },
    crawl_duration_ms: { type: Number, default: 0 },
    content_type:      { type: String, default: "" },
    error:             { type: String, default: "" },
  },
  status: {
    type:    String,
    enum:    ["crawled", "failed"],
    default: "crawled",
  },
});

const frontierSchema = new mongoose.Schema({
  url:       { type: String, required: true, unique: true },
  depth:     { type: Number, default: 0 },
  domain:    { type: String, default: "" },
  status: {
    type:    String,
    enum:    ["pending", "processing", "done", "failed"],
    default: "pending",
  },
  added_at:  { type: Date, default: Date.now },
});

// Indexes for performance
pageSchema.index({ url: 1 });
pageSchema.index({ status: 1 });
frontierSchema.index({ status: 1, depth: 1 });
frontierSchema.index({ domain: 1 });           

export const Page     = mongoose.model("Page",     pageSchema);
export const Frontier = mongoose.model("Frontier", frontierSchema);

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};