module.exports = (ctx, next) => {
	let handleCreate = params => {
		ctx.result = params.value
	}
	ctx.directive('create', handleCreate, 'pre')
	return next()
}
