const mongoose = require('mongoose');

const customerOne = { 
    _id: new mongoose.Types.ObjectId(),
    "custno": 10001,
    "name": "Billa AG",
    "email": "info@billa.ch",
    "language": "FR"
}

const customerTwo = { 
    _id: new mongoose.Types.ObjectId(),
    "custno": 10002,
    "name": "LuaBox AG",
    "email": "luabox@etsy.es",
    "language": "ES"
}

module.exports = {
    customerOne,
    customerTwo
}