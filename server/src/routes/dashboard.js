import { Router } from 'express'
import AssistanceRequest from '../models/AssistanceRequest.js'
import Organization from '../models/Organization.js'
import { requireAuth } from '../middleware/auth.js'
const router = Router()
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = req.user
    let filter = {}
    if (user.role === 'citizen') filter = { requestedBy: user._id }
    else if (user.role === 'volunteer') filter = { $or: [{ status: 'open' }, { assignedTo: user._id }] }
    else if (user.role === 'ngo') {
      if (!user.organizationVerified) return res.status(403).json({ message: 'Your organization must be verified before accessing the coordination dashboard.' })
      const ownOrgs = await Organization.find({ createdBy: user._id, verified: true }).select('_id')
      filter = { $or: [{ status: 'open' }, { assignedOrganization: { $in: ownOrgs.map(o => o._id) } }] }
    }
    const [visibleRequests, resolved, open, organizations, recentRequests] = await Promise.all([
      AssistanceRequest.countDocuments(filter), AssistanceRequest.countDocuments({ ...filter, status: 'resolved' }), AssistanceRequest.countDocuments({ ...filter, status: 'open' }), Organization.countDocuments({ verified: true }), AssistanceRequest.find(filter).populate('requestedBy','name').populate('assignedTo','name').sort({ createdAt: -1 }).limit(5)
    ])
    res.json({ stats: { visibleRequests, resolved, open, organizations }, recentRequests })
  } catch (e) { next(e) }
})
export default router
