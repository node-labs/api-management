let mongoose = require('mongoose')
let nodeify = require('bluebird-nodeify')

require('songbird')

let cacheSchema = mongoose.Schema({
	key: {
		type: String,
		required: true
	},
	value: {
		type: Object,
		required: true
	},
	cachedTS: {
		type: Date,
		required: true
	}
})

module.exports = mongoose.model('Cache', cacheSchema)
