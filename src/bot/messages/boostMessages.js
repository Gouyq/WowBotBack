import Helpers from '../../helpers'

const roleIds = require('../../../config/roleIds')
const emojiIds = require('../../../config/emojiIds')

const Discord = require('discord.js')

export default {
  boostMessage (bot, boost, boosters) {
    const displayName = boosters.advertiserDiscord.user.username + '#' + boosters.advertiserDiscord.user.discriminator

    let dungeon = boost.keys.map(key => {
      return key.instance
    })
    dungeon = [...new Set(dungeon)]

    let key = boost.keys.map(key => {
      return key.level
    })
    key = [...new Set(key)]

    let tagToShow = null
    if (boost.stack === 'none') {
      tagToShow = Object.keys(roleIds).find(key => roleIds[key] === `ROLE_BOOSTER`)
    } else {
      tagToShow = Object.keys(roleIds).find(key => roleIds[key] === `ROLE_${boost.stack.toUpperCase()}`)
    }

    const embedMessage = new Discord.MessageEmbed()
        .setTitle('About key')
        .setColor('#15f153')
        .setAuthor(displayName, boosters.advertiserDiscord.user.avatarURL())
        .addFields(
            {name: 'Dungeon ', value: dungeon.join(' '), inline: true},
            {name: 'Key lvl ', value: key.join(' '), inline: true},
            {name: 'Number of Boost', value: boost.keys.length, inline: true},
            {
              name: 'Boost Price ',
              value: `${Helpers.numberWithSpaces(boost.total)} <:gold:${emojiIds.EMOJI_GOLD}>`,
              inline: true
            },
            {name: 'Armor Stack', value: `<@&${tagToShow}>`, inline: true},
            {
              name: 'Booster Cut ',
              value: `${Helpers.numberWithSpaces(boost.cutBooster)} <:gold:${emojiIds.EMOJI_GOLD}>`,
              inline: true
            },
            {
              name: 'Boosters',
              value:
                  `<:tank:${emojiIds.EMOJI_TANK}> ${boosters.tank ? "<@!" + boosters.tank.id + ">" : ""}
            <:healer:${emojiIds.EMOJI_HEALER}> ${boosters.healer ? "<@!" + boosters.healer.id + ">" : ""}
            <:dps:${emojiIds.EMOJI_DPS}> ${boosters.dps1 ? "<@!" + boosters.dps1.id + ">" : ""}
            <:dps:${emojiIds.EMOJI_DPS}> ${boosters.dps2 ? "<@!" + boosters.dps2.id + ">" : ""}` +
                  (!dungeon.includes('ANY') ? `
            <:keystone:${emojiIds.EMOJI_KEY}> ${boosters.key ? "<@!" + boosters.key.id + ">" : ""}` : ''),
              inline: true
            })
        .setTimestamp()
        .setFooter(`⚖️ @Cités d'or | BoostId : ${boost.id.substr(0, 8)}`)

    if (boost.description) {
      embedMessage.setDescription('```' + boost.description + '```')
    }

    return embedMessage

  },
  boostReadyMessage (embedMessage, boost, boosters) {
    const displayName = boosters.advertiserDiscord.user.username + '#' + boosters.advertiserDiscord.user.discriminator
    const iconServer = embedMessage.guild.iconURL()

    return new Discord.MessageEmbed()
        .setAuthor(displayName, boosters.advertiserDiscord.user.avatarURL())
        .setTitle('Boost Ready')
        .setColor('#15f153')
        .setDescription(`<@!${boosters.tank.id}>  <@!${boosters.healer.id}>  <@!${boosters.dps1.id}>  <@!${boosters.dps2.id}>`)
        .addFields(
            {name: 'Whisper Command ', value: '``/w ' + boost.whisper + ' inv``', inline: true},
            {name: 'Voice channel', value: `Go on boost channel`, inline: true})
        .setThumbnail(iconServer)
        .setFooter(`⚖️ @Cités d'or  | BoostId : ${boost.id.substr(0, 8)}`)
  },
  boostCancelMessage (embedMessage, boost, boosters) {
    const displayName = boosters.advertiserDiscord.user.username + '#' + boosters.advertiserDiscord.user.discriminator
    const iconServer = embedMessage.guild.iconURL()

    let dungeon = boost.keys.map(key => {
      return key.instance
    })
    dungeon = [...new Set(dungeon)]

    let key = boost.keys.map(key => {
      return key.level
    })
    key = [...new Set(key)]

    return new Discord.MessageEmbed()
        .setAuthor(displayName, boosters.advertiserDiscord.user.avatarURL())
        .setTitle('Boost Cancelled')
        .setColor('#15f153')
        .addFields(
            {name: 'Dungeon ', value: dungeon.join(' '), inline: true},
            {name: 'Key lvl ', value: key.join(' '), inline: true})
        .setThumbnail(iconServer)
        .setFooter(`⚖️ @Cités d'or  | BoostId : ${boost.id.substr(0, 8)}`)
  },
  boostMention (boost) {
    let tagsToShow = []
    let roles = []
    switch (boost.stack) {
      case 'leather':
        tagsToShow = Object.keys(roleIds).filter(key => roleIds[key] === `ROLE_${boost.stack.toUpperCase()}`)
        break
      case 'cloth':
        roles.push(`ROLE_${boost.stack.toUpperCase()}`)
        roles.push(`ROLE_TANK`)
        tagsToShow = Object.keys(roleIds).filter(key => roles.includes(roleIds[key]))
        break
      case 'mail':
        roles.push(`ROLE_${boost.stack.toUpperCase()}`)
        roles.push(`ROLE_TANK`)
        tagsToShow = Object.keys(roleIds).filter(key => roles.includes(roleIds[key]))
        break
      case 'plate':
        tagsToShow = Object.keys(roleIds).filter(key => roleIds[key] === `ROLE_${boost.stack.toUpperCase()}`)
        break
      default:
        tagsToShow = Object.keys(roleIds).filter(key => roleIds[key] === `ROLE_BOOSTER`)
    }

    return tagsToShow.map(roleId => `<@&${roleId}>`).join(" - ")
  },
  boostWaiting (boost, boosters) {
    const displayName = boosters.advertiserDiscord.user.username + '#' + boosters.advertiserDiscord.user.discriminator

    let dungeon = boost.keys.map(key => {
      return key.instance
    })
    dungeon = [...new Set(dungeon)]

    let key = boost.keys.map(key => {
      return key.level
    })
    key = [...new Set(key)]

    const embedMessage = new Discord.MessageEmbed()
        .setTitle('Waiting 5 sec for starting apply to :')
        .setColor('#15f153')
        .setAuthor(displayName, boosters.advertiserDiscord.user.avatarURL())
        .addFields(
            {name: 'Dungeon ', value: dungeon.join(' '), inline: true},
            {name: 'Key lvl ', value: key.join(' '), inline: true},
            {name: 'Number of Boost', value: boost.keys.length, inline: true}
        )
        .setTimestamp()
        .setFooter('⚖️ @Cités d\'or')

    if (boost.description) {
      embedMessage.setDescription('```' + boost.description + '```')
    }

    return embedMessage
  }
}