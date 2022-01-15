const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

import {BOOST_INITIALIZED} from '../constants/boost'

const BoostSchema = new mongoose.Schema({
  tank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  healer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dps1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dps2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  advertiser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: {
    type: String
  },
  stack: {
    type: String,
    required: true
  },
  keys: {
    type: Array,
    required: true,
    default: []
  },
  total: {
    type: Number,
    required: true,
  },
  cutBooster: {
    type: Number,
    required: true,
  },
  cutAdvertiser: {
    type: Number,
    required: true,
  },
  whisper: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    default: BOOST_INITIALIZED
  },
  realm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Realm'
  }
}, {
  timestamps: true
})

BoostSchema.plugin(mongoosePaginate)

const Boost = mongoose.model('Boost', BoostSchema)

module.exports = {Boost, BoostSchema}