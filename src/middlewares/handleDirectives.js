const { isThenable, createContext } = require('../util')

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
      let args = resolveArgs(directives[key], key, ctx)
      let result = handler(args || {}, i, directiveKeys)

      if (isThenable(result)) {
        await result
      }
    } else {
      ctx.error(`Unknow directive @${key}`)
    }
  }
}

const resolveArgs = (args, key, ctx) => {
  if (!args || !args.use) {
    return args
  }

  let { use: code, ...rest } = args

  if (typeof code !== 'string') {
    throw new Error(`\`use\` must be a string in @${key}, instead of ${code}`)
  }

  let f = ctx.createFunction(code, '$value')
  let context = createContext(rest, ctx.result, ctx.fieldName)

  return { ...context, ...f(context, ctx.result) }
}

module.exports = handleDirectives
