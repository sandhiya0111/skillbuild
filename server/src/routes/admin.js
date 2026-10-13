import { Router } from 'express'
import Organization from '../models/Organization.js'
import User from '../models/User.js'
import { requireAuth, allowRoles } from '../middleware/auth.js'
const router = Router()
router.use(requireAuth, allowRoles('admin'))
router.get('/organizations', async (_req, res, next) => {
  try { const organizations = await Organization.find().populate('createdBy','name email').sort({ verified: 1, createdAt: -1 }); res.json({ organizations }) } catch (e) { next(e) }
})
router.get('/users', async (req, res, next) => {
  try { const role = ['citizen','volunteer','ngo','admin'].includes(req.query.role) ? req.query.role : undefined; const users = await User.find({ ...(role ? { role } : {}), active: true }).select('name email role organizationName').sort({ name: 1 }).limit(500); res.json({ users }) } catch (e) { next(e) }
})
export default router
