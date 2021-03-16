const versioning = require('../../src/versioning/versioning');
const util = require('../../src/versioning/util');
const c = require('../../src/versioning/constants');
const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var db = require('../../src/db/database')

// connect to db
db.connect(process.env.DB_URI)

// test schema definition
const NAME = "test"
let testSchema = new Schema({
  data : { type: String, required: false, unique: false },
}, { autoIndex: false });
testSchema.plugin(versioning, NAME + "s.versioning");
let Mock = mongoose.model(NAME, testSchema);

const mockOne = { 
  _id: new mongoose.Types.ObjectId(),
  data: "first mock test" 
}

let initialMock

// test versioning.js
const tap = require('tap');

// test versioning CRUD
tap.test('create new object', async (t) => {
  initialMock = await new Mock(mockOne).save()
  t.equal(initialMock[c.VERSION], 1);
  t.end()
})

tap.test('update object', async (childTest) => {
  var mock = await Mock.findById(mockOne._id)
  mock.data = "modified"
  mock = await mock.save()  
  childTest.equal(mock[c.VERSION], 2);
  childTest.end()
})

tap.test('find current version by number', async (childTest) => {
  var mock = await Mock.findVersion(mockOne._id, 2, Mock)
  childTest.isEqual(mock[c.VALIDITY].end, undefined);
  childTest.end()
});

tap.test('find old version by number', async (childTest) => {
  var mock = await Mock.findVersion(mockOne._id, 1, Mock)
  childTest.type(mock[c.VALIDITY].end, Date);
  childTest.end()
});

tap.test('find current valid version', async (childTest) => {
  var mock = await Mock.findValidVersion(mockOne._id, new Date(), Mock)
  childTest.equal(mock[c.VERSION], 2);
  childTest.end()
});

tap.test('find old valid version', async (childTest) => {
  var archivedMock = await Mock.VersionedModel.findById({ _id: mockOne[c.ID], _version: 1 })
  let creationDate = archivedMock[c.VALIDITY].start
  var mock = await Mock.findValidVersion(mockOne._id, creationDate, Mock)
  childTest.equal(mock[c.VERSION], 1);
  childTest.end()
});

tap.test('trying to update old version fails', async (childTest) => {
  try {      
    initialMock.data = "test not update old"
    await initialMock.save()
    childTest.fail('Should not get here');
  } catch (err) {
    childTest.ok(err, 'Got expected error');
  }
  childTest.end()
});

tap.test('delete object moves it to archive', async (childTest) => {
  var mock = await Mock.findById(mockOne[c.ID])
  mock._deletion = { "_deleter": "test" }
  await mock.remove()

  var noMock = await Mock.findValidVersion(mockOne[c.ID], new Date(), Mock)
  childTest.isEqual(noMock, null);
  
  var archivedMock = await Mock.VersionedModel.findById({ _id: mockOne[c.ID], _version: 2 })
  childTest.isEqual(archivedMock[c.DELETER], "test")
  childTest.end()
});

tap.test('trying to update deleted version fails', async (childTest) => {
  try {      
    initialMock.data = "test not update deleted"
    await initialMock.save()
    childTest.fail('Should not get here');
  } catch (err) {
    childTest.ok(err, 'Got expected error');
  }
  childTest.end()
});

tap.teardown(async function() { 
  await Mock.deleteMany()
  await Mock.VersionedModel.deleteMany()
  await db.end()
});