import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function issueToken(user) { return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }) }
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {}
    if (![name,email,password].every(v => typeof v === 'string')) return res.status(400).json({ message: 'Name, email and password are required.' })
    const cleanName = name.trim(), cleanEmail = email.trim().toLowerCase()
    if (cleanName.length < 2 || cleanName.length > 100) return res.status(400).json({ message: 'Name must be between 2 and 100 characters.' })
    if (!emailPattern.test(cleanEmail) || cleanEmail.length > 254) return res.status(400).json({ message: 'Please enter a valid email address.' })
    if (password.length < 8 || password.length > 128) return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' })
    if (await User.exists({ email: cleanEmail })) return res.status(409).json({ message: 'An account with this email already exists.' })
    const allowedRoles = ['citizen', 'volunteer', 'ngo']
    const safeRole = allowedRoles.includes(role) ? role : 'citizen'
    const user = await User.create({ name: cleanName, email: cleanEmail, password, role: safeRole, organizationVerified: false })
    res.status(201).json({ token: issueToken(user), user: user.toSafeJSON() })
  } catch (e) { next(e) }
})
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Email and password are required.' })
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
    if (!user || !user.active || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Email or password is incorrect.' })
    res.json({ token: issueToken(user), user: user.toSafeJSON() })
  } catch (e) { next(e) }
})
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toSafeJSON() }))
export default router
