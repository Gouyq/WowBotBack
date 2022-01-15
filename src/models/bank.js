let mongoose = require('mongoose')

const BankSchema = new mongoose.Schema({
  currentAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  dueAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  }
})

const Bank = mongoose.model('Bank', BankSchema)

module.exports = {Bank, BankSchema}
