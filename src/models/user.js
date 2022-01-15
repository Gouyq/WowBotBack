const AutoComplete = require('mongoose-in-memory-autocomplete').AutoComplete

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const {Bank, BankSchema} = require('./bank')
const roleIds = require('../../config/roleIds')

const UserSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  discriminator: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  bank: BankSchema,
  roles: {
    type: Array,
    default: []
  },
  active: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

UserSchema.plugin(mongoosePaginate)

UserSchema.statics.updateCurrentBalance = (userId, amount, callback) => {
  return User
    .findOne({_id: userId})
    .then(user => {
      user.bank.currentAmount += amount
      user.save()
      callback(user, amount)
    })
}

UserSchema.statics.autocomplete = (search) => {
  const configuration = {
    autoCompleteFields: ['nickname'],
    dataFields: ['_id'],
    maximumResults: 10,
    model: User
  }

  const autocomplete = new AutoComplete(configuration, () => {
  })

  return new Promise((resolve) => {
    autocomplete.getResults(search, (err, result) => {
      if (err) {
        resolve([])
      } else {
        resolve(result.map(r => {
          return {
            _id: r.data[0],
            nickname: r.word
          }
        }))
      }
    })
  })
}

UserSchema.statics.createFromDiscord = (discordData) => {
  let roles = []

  discordData._roles.forEach(role => {
    if (roleIds[role]) {
      roles.push(roleIds[role])
    }
  })

  const bank = new Bank()
  const user = new User({
    active: true,
    discordId: discordData.id,
    username: discordData.user.username,
    discriminator: discordData.user.discriminator,
    nickname: discordData.nickname ? discordData.nickname : discordData.user.username,
    bank,
    roles
  })

  return user.save()
}

UserSchema.methods.updateFromDiscord = function (discordData) {
  let roles = []

  discordData._roles.forEach(role => {
    if (roleIds[role]) {
      roles.push(roleIds[role])
    }
  })

  return this.update({
    active: true,
    username: discordData.user.username,
    discriminator: discordData.user.discriminator,
    nickname: discordData.nickname ? discordData.nickname : discordData.user.username,
    roles
  })
}

UserSchema.statics.getLeaderboard = () => {
  return User.find({
    $and: [
      {discordId: {$ne: process.env.SERVER_ID}},
      {'bank.currentAmount': {$gt: 0}}
    ]
  }).sort({'bank.currentAmount': -1})
}

const User = mongoose.model('User', UserSchema)

module.exports = {User, UserSchema}
