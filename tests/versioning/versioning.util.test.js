const util = require('../../src/versioning/util')
const mongoose = require('mongoose')
let Schema = mongoose.Schema


// test util
const t = require('tap')
t.jobs = 3

t.test('clone schema should keep original fields', t => {
  let originalSchema = new Schema({
    data : { type: String, required: false, unique: false },
  })
  let clone = util.cloneSchema(originalSchema, mongoose)
  t.equal(JSON.stringify(clone.paths.data), JSON.stringify(originalSchema.paths.data))
  t.end()
})

t.test('valid is true for version "1"', t => {
  t.equal(util.isValidVersion('1'), true)
  t.end()
})

t.test('valid is false for version "0"', t => {
   t.equal(util.isValidVersion('0'), false)
   t.end()
})

t.test('valid is false for version "x"', t => {
   t.equal(util.isValidVersion('x'), false)
   t.end()
})

t.test('valid is false for version " "', t => {
  t.equal(util.isValidVersion(' '), false)
  t.end()
})

t.test('valid is false for int version', t => {
  t.equal(util.isValidVersion(5), false)
  t.end()
})
