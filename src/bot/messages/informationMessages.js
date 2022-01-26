const Discord = require('discord.js')
const channels = require('../../../config/channels')

export default function informationMessageCommand (message) {
  return new Discord.MessageEmbed()
      .setTitle('Commands Informations')
      .setThumbnail(message.guild.iconURL())
      .setColor('#15f153')
      .addFields(
          {
            name: '● **!add-money**',
            value: '  - Command to add money to booster       - Channel :' + message.guild.channels.cache.find(channel => channel.id === channels['add-money']).toString()
          },
          {
            name: '● **!strike**',
            value: '  - Command to strike money to booster    - Channel :' + message.guild.channels.cache.find(channel => channel.id === channels['strike']).toString()
          },
          {
            name: '● **!leaderboard**',
            value: '  - Command to show leaderboard           - Channel :' + message.guild.channels.cache.find(channel => channel.id === channels['leaderboard']).toString()
          },
          {
            name: '● **!money**',
            value: '  - Command to show your current balance  - Channel :' + message.guild.channels.cache.find(channel => channel.id === channels['money']).toString()
          },
          {
            name: '● **!logs**',
            value: '  - Register logs for a specific boost  - Channel :' + message.guild.channels.cache.find(channel => channel.id === channels['logs']).toString()
          })
}