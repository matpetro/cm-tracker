const express = require('express')
const router = express.Router()
const Team = require('../models/Team')
const PlayerOwner = require('../models/PlayerOwner')
const Rule = require('../models/Rule')

// GET /api/state — combined fetch for initial page load
router.get('/', async (_req, res, next) => {
  try {
    const [teams, playerOwnerDocs, rules] = await Promise.all([
      Team.find({}, '-_id -__v'),
      PlayerOwner.find({}),
      Rule.find({}, '-_id -__v'),
    ])
    const playerOwners = {}
    playerOwnerDocs.forEach((d) => { playerOwners[d.playerId] = d.owners })
    res.json({ teams, playerOwners, rules })
  } catch (err) { next(err) }
})

module.exports = router
