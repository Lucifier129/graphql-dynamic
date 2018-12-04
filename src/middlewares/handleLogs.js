module.exports = (ctx, next) => {
  ctx.log = message => {
    ctx.logs.push({
      field: ctx.fieldName,
      message
    })
  }
  return next()
}
