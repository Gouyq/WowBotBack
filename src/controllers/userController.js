import Helpers from '../helpers'

const User = require('../models/user').User
const Boost = require('../models/boost').Boost
const UserTransaction = require('../models/transaction').UserTransaction
const {validationResult} = require('express-validator')

import {BOOST_COMPLETED} from '../constants/boost'
import privateTemplate from '../bot/messages/privateMessage'
import {TRANSACTION_ADD_MONEY, TRANSACTION_REMOVE_MONEY} from '../constants/transaction'

const bot = require('../services/bot')

exports.index = (req, res) => {
  const page = req.query.page
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  User
    .paginate(
        {},
      // {
      //   'bank.currentAmount': {$gt: 0}
      // },
      {
        select: ['-__v'],
        limit: 20,
        page,
        sort: {'bank.currentAmount': -1}
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
}

exports.user = (req, res) => {
  if (!req.user.roles.includes('ROLE_ADMIN') && req.params.id !== req.user._id) {
    return res.status(401).json({data: {message: 'Unauthorized!'}})
  }

  User
    .findById(req.params.id)
    .then(async user => {
      const tankCount = await Boost.countDocuments({tank: req.params.id, status: BOOST_COMPLETED})
      const healerCount = await Boost.countDocuments({healer: req.params.id, status: BOOST_COMPLETED})
      const dpsCount = await Boost.countDocuments({
        $or: [{dps1: req.params.id}, {dps2: req.params.id}],
        status: BOOST_COMPLETED
      })

      res.json({
        data: {
          user,
          stats: {
            tankCount,
            healerCount,
            dpsCount
          }
        }
      })
    })
    .catch(() => {
      res.status(404).json({message: 'User not found!'})
    })
}

exports.boosts = (req, res) => {
  if (!req.user.roles.includes('ROLE_ADMIN') && req.params.id !== req.user._id) {
    return res.status(401).json({data: {message: 'Unauthorized!'}})
  }

  const userId = req.params.id
  const page = req.query.page

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  Boost
    .paginate(
      {
        $and: [
          {status: BOOST_COMPLETED},
          {
            $or: [
              {tank: userId},
              {healer: userId},
              {dps1: userId},
              {dps2: userId},
              {advertiser: userId}
            ]
          }
        ]
      },
      {
        select: ['-__v'],
        populate: ['tank', 'healer', 'dps1', 'dps2', 'advertiser'],
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

exports.transactions = (req, res) => {
  if (!req.user.roles.includes('ROLE_ADMIN') && req.params.id !== req.user._id) {
    return res.status(401).json({data: {message: 'Unauthorized!'}})
  }

  const userId = req.params.id
  const page = req.query.page

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  UserTransaction
    .paginate(
      {
        target: userId
      },
      {
        select: ['-__v'],
        populate: ['author'],
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

exports.pay = (req, res) => {
  User.findById(req.params.id)
    .then(async user => {
      if (user.bank.currentAmount === 0) {
        return res.status(500).json({message: 'User\'s bank is empty!'})
      }

      const data = {
        message: 'Your payment has been made: ' + Helpers.numberWithSpaces(user.bank.currentAmount) + ' golds',
        title: 'Payment sent'
      }

      await user.update({
        $inc: {'bank.totalAmount': user.bank.currentAmount},
        'bank.currentAmount': 0
      })

      const transaction = new UserTransaction({
        description: 'Payment made',
        author: req.user._id,
        amount: user.bank.currentAmount,
        type: TRANSACTION_REMOVE_MONEY,
        target: user._id
      })

      await transaction.save()

      const discordUser = bot.guilds.cache.find(g => g.id === process.env.SERVER_ID).members.cache.get(user.discordId)

      if (discordUser) {
        await discordUser.send(privateTemplate.privateMessage(bot, data))
      }

      return res.json({data: user})
    })
    .catch(error => {
      console.log(error)
      res.status(404).json({message: 'User not found!'})
    })
}

exports.autocomplete = (req, res) => {
  const search = req.body.search

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  return User
    .autocomplete(search)
    .then(result => {
      res.json({data: result})
    })
}

exports.updateBalance = (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  const body = req.body

  User
      .findById(req.params.id)
      .then(user => {
        const transaction = new UserTransaction({
          description: body.description,
          author: req.user._id,
          amount: body.amount >= 0 ? body.amount : body.amount * -1,
          type: body.amount >= 0 ? TRANSACTION_ADD_MONEY : TRANSACTION_REMOVE_MONEY,
          target: user._id
        })

        user.bank.currentAmount += Math.floor(parseInt(body.amount))

        Promise.all([
          transaction.save(),
          user.save()
        ]).then(() => {
          res.json({data: user})
        })
      })
      .catch(() => {
        res.status(404).json({message: 'User not found!'})
      })
}
