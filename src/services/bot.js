const Discord = require('discord.js')
const fs = require('fs')

const User = require('../models/user').User
const apply = require('../bot/applies/mythicplus')

const bot = new Discord.Client({
  disableEveryone: true,
})

bot.commands = new Discord.Collection()

const commandFolder = __dirname + '/../bot/commands/'

fs.readdir(commandFolder, (err, files) => {
  if (err) console.log(err)

  let file = files.filter(f => f.split('.').pop() === 'js')

  file.forEach(f => {
    let props = require(`${commandFolder}/${f}`)

    if (props.help) {
      console.log(`[INFO] Command ${f} loaded!`)
      bot.commands.set(props.help.name, props)
    }
  })
})

bot.on('ready', () => {
  console.log(`[INFO] I'm now online, ${bot.user.username}`)

  bot.user.setActivity('Managing Boost Cité d\'or', {
    type: 'PLAYING'
  })
})

bot.on('message', async message => {
  let prefix = process.env.PREFIX

  if (message.author.bot) return
  if (!message.guild) return
  //if (!message.content.startsWith(prefix)) return
  if (message.guild.id !== process.env.SERVER_ID) return
  let args = message.content.slice(prefix.length).trim().split(/ +/g)
  let cmd = args.shift().toLowerCase()
  if(message.content.startsWith('!')){
    let file = bot.commands.get(cmd)
    if (file) file.run(bot, message, args)
  }
  else{
    apply.run(bot,message)
  }

})

bot.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (!newMember.id) return

  const userModel = await User.findOne({discordId: newMember.id})

  if (userModel) {
    await userModel.updateFromDiscord(newMember)
  } else {
    await User.createFromDiscord(newMember)
  }
})

bot.on('guildMemberRemove', async (member) => {
  if (!member.id) return

  const userModel = await User.findOne({discordId: member.id})

  if (userModel) {
    await userModel.update({
      roles: [],
      active: false
    })
  }
})

bot.login(process.env.BOT_TOKEN)

module.exports = bot
