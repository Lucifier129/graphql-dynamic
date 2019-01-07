const isPlainObject = require('is-plain-object')
const { Router } = require('express')
const bodyParser = require('body-parser')
const createLoader = require('./src/createLoaderForServer')
const { renderPlaygroundPage } = require('graphql-playground-html')
const {
  version
} = require('graphql-playground-middleware-express/package.json')

const defaultConfig = {
  logs: true,
  fetchTimeout: 3000,
  variableTimeout: 3000,
  playground: true,
  endpoint: '/graphql'
}

module.exports = config => {
  config = { ...defaultConfig, ...config }

  let router = Router()
  let loader = createLoader(config)
  let load = async ({ query, variables, options, req, res }) => {
    if (typeof query !== 'string') {
      throw new Error('graphql query is not valid')
    }

    // return empty schema for IntrospectionQuery
    if (query.includes('query IntrospectionQuery')) {
      return res.json({
        errors: [
          {
            message: 'graphql-dynamic is schema-less, ignore this error'
          }
        ]
      })
    }

    let context = {
      req: req,
      res: res,
      headers: req.headers,
      ...req.graphqlContext,
      ...options
    }
    let { errors, logs, data } = await loader.load(
      query,
      variables,
      context,
      req.rootValue
    )

    return { errors, logs, data }
  }

  router.loader = loader
  router.load = load

  router.post('/', bodyParser.json(), async (req, res, next) => {
    if (!isPlainObject(req.body)) {
      return next(
        new Error(
          `request body is not valid, it should form as { query, variables, options, ...rest }`
        )
      )
    }
    let { query, variables, options } = req.body

    try {
      let result = await load({ query, variables, options, req, res })

      if (res.finished) return

      let { errors, logs, data } = result

      if (config.logs !== false) {
        res.json({ errors, logs, data })
      } else {
        res.json({ errors, data })
      }
    } catch (error) {
      next(error)
    }
  })

  // attach graphql playground if needed
  if (config.playground !== false) {
    let playgroundOptions = {
      settings: {
        'editor.theme': 'light',
        'request.credentials': 'include',
        'tracing.hideTracingResponse': true,
        ...config.playground
      },
      version: version,
      endpoint: config.endpoint
    }
    router.get('/', (req, res) => {
      let playground = renderPlaygroundPage({
        ...playgroundOptions,
        ...req.graphqlPlaygroundOptions
      })
      res.setHeader('Content-Type', 'text/html')
      res.end(playground)
    })
  }

  return router
}
