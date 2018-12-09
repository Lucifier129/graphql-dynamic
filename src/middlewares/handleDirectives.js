const { isThenable } = require('../util')
const isPlainObject = require('is-plain-object')

const handleDirectives = async (ctx, next) => {
  let directiveHandlers = (ctx.directiveHandlers = {})

  ctx.directive = (key, handler) => {
    directiveHandlers[key] = handler
  }

  await next()

  if (ctx.info.directives) {
    await executeDirectives(ctx, ctx.info.directives)
  }
}

const executeDirectives = async (ctx, directives) => {
  let directiveKeys = Object.keys(directives)

  for (let i = 0; i < directiveKeys.length; i++) {
    let key = directiveKeys[i]
    let handler = ctx.directiveHandlers[key]

    if (typeof handler === 'function') {
      let args = resolveArgs(directives[key], ctx)
      let result = handler(args || {}, i, directiveKeys)

      if (isThenable(result)) {
        await result
      }
    } else {
      ctx.error(`Unknow directive @${key}`)
    }
  }
}

const resolveArgs = (args, ctx) => {
  if (!args || !args.use) {
    return args
  }

  let { use, ...rest } = args

  if (typeof use === 'string') {
    use = { code: use }
  }

  if (!isPlainObject(use)) {
    return args
  }

  let { code, context } = use
  let f = ctx.createFunction(code)

  if (isPlainObject(ctx.result)) {
    context = { ...ctx.result, ...rest, ...context }
  } else {
    context = { [ctx.fieldName]: ctx.result, ...rest, ...context }
  }

  return { ...rest, ...f(context) }
}

module.exports = handleDirectives
