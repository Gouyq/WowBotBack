import {isAuthenticated, isGranted} from '../guard'

let router = require('express').Router()

let realmController = require('../../controllers/realmController')

const {body, query} = require('express-validator')

router.get('/', isAuthenticated(), realmController.index)
router.get('/admin', isGranted('ROLE_ADMIN'), query('page').isNumeric().custom(value => value >= 1), realmController.adminIndex)
router.get('/overview', isGranted('ROLE_ADMIN'), realmController.overview)
router.get('/transactions', isGranted('ROLE_ADMIN'), query('page').isNumeric().custom(value => value >= 1), realmController.transactions)

router.post(
  '/',
  isGranted('ROLE_ADMIN'),
  [
    body('name').isString(),
    body('default').isBoolean()
  ],
  realmController.store
)

router.get('/:id', isGranted('ROLE_ADMIN'), realmController.show)
router.get('/:id/transactions', isGranted('ROLE_ADMIN'), realmController.transactions)
router.put(
  '/:id',
  isGranted('ROLE_ADMIN'),
  [
    body('name').isString(),
    body('default').isBoolean(),
    body('bank.currentAmount').isNumeric().custom(value => value >= 0),
    body('bank.totalAmount').isNumeric().custom(value => value >= 0)
  ],
  realmController.update
)
router.post(
  '/:id/updateBalance',
  isGranted('ROLE_ADMIN'),
  [
    body('amount').isNumeric().custom(value => value !== 0)
  ],
  realmController.updateBalance
)

router.delete('/:id', isGranted('ROLE_ADMIN'), realmController.destroy)

module.exports = router
