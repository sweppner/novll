'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schemaOptions = {
	id: false,
	timestamps: {},
	toJSON: 		{virtuals: true},
	toObject: 	{virtuals: true}
};

const ideaHistorySchema = new Schema({
	searchTermCombo: { type: Schema.Types.ObjectId, ref: 'searchTermCombos'},
  bookIdeas:Array
	
}, schemaOptions);

const ideaHistory = mongoose.model('ideaHistory', ideaHistorySchema);
module.exports = ideaHistory;


