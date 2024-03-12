const mongoose = require('mongoose');

const BusinessSeatSchema = new mongoose.Schema({
        country: {
            type : String,
            required : true,
            trim : true
        },
        city: {
            type : String,
            required : true,
            trim : true
        },
        ZIP: {
            type : String,
            required : true,
            trim : true
        },
        street: {
            type : String,
            required : true,
            trim : true
        },
        housenumber: {
            type : String,
            required : true,
            trim : true
        },
        userID: {
            type : mongoose.Schema.Types.ObjectId,
            required : true,
            ref : 'User'
        }
}, { collection: 'businessseat' });

module.exports = mongoose.model('BusinessSeat', BusinessSeatSchema);