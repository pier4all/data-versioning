const tape = require('tape');
const versioning = require('../src/versioning/versioning');
const util = require('../src/versioning/util');
const mongoose = require('mongoose');

// schema definition
var Schema = mongoose.Schema;
let testSchema = new Schema({
  data : { type : String, required : false, unique: false },
});

// test util
tape.test('clone schema should keep original fields', t => {
  let clone = util.cloneSchema(testSchema, mongoose)
  t.equal(JSON.stringify(clone.paths.data), JSON.stringify(testSchema.paths.data));
  t.end();
});

tape.test('valid is true for version "1"', t => {
  t.equal(util.isValidVersion('1'), true);
  t.end();
});

tape.test('valid is false for version "0"', t => {
   t.equal(util.isValidVersion('0'), false);
   t.end();
});

tape.test('valid is false for version "x"', t => {
   t.equal(util.isValidVersion('x'), false);
   t.end();
});
