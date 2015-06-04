require('songbird')

module.exports = class secured {
	constructor(config) {
		this.config = config
	}


	async validate(req) {
		console.log('INSIDE VALIDATE - secured')
		return true
	}
}
