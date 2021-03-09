const tape = require('tape');
const versioning = require('../src/versioning/versioning');
const util = require('../src/versioning/util');
const mongoose = require('mongoose');

// schema definition
var Schema = mongoose.Schema;
let testSchema = new Schema({
  data : { type : String, required : false, unique: false },
});

tape.test('clone schema should keep original fields', t => {
  let clone = util.cloneSchema(testSchema, mongoose)
  t.equal(JSON.stringify(clone.paths.data), JSON.stringify(testSchema.paths.data));
  t.end();
});
