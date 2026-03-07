const mongoose = require('mongoose')

// A single document stores the entire app state.
// We upsert it by a fixed singleton key so there is always exactly one doc.

const titlesSchema = new mongoose.Schema({
  leagueTitle:      { type: Number, default: 0 },
  leagueCup:        { type: Number, default: 0 },
  europaLeague:     { type: Number, default: 0 },
  championsLeague:  { type: Number, default: 0 },
}, { _id: false })

const teamSchema = new mongoose.Schema({
  id:        { type: String, required: true },
  ownerName: { type: String, required: true },
  club:      { type: String, required: true },
  clubLogo:  { type: String, default: '' },
  titles:    { type: titlesSchema, default: () => ({}) },
}, { _id: false })

const ruleSchema = new mongoose.Schema({
  id:   { type: String, required: true },
  text: { type: String, required: true },
}, { _id: false })

const stateSchema = new mongoose.Schema({
  // Fixed singleton key – always "_singleton"
  _key: { type: String, default: '_singleton', unique: true, index: true },

  // { [playerId]: [ownerName, ...] }  stored as a plain object
  playerOwners: { type: mongoose.Schema.Types.Mixed, default: {} },

  teams: { type: [teamSchema], default: [] },
  rules: { type: [ruleSchema], default: [] },
}, { timestamps: true })

module.exports = mongoose.model('State', stateSchema)
