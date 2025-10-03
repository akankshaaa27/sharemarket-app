import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Distinctive number sub-schema
const DistinctiveSchema = new Schema(
  {
    from: { type: String, trim: true },
    to: { type: String, trim: true },
  },
  { _id: false },
);

// Review sub-schema
const ReviewSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "needs_attention"],
      default: "pending",
    },
    notes: { type: String, trim: true, default: "" },
    reviewedAt: { type: Date },
    reviewedBy: { type: String, trim: true },
  },
  { _id: false },
);

// Company sub-schema
const CompanySchema = new Schema(
  {
    companyName: { type: String, required: true, trim: true },
    isinNumber: { type: String, trim: true },
    folioNumber: { type: String, trim: true },
    certificateNumber: { type: String, trim: true },
    distinctiveNumber: DistinctiveSchema,
    quantity: { type: Number, default: 0 },
    faceValue: { type: Number, default: 0 },
    purchaseDate: { type: Date },
    // Nested review object
    review: {
      type: ReviewSchema,
      default: () => ({
        status: "pending",
        notes: "",
        reviewedAt: null,
        reviewedBy: "",
      }),
    },
  },
  { _id: true },
);

// Bank details sub-schema
const BankDetailsSchema = new Schema(
  {
    bankNumber: { type: String, trim: true },
    branch: { type: String, trim: true },
    bankName: { type: String, trim: true },
    ifscCode: { type: String, uppercase: true, trim: true },
    micrCode: { type: String, trim: true },
  },
  { _id: false },
);

// Shareholder names sub-schema
const ShareholderNameSchema = new Schema(
  {
    name1: { type: String, required: true, trim: true },
    name2: { type: String, trim: true },
    name3: { type: String, trim: true },
  },
  { _id: false },
);

// Dividend sub-schema
const DividendSchema = new Schema(
  {
    amount: { type: Number, default: 0 },
    date: { type: Date },
  },
  { _id: false },
);

const ClientProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    shareholderName: ShareholderNameSchema,
    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    aadhaarNumber: { type: String, trim: true }, // New Aadhaar field
    address: { type: String, trim: true },
    bankDetails: BankDetailsSchema,
    dematAccountNumber: { type: String, trim: true },
    dematCreatedWith: { type: String, trim: true }, // New field for DMAT account creation platform
    dematCreatedWithPerson: { type: String, trim: true },
    dematCreatedWithPersonNumber: { type: String, trim: true },
    companies: [CompanySchema],
    currentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Active", "Closed", "Pending", "Suspended"],
      default: "Active",
      index: true,
    },
    remarks: { type: String, trim: true },
    dividend: DividendSchema,
  },
  { timestamps: true },
);

// Index for better query performance on review status
ClientProfileSchema.index({ "companies.review.status": 1 });

// Index for Aadhaar number for better query performance
ClientProfileSchema.index({ aadhaarNumber: 1 });

// Index for demat account fields for better query performance
ClientProfileSchema.index({ dematAccountNumber: 1 });
ClientProfileSchema.index({ dematCreatedWith: 1 });
ClientProfileSchema.index({ dematCreatedWithPerson: 1 });

export default mongoose.models.ClientProfile ||
  model("ClientProfile", ClientProfileSchema);
