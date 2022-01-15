import {isGranted} from '../guard'

const router = require('express').Router()

const userController = require('../../controllers/userController')

const {body, query} = require('express-validator')

router.get('/', isGranted('ROLE_ADMIN'), query('page').isNumeric().custom(value => value >= 1), userController.index)
router.post('/autocomplete', isGranted('ROLE_ADMIN', 'ROLE_ADVERTISER'), body('search').isString().custom(value => value.length >= 2), userController.autocomplete)
router.get('/:id', isGranted('ROLE_BOOSTER', 'ROLE_ADMIN', 'ROLE_ADVERTISER'), userController.user)
router.get('/:id/boosts', isGranted('ROLE_BOOSTER', 'ROLE_ADMIN', 'ROLE_ADVERTISER'), query('page').isNumeric().custom(value => value >= 1), userController.boosts)
router.get('/:id/transactions', isGranted('ROLE_BOOSTER', 'ROLE_ADMIN', 'ROLE_ADVERTISER'), query('page').isNumeric().custom(value => value >= 1), userController.transactions)
router.post('/:id/pay', isGranted('ROLE_ADMIN'), userController.pay)

router.post(
    '/:id/updateBalance',
    isGranted('ROLE_ADMIN'),
    [
      body('amount').isNumeric().custom(value => value !== 0)
    ],
    userController.updateBalance
)

module.exports = router