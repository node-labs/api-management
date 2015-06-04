require('songbird')

module.exports = class basic {
	constructor(config) {
		this.config = config
	}


	async validate(req) {
		console.log('INSIDE VALIDATE - basic')
		return true
	}
}
