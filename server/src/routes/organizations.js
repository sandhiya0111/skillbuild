import { Router } from 'express'
import mongoose from 'mongoose'
import Organization from '../models/Organization.js'
import User from '../models/User.js'
import { requireAuth, allowRoles } from '../middleware/auth.js'
const router = Router()
router.get('/', async (_req, res, next) => {
  try {
    const organizations = await Organization.find({ verified: true }).populate('createdBy','name').sort({ city: 1, name: 1 }).limit(300)
    res.json({ organizations })
  } catch (e) { next(e) }
})
router.get('/mine', requireAuth, allowRoles('ngo','admin'), async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id }
    const organization = await Organization.findOne(filter).sort({ createdAt: -1 }).populate('createdBy','name email')
    res.json({ organization })
  } catch (e) { next(e) }
})
router.get('/admin/all', requireAuth, allowRoles('admin'), async (_req, res, next) => {
  try { res.json({ organizations: await Organization.find().populate('createdBy','name email').populate('verifiedBy','name').sort({ verified: 1, createdAt: -1 }) }) } catch (e) { next(e) }
})
router.post('/', requireAuth, allowRoles('ngo'), async (req, res, next) => {
  try {
    const existing = await Organization.findOne({ createdBy: req.user._id })
    if (existing) return res.status(409).json({ message: 'Your account already has an organization profile. Contact an administrator if it needs correction.' })
    const { name, type, description, city, address, contactEmail, phone, bedsAvailable, mealsAvailable } = req.body || {}
    const org = await Organization.create({ name, type, description, city, address, contactEmail, phone, bedsAvailable, mealsAvailable, createdBy: req.user._id, verified: false })
    await User.findByIdAndUpdate(req.user._id, { organizationName: org.name, organizationVerified: false })
    req.app.get('io').emit('organizations:changed', { id: org._id.toString(), action: 'submitted', at: new Date().toISOString() })
    res.status(201).json({ organization: org })
  } catch (e) { next(e) }
})
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid organization identifier.' })
    const org = await Organization.findById(req.params.id)
    if (!org) return res.status(404).json({ message: 'Organization not found.' })
    if (req.user.role === 'admin') {
      if (typeof req.body?.verified === 'boolean') {
        org.verified = req.body.verified
        org.verifiedBy = req.body.verified ? req.user._id : null
        org.verifiedAt = req.body.verified ? new Date() : null
        await org.save()
        await User.findByIdAndUpdate(org.createdBy, { organizationVerified: org.verified, organizationName: org.name })
        req.app.get('io').emit('organizations:changed', { id: org._id.toString(), action: 'verification-updated', at: new Date().toISOString() })
        return res.json({ organization: org })
      }
      return res.status(400).json({ message: 'Admins may update the verification status through this endpoint.' })
    }
    if (req.user.role !== 'ngo' || !org.createdBy.equals(req.user._id)) return res.status(403).json({ message: 'You can only update your own organization profile.' })
    if (org.verified) return res.status(409).json({ message: 'Verified profiles cannot be edited directly. Contact an administrator.' })
    const editable = ['name','type','description','city','address','contactEmail','phone','bedsAvailable','mealsAvailable']
    for (const key of editable) if (req.body[key] !== undefined) org[key] = req.body[key]
    await org.save(); await User.findByIdAndUpdate(req.user._id, { organizationName: org.name })
    res.json({ organization: org })
  } catch (e) { next(e) }
})
export default router
