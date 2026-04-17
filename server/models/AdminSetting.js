const mongoose = require("mongoose");

const adminSettingSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, unique: true, default: "primary" },
    accessCodeHash: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    collection: "admin_settings",
  }
);

module.exports = mongoose.model("AdminSetting", adminSettingSchema);
