import Discord from '../services/discord'

const User = require('../models/user').User
const jwt = require('jsonwebtoken')

const REDIRECT_URI = process.env.FRONT_URL + '/auth/callback'

exports.auth = (req, res) => {
  const scopes = ['identify', 'guilds']

  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scopes.join('%20')}`

  res.redirect(url)
}

exports.callback = async (req, res) => {
  const code = req.query.code

  if (!code) return res.status(201).json({message: 'Missing code parameter!'})

  let token = null

  await Discord
    .getToken(code)
    .then(response => {
      token = response.data
    })
    .catch(error => {
      const response = error.response
      console.error(response)
      res.status(401).json({message: 'Internal Server Error!'})
    })

  let discordUser = null

  await Discord
    .getUserInfo(token.access_token)
    .then(response => {
      discordUser = response.data
    })

  let user = await User.findOne({discordId: discordUser.id})
    .select(['-bank', '-__v'])
    .exec()

  if (user) {
    const jwtToken = jwt.sign({data: user}, process.env.APP_SECRET, {
      expiresIn: '24h'
    })
    res.json({jwtToken})
  } else {
    res.status(401).json({message: 'Unauthorized!'})
  }
}

exports.impersonate = async (req, res) => {
  User
    .findById(req.params.id)
    .then(user => {
      const jwtToken = jwt.sign({data: user}, process.env.APP_SECRET, {
        expiresIn: '24h'
      })
      res.json({jwtToken})
    }).catch(() => {
    res.status(404).json({data: {message: 'User not found!'}})
  })
}


exports.check = (req, res) => {
  res.json({message: 'Welcome to Cité d\'or!'})
}