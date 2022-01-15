const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const TransactionSchema = new mongoose.Schema({
  description: String,
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: Number,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

TransactionSchema.plugin(mongoosePaginate)

const Transaction = mongoose.model('Transaction', TransactionSchema)

const UserTransaction = Transaction.discriminator(
  'TargetUser',
  new mongoose.Schema({
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  })
)

const RealmTransaction = Transaction.discriminator(
  'TargetRealm',
  new mongoose.Schema({
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Realm',
      required: true
    }
  })
)

module.exports = {UserTransaction, RealmTransaction}
