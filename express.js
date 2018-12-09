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

  router.post('/', bodyParser.json(), async (req, res, next) => {
    let { query, variables } = req.body

    // return empty schema for IntrospectionQuery
    if (query.includes('query IntrospectionQuery')) {
      return res.json({
        errors: ['graphql-dynamic is schema-less, ignore this error']
      })
    }

    try {
      let context = {
        ...req.graphqlContext,
        headers: req.headers
      }
      let { errors, logs, data } = await loader.load(
        query,
        variables,
        context,
        req.rootValue
      )

      if (config.logs !== false) {
        res.json({ errors, logs, data })
      } else {
        res.json({ errors, data })
      }
    } catch (error) {
      next(error)
    }
  })

  if (config.playground !== false) {
    let playgroundOptions = {
      settings: {
        'request.credentials': 'include',
        'tracing.hideTracingResponse': true
      },
      ...config,
      version: version,
      endpoint: config.endpoint
    }
    router.get('/', (req, res) => {
      let playground = renderPlaygroundPage(playgroundOptions)
      res.setHeader('Content-Type', 'text/html')
      res.end(playground)
    })
  }

  return router
}
