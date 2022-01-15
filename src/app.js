const {config} = require('dotenv')
config({path: __dirname + '/../.env'})

/* Setup lib app */
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const rfs = require('rotating-file-stream')
const jwt = require('jsonwebtoken')

/* MongoDB Config and Start */
const mongoose = require('mongoose')
mongoose.set('useUnifiedTopology', true)
mongoose.set('useFindAndModify', false)
mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`, {useNewUrlParser: true})
const db = mongoose.connection
db.on('error', console.error.bind(console, '\x1b[31m', '[ERROR] Could not connect to MongoDB!'))
db.once('open', () => console.log('[INFO] Connection successful!'))

/* App Config and routes config */

const app = express()
const routes = require('./routes')

const accessLogStream = rfs.createStream('access.log', {
  interval: '1d',
  path: __dirname + '/../log'
})

morgan.token('remote-addr', req => {
  const headerValue = req.headers['x-forwarded-for']
  return headerValue || req.connection.remoteAddress
})

morgan.token('remote-user', req => {
  const headerValue = req.headers['authorization']

  if (!headerValue) return 'Anonymous'

  const match = headerValue.match(/Bearer (.+)/)
  const token = match && match.length > 1 ? match[1] : ''

  try {
    jwt.verify(token, process.env.APP_SECRET)

    const user = jwt.decode(token).data

    return `${user.username}#${user.discriminator}`
  } catch {
    return 'Anonymous'
  }
})

app.use(
  morgan(
    'combined',
    {stream: accessLogStream}
  )
)


app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(cors())
app.use('/', routes)
app.listen(process.env.PORT || 8081)

/* Load Bot */
require('./services/bot')
