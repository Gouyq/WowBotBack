import Helpers from '../../helpers'

const Discord = require('discord.js')

export default {
  moneyMessage (info, message, channel) {
    const displayName = info.user.username + '#' + info.user.discriminator
    let displayedRank = ''
    if (info.rank > 0) {
      displayedRank = '```Your current rank is ' + info.rank + '```';
    } else {
      displayedRank = '```You don\'t currently have a rank  ```';
    }
    return new Discord.MessageEmbed()
      .setAuthor(displayName, info.userDiscord.avatarURL())
      .setColor('#15f153')
      .addFields(
        {name: '**Cite d\'or Bank Account**', value: displayedRank},
        {
          name: 'Current Balance', value: `
        💰 ${Helpers.numberWithSpaces(info.user.bank.currentAmount)}`, inline: true
        },
        {name: 'Total Gain', value: `:bank: ${Helpers.numberWithSpaces(info.user.bank.totalAmount)}`, inline: true},
        {name: 'WebSite Profile', value: `[${displayName}](${process.env.FRONT_URL}/booster/${info.user._id})`},
      )
      .setTimestamp()
      .setThumbnail(message.guild.iconURL())
      .setFooter('⚖️ @Cités d\'or')
  },
  leaderBoardMessage (listUsers, message, channel) {
    let moneyEmbed = null

    if (listUsers.length > 0) {
      let fields = []
      const userRank = listUsers.findIndex(user => {
        return user.discordId === message.author.id
      })
      const numberToShow = listUsers.length > 5 ? 5 : listUsers.length

      let displayedRank = ''
      if (userRank !== -1) {
        displayedRank = 'Your current rank is ' + (userRank + 1)
      } else {
        displayedRank = 'You don\'t currently have a rank'
      }

      moneyEmbed = new Discord.MessageEmbed()
        .setAuthor('Cités d\'or Leaderboard', message.guild.iconURL())
        .setDescription(`View the leaderboard online [here](${process.env.FRONT_URL}/booster/leaderboard)`)
        .setColor('#15f153')
        .setFooter('⚖️ @Cités d\'or | ' + displayedRank)

      for (let i = 0; i < numberToShow; i++) {
        fields.push(`
        ** ${(i + 1)} ●** [${listUsers[i].username}#${listUsers[i].discriminator}](${process.env.FRONT_URL}/booster/${listUsers[i]._id})  **●** 💰 ${Helpers.numberWithSpaces(listUsers[i].bank.currentAmount)}`)
      }

      if (userRank > 4) {
        fields.push(`
        ** ${(userRank + 1)} ●** ${listUsers[userRank].username}#${listUsers[userRank].discriminator}  **●** 💰 ${Helpers.numberWithSpaces(listUsers[userRank].bank.currentAmount)}
        `)
      }

      moneyEmbed.addField('**Leaderboard**', fields.join(''))
    } else {
      moneyEmbed = new Discord.MessageEmbed()
        .setAuthor('Cités d\'or Leaderboard', message.guild.iconURL())
        .setDescription(`View the leaderboard online [here](${process.env.FRONT_URL}/booster/leaderboard)`)
        .setColor('#15f153')
        .addField('\u200b', '**No registered users**')
        .setFooter('⚖️ @Cités d\'or')
    }

    channel.send(moneyEmbed)
  }
}