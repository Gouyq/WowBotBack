import wrongChannel from '../messages/wrongChannel'
import moneyChannel from '../messages/moneyChannel'

const User = require('../../models/user').User
const currentChannel = require('../../../config/channels')['money']

module.exports.run = async (bot, message) => {
  if (message.channel.id !== currentChannel) {
    wrongChannel(message, currentChannel)
  } else {
    const currentUser = message.author
    const users = await User.getLeaderboard()
    const rank = users.findIndex(user => user.discordId === currentUser.id) + 1
    User.findOne({discordId: currentUser.id}, (err, user) => {
      const balanceChannel = message.guild.channels.cache.find(channel => channel.id === currentChannel)
      if (!balanceChannel) return message.channel.send('Couldn\'t find reports channel.')

      if (!user) {
        balanceChannel.send('!'+ currentUser.id + '> n\'a pas encore été enregistré')
      } else {
        const info = {
          user: user,
          userDiscord: currentUser,
          rank: rank
        }

        /*balanceChannel.send(`<@!${currentUser.id}>, <@!${bot.user.id}> sent you your balance report on DM, check out your messages!`)
        currentUser.send(moneyChannel.moneyMessage(info, message))*/
        
        balanceChannel.send(moneyChannel.moneyMessage(info, message))
      }
    })
  }
}

module.exports.help = {
  name: 'money'
}
