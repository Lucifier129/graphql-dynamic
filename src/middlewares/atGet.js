const URL = require('url')
const querystring = require('querystring')
const { createFetch } = require('./atFetch')

module.exports = (ctx, next) => {
	let fetch = createFetch(ctx)
	ctx.directive('get', params => {
		let { url, query, options, ...rest } = params
		let urlObj

		if (typeof url === 'object') {
			urlObj = url
		} else if (typeof url == 'string') {
			urlObj = URL.parse(url)
		}

		if (urlObj) {
			// merge params.query into url
			urlObj.query = {
				...querystring.parse(urlObj.query),
				...query
			}
			url = URL.format(urlObj)
		}

		options = {
			...options,
			method: 'GET'
		}

		return fetch({ url, options, ...rest })
	})
	return next()
}
