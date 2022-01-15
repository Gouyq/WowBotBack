const Discord = require('discord.js')

export default function wrongChannelCommand (message, currentChannel) {
  message.delete()
  const messageEmbed = new Discord.MessageEmbed()
      .setTitle('Command information')
      .setThumbnail(message.guild.iconURL())
      .setColor('#15f153')
      .addField('Warning', 'You cannnot use this command on this channel, click on '
          + message.guild.channels.cache.find(channel => channel.id === currentChannel).toString())

  message.channel.send(messageEmbed).then(messageSent => {
    setTimeout(() => {
      messageSent.delete()
    }, 15000)
  })
}