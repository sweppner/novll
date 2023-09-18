const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const passport = require("passport");
const story = require("../../FirstBook.json")
const jsonPayload = { msg: null };
const loginCheck = require('../middleware/loginCheck')

router.get('/index', (req, res, next)=>{
  res.send(story)
})





module.exports = router;


