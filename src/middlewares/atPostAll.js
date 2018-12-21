const { createPost } = require('./atPost')

const atPostAll = (ctx, next) => {
	ctx.directive('postAll', async params => {
		let postAll = createPostAll(ctx)
		ctx.result = await postAll(params)
	})
	return next()
}

const createPostAll = ctx => params => {
	let { url, bodys, body, ...rest } = params
	if (!Array.isArray(bodys)) {
		throw new Error(`bodys is not a array in @postAll`)
	}
	let get = createPost(ctx)
	let handlePost = body => get({ url, body, ...rest })
	let list = bodys.map(handlePost)
	return Promise.all(list)
}

module.exports = atPostAll
