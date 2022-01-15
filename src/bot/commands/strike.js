import {checkDiscordUserRole} from '../helpers'
import Helpers from '../../helpers'
import wrongChannel from '../messages/wrongChannel'
import privateTemplate from '../messages/privateMessage'
import permissionTemplate from '../messages/permissionMessage'
import {RealmTransaction, UserTransaction} from '../../models/transaction'
import {TRANSACTION_REMOVE_MONEY, TRANSACTION_ADD_MONEY} from '../../constants/transaction';

const User = require('../../models/user').User
const Realm = require('../../models/realm').Realm
const currentChannel = require('../../../config/channels')['strike']

module.exports.run = async (bot, message, args) => {
  message.delete()

  if (message.channel.id !== currentChannel) {
    wrongChannel(message, currentChannel)
  } else {
    const manageChannel = message.guild.channels.cache.find(channel => channel.id === currentChannel)
    if (!manageChannel) return message.channel.send('Couldn\'t find reports channel.')

    if (
        checkDiscordUserRole(message.guild, message.author, ['ROLE_ADMIN']) ||
        checkDiscordUserRole(message.guild, message.author, ['ROLE_STAFF'])
    ) {
      const currentUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]))

      if (!currentUser) {
        return message.author.send('Invalid Syntax: !strike @user <amount> <optional:description>')
      }

      const coins = args[1]

      if (isNaN(coins)) {
        return message.author.send(`${coins} must be numeric!`)
      }

      const amount = parseInt(coins)

      const description = args.slice(2, args.length).join(' ')

      const user = await User.findOne({discordId: currentUser.id})
      const author = await User.findOne({discordId: message.author.id})
      const realm = await Realm.findOne({default: true})

      if (user) {
        await user.updateOne({$inc: {'bank.currentAmount': amount * -1}})
        await realm.updateOne({$inc: {'bank.currentAmount': amount}})

        const transaction = new UserTransaction({
          description: description.length ? description : null,
          author: author ? author._id : null,
          amount: amount,
          type: TRANSACTION_REMOVE_MONEY,
          target: user._id
        })

        const transactionRealm = new RealmTransaction({
          description: description.length ? description : null,
          author: author ? author._id : null,
          amount: amount,
          type: TRANSACTION_ADD_MONEY,
          target: realm._id
        })

        await transaction.save()
        await transactionRealm.save()

        /*const data = {
          message: `You have been struck for ${Helpers.numberWithSpaces(amount)} golds`,
          title: `Strike by ${message.author.username}#${message.author.discriminator}`
        }*/

        const dataAdmin = {
          message: `You struck ${user.username}#${user.discriminator} for ${Helpers.numberWithSpaces(amount)} golds`,
          title: `Strike by ${message.author.username}#${message.author.discriminator}`
        }

        message.author.send(privateTemplate.privateMessage(bot, dataAdmin))
        //return currentUser.send(privateTemplate.privateMessage(bot, data))

        manageChannel.send(`${amount} a été retiré de la banque de <@!${currentUser.id}>`)
      } else {
        manageChannel.send('<@!' + currentUser.id + '> n\'a pas encore été enregistré')
      }
    } else {
      permissionTemplate(message, currentChannel)
    }
  }
}

module.exports.help = {
  name: 'strike'
}
