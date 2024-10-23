import session from 'express-session'
import { default as connectMongoDBSession } from 'connect-mongodb-session';
import { DB_URL } from './dbController.js';


const MongoDBStore = connectMongoDBSession(session);
const sessionStore = new MongoDBStore({
  uri: DB_URL,
  collection: 'Sessions',
});

sessionStore.on('error', (error) => {
    console.log('Session store error:', error);
});

// const appSession = session({
//     secret: process.env.SESSION_KEY,
//     resave: false,
//     saveUninitialized: false,
//     store: sessionStore,
// })

const appSession = session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
      path: '/',               
      httpOnly: false,          
      // secure: false, 
       sameSite: 'none',           
      // domain: '192.168.0.170', 
      maxAge: 24 * 60 * 60 * 1000,
  },
});

export default appSession
