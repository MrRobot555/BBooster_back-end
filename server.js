const { ApolloServer, PubSub, gql, AuthenticationError } = require('apollo-server');
const { withFilter } = require('apollo-server');
const pubsub = new PubSub();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');


const filePath = path.join(__dirname, 'typeDefs.gql');
const typeDefs = fs.readFileSync(filePath, 'utf-8');
/* const resolvers = require('./resolvers'); */

require('dotenv').config({ path: 'variables.env'});

const User = require('./models/User');
const Address = require('./models/Address');
const BusinessSeat = require('./models/BusinessSeat');
const Lists = require('./models/Lists');
const Entry = require('./models/Entry');
const CardDetails = require('./models/CardDetails');
const LiveFeed = require('./models/LiveFeed');
const Networks = require('./models/Networks');
const Plan = require('./models/Plan');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/* FOR SERVER SIDE MUTATION */

/* const names = require('./names'); */
const myFetch = require('node-fetch');

const { createApolloFetch } = require('apollo-fetch');

const fetch = createApolloFetch({
    uri: 'http://localhost:4000/graphql',
});

var alivenow = false;

var randomUsers = null;

var subUser = null;

myFetch('https://randomuser.me/api/?results=2000')
    .then(res => res.json())
    .then(json => randomUsers = json.results)
    .catch(err => console.error(err));


/* FOR SERVER SIDE MUTATION */


const createToken = (user, secret, expiresIn) => {
    const { email } = user;
    return jwt.sign({ email }, secret, { expiresIn });
}


const allUserData = [{
                        path: 'user_address',
                        model: 'Address'
                        },
                        {
                        path: 'company_seat',
                        model: 'BusinessSeat'
                        },
                        {
                        path: 'card_details',
                        model: 'CardDetails'
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
                        }];

const allLists = [{
                        path: 'name_list',
                        model: 'Entry'
                    }];

