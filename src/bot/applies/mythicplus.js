import Helpers from '../../helpers'
import {checkDiscordUserRole} from '../helpers'
import wrongChannel from '../messages/wrongChannel'
import privateTemplate from '../messages/privateMessage'
import permissionTemplate from '../messages/permissionMessage'
import {UserTransaction} from '../../models/transaction'
import {TRANSACTION_ADD_MONEY} from '../../constants/transaction'

const User = require('../../models/user').User
const currentChannel = require('../../../config/channels')['mythic-plus']
const stack = require('../../../config/stack')
const roleIds = require('../../../config/roleIds')
const roles = require('../../../config/roles')
const emojiIds = require('../../../config/emojiIds')
import RaiderIO from '../../services/raiderio'

module.exports.run = async (bot, message) => {
  if (message.channel.id === currentChannel) {
    const mythicChannel = message.guild.channels.cache.find(channel => channel.id === currentChannel)
    const currentUser = message.author
    if (!mythicChannel) return message.channel.send('Couldn\'t find reports channel.')
    await message.react(mythicChannel.guild.emojis.cache.get(emojiIds.EMOJI_ACCEPT))
    await message.react(mythicChannel.guild.emojis.cache.get(emojiIds.EMOJI_CANCEL))
    const informations = message.content.split("/");
    const total = informations.length;
    message
      .awaitReactions((reaction, user) => checkDiscordUserRole(mythicChannel.guild, user, ['ROLE_ADMIN']) && !user.bot, {max: 1})
      .then(async () => {
        const reactions = message.reactions.cache
        let accept = reactions.get(emojiIds.EMOJI_ACCEPT).users.cache.filter(u => checkDiscordUserRole(mythicChannel.guild, u, ['ROLE_ADMIN']))
        let refuse = reactions.get(emojiIds.EMOJI_CANCEL).users.cache.filter(u => checkDiscordUserRole(mythicChannel.guild, u, ['ROLE_ADMIN']))
        if(accept.size){
          RaiderIO.getProfile(informations[total-3], informations[total-2], informations[total-1]).then(async (response) => {
            const profile = response.data;
            const { guild, channel } = message;
            const member = guild.members.cache.get(message.author.id)
            /*if(stack[profile.class.toLowerCase()] != null){
              console.log(stack[profile.class.toLowerCase()])
              let role = message.guild.roles.cache.find(r => r.id === stack[profile.class.toLowerCase()]);
              member.roles.add(role);
            }*/
            if(profile.mythic_plus_scores['dps'] >= 2000){
              let role = message.guild.roles.cache.find(r => r.name === roles['ROLE_DPS']);
              console.log(role)
              member.roles.add(role);
      
            }
      
            if(profile.mythic_plus_scores['healer']  >= 2000){
              let role = message.guild.roles.cache.find(r => r.name === roles['ROLE_HEALER']);
              member.roles.add(role);
            }
      
            if(profile.mythic_plus_scores['tank']  >= 2000){
              let role = message.guild.roles.cache.find(r => r.name === roles['ROLE_TANK']);
              member.roles.add(role);
            }
            await currentUser.send('application mm+ validate')
            console.log(profile);
          })
          .catch((error) => {
            console.log(error)
          })
        }
        else if(refuse.size) {
          await currentUser.send('application mm+ refuse')
        }
      })
      .catch(async error => {

      })

  }
}
