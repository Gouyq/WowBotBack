import Helpers from '../../helpers'
import {checkDiscordUserRole} from '../helpers'
import wrongChannel from '../messages/wrongChannel'
import privateTemplate from '../messages/privateMessage'
import permissionTemplate from '../messages/permissionMessage'
import {UserTransaction} from '../../models/transaction'
import {TRANSACTION_ADD_MONEY} from '../../constants/transaction'

const User = require('../../models/user').User
const currentChannel = require('../../../config/channels')['logs']

module.exports.run = async (bot, message, args) => {
  if (message.channel.id !== currentChannel) {
    wrongChannel(message, currentChannel)
  } else {
    const manageChannel = message.guild.channels.cache.find(channel => channel.id === currentChannel)
    if (!manageChannel) return message.channel.send('Couldn\'t find reports channel.')

    if (
      checkDiscordUserRole(message.guild, message.author, ['ROLE_BOOSTER'])
    ) {
      const currentUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]))

      if (!currentUser) {
        return message.reply('Invalid Syntax: !add-money @user <amount> <optional:description>')
      }

      const coins = args[1]

      if (isNaN(coins)) {
        return message.reply(`${coins} must be numeric!`)
      }

      const amount = parseInt(coins)

      const description = args.slice(2, args.length).join(' ')

      const user = await User.findOne({discordId: currentUser.id})
      const author = await User.findOne({discordId: message.author.id})

      if (user) {
        await user.updateOne({$inc: {'bank.currentAmount': amount}})

        const transaction = new UserTransaction({
          description: description.length ? description : null,
          author: author ? author._id : null,
          amount: amount,
          type: TRANSACTION_ADD_MONEY,
          target: user._id
        })

        await transaction.save()

        const data = {
          message: 'You have received ' + Helpers.numberWithSpaces(amount) + ' golds',
          title: 'Gold added by ' + message.author.username + '#' + message.author.discriminator
        }

        return currentUser.send(privateTemplate.privateMessage(bot, data))
      }
    } else {
      permissionTemplate(message, currentChannel)
    }
  }
}

module.exports.help = {
  name: 'add-money'
}
