const isPlainObject = require('is-plain-object')

module.exports = (ctx, next) => {
	let handleMap = params => {
		if (typeof ctx.runInContext !== 'function') {
			throw new Error(`ctx.runInContext is not a function in @map`)
		}

		let result = ctx.result

		if (result == null) {
			return
		}

		if (typeof params.to !== 'string') {
			ctx.error(
				`\`to\` in @map should be a string of expresstion, instead of ${
					params.to
				}`
			)
			return
		}

		let isArray = Array.isArray(result)
		let code = params.to

		result = isArray ? result : [result]

		result = result.map(item => {
			let sandbox
			if (isPlainObject(item)) {
				sandbox = { ...item, ...params.context }
			} else {
				sandbox = { [ctx.fieldName]: item, ...params.context }
			}
			return ctx.runInContext(`(${code})`, sandbox)
		})

		ctx.result = isArray ? result : result[0]
	}

	ctx.directive('map', handleMap)
	return next()
}
