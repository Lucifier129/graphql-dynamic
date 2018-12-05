const URL = require('url')
const { fromEntries } = require('../util')

module.exports = (ctx, next) => {
	let handleFetch = async params => {
		if (typeof ctx.fetch !== 'function') {
			throw new Error(`ctx.fetch is not a function in @fetch`)
		}

		// handle url
		let url = params.url

		if (!url) {
			ctx.error(`@fetch without \`url\` is not recommended`)
			return
		}

		if (typeof url === 'object') {
			url = URL.format(url)
		}

		if (typeof url !== 'string') {
			ctx.error(`\`url\` is not valid in @fetch ${url}`)
			return
		}

		// handle options
		let options = params.options || {}
		options.headers = {
			...ctx.headers,
			...fromEntries(options.headers)
		}

		let bodyType = params.bodyType || 'json'

		if (bodyType === 'json') {
			options.body = JSON.stringify(options.body)
		} else if (bodyType === 'text') {
			options.body = options.body + ''
		}

		// handle request
		let response = await ctx.fetch(url, options)

		// handle transform
		let type = params.responseType || 'json'

		if (typeof response[type] !== 'function') {
			ctx.error(`Unsupported response type in @fetch: ${type}`)
			return
		}

		// handle result
		let data = await response[type]()
		ctx.result = data
	}

	ctx.directive('fetch', handleFetch)
	return next()
}
