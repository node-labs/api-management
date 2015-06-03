let mongoose = require('mongoose')
let bcrypt = require('bcrypt')
let nodeify = require('bluebird-nodeify')

require('songbird')

let apiSchema = mongoose.Schema({
	apiname: {
		type: String,
		required: true
	},
	url: {
		type: String,
		required: true
	},
	endpoint: {
		type: String,
		required: true
	},
	endpointurls: {
		type: String,
		required: false
	},
	enablecaching: {
		type: Boolean,
		required: true
	},
	cacheparams: {
		type: String
	},
	ttl: {
		type: Number
	},
	enabledebug: {
		type: Boolean,
		required: true
	},
	reqparams: {
		type: String
	},
	validators: {
		type: String
	}
})

module.exports = mongoose.model('Api', apiSchema)
