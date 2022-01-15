import wrongChannel from '../messages/wrongChannel'
import moneyChannel from '../messages/moneyChannel'

const User = require('../../models/user').User
const currentChannel = require('../../../config/channels')['leaderboard']

module.exports.run = async (bot, message) => {
  if (message.channel.id !== currentChannel) {
    wrongChannel(message, currentChannel)
  } else {

    User.getLeaderboard().exec((err, docs) => {
      let balanceChannel = message.guild.channels.cache.find(channel => channel.id === currentChannel)
      if (!balanceChannel) return message.channel.send('Couldn\'t find reports channel.')

      if (!docs) {
        balanceChannel.send(`<@!${currentUser.id}> n'a pas encore été enregistré`)
      } else {
        moneyChannel.leaderBoardMessage(docs, message, balanceChannel)
      }
    });
  }
}

module.exports.help = {
  name: 'leaderboard'
}