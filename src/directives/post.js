const URL = require('URL')
const querystring = require('querystring')
const { fromEntries } = require('../util')

module.exports = (ctx, next) => {
	let handlePost = async params => {
		// handle url
		let url = params.url

		if (!url) {
			ctx.error(`@post without url arg is not recommended`)
			return
		}

		if (typeof url === 'object') {
			url = URL.format(url)
		}

		if (typeof url !== 'string') {
      ctx.error(`url arg is not valid in @post`)
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

		let body = params.body
		let bodyType = params.bodyType || 'json'

		if (bodyType === 'json') {
			body = JSON.stringify(body)
		}

		// handle request
		let response = await ctx.fetch(url, {
			...options,
			method: 'POST',
			body
		})

		// handle transform
		let type = params.type || 'json'
		if (typeof response[type] !== 'function') {
			ctx.error(`Unsupported type in @post: ${type}`)
			return
		}

		// handle result
		let data = await response[type]()
		ctx.result = data
	}

	ctx.directive('post', handlePost, 'pre')
	return next()
}
