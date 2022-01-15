const axios = require('axios')
const qs = require('querystring')

const DISCORD_BASE_URL = 'https://raider.io/api/v1'
const REDIRECT_URI = process.env.FRONT_URL + '/auth/callback'
axios.defaults.baseURL = DISCORD_BASE_URL

export default {
  getProfile (region, realm, name) {
    return axios
      .get(
        `/characters/profile?region=${region}&realm=${realm}&name=${name}&fields=mythic_plus_scores`
        )
  }
}