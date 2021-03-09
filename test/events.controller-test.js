const tape = require('tape');
const eventsController = require('../src/controllers/events.controller');

tape.test('returns true for version "1"', t => {
  t.equal(eventsController.isValidVersion('1'), true);
  t.end();
});

tape.test('returns false for version "0"', t => {
   t.equal(eventsController.isValidVersion('0'), false);
   t.end();
});

tape.test('returns false for version "x"', t => {
   t.equal(eventsController.isValidVersion('x'), false);
   t.end();
});
