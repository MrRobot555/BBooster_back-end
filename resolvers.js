const { PubSub } = require('apollo-server');
const pubsub = new PubSub();

module.exports = {
    Query: {
       getUser: async (_, {email}, { User }) => {
           const userBack = await User.findOne({email}).populate(
           [{
               path: 'user_address',
               model: 'Address'
            },
            {
               path: 'company_seat',
               model: 'BusinessSeat'
            },
            {
               path: 'lists',
               model: 'Lists'
            },
            {
                path: 'lists',
                populate: {
                    path: 'name_list',
                    model: 'Entry'
                }
            }]
           );
           return userBack;
       },

       getAddress: async (_, args, { Address }) => {
           const addressBack = await Address.find({}).populate({
               path: 'userID',
               model: 'User'
           });
           return addressBack;
       }
    },
    Mutation: {

        addAddress: async (_, {country, city, ZIP, street, housenumber, userID}, { Address, User }) => {
           const address = await Address.findOne({ userID });
           if (address) {
               throw new Error('An address is already attached to this user');
           }
           const userExist = await User.findOne({ _id: userID });
           if (!userExist) {
               throw new Error('User is not present in DB.');
           }
           const newAddress = await new Address({
               country,
               city,
               ZIP,
               street,
               housenumber,
               userID: userID
           }).save();

           const insertAddress = await User.findOneAndUpdate(
               { _id : userID },
               { $set: { user_address: newAddress._id }},
               { new: false }
           );

           return newAddress;
        },

        addBusinessSeat: async (_, {country, city, ZIP, street, housenumber, userID}, { BusinessSeat, User }) => {
            const address = await BusinessSeat.findOne({ userID });
            if (address) {
               throw new Error('A business seat is already attached to this user');
            }
            const userExist = await User.findOne({ _id: userID });
           if (!userExist) {
               throw new Error('User is not present in DB.');
           }
           const newBusinessAddress = await new BusinessSeat({
               country,
               city,
               ZIP,
               street,
               housenumber,
               userID: userID
           }).save();

            const insertAddress = await User.findOneAndUpdate(
               { _id : userID },
               { $set: { company_seat: newBusinessAddress._id }},
               { new: false }
           );

           return newBusinessAddress;
        },

        signupUser: async (_, { email, first_name, last_name, password, profile_pic, is_company, tax_number, company_name}, { User }) => {
            const user = await User.findOne({ email });
            if (user) {
                throw new Error('User already exists with this email address');
            }
                const newUser = await new User({
                    email,
                    first_name,
                    last_name,
                    password,
                    profile_pic,
                    is_company,
                    tax_number,
                    company_name
                }).save();
                
                return newUser;                
        },

        addList: async (_, { userID, order_quantity, network_name }, { Lists, User }) => {
            const userExist = await User.findOne({ _id: userID });
            if (!userExist) {
               throw new Error('User is not present in DB.');
            }
            const newList = await new Lists({
                    order_quantity,
                    network_name,
                    userID
            }).save();

            const insertList = await User.findOneAndUpdate(
               { _id : userID },
               { $push: { lists: { $each: [newList], $position: 0 } } },
               { new: true }
           );

            return newList;
        },

        addEntry: async (_, { client_name, client_phone, listID }, { Entry, Lists }) => {
            const listExist = await Lists.findOne({ _id: listID });
            if (!listExist) {
               throw new Error('List is not present in DB.');
            }
            const newEntry = await new Entry({
                    client_name,
                    client_phone,
                    listID
            }).save();

            const insertList = await Lists.findOneAndUpdate(
               { _id : listID },
               { $push: { name_list: { $each: [newEntry], $position: 0 } } },
               { new: true }
           );

            return newEntry;
        }
    },

    Subscription: {
        getUserSub: {
            subscribe: () => pubsub.asyncIterator(['USER_CHANGED']),
        },
  }
}