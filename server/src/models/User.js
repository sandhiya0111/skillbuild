import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['citizen', 'volunteer', 'ngo', 'admin'], default: 'citizen' },
  organizationName: { type: String, trim: true, maxlength: 120, default: '' },
  organizationVerified: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false })

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})
userSchema.methods.comparePassword = function (candidate) { return bcrypt.compare(candidate, this.password) }
userSchema.methods.toSafeJSON = function () {
  return { _id: this._id, name: this.name, email: this.email, role: this.role, organizationName: this.organizationName, organizationVerified: this.organizationVerified, createdAt: this.createdAt }
}
export default mongoose.model('User', userSchema)
