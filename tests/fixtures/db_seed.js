const mongoose = require('mongoose')
var chalk = require('chalk')

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

const customerThree = { 
    _id: new mongoose.Types.ObjectId(),
    "custno": 10003,
    "name": "Heinz AG",
    "email": "support@heinz-de.ch",
    "language": "DE"
}

const customerFour = { 
    _id: new mongoose.Types.ObjectId(),
    "custno": 10004,
    "name": "Mirk GmBH",
    "email": "mirk@mg.de",
    "language": "DE"
}

const initDB = async (app) => {

    const response1 = await app.inject({
        method: 'POST',
        url: '/crud/customer',
        body: customerOne
    })

    const response2 = await app.inject({
        method: 'POST',
        url: '/crud/customer',
        body: customerTwo
    })

    const response3 = await app.inject({
        method: 'POST',
        url: '/crud/customer',
        body: customerThree
    })

    const response4 = await app.inject({
        method: 'POST',
        url: '/crud/customer',
        body: customerFour
    })

    console.log(chalk.greenBright("created test data in DB"))
} 

module.exports = {
    customerOne,
    customerTwo,
    customerThree,
    customerFour,
    initDB
}