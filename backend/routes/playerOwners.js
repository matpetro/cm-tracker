const express = require('express')
const router = express.Router()
const PlayerOwner = require('../models/PlayerOwner')

// GET all as a map { [playerId]: [ownerName, ...] }
router.get('/', async (_req, res, next) => {
  try {
    const docs = await PlayerOwner.find({})
    const map = {}
    docs.forEach((d) => { map[d.playerId] = d.owners })
    res.json(map)
  } catch (err) { next(err) }
})

// PUT batch update multiple players at once
// Body: { [playerId]: [ownerName, ...] }
// An empty array for a player deletes that document.
// MUST be defined before /:playerId or Express will match "batch" as a playerId.
router.put('/batch', async (req, res, next) => {
  try {
    const updates = req.body // { [playerId]: [...owners] }
    await Promise.all(
      Object.entries(updates).map(([playerId, owners]) => {
        if (!owners || owners.length === 0) {
          return PlayerOwner.findOneAndDelete({ playerId })
        }
        return PlayerOwner.findOneAndUpdate(
          { playerId },
          { owners },
          { upsert: true }
        )
      })
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// PUT set owners for a single player (upsert)
// If owners array is empty the document is deleted to keep the collection clean.
router.put('/:playerId', async (req, res, next) => {
  try {
    const { owners } = req.body
    if (!owners || owners.length === 0) {
      await PlayerOwner.findOneAndDelete({ playerId: req.params.playerId })
      return res.json({ playerId: req.params.playerId, owners: [] })
    }
    const doc = await PlayerOwner.findOneAndUpdate(
      { playerId: req.params.playerId },
      { owners },
      { new: true, upsert: true }
    )
    res.json({ playerId: doc.playerId, owners: doc.owners })
  } catch (err) { next(err) }
})

// DELETE all (reset ownership)
router.delete('/', async (_req, res, next) => {
  try {
    await PlayerOwner.deleteMany({})
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