mongoose
.connect(process.env.MONGO_URI, { useFindAndModify: false, useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
.then(() => console.log('DB connected'))
.catch(err => console.error(err));


/* RESOLVERS */


const resolvers = {
    Query: {

       getNetworks: async (_, { id }, { Networks }) => {
        const networksList = await Networks.findOne({ _id: id }).populate(
            [   
                {
                    path: 'networks_name',
                    populate: {
                        path: 'plans',
                        model: 'Plan'
                    }
                }
            ]
        );
        return networksList;
       },

       getUser: async (_, {email}, { User }) => {
           const userBack = await User.findOne({email}).populate(allUserData);
           return userBack;
       },

       getPlans: async (_, args, { Plan }) => {
        const plans = await Plan.find({});
        return plans;
    },

       getFeed: async (_, args, { LiveFeed }) => {
        const fetchedFeed = await LiveFeed.find({});
        return fetchedFeed;
       },

       getAddress: async (_, args, { Address }) => {
           const addressBack = await Address.find({}).populate({
               path: 'userID',
               model: 'User'
           });
           return addressBack;
       },

       getCurrentUser: async (_, args, { User, currentUser}) => {
            if (!currentUser) {
                return null;
            }

            const user = await User.findOne({ email: currentUser.email }).populate(allUserData);
            return user;
       }
    },
    Mutation: {
        addNetworkContainer: async (_, {id, name, price, payoff}, { Networks }) => {
            addNetworkRoot = await new Networks({
                networks_name: [{
                    name,
                    id,
                    price,
                    payoff
                }]
            }).save();
        
        return addNetworkRoot;

        },

        addNetwork: async (_, { networksID, name, id, price, payoff, description, image }, { Networks }) => {

        const NewNetwork = {
            name,
            id,
            price,
            payoff,
            description,
            image
        };

        const insertNetwork = await Networks.findOneAndUpdate(
           { _id : networksID },
           { $push: { networks_name: { $each: [NewNetwork], $position: 0 } } },
           { new: true }
        ); 

        return insertNetwork;
        },

        addPlan: async (_, {plan_name, plan_description, plan_price}, {Plan}) => {
            const newPlan = await new Plan({
                plan_name,
                plan_description,
                plan_price,
            }).save();

            return newPlan;
        },

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

            const feedUser = await User.findOne({ _id: userID }).populate(allUserData);
            pubsub.publish('USER_CHANGED', { getUserSub: feedUser });
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

            const feedUser = await User.findOne({ _id: userID }).populate(allUserData);
            pubsub.publish('USER_CHANGED', { getUserSub: feedUser });
           return newBusinessAddress;
        },

        signinUser: async (_, {email, password}, { User }) => {
            const findUser = await User.findOne({ email });
            if (!findUser) {
                throw new Error('User not found.');
            }

            const isValidPassoword = await bcrypt.compare(password, findUser.password);
            if (!isValidPassoword) {
                throw new Error('Invalid password.');
            }

            return { token: createToken(findUser, process.env.SECRET, '10hr') };
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

                const feedUser = await User.findOne({ email: email }).populate(allUserData);
                pubsub.publish('USER_CHANGED', { getUserSub: feedUser });

                return { token: createToken(newUser, process.env.SECRET, '1hr') };              
        },

        addList: async (_, { userID, order_quantity, network_id, plan_id }, { Lists, User, Plan }) => {
            const userExist = await User.findOne({ _id: userID });
            if (!userExist) {
               throw new Error('User is not present in DB.');
            }
            const planExist = await Plan.findOne({ _id: plan_id });
            if (!planExist) {
                throw new Error('Plan is not present in DB.');
             }            
            const newList = await new Lists({
                    order_quantity,
                    network_id,
                    plan_id,
                    userID
            }).save();

            const insertList = await User.findOneAndUpdate(
               { _id : userID },
               { $push: { lists: { $each: [newList], $position: 0 } } },
               { new: true }
           );

            const feedUser = await User.findOne({ _id: userID }).populate(allUserData);
            pubsub.publish('USER_CHANGED', { getUserSub: feedUser });

            return newList;
        },

        addEntry: async (_, { client_name, client_pic, client_city, client_email, client_phone, network_id }, { Entry, Lists }) => {
            const TotalLists = await Lists.find({ network_name: network_id }).populate(
            [{
                        path: 'name_list',
                        model: 'Entry'
            }]
            );

            const selectedList = TotalLists.filter( (oneList => {
                return oneList.name_list.length < oneList.order_quantity;
            })); 

            selectedList.sort(function(a,b){
                return new Date(a.order_date) - new Date(b.order_date);
            });

            console.log(TotalLists);
            console.log('filtered lists: ', selectedList);
            console.log('selected list: ', selectedList[0]);
                      
            const newEntry = await new Entry({
                    client_name,
                    client_pic,
                    client_city,
                    client_email,
                    client_phone,
                    listID: selectedList[0]._id
            }).save();

            const insertList = await Lists.findOneAndUpdate(
               { _id : newEntry.listID },
               { $push: { name_list: { $each: [newEntry], $position: 0 } } },
               { new: true }
           );

            const feedUser = await User.findOne({ _id: insertList.userID }).populate(allUserData);
            pubsub.publish('USER_CHANGED', { getUserSub: feedUser });

            console.log('updated user: ', feedUser);

            return newEntry;
        },

        setEntryStatus: async (_, { entryID, newStatus }, { Entry, Lists }) => {
            const entryExist = await Entry.findOne({ _id: entryID });
            if (!entryExist) {
               throw new Error('Entry is not present in DB.');
            }

            const updateEntryStatus = await Entry.findOneAndUpdate(
               { _id : entryID },
               { $set: { status: newStatus }},
               { new: true }
           );

            const findUser = await Lists.findOne({ _id: updateEntryStatus.listID});

            const feedUser = await User.findOne({ _id: findUser.userID }).populate(allUserData);
            pubsub.publish('USER_CHANGED', { getUserSub: feedUser });

            return updateEntryStatus;
        },

        addCard: async (_, { name_on_card, card_number, expiry, ccv, userID }, { CardDetails, User }) => {
            const userExist = await User.findOne({ _id: userID });
            if (!userExist) {
               throw new Error('User is not found in DB.');
            }
            const newCard = await new CardDetails({
                    name_on_card,
                    card_number,
                    expiry,
                    ccv
            }).save();

            const insertCard = await User.findOneAndUpdate(
                { _id : userID },
                { $set: { card_details: newCard._id }},
                { new: false }
            );

            const feedUser = await User.findOne({ _id: userID }).populate(allUserData);
            pubsub.publish('USER_CHANGED', { getUserSub: feedUser });

            return newCard;
        },
        
        addToLiveFeed: async(_, { client_name, email, phone, city, image, network_id }, { LiveFeed }) => {
            
/*             const userExist = await User.findOne({ _id: userID });
            if (!userExist) {
                throw new Error('User is not found in DB.');
             } */
             const newFeed = await new LiveFeed({
                 client_name,
                 email,
                 phone,
                 city,
                 image,
                 client_level: "0",
                 network_id,
             }).save();

             /* we do not touch User anymore */

/*              const feedLive = await User.findOneAndUpdate(
                { _id : userID },
                { $push: { live_feed: { $each: [newFeed], $position: 0 } } },
                { new: true }
            ); */
            
/*             const feedUser = await User.findOne({ _id: userID }).populate(allUserData);
            pubsub.publish('USER_CHANGED', { getUserSub: feedUser }); */

            const feedSubscription = await LiveFeed.find({});
            pubsub.publish('LIVEFEED_CHANGED', { getLiveFeed: feedSubscription });

            return newFeed;
        },

        lostTouch: async(_, { clientID }, { LiveFeed, User }) => {
            const clientExist = await LiveFeed.findOne({ _id: clientID });
            if (!clientExist) {
                throw new Error('Client is not found in DB.');
             }
             
             const feedLive = await User.findOneAndUpdate(
                { _id : clientExist.userID },
                { $pull: { live_feed: clientID} },
                { new: true }
            );
            
            const deletedClient = await LiveFeed.findOneAndRemove({ _id: clientID });

            const feedUser = await User.findOne({ _id: clientExist.userID }).populate(allUserData);
            pubsub.publish('USER_CHANGED', { getUserSub: feedUser });

            const feedSubscription = await LiveFeed.find({});
            pubsub.publish('LIVEFEED_CHANGED', { getLiveFeed: feedSubscription });            

            return deletedClient;
        },

        changeClientLevel: async(_, { clientID, new_level }, { LiveFeed }) => {
            const clientExist = await LiveFeed.findOne({ _id: clientID });
            if (!clientExist) {
                throw new Error('Client is not found in DB.');
             }
            
             const changeLevel = await LiveFeed.findOneAndUpdate(
                { _id : clientID },
                { $set: { client_level: new_level }},
                { new: true }
            );

            /* we used to change user as well, but LiveFeed does not have a User reference anymore */

/*             const feedUser = await User.findOne({ _id: clientExist.userID }).populate(allUserData);
            pubsub.publish('USER_CHANGED', { getUserSub: feedUser }); */

            const feedSubscription = await LiveFeed.find({});
            pubsub.publish('LIVEFEED_CHANGED', { getLiveFeed: feedSubscription });

            return changeLevel;

        },

    },

  Subscription: {
        getUserSub: {
            subscribe: withFilter(
                () => pubsub.asyncIterator(['USER_CHANGED']),
                (payload, variables) => {
                    console.log((payload.getUserSub.email === subUser));
                    return (payload.getUserSub.email === subUser);
                },
            ),
        },

        getLiveFeed: {
            subscribe: () => pubsub.asyncIterator(['LIVEFEED_CHANGED']),
        },

    }
}


/* END OF RESOLVERS */

/* Token verification */
const getUser = async token => {
    if (token && token !== '') {
        try {
            console.log('authenticating...');
            return await jwt.verify(token, process.env.SECRET);
        } catch(err) {
            console.log('not authenticated');
            throw new AuthenticationError('Your session has ended. Please sign in again.');
        }
    }
    console.log('not authenticated, token is not serverd');
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true,
    context: async ({ req }) => {
        if ( req ) {
            if (req.headers) {
                const token = (req.headers["authorization"]);

                alivenow = true;
                if (req.body) {
                    if (req.body.query) {
/*                         console.log('REQUEST: ', req.body.variables); */

                        if (req.body.query.includes('signinUser')) {
                            return { User };
                        }

                        let currentUser = await getUser(token);
                        if (currentUser) {
                            return { User, Address, BusinessSeat, Lists, Entry, CardDetails, LiveFeed, Networks, Plan, pubsub, endpoint: "/", currentUser };
                        }

                        if (req.body.variables) {
                            if (req.body.variables.jokerToken) {
                                if (req.body.variables.jokerToken === process.env.JOKER_TOKEN) {
                                    return { User, Address, BusinessSeat, Lists, Entry, CardDetails, LiveFeed, Networks, Plan };
                                }
                            }
                        }

                    }
                }
            }
        }
    },
    subscriptions: {
        path: '/subscriptions',
            onConnect: async (connectionParams, webSocket) => {
            console.log('Websocket connected');
            if (Object.keys(connectionParams).length !== 0) { 
                /* if (true) { */
                if (connectionParams.authorization) {
                /* if (true) { */
                    const isAuthorized =  await getUser(connectionParams.authorization);
                    console.log('SUBSCRIPTION USER: ', isAuthorized);
                    /* const isAuthorized = await getUser('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJhcmlzQGRpbGF2ZXIuY29tIiwiaWF0IjoxNjM0MDE4MzEzLCJleHAiOjE2MzQwNTQzMTN9.NQxglgb6RGVrSPdxe3wHojmNwe8kvfnJht4vwrfL9i4'); */
                    if (isAuthorized) {
                       //authorized
                       console.log('subscription authorized');
                       subUser = isAuthorized.email;
                    } else {
                        //false authorization
                        subUser = null;
                        throw new AuthenticationError('False authorization.');
                    }
                } else {
                    subUser = null;
                    throw new AuthenticationError('Authorization not found.');
                }
            } else {
                subUser = null;
                throw new AuthenticationError('Not authorized for subscription.');
            }
        },
            onDisconnect: (webSocket, context) => {
            subUser = null;
            console.log('Websocket disconnected')
        },
  },
});

