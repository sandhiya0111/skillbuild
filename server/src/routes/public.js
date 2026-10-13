import { Router } from 'express'
import AssistanceRequest from '../models/AssistanceRequest.js'
import Organization from '../models/Organization.js'
const router = Router()
router.get('/stats', async (_req, res, next) => {
  try { const [requests, resolved, organizations] = await Promise.all([AssistanceRequest.countDocuments(), AssistanceRequest.countDocuments({ status: 'resolved' }), Organization.countDocuments({ verified: true })]); res.json({ requests, resolved, organizations }) } catch (e) { next(e) }
})
export default router
