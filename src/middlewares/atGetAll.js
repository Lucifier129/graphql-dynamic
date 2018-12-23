module.exports = (ctx, next) => {
  ctx.getAll = params => {
    let { url, querys, query, ...rest } = params
    if (!Array.isArray(querys)) {
      throw new Error(`querys is not a array in @getAll`)
    }
    let handleGet = query => ctx.get({ url, query, ...rest })
    let list = querys.map(handleGet)
    return Promise.all(list)
  }

  ctx.directive('getAll', async params => {
    ctx.result = await ctx.getAll(params)
  })

  return next()
}
