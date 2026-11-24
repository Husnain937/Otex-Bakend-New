import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      unique:true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "accounts", "stock", "purchase", "production", "wages"],
      default: "stock",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    permissions: {
      dashboard: { type: Boolean, default: true },
      accounts: { type: Boolean, default: false },
      stock: { type: Boolean, default: false },
      purchase: { type: Boolean, default: false },
      production: { type: Boolean, default: false },
      wages: { type: Boolean, default: false },
      reports: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ role: 1 });


export default mongoose.model("User", userSchema);
