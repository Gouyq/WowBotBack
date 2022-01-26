import Helpers from '../../helpers'
import {checkDiscordUserRole} from '../helpers'
import wrongChannel from '../messages/wrongChannel'
import privateTemplate from '../messages/privateMessage'
import permissionTemplate from '../messages/permissionMessage'
import {BOOST_COMPLETED,BOOST_VALIDATED,BOOST_CANCELLED} from '../../constants/boost'

const Boost = require('../../models/boost').Boost
const User = require('../../models/user').User
const currentChannel = require('../../../config/channels')['logs']
const validUrl = require('valid-url');
module.exports.run = async (bot, message,args) => {
  if (message.channel.id !== currentChannel) {
    wrongChannel(message, currentChannel)
  } else {
    const manageChannel = message.guild.channels.cache.find(channel => channel.id === currentChannel)
    if (!manageChannel) return message.channel.send('Couldn\'t find reports channel.')
    if (checkDiscordUserRole(message.guild, message.author, ['ROLE_BOOSTER'])) 
    {
      // !logs <boostID> <WarcraftLogsUrl>
      if(args.length == 2)
      {
        // Vérifier que le boost exist
        try
        {
          const currentBoost = await Boost.findById(args[0])
          if(currentBoost.status != BOOST_VALIDATED && currentBoost.status != BOOST_CANCELLED)
          {
            // Si le booster fait partie du boost
            
            const currentUser = await User.findOne({discordId: message.author.id})
            if(currentBoost.tank._id.toString() == currentUser._id.toString() ||  
               currentBoost.healer._id.toString() == currentUser._id.toString() ||
               currentBoost.dps1._id.toString() == currentUser._id.toString() ||
               currentBoost.dps2._id.toString() == currentUser._id.toString())
               {
                 // Si c'est une url
                 if(validUrl.isUri(args[1]))
                 {
                   await currentBoost.update({log: args[1],status:BOOST_COMPLETED})
                   const data = {
                    title: 'Upload de logs',
                    message: 'Les logs on bien été enregistrer et le boost est considérer comme terminé',
                  }
                  message.author.send(privateTemplate.privateMessage({user:message.author},data))
                 }
                 else
                 {
                  message.delete();
                  const data = {
                    title: 'Erreur upload de logs',
                    message: 'L\'url de warcraft logs n\'est pas valide.',
                  }
                  message.author.send(privateTemplate.privateMessage({user:message.author},data))
                 }
               }
               else
               {
                message.delete();
                const data = {
                  title: 'Erreur upload de logs',
                  message: 'Vous ne participer pas sur le boost',
                }
                message.author.send(privateTemplate.privateMessage({user:message.author},data))
               }
          }
          else
          {
            message.delete();
            const data = {
              title: 'Erreur upload de logs',
              message: 'Les logs ne sont plus modifiable car le boost a été validé ou annulé.',
            }
            message.author.send(privateTemplate.privateMessage({user:message.author},data))
          }
        }
        catch
        {
          message.delete();
          const data = {
            title: 'Erreur upload de logs',
            message: 'L\'identifiant du boost n\'existe pas.',
          }
          message.author.send(privateTemplate.privateMessage({user:message.author},data))
        }
      }
      else
      {
        message.delete();
        const data = {
          title: 'Erreur upload de logs',
          message: 'Invalid Syntax: !logs <boostID> <WarcraftLogsUrl>',
        }
        message.author.send(privateTemplate.privateMessage({user:message.author},data))
      }
    } else {
      permissionTemplate(message, currentChannel)
    }
  }
}

module.exports.help = {
  name: 'logs'
}
