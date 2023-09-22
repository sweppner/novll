'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schemaOptions = {
	id: false,
	timestamps: {},
	toJSON: 		{virtuals: true},
	toObject: 	{virtuals: true}
};

const booksSchema = new Schema({
  chapters:Number,
  title:String,
  content:String,
}, schemaOptions);

const Books = mongoose.model('books', booksSchema);
module.exports = Books;


