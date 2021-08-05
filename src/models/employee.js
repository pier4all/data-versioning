// imports
const mongoose = require('mongoose')
const versioning = require('../versioning/versioning')
mongoose.Promise = require('bluebird')

const NAME = "employee"

// schema definition
let Schema = mongoose.Schema

let employeeSchema = new Schema({
    supervisor: {type: mongoose.Schema.Types.ObjectId, ref: "Employee"},
    projects: [
        {
        projectID: {type: mongoose.Schema.Types.ObjectId, ref: "Project"},
        projectStart: {type: Date},
        projectEnd: {type: Date},
        projectActive: {type: Boolean}
        } 
    ],
    pricePerWorkingUnit: {type: Number},
    validFrom: [{type: Date}],
    validUntil: [{type: Date}],
    active: {type: Boolean, default: true},
    user: {
        role: {type: mongoose.Schema.Types.ObjectId, ref: "Role", required:true},
        username: {type: String, required: true},
        active: {type: Boolean, default: true} },
    person: {
        firstName: {type: String, required: true, index: true},
        lastName: {type: String, required: true, index: true},
        dateOfBirth: {type: Date, required: true},
        AHVnumber: {type: String, required: true},
        phoneNumber: {type: String, required: true},
        phoneNumberPrefix: {type: String, required: true},
        personalEmail: {type: String, required: true},
        workEmail: {type: String},
        usedHolidays: {type: Number},
        totalHolidays: {type: Number},
        salaryFulltime: {type: Number, required: true},
        levelOfEmployment: {type: Number, required: true},
        address: {
            street: {type: String, required: true},
            PLZ: {type: String, required: true},
            canton: {type: String, required: true},
            country: {type: String, required: true},
        },
        bank: {
            bankName: {type: String, required: true},
            bankAdress: {type: String, required: true},
            bankPLZ: {type: String, required: true},
            SWIFT: {type: String, required: true},
            IBAN: {type: String, required: true},
            currency: {
                type: String,
                enum: ["CHF", "EUR", "USD"],
                default: "CHF"}   
        },
        children: [{
            _id: false,
            name: {type: String},
            dateOfBirth: {type: Date, required: true},
        }],
        holidays: [{
            holidayFrom: {type: Date, required: true},
            holidayUntil: {type: Date, required: true},
            holidayApproved: {type: Boolean, required: true},
    
        }],
        skills: [{
            _id: false,
            skillName: {type: String, required: true},
            skillDescription: {type: String, required: true},
            skillCertificate: {
                file: {type: Buffer},
                filename: {type: String},
                mimetype: {type: String}
            },
            skillGroup: {type: String},
            skillTags: [{type: String, index: true }]
        }],
        training: [{
            _id: false,
            trainingName: {type: String, required: true},
            trainingApproved: {type: Boolean, required: true},
            trainingCost: {type: Number, required: true},
            trainingDateRequest: {type: Date, required: true},
            trainingDateFrom: {type: Date, required: true},
            trainingDateUntil: {type: Date, required: true},
            trainingAttachments: [{
                file: {type: Buffer},
                filename: {type: String},
                mimetype: {type: String}
            }],
            trainingCertificates: [{
                file: {type: Buffer},
                filename: {type: String},
                mimetype: {type: String}
            }],
            trainingProviders: [{
                _id: false,
                providerName: {type: String, required: true},
                providerAddress: {type: String, required: true},
                providerPLZ: {type: String, required: true},
                providerCity: {type: String, required: true},
                providerCountry: {type: String, required: true},
            }]
        }]
    }
})

// TODO set indexes manually after adding option { autoIndex: false }
employeeSchema.plugin(versioning, {collection: NAME + "s.versioning", mongoose})

module.exports = mongoose.model(NAME, employeeSchema)
