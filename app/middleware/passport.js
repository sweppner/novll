const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const LineStrategy = require("passport-line").Strategy;

const bcrypt = require("bcryptjs");
const uuid = require("uuid");

const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

//Load user model
const User = require("../models/userModel");

//Set up Localstrategy(Takes in username, password and CBF/done)
//Find the user by username(Takes in err and authenticatedUser) and throw err if err, return null if no err, return false if no user found or password not matched.
passport.use(
  "local-signin",
  new LocalStrategy(
    {
      //username and password fields have to match the frontEnd
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        let user = await User.findOne({ email });
        //if email does not exist in database
        if (!user) {
          return done(null, false, {
            message: "user not registered",
          });
        }
        //if email exists in database, we check password match
        const isMatch = await bcrypt.compare(password, user.password);
        return isMatch
          ? done(null, user, { message: "user logged in" })
          : done(null, false, { message: "incorrect password" });
      } catch (err) {
        return done(err, false, { message: "there was an error" });
      }
    }
  )
);

passport.use(
  "local-signup",
  new LocalStrategy(
    {
      //username and password fields have to match the frontEnd
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true,
    },

    async (req, email, password, done) => {
      try {
        //first validate the inputs
        if (!req.body.displayName || !email || !password)
          return done(null, false, { message: "missing fields" });

        //then look for email in database, return if user already exists
        let user = await User.findOne({ email });
        if (user) return done(null, false, { message: "user exists" });

        //hash password and register the user to database
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = User({
          displayName: req.body.displayName,
          email: email,
          password: hashedPassword,
          uuid: uuid.v4(),
        });
        user = await User.create(newUser);
        return done(null, user, {
          message: "user registered successfully",
        });
      } catch (err) {
        return done(err, false, { message: "there was an error" });
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/oauth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        //this is reuseable code. To do: should define a static method in the user schema and call it.
        let user = await User.findOne({
          $or: [{ googleID: profile.id }, { email: profile.email }],
        });
        //if user exists, return user
        if (user) return done(null, user, { message: "user logged in" });
        //define newUser
        const newUser = {
          googleId: profile.id,
          googleToken: accessToken,
          email: profile.email,
          displayName: profile.displayName,
          uuid: uuid.v4(),
        };
        //create newUser
        user = await User.create(newUser);
        return done(null, user, { message: "user registered successfully" });
      } catch (err) {
        return done(err, false, { message: "there was an error" });
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "/api/oauth/facebook/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        //this is reuseable code. To do: should define a static method in the user schema and call it.
        let user = await User.findOne({
          $or: [{ facebookID: profile.id }, { email: profile.email }],
        });
        //if user exists, return user
        if (user) return done(null, user, { message: "user logged in" });
        //define newUser
        const newUser = {
          facebookId: profile.id,
          facebookToken: accessToken,
          email: profile.email,
          displayName: profile.displayName,
          uuid: uuid.v4(),
        };
        //create newUser
        user = await User.create(newUser);
        return done(null, user, { message: "user registered successfully" });
      } catch (err) {
        return done(err, false, { message: "there was an error" });
      }
    }
  )
);

passport.use(
  new LineStrategy(
    {
      channelID: process.env.LINE_CHANNEL_ID,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
      callbackURL: "/api/oauth/line/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        //this is reuseable code. To do: should define a static method in the user schema and call it.
        let user = await User.findOne({
          $or: [{ lineId: profile.id }, { email: profile.email }],
        });
        //if user exists, return user
        if (user) return done(null, user, { message: "user logged in" });
        //define newUser
        const newUser = {
          lineId: profile.id,
          lineToken: accessToken,
          displayName: profile.displayName,
          uuid: uuid.v4(),
        };
        //create newUser
        user = await User.create(newUser);
        return done(null, user, { message: "user registered successfully" });
      } catch (err) {
        return done(err, false, { message: "error" });
      }
    }
  )
);

//Serialize i.e, store the authenticatedUser in session.
//During "serializeUser", the PassportJS library adds the authenticated user to end of the "req.session.passport" object.
//example: req.session.passport.{id: 123, name: Al}
passport.serializeUser((user, done) => {
  done(null, user.id);
});

//Deserialize takes the data stored at the end of the req.session.passport and attaches it to req.user
//example: req.user.{id: 123, name: Al}
//"req.user" will now contain the authenticated user object for that session, to be used in any of the routes.
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    if (err) return done(err);
    done(null, user);
  });
});
