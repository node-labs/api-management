require('songbird')
var url = require('url');


module.exports = class ReqParamsValidator {
	constructor(config) {
		this.config = config
	}


	async validate(req) {
		console.log('INSIDE VALIDATE - reqparamsvalidator')
		var reqparamsarray = req.mandatoryparams.split(',')
		reqparamsarray = reqparamsarray.filter(Boolean)
		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;
		for(let counter = 0; counter<reqparamsarray.length; counter++){
			if(!query[reqparamsarray[counter]]){
				console.log('Param '+reqparamsarray[counter]+' not found in request. Invalid request.')
				req.validatorerror = 'Required parameters missing'
				return false
			}
		}
		return true
	}
}
