module.exports = (ctx, next) => {
	let handleVariable = params => {
		let name = params.name || ctx.info.resultKey
		ctx.variables[name] = ctx.result
	}

	ctx.directive('variable', handleVariable, 'post')
	return next()
}
