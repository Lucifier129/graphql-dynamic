const { createGet } = require('./atGet')

const atGetAll = (ctx, next) => {
	ctx.directive('getAll', async params => {
		let getAll = createGetAll(ctx)
		ctx.result = await getAll(params)
	})
	return next()
}

const createGetAll = ctx => params => {
	let { url, querys, query, ...rest } = params
	if (!Array.isArray(querys)) {
		throw new Error(`querys is not a array in @getAll`)
	}
	let get = createGet(ctx)
	let handleGet = query => get({ url, query, ...rest })
	let list = querys.map(handleGet)
	return Promise.all(list)
}

module.exports = atGetAll
