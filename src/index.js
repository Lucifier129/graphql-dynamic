const { graphql } = require('graphql-anywhere/lib/async')
const gql = require('graphql-tag')
const compose = require('koa-compose')
const fetch = require('isomorphic-fetch')
const { getValue, isThenable } = require('./util')
const directives = require('./directives')
const createVariables = require('./createVariables')

const resolveDynamicArgs = async (ctx, next) => {
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

const pushError = (ctx, errors, error) => {
  if (error instanceof Error) {
    let message = ctx.dev ? error.stack : error.message
    error.push(message)
  } else {
    errors.push(error)
  }
}

const addBaseUtils = (ctx, next) => {
  ctx.fetch = fetch
  ctx.error = error => {
    ctx.errors.push(`Error in field [${ctx.fieldName}]\n${error}`)
  }
  return next()
}

const builtInMiddlewares = [resolveDynamicArgs, addBaseUtils, ...directives]

const create = (...middlewares) => {
  let resolve = compose([...builtInMiddlewares, ...middlewares])
  let resolver = async (fieldName, rootValue, args, context, info) => {
    let result = rootValue ? rootValue[fieldName] : null
    context = {
      ...context,
      fieldName,
      rootValue,
      result,
      args,
      info
    }
    try {
      await resolve(context)
      return context.result
    } catch (error) {
      context.errors.push(`Error in field [${fieldName}] \n${error.stack}`)
      return null
    }
  }
  return async (query, variables, context, rootValue) => {
    let errors = []

    variables = createVariables(variables)

    context = {
      errors,
      variables,
      ...context
    }

    let data = await graphql(resolver, query, rootValue, context, variables)

    return { errors, data }
  }
}

const load = create()

const test = async () => {
  const result = await load(gql`
    {
      data @create(value: { a: 1, b: 2 }) {
        a @map(to: "a + 10")
        b @variable
      }
      test @create(value: $b)
    }
  `)
  console.log('result', result)
}

test()

module.exports = { create }

gql`
  {
    object(value: { a: 123, b: $test, c: 522 })
    provide(value: 123) @variable(name: "provide") @val
    a(value: $testA)
      @get(
        url: "/12446/getUserInfo"
        query: { a: 1, b: 2, c: 3 }
        options: { headers: [["Content-Type", "application/json"]] }
      )
      @drop(if: true)
    b(value: $provide)
      @post(url: "/12446/getUserInfo", body: { a: 1, b: 2, c: 3 })
      @do(filter: "b === 1")
      @filter(if: "xxx = 1")
      @map(to: "x * 2")
      @create(value: { a: 1, b: 2, c: 3 })
  }
`
