var mongoose = require('mongoose');

var discountCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  available: Number
});

module.exports = mongoose.model('DiscountCode', discountCodeSchema);