const express = require('express')
const bodyParser = require('body-parser')
const createLoader = require('./src/createLoaderForServer')
const expressPlayground = require('graphql-playground-middleware-express')
  .default

const PORT = 2333

const app = express()
const loader = createLoader()

app.post('/map-post', bodyParser.json(), async (req, res, next) => {
  try {
    res.json({
      url: req.url,
      options: { method: req.method, body: req.body, headers: req.headers }
    })
  } catch (error) {
    next(error)
  }
})

app.get('/graphql', expressPlayground({ endpoint: '/graphql' }))
app.post('/graphql', bodyParser.json(), async (req, res, next) => {
  let { query, variables } = req.body
  if (query.includes('query IntrospectionQuery')) {
    return res.json({ data: { __schema: { types: [] } } })
  }
  try {
    let headers = req.headers
    let result = await loader.load(query, variables, { headers })
    res.json(result)
  } catch (error) {
    console.log('error', error)
    next(error)
  }
})

app.use((req, res) => {
  res.send('404')
})

app.listen(PORT)

console.log(
  `Serving the GraphQL Playground on http://localhost:${PORT}/playground`
)
