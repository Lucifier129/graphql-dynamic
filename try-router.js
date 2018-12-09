const express = require('express')
const bodyParser = require('body-parser')
const graphqlRouter = require('./express')

const PORT = 2333
const app = express()

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

app.use('/graphql', graphqlRouter())

app.use((req, res) => {
  res.send('404')
})

app.listen(PORT)

console.log(
  `Serving the GraphQL Playground on http://localhost:${PORT}/graphql`
)
