import {checkDiscordUserRole} from '../helpers'
import permissionTemplate from '../messages/permissionMessage'
import informationTemplate from '../messages/informationMessages'


module.exports.run = (bot, message) => {
  if (checkDiscordUserRole(message.guild, message.author, ['ROLE_ADMIN'])) {
    message.delete()
    const currentUser = message.guild.member(message.author).user
    if (currentUser) {
        currentUser.send(informationTemplate(message))
    }
  } else {
    permissionTemplate(message, message.channel)
  }
}

module.exports.help = {
  name: 'info'
}
