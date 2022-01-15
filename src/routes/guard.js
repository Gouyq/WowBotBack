const jwt = require('jsonwebtoken')

export function isAuthenticated () {
  return (req, res, next) => {
    const header = req.headers['authorization']

    if (header === undefined) res.status(401).json({message: 'Missing Authorization Header!'})

    const match = header.match(/Bearer (.+)/)
    const token = match && match.length > 1 ? match[1] : ''

    try {
      jwt.verify(token, process.env.APP_SECRET)

      req.user = jwt.decode(token).data

      next()
    } catch {
      res.status(401).json({message: 'Invalid Token!'})
    }
  }
}

export function isGranted (...roles) {
  return (req, res, next) => {
    isAuthenticated()(req, res, () => {
      let granted = false

      roles.forEach(role => {
        if (req.user.roles.includes(role)) {
          granted = true
        }
      })

      if (granted) {
        next()
      } else {
        res.status(403).json({message: 'Access Forbidden!'})
      }
    })
  }
}