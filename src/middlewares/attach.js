module.exports = (key, value) => (ctx, next) => {
	ctx[key] = value
	return next()
}
