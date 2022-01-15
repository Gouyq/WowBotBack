import {isGranted} from '../guard'

let router = require('express').Router()

let boostController = require('../../controllers/boostController')

const {body, query} = require('express-validator')

router.get('/', isGranted('ROLE_ADMIN'), query('page').isNumeric().custom(value => value >= 1), boostController.index)

router.post('/:id/complete', isGranted('ROLE_ADMIN'), boostController.markAsCompleted)
router.post('/:id/cancel', isGranted('ROLE_ADMIN'), boostController.markAsCancelled)

router.post(
  '/',
  isGranted('ROLE_ADVERTISER'),
  [
    body('description').isString(),
    body('keys').isArray(),
    body('stack').isString().isIn(['none', 'leather', 'mail', 'plate', 'cloth']),
    body('total').isNumeric().custom(value => value > 0),
    body('whisper').isString()
  ],
  boostController.store
)

module.exports = router