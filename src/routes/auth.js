import {isAuthenticated, isGranted} from './guard'

let router = require('express').Router()

let authController = require('../controllers/authController')

router.get('/', authController.auth)
router.get('/check', isAuthenticated(), authController.check)
router.get('/:id/impersonate', isGranted('ROLE_ADMIN'), authController.impersonate)
router.get('/callback', authController.callback)

module.exports = router
