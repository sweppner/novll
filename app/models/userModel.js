'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const adminLevel = ['ban', 'user', 'critic', 'blogger', 'contributor', 'editor', 'admin'];
const schemaOptions = {
	id: false,
	timestamps: {},
	toJSON: 		{virtuals: true},
	toObject: 	{virtuals: true}
};


const userSchema = new Schema({
	native: {
		email: 		String,
    password: String
  },
  facebook: {
  	email: String,
    id: 	 String,
    token: String
  },
  resetPasswordToken: 	String,
	resetPasswordExpires: Date,
	displayName: 					String,
	firstName: 						String,
	lastName: 						String,
	dob: 				    			Date,
	biography: 						String,
	
	
	
	
	photo: 								{ type: String},
	
  
	lastLogin:            { type: Date, default: Date.now },
	
}, schemaOptions);

// for review populate
// userSchema.index({_id:1, displayName: 1, photo: 1});


// Virtuals
userSchema.virtual('thumbnail').get(function(){
   if (this.photo){
		let path = this.photo.split('.');
		let ext = path.pop();
		path = path.join('.').replace('_', '');
		return `${path}_thumb.${ext}`;
	};
});
userSchema.methods={
	comparePassword:function (pw, userPassword) {
  	return bcrypt.compareSync(pw, userPassword)
	},
	generateHash: function(password) {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
	},
}

const User = mongoose.model('user', userSchema);
module.exports = User;


