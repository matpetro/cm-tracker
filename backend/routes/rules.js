const express = require('express')
const router = express.Router()
const Rule = require('../models/Rule')

// GET all rules
router.get('/', async (_req, res, next) => {
  try {
    res.json(await Rule.find({}, '-_id -__v'))
  } catch (err) { next(err) }
})

// POST create a rule
router.post('/', async (req, res, next) => {
  try {
    const rule = await Rule.create(req.body)
    res.status(201).json(rule)
  } catch (err) { next(err) }
})

// DELETE one rule
router.delete('/:id', async (req, res, next) => {
  try {
    await Rule.findOneAndDelete({ id: req.params.id })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
