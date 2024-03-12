const mongoose = require('mongoose');

const LiveFeedSchema = new mongoose.Schema({
    client_name: {
        type : String,
        required : true,
        trim : true
    },
    email: {
        type: String,
        required: false,
        trim: true
    },
    phone: {
        type: String,
        required: false,
        trim: true
    },
    city: {
        type: String,
        required: false,
        trim: true
    },
    image: {
        type: String,
        required: false,
        trim: true
    },
    client_level: {
        type : String,
        required : true,
        trim : true
    },
    network_id: {
        type : String,
        required : true,
        trim : true
    },
    started_at: {
        type : Date,
        default : Date.now
    },
    last_touch: {
        type : Date,
        default : Date.now
    },
}, { collection: 'livefeed' });


module.exports = mongoose.model('LiveFeed', LiveFeedSchema);