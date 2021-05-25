const versioning = require('../../src/versioning/versioning')
const c = require('../../src/versioning/constants')
const mongoose = require('mongoose')
var Schema = mongoose.Schema

// test versioning.js
const tap = require('tap')

// test versioning schema

tap.test(`schema cannot have field ${c.EDITOR}`, t => {
  try {    
    const NAME = "bad"  
    let badSchema = new Schema({ })

    let reservedField = {}
    reservedField[c.EDITOR] = { type: String, required: true, default: c.DEFAULT_EDITOR }
    badSchema.add(reservedField)
    
    badSchema.plugin(versioning, NAME + "s.versioning")
    mongoose.model(NAME, badSchema)
    t.fail('Should not get here')

  } catch (err) {
    t.ok(err, 'Got expected error')
  }
  t.end()
})

tap.test(`schema cannot have field ${c.DELETER}`, t => {
  try {    
    const NAME = "bad"  
    let badSchema = new Schema({ })

    let reservedField = {}
    reservedField[c.DELETER] = { type: String }
    badSchema.add(reservedField)
    
    badSchema.plugin(versioning, NAME + "s.versioning")
    mongoose.model(NAME, badSchema)
    t.fail('Should not get here')

  } catch (err) {
    t.ok(err, 'Got expected error')
  }
  t.end()
})

tap.test(`schema cannot have field ${c.VERSION}`, t => {
  try {    
    const NAME = "bad"  
    let badSchema = new Schema({ })

    let reservedField = {}
    reservedField[c.VERSION] = { type: Number, required: true, default: 0, select: true }
    badSchema.add(reservedField)
    
    badSchema.plugin(versioning, NAME + "s.versioning")
    mongoose.model(NAME, badSchema)
    t.fail('Should not get here')

  } catch (err) {
    t.ok(err, 'Got expected error')
  }
  t.end()
})

tap.test(`schema cannot have field ${c.VALIDITY}`, t => {
  try {    
    const NAME = "bad"  
    let badSchema = new Schema({ })

    let reservedField = {}
    reservedField[c.VALIDITY] = { type: Date, required: false }
    badSchema.add(reservedField)
    
    badSchema.plugin(versioning, NAME + "s.versioning")
    mongoose.model(NAME, badSchema)
    t.fail('Should not get here')

  } catch (err) {
    t.ok(err, 'Got expected error')
  }
  t.end()
})

tap.test(`schema cannot have field ${c.DELETION}`, t => {
  try {    
    const NAME = "bad"  
    let badSchema = new Schema({ })

    let reservedField = {}
    reservedField[c.DELETION] = { type: Date, required: false }
    badSchema.add(reservedField)
    
    badSchema.plugin(versioning, NAME + "s.versioning")
    mongoose.model(NAME, badSchema)
    t.fail('Should not get here')

  } catch (err) {
    t.ok(err, 'Got expected error')
  }
  t.end()
})

tap.test(`schema cannot have field ${c.EDITION}`, t => {
  try {    
    const NAME = "bad"  
    let badSchema = new Schema({ })

    let reservedField = {}
    reservedField[c.EDITION] = { type: Date, required: false }
    badSchema.add(reservedField)
    
    badSchema.plugin(versioning, NAME + "s.versioning")
    mongoose.model(NAME, badSchema)
    t.fail('Should not get here')

  } catch (err) {
    t.ok(err, 'Got expected error')
  }
  t.end()
})

tap.test(`schema cannot have field ${c.SESSION}`, t => {
  try {    
    const NAME = "bad"  
    let badSchema = new Schema({ })

    let reservedField = {}
    reservedField[c.SESSION] = { type: Date, required: false }
    badSchema.add(reservedField)
    
    badSchema.plugin(versioning, NAME + "s.versioning")
    mongoose.model(NAME, badSchema)
    t.fail('Should not get here')

  } catch (err) {
    t.ok(err, 'Got expected error')
  }
  t.end()
})