import mongoose from 'mongoose'
const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, minlength: 2, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false })
const requestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 4, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
  type: { type: String, enum: ['food', 'clothing', 'shelter', 'medical', 'rehabilitation', 'employment', 'other'], required: true },
  urgency: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  status: { type: String, enum: ['open', 'assigned', 'in-progress', 'resolved', 'cancelled'], default: 'open' },
  location: {
    city: { type: String, required: true, trim: true, maxlength: 100 },
    area: { type: String, trim: true, maxlength: 120, default: '' }
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedOrganization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  comments: { type: [commentSchema], default: [] },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false })
requestSchema.index({ status: 1, type: 1, urgency: 1, createdAt: -1 })
requestSchema.index({ requestedBy: 1, createdAt: -1 })
export default mongoose.model('AssistanceRequest', requestSchema)
