const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    learningInterests: [{ type: String, trim: true }],
    preferredLanguages: [{ type: String, trim: true }],
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", ""],
      default: "",
    },

    skills: [{ type: String, trim: true }],
    yearsOfExperience: { type: Number, min: 0, max: 60, default: null },
    bio: { type: String, trim: true, maxlength: 1000 },
    certifications: [{ type: String, trim: true }],
    portfolioLinks: [{ type: String, trim: true }],
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatar: { type: String, default: null },

    role: {
      type: String,
      enum: ["learner", "teacher", null],
      default: null,
    },

    profileCompleted: { type: Boolean, default: false },
    profile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, profileCompleted: 1 });

module.exports = mongoose.model("User", userSchema);
