const axios = require('axios')
const qs = require('querystring')

const DISCORD_BASE_URL = 'https://raider.io/api/v1'

export default {
  getProfile (region, realm, name) {
    axios.defaults.baseURL = DISCORD_BASE_URL
    return axios
      .get(
        `/characters/profile?region=${region}&realm=${realm}&name=${name}&fields=mythic_plus_scores`
        )
  }
}