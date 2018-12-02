const { graphql } = require('graphql-anywhere/lib/async')
const gql = require('graphql-tag')
const fetch = require('node-fetch')
const compose = require('koa-compose')
const { getValue, isThenable, deferred } = require('./util')

const check = async (ctx, next) => {
  let directives = getValue(ctx.info.directives)
  let args = getValue(ctx.args)

  if (isThenable(directives)) {
    ctx.info.directives = await directives
  }

  if (isThenable(args)) {
    ctx.args = await args
  }
  return next()
}

const create = config => {
  return (query, variables) => {
    let deferredMap = {}
    let variablesProxy = new Proxy(variables, {
      get(target, key) {
        if (key in target) {
          return target[key]
        }
        if (!deferredMap.hasOwnProperty(key)) {
          resolveMap[key] = deferred()
        }
        return deferredMap[key].promise
      }
    })
    let errors = []
    let resolve = compose(
      check,
      ...config.middlewares
    )
    let resolver = async (fieldName, rootValue, args, context, info) => {
      let context = {
        fieldName,
        rootValue,
        args,
        context,
        info,
        errors,
        result: null
      }
      await resolve(context)
      return context.result
    }
    return graphql(resolver, query, null, null, variablesProxy)
  }
}

const resolver = async (fieldName, rootValue, args, context, info) => {
  console.log('info', info)
  return await args.value
}

const q1 = gql`
  {
    object(value: { a: 123, b: $test, c: 522 })
    provide(value: 123) @variable(name: "provide") @val
    a(value: $testA)
      @get(
        url: "/12446/getUserInfo"
        query: { a: 1, b: 2, c: 3 }
        options: {
          headers: [{ key: "Content-Type", value: "application/json" }]
        }
      )
      @drop(if: true)
    b(value: $provide)
      @post(url: "/12446/getUserInfo", body: { a: 1, b: 2, c: 3 })
  }
`

const proxy = new Proxy(
  {},
  {
    get(target, key) {
      return Promise.resolve(key)
    }
  }
)

const test = async () => {
  // Filter the data!
  const result = await graphql(resolver, q1, null, null, proxy)

  console.log('result', result)
}

test()

module.exports = { create }
