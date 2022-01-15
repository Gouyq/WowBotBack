const Discord = require('discord.js')

export default {
  privateMessage (bot, data) {
    const displayName = bot.user.username + '#' + bot.user.discriminator
    return new Discord.MessageEmbed()
        .setTitle(data.title)
        .setColor('#15f153')
        .setAuthor(displayName, bot.user.avatarURL())
        .addField('**Information**', '```' + data.message + '```')
        .setTimestamp()
        .setFooter(`⚖️ @Cités d\'or`)
  }
}