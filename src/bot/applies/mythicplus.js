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
import RaiderIO from '../../services/raiderio'

module.exports.run = async (bot, message) => {
  if (message.channel.id !== currentChannel) {
    wrongChannel(message, currentChannel)
  } else {
    const manageChannel = message.guild.channels.cache.find(channel => channel.id === currentChannel)
    if (!manageChannel) return message.channel.send('Couldn\'t find reports channel.')

    const informations = message.content.split("/");
      const total = informations.length;
      RaiderIO.getProfile(informations[total-3], informations[total-2], informations[total-1]).then((response) => {
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
        console.log(profile);
      })
      .catch((error) => {
        console.log(error)
      })

    /*if (
      checkDiscordUserRole(message.guild, message.author, ['ROLE_ADMIN']) ||
      checkDiscordUserRole(message.guild, message.author, ['ROLE_STAFF'])
    ) {
      
      }
    else {
      permissionTemplate(message, currentChannel)
    }*/
  }
}
