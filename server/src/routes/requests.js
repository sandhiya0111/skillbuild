import { Router } from 'express'
import mongoose from 'mongoose'
import AssistanceRequest from '../models/AssistanceRequest.js'
import Organization from '../models/Organization.js'
import User from '../models/User.js'
import { requireAuth, allowRoles } from '../middleware/auth.js'
const router = Router()
const populate = [{ path: 'requestedBy', select: 'name role' }, { path: 'assignedTo', select: 'name role' }, { path: 'assignedOrganization', select: 'name city type createdBy' }, { path: 'comments.author', select: 'name role' }]
const isId = id => mongoose.isValidObjectId(id)
async function canSee(req, user) {
  if (user.role === 'admin') return true
  if (req.requestedBy?._id?.equals(user._id) || req.requestedBy?.equals?.(user._id)) return true
  if (req.assignedTo?._id?.equals(user._id) || req.assignedTo?.equals?.(user._id)) return true
  if (req.assignedOrganization?.createdBy?.equals(user._id)) return true
  if (req.status === 'open' && user.role === 'volunteer') return true
  if (req.status === 'open' && user.role === 'ngo' && user.organizationVerified) return true
  return false
}
router.use(requireAuth)
router.get('/', async (req, res, next) => {
  try {
    let filter = {}
    const user = req.user
    if (user.role === 'citizen') filter = { requestedBy: user._id }
    else if (user.role === 'volunteer') filter = { $or: [{ status: 'open' }, { assignedTo: user._id }] }
    else if (user.role === 'ngo') {
      if (!user.organizationVerified) return res.status(403).json({ message: 'Your organization must be verified before you can view and coordinate open requests.' })
      const ownOrgs = await Organization.find({ createdBy: user._id, verified: true }).select('_id')
      filter = { $or: [{ status: 'open' }, { assignedOrganization: { $in: ownOrgs.map(o => o._id) } }] }
    }
    const requests = await AssistanceRequest.find(filter).populate(populate).sort({ createdAt: -1 }).limit(200)
    res.json({ requests })
  } catch (e) { next(e) }
})
router.post('/', async (req, res, next) => {
  try {
    const { title, description, type, urgency, location } = req.body || {}
    if (![title, description, type, location?.city].every(v => typeof v === 'string' && v.trim())) return res.status(400).json({ message: 'Title, description, support type and city are required.' })
    const request = await AssistanceRequest.create({ title, description, type, urgency, location: { city: location.city, area: typeof location.area === 'string' ? location.area : '' }, requestedBy: req.user._id })
    const full = await AssistanceRequest.findById(request._id).populate(populate)
    req.app.get('io').emit('requests:changed', { id: request._id.toString(), action: 'created', at: new Date().toISOString() })
    res.status(201).json({ request: full })
  } catch (e) { next(e) }
})
router.get('/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid request identifier.' })
    const request = await AssistanceRequest.findById(req.params.id).populate(populate)
    if (!request) return res.status(404).json({ message: 'Request not found.' })
    if (!(await canSee(request, req.user))) return res.status(403).json({ message: 'You do not have access to this request.' })
    res.json({ request })
  } catch (e) { next(e) }
})
router.patch('/:id/assign', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid request identifier.' })
    const request = await AssistanceRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ message: 'Request not found.' })
    if (request.status !== 'open' && req.user.role !== 'admin') return res.status(409).json({ message: 'Only open requests can be claimed or assigned.' })
    const { assigneeType, assigneeId } = req.body || {}
    if (req.user.role === 'volunteer') {
      if (assigneeType !== 'volunteer' || (assigneeId && assigneeId !== req.user.id)) return res.status(403).json({ message: 'Volunteers can claim an open request for themselves.' })
      request.assignedTo = req.user._id; request.assignedOrganization = null
    } else if (req.user.role === 'ngo') {
      if (!req.user.organizationVerified) return res.status(403).json({ message: 'Your NGO account is awaiting verification.' })
      const org = await Organization.findOne({ createdBy: req.user._id, verified: true })
      if (!org) return res.status(403).json({ message: 'Submit and verify your organization profile first.' })
      request.assignedOrganization = org._id; request.assignedTo = null
    } else if (req.user.role === 'admin') {
      if (assigneeType === 'volunteer') {
        if (!isId(assigneeId)) return res.status(400).json({ message: 'Choose a valid volunteer.' })
        const volunteer = await User.findOne({ _id: assigneeId, role: 'volunteer', active: true })
        if (!volunteer) return res.status(400).json({ message: 'Choose an active volunteer account.' })
        request.assignedTo = volunteer._id; request.assignedOrganization = null
      } else if (assigneeType === 'organization') {
        if (!isId(assigneeId)) return res.status(400).json({ message: 'Choose a valid organization.' })
        const org = await Organization.findOne({ _id: assigneeId, verified: true })
        if (!org) return res.status(400).json({ message: 'Choose a verified organization.' })
        request.assignedOrganization = org._id; request.assignedTo = null
      } else return res.status(400).json({ message: 'Choose a volunteer or organization.' })
    } else return res.status(403).json({ message: 'Only volunteers, verified NGOs, and admins can assign requests.' })
    request.status = 'assigned'; await request.save()
    req.app.get('io').emit('requests:changed', { id: request._id.toString(), action: 'assigned', at: new Date().toISOString() })
    res.json({ request: await AssistanceRequest.findById(request._id).populate(populate) })
  } catch (e) { next(e) }
})
router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid request identifier.' })
    const request = await AssistanceRequest.findById(req.params.id).populate('assignedOrganization')
    if (!request) return res.status(404).json({ message: 'Request not found.' })
    const { status } = req.body || {}
    if (!['open','assigned','in-progress','resolved','cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid request status.' })
    const isCreator = request.requestedBy.equals(req.user._id)
    const isAssignedVolunteer = request.assignedTo?.equals(req.user._id)
    const isAssignedOrgOwner = request.assignedOrganization?.createdBy?.equals(req.user._id)
    const isAdmin = req.user.role === 'admin'
    if (!isAdmin && !(isCreator && request.status === 'open' && status === 'cancelled') && !((isAssignedVolunteer || isAssignedOrgOwner) && ['assigned','in-progress','resolved','cancelled'].includes(status))) return res.status(403).json({ message: 'You cannot change the status of this request.' })
    if (status === 'in-progress' && request.status === 'open') return res.status(409).json({ message: 'Assign the request before marking it in progress.' })
    request.status = status; request.resolvedAt = status === 'resolved' ? new Date() : null; await request.save()
    req.app.get('io').emit('requests:changed', { id: request._id.toString(), action: 'status-updated', at: new Date().toISOString() })
    res.json({ request: await AssistanceRequest.findById(request._id).populate(populate) })
  } catch (e) { next(e) }
})
router.post('/:id/comments', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid request identifier.' })
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
    if (body.length < 2 || body.length > 1000) return res.status(400).json({ message: 'Update must be between 2 and 1000 characters.' })
    const request = await AssistanceRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ message: 'Request not found.' })
    if (!(await canSee(request, req.user))) return res.status(403).json({ message: 'You do not have access to this request.' })
    request.comments.push({ author: req.user._id, body }); await request.save()
    req.app.get('io').emit('requests:changed', { id: request._id.toString(), action: 'comment-added', at: new Date().toISOString() })
    res.status(201).json({ request: await AssistanceRequest.findById(request._id).populate(populate) })
  } catch (e) { next(e) }
})
export default router
