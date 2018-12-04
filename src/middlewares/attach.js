module.exports = (key, value) => (ctx, next) => {
  if (!ctx.hasOwnProperty(key)) {
    ctx[key] = value
  }
  return next()
}
