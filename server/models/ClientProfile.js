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
    bankAccountNumber: { type: String, trim: true },
    bankAccountType: { type: String, enum: ["Savings", "Current", "Other"], default: "Savings" },
    bankName: { type: String, trim: true },
    branchCode: { type: String, trim: true },
    ifscCode: { type: String, uppercase: true, trim: true },
    micrCode: { type: String, trim: true },
    bankAddress: { type: String, trim: true },
    leiNumber: { type: String, trim: true },
  },
  { _id: false },
);

// Shareholder names sub-schema
const ShareholderNameSchema = new Schema(
  {
    name1: { type: String, required: true, trim: true },
    name2: { type: String, trim: true },
    name3: { type: String, trim: true },
    fatherOrSpouseName: { type: String, trim: true },
  },
  { _id: false },
);

// Address sub-schema
const AddressSchema = new Schema(
  {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: "India", trim: true },
  },
  { _id: false },
);

// Nominee sub-schema
const NomineeSchema = new Schema(
  {
    name: { type: String, trim: true },
    pan: { type: String, uppercase: true, trim: true },
    address: { type: String, trim: true },
    pincode: { type: String, trim: true },
    aadhaar: { type: String, trim: true },
    emailId: { type: String, trim: true },
    relationship: { type: String, trim: true },
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
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    
    // Basic Client Information
    clientId: { type: String, required: true, unique: true, trim: true, index: true },
    shortName: { type: String, trim: true },
    clientType: { type: String, enum: ["Resident", "Non-Resident"], default: "Resident" },
    accountCategory: { type: String, enum: ["Beneficiary", "Other"], default: "Beneficiary" },
    subType: { type: String, enum: ["Ordinary", "Other"], default: "Ordinary" },
    status: {
      type: String,
      enum: ["Active", "Closed", "Pending", "Suspended"],
      default: "Active",
      index: true,
    },
    accountActivationDate: { type: Date, default: Date.now },
    statusChangeReason: { type: String, trim: true },
    statusChangeDate: { type: Date },
    standingInstruction: { type: String, enum: ["Y", "N"], default: "N" },
    
    // Personal Details
    shareholderName: ShareholderNameSchema,
    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    aadhaarNumber: { type: String, trim: true },
    occupation: { type: String, trim: true },
    address: AddressSchema,
    mobileNumber: { type: String, trim: true },
    emailId: { type: String, trim: true },
    eDisFlag: { type: String, enum: ["Y", "N"], default: "N" },
    oneTimeDeclarationFlag: { type: String, default: "Not Submitted", trim: true },
    
    // Financial Details
    bankDetails: BankDetailsSchema,
    
    // Income & Net Worth
    grossAnnualIncomeRange: { type: String, trim: true },
    netWorth: { type: String, trim: true },
    netWorthAsOnDate: { type: Date },
    
    // Additional Flags
    familyFlagMobile: { type: String, trim: true },
    familyFlagEmail: { type: String, trim: true },
    smsFacility: { type: String, enum: ["Available", "Not Available"], default: "Available" },
    panFlag: { type: String, default: "Not Verified", trim: true },
    atmFlag: { type: String, default: "Not Assigned", trim: true },
    receivePhysicalCommunicationsFlag: { type: String, default: "Not Available", trim: true },
    
    // Demat Account Details
    dematAccountNumber: { type: String, trim: true },
    dpId: { type: String, default: "IN300095", trim: true },
    dpName: { type: String, default: "ILAFS SECURITIES SERVICES LIMITED", trim: true },
    
    // Nominee Details
    nominee: NomineeSchema,
    
    companies: [CompanySchema],
    currentDate: { type: Date, default: Date.now },
    remarks: { type: String, trim: true },
    dividend: DividendSchema,
  },
  { timestamps: true },
);

// Indexes for better query performance
ClientProfileSchema.index({ "companies.review.status": 1 });
ClientProfileSchema.index({ aadhaarNumber: 1 });
ClientProfileSchema.index({ dematAccountNumber: 1 });
ClientProfileSchema.index({ mobileNumber: 1 });
ClientProfileSchema.index({ emailId: 1 });
ClientProfileSchema.index({ clientType: 1 });
ClientProfileSchema.index({ accountCategory: 1 });

export default mongoose.models.ClientProfile ||
  model("ClientProfile", ClientProfileSchema);