const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const {BankSchema} = require('./bank')

const RealmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  bank: BankSchema,
  default: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

RealmSchema.statics.updateCurrentBalance = (realmId, amount) => {
  return Realm.findOneAndUpdate({_id: realmId}, {$inc: {'bank.currentAmount': amount}})
}

RealmSchema.statics.updateDefaultRealm = (amount) => {
  return Realm.findOneAndUpdate({default: true}, {$inc: {'bank.currentAmount': amount}})
}

RealmSchema.plugin(mongoosePaginate)

const Realm = mongoose.model('Realm', RealmSchema)

module.exports = {Realm, RealmSchema}
