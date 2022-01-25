const axios = require('axios')
const qs = require('querystring')

const DISCORD_BASE_URL = 'https://discord.com/api/v6'
const REDIRECT_URI = process.env.FRONT_URL + '/auth/callback'


export default {
  getToken (code) {
    axios.defaults.baseURL = DISCORD_BASE_URL
    return axios
      .post(
        '/oauth2/token',
        qs.stringify({
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
  },
  getUserInfo (token) {
    axios.defaults.baseURL = DISCORD_BASE_URL
    return axios
      .get(
        '/users/@me',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
  },
  refreshToken (token) {
    axios.defaults.baseURL = DISCORD_BASE_URL
    return axios
      .post(
        '/oauth2/token',
        qs.stringify({
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: token.refresh_token,
          redirect_uri: REDIRECT_URI
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )
  }
}