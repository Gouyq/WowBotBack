import {checkDiscordUserRole, getUserReactionRoles, checkHasReaction} from '../helpers'
import boostMessages from '../messages/boostMessages'

const User = require('../../models/user').User
const emojiIds = require('../../../config/emojiIds')

import {BOOST_CONFIRMED, BOOST_CANCELLED} from '../../constants/boost'

const currentChannel = require('../../../config/channels')['boost']

module.exports.run = async (bot, boost, specificPlayers = {}) => {
  const guild = await bot.guilds.fetch(process.env.SERVER_ID)
  const boostChannel = guild.channels.cache.get(currentChannel)

  const advertiserModel = await User.findById(boost.advertiser)
  const advertiserDiscord = await guild.members.fetch(advertiserModel.discordId)

  let boosters = {
    advertiserDiscord,
    tank: null,
    healer: null,
    dps1: null,
    dps2: null,
    key: null,
    keyholderRole: null
  }

  for (let role of ['tank', 'healer', 'dps1', 'dps2', 'key']) {
    if (specificPlayers[role]) {
      const specificPlayer = await User.findById(specificPlayers[role])

      if (specificPlayer) {
        boosters[role] =  await guild.members.fetch(specificPlayer.discordId)
      }
    }
  }

  const roleFilters = {
    tank: ['ROLE_TANK'],
    healer: ['ROLE_HEALER'],
    dps: ['ROLE_DPS'],
    key: []
  }

  let requestedKeys = boost.keys.map(key => {
    return key.instance
  })
  requestedKeys = [...new Set(requestedKeys)]
  const specificKey = !requestedKeys.includes('ANY')

  if (boost.stack !== 'none') {
    for (let role of ['tank', 'healer', 'dps', 'key']) {
      roleFilters[role].push(`ROLE_${boost.stack.toUpperCase()}`)
    }
  }

  if (['mail', 'cloth'].includes(boost.stack)) {
    roleFilters.tank.splice(roleFilters.tank.findIndex(v => v === `ROLE_${boost.stack}`), 1)
    roleFilters.key.splice(roleFilters.key.findIndex(v => v === `ROLE_${boost.stack}`), 1)
  }

  // console.log(roleFilters)

  const boostMessage = boostMessages.boostMessage(bot, boost, boosters)
  const boostMention = boostMessages.boostMention(boost)
  const boostWaiting = boostMessages.boostWaiting(boost, boosters)

  boostChannel.send(boostMention)
  boostChannel.send(boostWaiting).then(waitingMessage => {
    setTimeout(() => {
      waitingMessage.delete()
    }, 15000)
  })

  const startingApply = () => {
    boostChannel
        .send(boostMessage)
        .then(async embedMessage => {
          await embedMessage.react(boostChannel.guild.emojis.cache.get(emojiIds.EMOJI_TANK))
          await embedMessage.react(boostChannel.guild.emojis.cache.get(emojiIds.EMOJI_HEALER))
          await embedMessage.react(boostChannel.guild.emojis.cache.get(emojiIds.EMOJI_DPS))

          if (specificKey) {
            await embedMessage.react(boostChannel.guild.emojis.cache.get(emojiIds.EMOJI_KEY))
          }

          await embedMessage.react(boostChannel.guild.emojis.cache.get(emojiIds.EMOJI_CANCEL))

          const awaitOneReaction = () => {
            embedMessage
                .awaitReactions((reaction, user) => !user.bot, {max: 1, time: 15 * 60 * 1000})
                .then(async () => {
                  const reactions = embedMessage.reactions.cache

                  const candidates = {
                    tank: reactions.get(emojiIds.EMOJI_TANK).users.cache.filter(u => checkDiscordUserRole(boostChannel.guild, u, roleFilters.tank)),
                    healer: reactions.get(emojiIds.EMOJI_HEALER).users.cache.filter(u => checkDiscordUserRole(boostChannel.guild, u, roleFilters.healer)),
                    dps: reactions.get(emojiIds.EMOJI_DPS).users.cache.filter(u => checkDiscordUserRole(boostChannel.guild, u, roleFilters.dps)),
                    cancel: reactions.get(emojiIds.EMOJI_CANCEL).users.cache.filter(u => u.id === advertiserDiscord.user.id || checkDiscordUserRole(boostChannel.guild, u, ['ROLE_ADMIN']))
                  }

                  if (specificKey) {
                    candidates.key = reactions.get(emojiIds.EMOJI_KEY).users.cache.filter(u =>
                        checkDiscordUserRole(boostChannel.guild, u, roleFilters.key) &&
                        (
                            checkDiscordUserRole(boostChannel.guild, u, ['ROLE_TANK']) ||
                            checkDiscordUserRole(boostChannel.guild, u, ['ROLE_HEALER']) ||
                            checkDiscordUserRole(boostChannel.guild, u, ['ROLE_DPS'])
                        )
                    )
                  } else {
                    candidates.key = new Map()
                  }

                  if (candidates.cancel.size) {
                    throw 'Cancel boost!'
                  }

                  // console.log(`${candidates.tank.size} TANKS`)
                  // console.log(`${candidates.healer.size} HEALERS`)
                  // console.log(`${candidates.dps.size} DPS`)
                  // console.log(`${candidates.key.size} KEYS`)
                  // console.log(`${candidates.cancel.size} CANCEL`)

                  const emojis = {
                    tank: emojiIds.EMOJI_TANK,
                    healer: emojiIds.EMOJI_HEALER,
                    dps1: emojiIds.EMOJI_DPS,
                    dps2: emojiIds.EMOJI_DPS,
                    key: emojiIds.EMOJI_KEY
                  }

                  // Check si des gens ont enlevé leur réaction
                  for (let role of Object.keys(emojis)) {
                    if (boosters[role] && !checkHasReaction(reactions, boosters[role], emojis[role]) && !specificPlayers[role]) {
                      boosters[role] = null
                    }
                  }

                  // Check si des gens ont déjà un rôle
                  for (let role of ['tank', 'healer', 'dps1', 'dps2']) {
                    if (boosters[role]) {
                      candidates.tank = candidates.tank.filter(u => u.id !== boosters[role].id)
                      candidates.healer = candidates.healer.filter(u => u.id !== boosters[role].id)
                      candidates.dps = candidates.dps.filter(u => u.id !== boosters[role].id)
                    }
                  }

                  if (!boosters.tank && candidates.tank.size) {
                    boosters.tank = candidates.tank.values().next().value

                    candidates.healer = candidates.healer.filter(u => u.id !== boosters.tank.id)
                    candidates.dps = candidates.dps.filter(u => u.id !== boosters.tank.id)
                  }

                  if (!boosters.healer && candidates.healer.size) {
                    boosters.healer = candidates.healer.values().next().value

                    candidates.dps = candidates.dps.filter(u => u.id !== boosters.healer.id)
                  }

                  if (!boosters.dps1 && candidates.dps.size) {
                    boosters.dps1 = candidates.dps.values().next().value

                    candidates.dps = candidates.dps.filter(u => u.id !== boosters.dps1.id)
                  }

                  if (!boosters.dps2 && candidates.dps.size) {
                    boosters.dps2 = candidates.dps.values().next().value
                  }

                  if (!boosters.key && candidates.key.size) {
                    for (let [key, user] of candidates.key) {
                      const keyholderRoles = getUserReactionRoles(reactions, user, boostChannel.guild)

                      if (keyholderRoles.length) {
                        boosters.key = user
                        break
                      }
                    }
                  }

                  if (
                      boosters.tank &&
                      boosters.healer &&
                      boosters.dps1 &&
                      boosters.dps2 &&
                      boosters.key
                  ) {
                    for (let role of ['tank', 'healer', 'dps1', 'dps2']) {
                      if (boosters[role].id === boosters.key.id) {
                        boosters.keyholderRole = role
                      }
                    }

                    if (!boosters.keyholderRole) {
                      const keyholderRoles = getUserReactionRoles(reactions, boosters.key, boostChannel.guild)

                      switch (keyholderRoles[0]) {
                        case 'ROLE_TANK':
                          boosters.tank = boosters.key
                          boosters.keyholderRole = 'tank'
                          break
                        case 'ROLE_HEALER':
                          boosters.healer = boosters.key
                          boosters.keyholderRole = 'healer'
                          break
                        default:
                          boosters.dps2 = boosters.key
                          boosters.keyholderRole = 'dps2'
                      }
                    }
                  }

                  // console.log(boosters)
                  await embedMessage.edit(boostMessages.boostMessage(bot, boost, boosters))

                  let ready = false

                  if (specificKey) {
                    ready = boosters.tank && boosters.healer && boosters.dps1 && boosters.dps2 && boosters.keyholderRole
                  } else {
                    ready = boosters.tank && boosters.healer && boosters.dps1 && boosters.dps2
                  }

                  if (!ready) {
                    // console.log('--- NOT READY ---')
                    awaitOneReaction()
                  } else {
                    // console.log('--- READY ---')
                    const tankModel = await User.findOne({discordId: boosters.tank.id})
                    const healerModel = await User.findOne({discordId: boosters.healer.id})
                    const dps1Model = await User.findOne({discordId: boosters.dps1.id})
                    const dps2Model = await User.findOne({discordId: boosters.dps2.id})

                    await boost.update({
                      tank: tankModel._id,
                      healer: healerModel._id,
                      dps1: dps1Model._id,
                      dps2: dps2Model._id,
                      status: BOOST_CONFIRMED
                    })

                    await embedMessage.reply(boostMessages.boostReadyMessage(embedMessage, boost, boosters))
                  }
                })
                .catch(async error => {
                  // console.log('--- BOOST ANNULE ---')

                  console.error(error)

                  await boost.update({
                    status: BOOST_CANCELLED
                  })

                  await embedMessage.reply(boostMessages.boostCancelMessage(embedMessage, boost, boosters))
                  await embedMessage.delete()
                })
          }

          awaitOneReaction()
        })
  }

  setTimeout(startingApply, 5000)
}

module.exports.help = {
  name: 'boost'
}