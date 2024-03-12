const mongoose = require('mongoose');
const md5 = require('md5');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    email: {
        type : String,
        required : true,
        unique : true,
        trim : true
    },
    first_name: {
        type : String,
        required : true,
        trim : true
    },
    last_name: {
        type : String,
        required : true,
        trim : true
    },
    password: {
        type : String,
        required : true,
        trim : true
    },
    profile_pic: {
        type : String
    },
    join_datetime: {
        type : Date,
        default : Date.now
    },
    user_address: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Address'
    },
    is_company: {
        type : Boolean,
        required : true
    },
    tax_number: {
        type : String,
        trim : true
    },
    company_name: {
        type : String,
        trim : true,
    },
    company_seat: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'BusinessSeat'
    },
    card_details: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'CardDetails'
    },
    lists : {
        type : [mongoose.Schema.Types.ObjectId],
        ref : 'Lists'
    },
    live_feed : {
        type : [mongoose.Schema.Types.ObjectId],
        ref : 'LiveFeed'
    }
}, { collection: 'user' });

/* UserSchema.pre('save', function(next) {
    this.avatar = `http://gravatar.com/avatar/${md5(this.email)}?d=identicon`;
    next();
}); */

UserSchema.pre('save', function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);

        bcrypt.hash(this.password, salt, (err, hash) => {
            if (err) return next(err);

            this.password = hash;
            next();
        });
    });
});


module.exports = mongoose.model('User', UserSchema);