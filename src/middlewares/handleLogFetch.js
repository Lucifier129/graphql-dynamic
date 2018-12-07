module.exports = (ctx, next) => {
  let fetch = ctx.fetch
  ctx.fetch = async (url, options) => {
    let start = Date.now()
    let response = await fetch(url, options)
    let end = Date.now()
    ctx.log({ url, time: end - start })
    return response
  }
  return next()
}
