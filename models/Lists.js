const mongoose = require('mongoose');

const ListsSchema = new mongoose.Schema({
    userID: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    name_list : {
        type : [mongoose.Schema.Types.ObjectId],
        ref : 'Entry'
    },
    order_date : {
        type : Date,
        default : Date.now
    },
    order_quantity : {
        type : Number,
        required : true
    },
    network_id : {
        type : String,
        trim : true,
        required : true
    },
    plan_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Plan',
        required : true
    }
}, { collection: 'lists' });

module.exports = mongoose.model('Lists', ListsSchema);