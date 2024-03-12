const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
    plan_name : {
        type: String,
        required : true
    },
    plan_description : {
        type: String,
        required: false,
        trim: true
    },
    plan_price : {
        type: String,
        required : true
    }
}, { collection: 'plan' });

module.exports = mongoose.model('Plan', PlanSchema);