const mongoose = require('mongoose');

const customerOne = { 
    _id: new mongoose.Types.ObjectId(),
    "name": "Billa AG",
    "email": "info@billa.ch",
    "language": "FR"
}

const customerTwo = { 
    _id: new mongoose.Types.ObjectId(),
    "name": "LuaBox AG",
    "email": "luabox@etsy.es",
    "language": "ES"
}

module.exports = {
    customerOne,
    customerTwo
}