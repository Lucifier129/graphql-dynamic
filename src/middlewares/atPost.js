const { createFetch } = require('./atFetch')

module.exports = (ctx, next) => {
	let fetch = createFetch(ctx)
	ctx.directive('post', params => {
		let { url, body, options, ...rest } = params
		options = {
			...options,
			method: 'POST',
			body
		}
		return fetch({ url, options, ...rest })
	})
	return next()
}
