const gql = require('graphql-tag')
const createLoader = require('./src/createLoaderForServer')
const loader = createLoader()

const test = async () => {
  let start = Date.now()
  let query = gql`
    {
      data @create(value: { a: 1, b: 2 }) {
        a @map(to: "a + 10")
        b @variable(name: "b")
      }
      test @create(value: $b) @variable
      a {
        a @create(value: 1)
        b @create(value: $b)
      }
    }
  `
  console.log('parse time', Date.now() - start)
  let result = await loader.load(query)
  console.log('load time', Date.now() - start)
  console.log('result', JSON.stringify(result, null, 2))
}

test().catch(error => console.log('error', error))
