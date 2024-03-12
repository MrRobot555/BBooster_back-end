const mongoose = require('mongoose');
const md5 = require('md5');
const bcrypt = require('bcrypt');

const CardDetailsSchema = new mongoose.Schema({
    name_on_card: {
        type : String,
        required : true,
        trim : true
    },
    card_number: {
        type : String,
        required : true,
        trim : true
    },
    expiry: {
        type : String,
        required : true,
        trim : true
    },
    ccv: {
        type : String,
        required : true,
        trim : true
    },
    userID: {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    }
}, { collection: 'carddetails' });


module.exports = mongoose.model('CardDetails', CardDetailsSchema);