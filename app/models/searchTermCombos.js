'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schemaOptions = {
	id: false,
	timestamps: {},
	toJSON: 		{virtuals: true},
	toObject: 	{virtuals: true}
};

const searchTermCombosSchema = new Schema({
	author:String,
	book:String,
	conceptThemes:String,
	
}, schemaOptions);

const searchTermCombos = mongoose.model('searchTermCombos', searchTermCombosSchema);
module.exports = searchTermCombos;