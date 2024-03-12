const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
    client_name : {
        type: String,
        required : true
    },
    client_pic : {
        type: String,
        required: false,
        trim: true
    },
    client_phone : {
        type: String,
        required : true
    },
    client_city : {
        type: String,
        required : true
    },
    client_email : {
        type: String,
        required : true
    },
    status : {
        type: String,
        default : 'TO_CALL'
    },
    recall_time : {
        type : Date,
        default : Date.now
    },
    acquire_datetime: {
        type : Date,
        default : Date.now
    },
    own_notes : {
        type : String
    },
    feedback : {
        type : String
    },
    listID : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'Lists'
    }
}, { collection: 'entry' });

module.exports = mongoose.model('Entry', EntrySchema);