/* console.log(names); */
var addedIds = [];
addedIds.push({
    id: "6162cabcc8f14457d4855981",
    level: "4"
});

const scheduled = () => {
    console.log('im executed.');
    if (!alivenow || !randomUsers) {
        console.log('execution rejected');
        return null;
    }
    if (theRandomNumber = Math.floor(Math.random() * 8) + 1 === 5) {

        var userIndex = Math.floor(Math.random() * randomUsers.length);

        fetch({
            query: `
            mutation addToLiveFeed($name: String!, $email: String, $phone: String, $city: String, $image: String, $network: String!) {
                addToLiveFeed(userID: "61595d7a567d6639dc50ff13", client_name: $name, email: $email, phone: $phone, city: $city, image: $image, network_id: $network) {
                _id
                client_level
                }
            }
            `,
            variables: { 
                name: randomUsers[userIndex].name.first[0]+'. '+randomUsers[userIndex].name.last,
                email: randomUsers[userIndex].email,
                phone: randomUsers[userIndex].phone,
                city: randomUsers[userIndex].location.city,
                image: randomUsers[userIndex].picture.large,
                network: Math.floor(Math.random() * 4).toString(),
            },
        }).then(res => {
            addedIds.push({
                id: res.data.addToLiveFeed._id, 
                level: res.data.addToLiveFeed.client_level
            });
        }).catch(error => {
            console.log('fetch error: ', error);
        });
    }

    if (theRandomNumber = Math.floor(Math.random() * 5) + 1 === 5) {
  
        var selection = 0;
        do {
            selection = Math.floor(Math.random() * addedIds.length);
          }
        while (Number(addedIds[selection].level) > 3);

        fetch({
            query: `
            mutation changeClientLevel($id: ID!, $level: String!) {
                changeClientLevel(clientID: $id, new_level: $level) {
                _id
                client_name
                client_level
              }
            }
            `,
            variables: { 
                id: addedIds[selection].id,
                level: (Number(addedIds[selection].level)+1).toString(),
            },
        }).then(res => {
            addedIds[selection] = {
                id: res.data.changeClientLevel._id, 
                level: res.data.changeClientLevel.client_level
            };
        }).catch(error => {
            console.log('fetch error: ', error);
        });
    }
};


server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`Server listening on ${url}`);
});

/*     setInterval(() => { 
        scheduled();
    }, 4000); */

