const mongoose = require('mongoose')

const titlesSchema = new mongoose.Schema({
  leagueTitle:      { type: Number, default: 0 },
  leagueCup:        { type: Number, default: 0 },
  europaLeague:     { type: Number, default: 0 },
  championsLeague:  { type: Number, default: 0 },
}, { _id: false })

const teamSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  ownerName: { type: String, required: true },
  club:      { type: String, required: true },
  clubLogo:  { type: String, default: '' },
  titles:    { type: titlesSchema, default: () => ({}) },
})

module.exports = mongoose.model('Team', teamSchema)
