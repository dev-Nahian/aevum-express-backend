import mongoose from "mongoose";

const cmsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    label: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "richtext", "json"],
      default: "text",
    },
  },
  { timestamps: true }
);

const CMS = mongoose.model("CMS", cmsSchema);
export default CMS;
