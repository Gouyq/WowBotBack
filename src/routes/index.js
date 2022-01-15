const router = require('express').Router()

const authRoutes = require('./auth')
const userRoutes = require('./api/user')
const boostRoutes = require('./api/boost')
const realmRoutes = require('./api/realm')

router.use('/auth', authRoutes)
router.use('/api/users', userRoutes)
router.use('/api/boosts', boostRoutes)
router.use('/api/realms', realmRoutes)

module.exports = router
