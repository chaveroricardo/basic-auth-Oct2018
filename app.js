require('dotenv').config();

const bodyParser    = require('body-parser');
const cookieParser  = require('cookie-parser');
const express       = require('express');
const favicon       = require('serve-favicon');
const hbs           = require('hbs');
const mongoose      = require('mongoose');
const logger        = require('morgan');
const path          = require('path');
const session       = require('express-session');
const session = require("express-session");
const MongoStore    = require('connect-mongo')(session);
const bcrypt        = require('bcrypt');
const passport      = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const User          = require('./models/user');
const flash         = require("connect-flash");


mongoose
  .connect(
    process.env.MONGODB, 
    {useNewUrlParser: true})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  session({
  secret: "our-passport-local-strategy-app",
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({mongooseConnection: mongoose.connection})
})
);


passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

passport.use(new LocalStrategy((username, password, next) => {
  User.findOne({ username }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, { message: "Incorrect username" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, { message: "Incorrect password" });
    }

    return next(null, user);
  })
}))

// passport.use(new SlackStrategy({
//   clientID: "8932073120.527979211191",
//   clientSecret: "8a20fa2984d5311c80fb10f014d1c2b0"
// }, (accessToken, refreshToken, profile, done) => {
//   User.findOne({slackID: profile.id})
//   .then(user=>{
//     if(err)
//     return done(err)
//     if(user){
//       return donw(null, user)
//     }
//     const newUser = new User({
//       slackID: profile.id
//     })

//     newUser.save()
//     .then(user=>{
//       done(null, profile);
//     })
//   })
 
// }
// ));

app.use(flash())
app.use(passport.initialize());
app.use(passport.session());

// Express View engine setup

app.use(require('node-sass-middleware')({
  src:  path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// app.use(session({
//   secret: "basic-auth-secret",
//   cookie: { maxAge: 60000 },
//   store: new MongoStore({
//     mongooseConnection: mongoose.connection,
//     ttl: 24*60*60
//   })
// }));


// default value for title local
app.locals.title = 'Express - Generated with IronGenerator';


const auth = require('./routes/auth');
//const index = require('./routes/index');
const siteRoutes = require('./routes/site-routes')
//app.use('/', index);
app.use('/', auth);
app.use('/', siteRoutes)

const authRoutes = require('./routes/auth-routes')
app.use('/', authRoutes);

console.log("hola");

module.exports = app;