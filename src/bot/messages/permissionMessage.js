const Discord = require('discord.js')

export default function permissionMessageCommand (message, currentChannel) {
  message.delete()
  const messageEmbed = new Discord.MessageEmbed()
      .setTitle('Command alert')
      .setThumbnail(message.guild.iconURL())
      .setColor('#15f153')
      .addField('Warning', 'You don\'t have the permission to use this command'
          + message.guild.channels.cache.find(channel => channel.id === currentChannel).toString())
  message.channel.send(messageEmbed).then(messageSent => {
    setTimeout(() => {
      messageSent.delete()
    }, 15000)
  })
}