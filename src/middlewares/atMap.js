const isPlainObject = require('is-plain-object')

module.exports = (ctx, next) => {
	let handleMap = params => {
		if (typeof ctx.createFunction !== 'function') {
			throw new Error(`ctx.createFunction is not a function in @map`)
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
		let map = ctx.createFunction(code, '$item', '$index', '$list')

		result = isArray ? result : [result]

		result = result.map((item, index, list) => {
			let context
			if (isPlainObject(item)) {
				context = { ...item, ...params.context }
			} else {
				context = { [ctx.fieldName]: item, ...params.context }
			}
			return map(context, item, index, list)
		})

		ctx.result = isArray ? result : result[0]
	}

	ctx.directive('map', handleMap)
	return next()
}
