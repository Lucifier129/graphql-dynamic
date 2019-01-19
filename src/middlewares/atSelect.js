const { selectValueByKey } = require('../util')

module.exports = (ctx, next) => {
  let handleSelect = params => {
    let rootValue = !params.root ? ctx.result : ctx.rootValue
    let key = params.key || ctx.fieldName

    if (Array.isArray(rootValue)) {
      ctx.result = rootValue.map(item => selectValueByKey(item, key))
    } else {
      ctx.result = selectValueByKey(rootValue, key)
    }
  }
  ctx.directive('select', handleSelect)
  return next()
}
