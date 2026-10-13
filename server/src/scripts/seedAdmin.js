import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../models/User.js'
if (!process.env.MONGODB_URI || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
  console.error('Set MONGODB_URI, JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.'); process.exit(1)
}
try {
  await mongoose.connect(process.env.MONGODB_URI)
  const email = process.env.ADMIN_EMAIL.toLowerCase().trim()
  let admin = await User.findOne({ email }).select('+password')
  if (admin) {
    admin.role = 'admin'; admin.active = true
    if (process.env.RESET_ADMIN_PASSWORD === 'true') admin.password = process.env.ADMIN_PASSWORD
    await admin.save()
    console.log(`Admin account updated: ${email}`)
  } else {
    admin = await User.create({ name: process.env.ADMIN_NAME || 'Demo Admin', email, password: process.env.ADMIN_PASSWORD, role: 'admin', active: true })
    console.log(`Admin created: ${email}`)
  }
  console.log('Use the configured ADMIN_EMAIL and ADMIN_PASSWORD to sign in. Keep these secrets private.')
} catch (error) { console.error(error.message); process.exitCode = 1 }
finally { await mongoose.disconnect() }
