const { getMessage } = require('../util')

module.exports = (ctx, next) => {
	ctx.error = error => {
		ctx.errors.push(
			`Error in field [[ ${ctx.fieldName} ]]: ${getMessage(error, ctx.dev)}`
		)
	}
	return next()
}
