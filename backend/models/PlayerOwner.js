const mongoose = require('mongoose')

// One document per player that has at least one owner.
// Players with no owners are simply absent from the collection.
const playerOwnerSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  owners:   { type: [String], default: [] },
})

module.exports = mongoose.model('PlayerOwner', playerOwnerSchema)
