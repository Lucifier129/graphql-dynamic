const URL = require('url')
const querystring = require('querystring')
const { fromEntries } = require('../util')

module.exports = (ctx, next) => {
	let handleGet = async params => {
		if (typeof ctx.fetch !== 'function') {
			throw new Error(`ctx.fetch is not a function in @get`)
		}

		// handle url
		let url = params.url

		if (!url) {
			ctx.error(`@get without \`url\` is not recommended`)
			return
		}

		if (typeof url === 'object') {
			url = URL.format(url)
		}

		if (typeof url !== 'string') {
			ctx.error(`url is not valid in @get: ${url}`)
			return
		}

		// merge params.query into url
		let urlObj = URL.parse(url)
		urlObj.query = {
			...querystring.parse(urlObj.query),
			...params.query
		}

		url = URL.format(urlObj)

		// handle options
		let options = params.options || {}
		options.headers = {
			...ctx.headers,
			...fromEntries(options.headers)
		}

		// handle request
		let response = await ctx.fetch(url, {
			...options,
			method: 'GET'
		})

		// handle transform
		let type = params.responseType || 'json'
		if (typeof response[type] !== 'function') {
			ctx.error(`Unsupported response type in @get: ${type}`)
			return
		}

		// handle result
		let data = await response[type]()
		ctx.result = data
	}

	ctx.directive('get', handleGet)
	return next()
}
