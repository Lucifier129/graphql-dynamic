const URL = require('URL')
const { fromEntries } = require('../util')

module.exports = (ctx, next) => {
	let handleFetch = async params => {
		// handle url
		let url = params.url

		if (!url) {
			ctx.error(`@fetch without url arg is not recommended`)
			return
		}

		if (typeof url === 'object') {
			url = URL.format(url)
		}

		if (typeof url !== 'string') {
      ctx.error(`url arg is not valid in @fetch`)
      return
		}

		// handle options
		let options = params.options || {}
		options.headers = {
			...ctx.headers,
			...fromEntries(options.headers)
		}

		// handle request
		let response = await ctx.fetch(url, options)

		// handle transform
		let type = params.type || 'json'

		if (typeof response[type] !== 'function') {
			ctx.error(`Unsupported type in @fetch: ${type}`)
			return
		}

		// handle result
		let data = await response[type]()
		ctx.result = data
	}

	ctx.directive('fetch', handleFetch, 'pre')
	return next()
}
