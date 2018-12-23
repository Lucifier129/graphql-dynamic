module.exports = (ctx, next) => {
  ctx.postAll = params => {
    let { url, bodys, body, ...rest } = params
    if (!Array.isArray(bodys)) {
      throw new Error(`bodys is not a array in @postAll`)
    }
    let handlePost = body => ctx.post({ url, body, ...rest })
    let list = bodys.map(handlePost)
    return Promise.all(list)
  }

  ctx.directive('postAll', async params => {
    ctx.result = await ctx.postAll(params)
  })

  return next()
}
