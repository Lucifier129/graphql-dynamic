const { getValue, isThenable } = require('../util')

// make sure all args in field or directive are resolved
module.exports = async (ctx, next) => {
	let directives = getValue(ctx.info.directives)
	let args = getValue(ctx.args)

	if (isThenable(directives)) {
		ctx.info.directives = await directives
	}

	if (isThenable(args)) {
		ctx.args = await args
	}
	return next()
}
