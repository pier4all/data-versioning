const versioning = require('../src/versioning/versioning');
const util = require('../src/versioning/util');
const mongoose = require('mongoose');

var db = require('../src/db/database')

// connect to db
db.connect(process.env.DB_URI)

// schema definition
const NAME = "test"
var Schema = mongoose.Schema;
let testSchema = new Schema({
  data : { type: String, required: false, unique: false },
});
testSchema.plugin(versioning, NAME + "s.versioning");
let Mock = mongoose.model(NAME, testSchema);

const mockOne = { 
  _id: new mongoose.Types.ObjectId(),
  data: "first mock test" 
}

// test util
const t = require('tap');
t.jobs = 3

t.test('clone schema should keep original fields', t => {
  let originalSchema = new Schema({
    data : { type: String, required: false, unique: false },
  });
  let clone = util.cloneSchema(originalSchema, mongoose)
  t.equal(JSON.stringify(clone.paths.data), JSON.stringify(originalSchema.paths.data));
  t.end();
});

t.test('valid is true for version "1"', t => {
  t.equal(util.isValidVersion('1'), true);
  t.end();
});

t.test('valid is false for version "0"', t => {
   t.equal(util.isValidVersion('0'), false);
   t.end();
});

t.test('valid is false for version "x"', t => {
   t.equal(util.isValidVersion('x'), false);
   t.end();
});

t.test('valid is false for version " "', t => {
  t.equal(util.isValidVersion(' '), false);
  t.end();
});

t.test('valid is false for int version', t => {
  t.equal(util.isValidVersion(5), false);
  t.end();
});

// test versioning
const tap = require('tap');

tap.test('create new object', async (childTest) => {
  var mock = await new Mock(mockOne).save()
  childTest.equal(mock._version, 1);
  let creationDate = mock._validity.start

  await tap.test('update object', async (childTest) => {
    var mock = await Mock.findById(mockOne._id)
    mock.data = "modified"
    mock = await mock.save()  
    childTest.equal(mock._version, 2);
  });

  await tap.test('find current valid version', async (childTest) => {
    var mock = await Mock.findValidVersion(mockOne._id, new Date(), Mock)
    childTest.equal(mock._version, 2);
  });

  await tap.test('find old valid version', async (childTest) => {
    var mock = await Mock.findValidVersion(mockOne._id, creationDate, Mock)
    childTest.equal(mock._version, 1);
  });

  await tap.test('find current version by number', async (childTest) => {
    var mock = await Mock.findVersion(mockOne._id, 2, Mock)
    childTest.isEqual(mock._validity.end, undefined);
  });

  await tap.test('find old version by number', async (childTest) => {
    var mock = await Mock.findVersion(mockOne._id, 1, Mock)
    childTest.type(mock._validity.end, Date);
  });

  await tap.test('delete object moves it to archive', async (childTest) => {
    var mock = await Mock.findById(mockOne._id)
    mock._deletion = { "_deleter": "test" }
    await mock.remove()

    var noMock = await Mock.findValidVersion(mockOne._id, new Date(), Mock)
    childTest.isEqual(noMock, null);
    
    var archivedMock = await Mock.VersionedModel.findById({ _id: mockOne._id, _version: 2 })
    childTest.isEqual(archivedMock._deleter, "test")
  });

  childTest.end();

});

tap.teardown(async function() { 
  await Mock.deleteMany()
  await Mock.VersionedModel.deleteMany()
  await db.end()
});