import {TRANSACTION_ADD_MONEY, TRANSACTION_REMOVE_MONEY, TRANSACTION_SET_MONEY} from '../constants/transaction'

const {Bank} = require('../models/bank')
const {Realm} = require('../models/realm')
const {RealmTransaction} = require('../models/transaction')

const {validationResult} = require('express-validator')

exports.index = (req, res) => {
  Realm
    .find({default: false})
    .sort({name: 'ASC'})
    .select(['_id', 'name'])
    .then(realms => {
      res.json({data: realms})
    })
    .catch(() => {
      res.status(500).json('Internal Error!')
    })
}

exports.show = (req, res) => {
  Realm
    .findById(req.params.id)
    .select(['-__v'])
    .then(realm => {
      res.json({data: realm})
    })
    .catch(() => {
      res.status(404).json({message: 'Realm not found!'})
    })
}

exports.adminIndex = (req, res) => {
  const page = req.query.page
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  Realm
    .paginate(
      {},
      {
        sort: {name: 'ASC'},
        select: ['-__v'],
        limit: 20,
        page
      }
    )
    .then(result => {
      const data = result.docs
      delete result.docs

      res.json({
        ...result,
        data
      })
    })
}

exports.store = (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  const body = req.body

  const realm = new Realm({
    name: body.name,
    bank: new Bank(),
    default: body.default
  })

  if (body.default) {
    Realm.findOneAndUpdate({default: true}, {default: false})
  }

  realm
    .save()
    .then(() => {
      res.json({data: realm})
    })
    .catch(() => {
      res.status(500).json({message: 'Realm could not be saved!'})
    })
}

exports.update = async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  const body = req.body

  try {
    const realm = await Realm.findById(req.params.id)

    if (body.default && !realm.default) {
      await Realm.findOneAndUpdate({default: true}, {default: false})
    }

    if (realm.bank.currentAmount !== body.bank.currentAmount) {
      const transaction = new RealmTransaction({
        description: null,
        author: req.user._id,
        amount: body.bank.currentAmount,
        type: TRANSACTION_SET_MONEY,
        target: realm._id
      })

      await transaction.save()
    }

    realm.update(
      {
        name: body.name,
        default: body.default,
        'bank.currentAmount': body.bank.currentAmount,
        'bank.totalAmount': body.bank.totalAmount
      },
      {new: true}
    )
      .then(realm => {
        res.json({data: realm})
      })
  } catch (e) {
    return res.status(404).json({message: 'Realm not found!'})
  }
}

exports.destroy = (req, res) => {
  Realm
    .findByIdAndDelete(req.params.id)
    .select(['-__v', '-bank'])
    .then(realm => {
      res.json({data: realm})
    })
    .catch(() => {
      res.status(404).json({message: 'Realm not found!'})
    })
}

exports.overview = (req, res) => {
  Realm
    .findOne({default: true})
    .then(realm => {
      res.json({data: realm})
    })
}

exports.transactions = (req, res) => {
  const page = req.query.page

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  let options = {}

  if (req.params.id) {
    options = {target: req.params.id}
  }

  RealmTransaction
    .paginate(
      options,
      {
        select: ['-__v'],
        populate: ['author', 'target'],
        limit: 20,
        page,
        sort: {createdAt: 'DESC'}
      }
    )
    .then(result => {
      const data = result.docs
      delete result.docs

      res.json({
        ...result,
        data,
      })
    })
    .catch(() => {
      res.status(500).json({message: 'Internal Error!'})
    })
}

exports.updateBalance = (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  const body = req.body

  Realm
    .findById(req.params.id)
    .then(realm => {
      const transaction = new RealmTransaction({
        description: body.description,
        author: req.user._id,
        amount: body.amount >= 0 ? body.amount : body.amount * -1,
        type: body.amount >= 0 ? TRANSACTION_ADD_MONEY : TRANSACTION_REMOVE_MONEY,
        target: realm._id
      })

      realm.bank.currentAmount += Math.floor(parseInt(body.amount))

      Promise.all([
        transaction.save(),
        realm.save()
      ]).then(() => {
        res.json({data: realm})
      })
    })
    .catch(() => {
      res.status(404).json({message: 'Realm not found!'})
    })
}