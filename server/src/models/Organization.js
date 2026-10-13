import mongoose from 'mongoose'
const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  type: { type: String, enum: ['ngo', 'shelter', 'food-bank', 'medical', 'rehabilitation', 'employment'], default: 'ngo' },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1500 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  address: { type: String, required: true, trim: true, maxlength: 240 },
  contactEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 40, default: '' },
  bedsAvailable: { type: Number, min: 0, max: 100000, default: 0 },
  mealsAvailable: { type: Number, min: 0, max: 100000, default: 0 },
  verified: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false })
organizationSchema.index({ verified: 1, city: 1, type: 1 })
export default mongoose.model('Organization', organizationSchema)
