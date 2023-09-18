const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const loginCheck = require('../middleware/loginCheck');
const passport = require("passport");

const jsonPayload = { msg: null };

router.post('/register', (req, res, next)=>{
  passport.authenticate("local-signup", (err, user, info) => {
    //error
    if (err) {
      console.log(err);
      res.status(400).json(err);
    }
    //load messages from passport
    if (info) {
      jsonPayload.msg = info.message;
    }
    //authentication failed
    if (!user) {
      res.status(401).json(jsonPayload);
    }
    //authentication successful
    if (user) {
      jsonPayload.displayName = user.displayName;
      jsonPayload.email = user.email;
      jsonPayload.uuid = user.uuid;
      req.logIn(user, function (err) {
        if (err) {
          console.log('err',err);
          res.send(err);
        }
        return res.status(200).json(jsonPayload);
      });
    }
  })(req, res, next);
})

router.post('/login', (req, res, next)=>{
  passport.authenticate("local-signin", (err, user, info) => {
    //error
    if (err) {
      console.log(err);
      res.status(400).json(err);
    }
    //load messages from passport
    if (info) {
      jsonPayload.msg = info.message;
    }
    //authentication failed
    if (!user) {
      res.status(400).json(jsonPayload);
    }
    //authentication successful
    if (user) {
      jsonPayload.displayName = user.displayName;
      jsonPayload.email = user.email;
      jsonPayload.uuid = user.uuid;
      req.logIn(user, function (err) {
        if (err) {
          console.log(err);
          res.send(err);
        }
        return res.status(200).json(jsonPayload);
      });
    }
  })(req, res, next);
})




module.exports = router;


