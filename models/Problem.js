var mongoose = require('mongoose');

var problemSchema = new mongoose.Schema({
  event: String,
  problemName: String,
  roundName: String,
  roundId: Number,
  roomId: Number,
  componentId: Number
});

module.exports = mongoose.model('Problem', problemSchema);