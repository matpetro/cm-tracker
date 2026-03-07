const mongoose = require('mongoose')

const ruleSchema = new mongoose.Schema({
  id:   { type: String, required: true, unique: true },
  text: { type: String, required: true },
})

module.exports = mongoose.model('Rule', ruleSchema)
