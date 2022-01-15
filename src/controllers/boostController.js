import Helpers from '../helpers'

const bot = require('../services/bot')
import privateTemplate from '../bot/messages/privateMessage'

const Boost = require('../models/boost').Boost
const User = require('../models/user').User
const Realm = require('../models/realm').Realm

const cuts = require('../../config/cuts')
import {BOOST_CANCELLED, BOOST_COMPLETED, BOOST_CONFIRMED, BOOST_INITIALIZED} from '../constants/boost'
import {TRANSACTION_ADD_MONEY} from '../constants/transaction'

const {RealmTransaction} = require('../models/transaction')

const {validationResult} = require('express-validator')

exports.index = (req, res) => {
  const page = req.query.page
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.errors})
  }

  Boost
    .paginate(
      {},
      {
        sort: {createdAt: 'DESC'},
        populate: ['tank', 'advertiser', 'dps1', 'dps2', 'healer', {path: 'realm', select: 'name'}],
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

  Realm
    .findById(body.realm)
    .then(async realm => {
      let cutAdvertiser = 0

      if (req.user.roles.includes('ROLE_ADVERTISER_LEGENDARY')) {
        cutAdvertiser = cuts.ADVERTISER_CUTS.ROLE_ADVERTISER_LEGENDARY
      } else if (req.user.roles.includes('ROLE_ADVERTISER_RARE')) {
        cutAdvertiser = cuts.ADVERTISER_CUTS.ROLE_ADVERTISER_RARE
      } else {
        cutAdvertiser = cuts.ADVERTISER_CUTS.ROLE_ADVERTISER
      }

      const boost = new Boost({
        tank: null,
        healer: null,
        dps1: null,
        dps2: null,
        advertiser: req.user._id,
        stack: body.stack,
        total: body.total,
        whisper: body.whisper,
        description: body.description,
        cutBooster: Math.floor(cuts.BOOSTER_CUT * body.total),
        cutAdvertiser: Math.floor(cutAdvertiser * body.total),
        keys: body.keys,
        status: BOOST_INITIALIZED,
        realm: realm._id
      })

      boost
        .save()
        .then(() => {
          res.json({data: boost})
          bot.commands.get('boost').run(bot, boost, body.specificPlayers ? body.specificPlayers : {})
        })
        .catch(() => {
          res.status(500).json({message: 'Boost could not be saved!'})
        })
    })
    .catch(() => {
      res.status(422).json({
        errors: [
          {
            location: 'body',
            msg: 'Invalid realm',
            params: 'realm',
            value: body.realm
          }
        ]
      })
    })
}

exports.markAsCompleted = async (req, res) => {
  Boost.findById(req.params.id)
    .then(async (boost) => {
      if (boost.status !== BOOST_CONFIRMED) {
        return res.status(422).json({message: 'Action not available!'})
      }

      const callback = (user, amount) => {
        const discordUser = bot.guilds.cache.find(g => g.id === process.env.SERVER_ID).members.cache.get(user.discordId)

        if (discordUser) {
          const data = {
            title: 'Balance Updated',
            message: 'Your current balance have increased by ' + Helpers.numberWithSpaces(amount) + ' for the boost ' + String(boost._id).substr(0, 8),
          }

          discordUser.send(privateTemplate.privateMessage(bot, data))
        }
      }

      const realmTransaction = new RealmTransaction({
        description: `Boost ${String(boost._id).substr(0, 8)}`,
        author: req.user._id,
        amount: boost.total,
        type: TRANSACTION_ADD_MONEY,
        target: boost.realm
      })

      let additionalActions = []

      const communityRealm = await Realm.findOne({default: true})

      if (communityRealm) {
        const communityTransaction = new RealmTransaction({
          description: `Boost ${String(boost._id).substr(0, 8)}`,
          author: req.user._id,
          amount: boost.total - (boost.cutBooster * 4) - boost.cutAdvertiser,
          type: TRANSACTION_ADD_MONEY,
          target: communityRealm._id
        })

        additionalActions.push(Realm.updateDefaultRealm(boost.total - (boost.cutBooster * 4) - boost.cutAdvertiser))
        additionalActions.push(communityTransaction.save())
      }

      Promise.all([
        User.updateCurrentBalance(boost.tank, boost.cutBooster, callback),
        User.updateCurrentBalance(boost.healer, boost.cutBooster, callback),
        User.updateCurrentBalance(boost.dps1, boost.cutBooster, callback),
        User.updateCurrentBalance(boost.dps2, boost.cutBooster, callback)
      ])
        .then(() => {
          Promise.all([
            User.updateCurrentBalance(boost.advertiser, boost.cutAdvertiser, callback),
            Realm.updateCurrentBalance(boost.realm, boost.total),
            realmTransaction.save(),
            boost.update({status: BOOST_COMPLETED}),
            ...additionalActions
          ])
            .then(() => {
              res.json({data: boost})
            })
            .catch(console.error)
        })
        .catch(console.error)
    })
    .catch(error => {
      console.log(error)
      res.status(404).json({message: 'Boost not found!'})
    })
}

exports.markAsCancelled = (req, res) => {
  Boost.findById(req.params.id)
    .then(boost => {
      if (![BOOST_INITIALIZED, BOOST_CONFIRMED].includes(boost.status)) {
        return res.status(422).json({message: 'Action not available!'})
      }

      boost.status = BOOST_CANCELLED
      boost.save()

      res.json({data: boost})
    })
    .catch(() => {
      res.status(404).json({message: 'Boost not found!'})
    })
}