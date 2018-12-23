const { createContext } = require('../util')

module.exports = (ctx, next) => {
  let handleFilter = params => {
    if (typeof ctx.createFunction !== 'function') {
      throw new Error(`ctx.createFunction is not a function in @filter`)
    }

    let result = ctx.result

    if (result == null) {
      return
    }

    // if params.if is boolean, it will work like @include
    if (typeof params.if === 'boolean') {
      if (!params.if) {
        ctx.result = undefined
      }
      return
    }

    if (typeof params.if !== 'string') {
      ctx.error(
        `\`if\` in @filter should be a string of expresstion, instead of ${
          params.if
        }`
      )
      return
    }

    let isArray = Array.isArray(result)
    let { if: code, ...rest } = params
    let filter = ctx.createFunction(code, '$value', '$index', '$list', '$parent')

    result = isArray ? result : [result]

    result = result.filter((item, index, list) => {
      let context = {
        ...ctx.rootValue,
        [ctx.fieldName]: item,
        [ctx.info.resultKey]: item,
        ...item,
        ...rest
      }
      return filter(context, item, index, list, ctx.rootValue)
    })

    ctx.result = isArray ? result : result[0]
  }

  ctx.directive('filter', handleFilter)
  return next()
}
