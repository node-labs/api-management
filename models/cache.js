let mongoose = require('mongoose')

require('songbird')
let Cache

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

cacheSchema.statics.getEntry = async function(key, ttl) {
	console.log(key, ttl)
	let ttlms = ttl * 60 * 1000
    let date = new Date()
    console.log('current time:' + date)
    date.setTime(date.getTime() - ttlms)
	let entry = Cache.find({key: key}).where('cachedTS').gte(date).exec()
	//remove the expired entries
	Cache.find({key: key}).where('cachedTS').lte(date).remove().exec()
	return await entry
}

module.exports = Cache = mongoose.model('Cache', cacheSchema)
