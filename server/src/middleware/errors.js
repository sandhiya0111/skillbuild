export function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }) }
export function errorHandler(err, _req, res, _next) {
  if (err?.code === 11000) return res.status(409).json({ message: 'That value is already registered.' })
  if (err?.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join('. ') })
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid record identifier.' })
  console.error(err)
  res.status(500).json({ message: 'Unexpected server error. Please try again.' })
}
