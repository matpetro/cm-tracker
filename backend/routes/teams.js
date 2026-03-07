const express = require('express')
const router = express.Router()
const Team = require('../models/Team')

// GET all teams
router.get('/', async (_req, res, next) => {
  try {
    res.json(await Team.find({}, '-_id -__v'))
  } catch (err) { next(err) }
})

// POST create a team
router.post('/', async (req, res, next) => {
  try {
    const team = await Team.create(req.body)
    res.status(201).json(team)
  } catch (err) { next(err) }
})

// PATCH update title counters for one team
router.patch('/:id', async (req, res, next) => {
  try {
    const { key, delta } = req.body
    const team = await Team.findOne({ id: req.params.id })
    if (!team) return res.status(404).json({ error: 'Team not found' })
    const current = team.titles?.[key] ?? 0
    team.titles[key] = Math.max(0, current + delta)
    team.markModified('titles')
    await team.save()
    res.json(team)
  } catch (err) { next(err) }
})

// DELETE one team
router.delete('/:id', async (req, res, next) => {
  try {
    await Team.findOneAndDelete({ id: req.params.id })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// DELETE all teams (reset)
router.delete('/', async (_req, res, next) => {
  try {
    await Team.deleteMany({})
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
