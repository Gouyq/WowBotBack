/* Config bot */
const {config} = require('dotenv')
config({path: __dirname + '/../../.env'})

const Discord = require('discord.js')
const fs = require('fs')

const bot = new Discord.Client({
  disableEveryone: true,
})

/* Config Moongose */

const mongoose = require('mongoose')
mongoose.set('useUnifiedTopology', true)
mongoose.set('useFindAndModify', false)
mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`, {useNewUrlParser: true})
const db = mongoose.connection
db.on('error', console.error.bind(console, '[ERROR] Could not connect to MongoDB!'))
db.once('open', () => console.log('[INFO] Connection successful!'))

/* Imports Model */
const User = require('../models/user').User
const Bank = require('../models/bank').Bank

const roleNames = require('../../config/roles')

/* Starting bot to execute database initializer script */
bot.on('ready', () => {
  console.log(`[INFO] Ready to execute database creation and filling, BOT : ${bot.user.username}`)

  const guild = bot.guilds.fetch(process.env.SERVER_ID)
  guild.then(g => {
    if (g.id !== process.env.SERVER_ID) return

    let roleIds = {}

    g.roles.cache.forEach(r => {
      Object.keys(roleNames).forEach(key => {
        if (roleNames[key].toLowerCase() === r.name.toLowerCase()) {
          roleIds[r.id] = key
        }
      })
    })

    try {
      fs.writeFileSync(__dirname + '/../../config/roleIds.json', JSON.stringify(roleIds))
      console.log('[INFO] Role Ids saved to roleIds.json.')
    } catch (e) {
      console.error(e)
    }


    
    g.members
      .fetch()
      .then(async users => {
        for await (let discordUser of users.values()) {
          if (!discordUser.user.bot && discordUser.id) {
            let roles = []

            discordUser.roles.cache.forEach(r => {
              Object.keys(roleNames).forEach(key => {
                if (roleNames[key].toLowerCase() === r.name.toLowerCase()) {
                  roles.push(key)
                }
              })
            })

            let data = {
              discordId: discordUser.user.id,
              username: discordUser.user.username,
              discriminator: discordUser.user.discriminator,
              nickname: discordUser.nickname ? discordUser.nickname : discordUser.user.username,
              roles
            }

            const userModel = await User.findOne({discordId: data.discordId})

            if (!userModel) {
              let bank = new Bank()
              let user = new User({
                ...data,
                bank,
                active: true
              })

              await user.save()
              console.log(`[INFO] ${user.username}#${user.discriminator} added!`)
            } else {
              userModel.username = data.username
              userModel.discriminator = data.discriminator
              userModel.nickname = data.nickname
              userModel.roles = roles
              userModel.active = true

              await userModel.save()
              console.log(`[INFO] ${userModel.username}#${userModel.discriminator} updated!`)
            }
          }
        }
        bot.destroy()
        process.exit(0)
      })
      .catch(console.error)
  })
})

bot.login(process.env.BOT_TOKEN)