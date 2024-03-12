const mongoose = require('mongoose');

const NetworksSchema = new mongoose.Schema({
    networks_name: {
        type : [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true
                },
                id: {
                    type: String,
                    required: true,
                    trim: true
                },
                price: {
                    type: String,
                    required: true,
                },
                payoff: {
                    type: String,
                    required: true,
                },
                description: {
                    type: String,
                    required: true
                },
                image: {
                    type: String,
                    required: true,
                    trim: true
                },
                plans : {
                    type : [mongoose.Schema.Types.ObjectId],
                    ref : 'Plan'
                },
            }
        ],
    }
}, { collection: 'networks' });


module.exports = mongoose.model('Networks', NetworksSchema);