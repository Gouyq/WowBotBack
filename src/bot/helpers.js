const roleIds = require('../../config/roleIds')
const emojiIds = require('../../config/emojiIds')

const asyncFilterMap = async (map, filters) => {

}

const checkDiscordUserRole = (guild, discordUser, roles) => {
  const member = guild.members.cache.get(discordUser.id)

  if (!member) {
    console.error('--DEBUG--')
    console.error(discordUser)
  }

  return !discordUser.bot && member && member._roles.map(v => roleIds[v]).filter(x => roles.includes(x)).length === roles.length
}

const checkHasReaction = (reactions, discordUser, reaction) => {
  return !!reactions.get(reaction).users.cache.get(discordUser.id)
}

const getUserReactionRoles = (reactions, discordUser, guild) => {
  let roles = []

  if (checkHasReaction(reactions, discordUser, emojiIds.EMOJI_TANK) && checkDiscordUserRole(guild, discordUser, ['ROLE_TANK'])) roles.push('ROLE_TANK')
  if (checkHasReaction(reactions, discordUser, emojiIds.EMOJI_HEALER) && checkDiscordUserRole(guild, discordUser, ['ROLE_HEALER'])) roles.push('ROLE_HEALER')
  if (checkHasReaction(reactions, discordUser, emojiIds.EMOJI_DPS) && checkDiscordUserRole(guild, discordUser, ['ROLE_DPS'])) roles.push('ROLE_DPS')

  return roles
}

module.exports = {checkDiscordUserRole, checkHasReaction, getUserReactionRoles}