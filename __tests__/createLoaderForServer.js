const createLoader = require('../src/createLoaderForServer')
const gql = require('graphql-tag')
const http = require('http')

let createServer = handler => {
  return new Promise(resolve => {
    let server = http.createServer(handler)
    server.listen(2333)
    server.on('listening', () => resolve(server))
  })
}

let readBody = req => {
  return new Promise((resolve, reject) => {
    let buffers = []
    req.on('data', chunk => buffers.push(chunk))
    req.on('end', () => {
      resolve(Buffer.concat(buffers).toString())
    })
    req.on('error', reject)
  })
}

describe('createLoaderForServer', () => {
  let loader
  beforeEach(() => {
    loader = createLoader()
  })

  afterEach(() => {
    loader = null
  })

  describe('@create', () => {
    test('create object for non-leaf field automaticlly', async () => {
      let query = gql`
        {
          a {
            b {
              c {
                d @create(value: 1)
              }
            }
          }
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: {
          b: {
            c: {
              d: 1
            }
          }
        }
      })
    })

    test('create value for field', async () => {
      let query = gql`
        {
          a @create(value: 1)
          b @create(value: "1")
          c @create(value: [])
          d @create(value: {})
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: 1, b: '1', c: [], d: {} })
    })

    test('create complex value for field', async () => {
      let query = gql`
        {
          a @create(value: { b: [1, 2, 3], c: { e: "e" }, d: [{ f: "f" }] }) {
            b
            c
            d
          }
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: {
          b: [1, 2, 3],
          c: { e: 'e' },
          d: [{ f: 'f' }]
        }
      })
    })
  })

  describe('@variable', () => {
    test('access existed variables', async () => {
      let variables = { a: 1, b: 2 }
      let query = gql`
        {
          a @create(value: $a)
          b @create(value: $b)
        }
      `
      let result = await loader.load(query, variables)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: 1, b: 2 })
    })

    test('access dynamic variables', async () => {
      let query = gql`
        {
          a @create(value: 1) @variable
          b @create(value: 2) @variable
          test {
            a @create(value: $a)
            b @create(value: $b)
          }
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: 1, b: 2, test: { a: 1, b: 2 } })
    })

    test('access async and dynamic variables', async () => {
      let query = gql`
        {
          test {
            a @create(value: $a)
            b @create(value: $b)
          }
          a @create(value: 1) @variable
          b @create(value: 2) @variable
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ test: { a: 1, b: 2 }, a: 1, b: 2 })
    })

    test('rename dynamic variables', async () => {
      let query = gql`
        {
          a @create(value: 1) @variable(name: "custom_name")
          b @create(value: $custom_name)
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: 1, b: 1 })
    })
  })

  describe('@map', () => {
    test('access filedName in non-object field', async () => {
      let query = gql`
        {
          a @create(value: 1) @map(to: "a + 1")
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: 2 })
    })

    test('access children fieldNames in object field', async () => {
      let query = gql`
        {
          a @create(value: { b: 1, c: 2 }) @map(to: "{ b: c + 1, c: b - 1 }") {
            b
            c
          }
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: { b: 3, c: 0 } })
    })

    test('access `this` in object field', async () => {
      let query = gql`
        {
          a @create(value: { b: 1, c: 2 }) @map(to: "{ ...this, c: b - 1 }") {
            b
            c
          }
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: { b: 1, c: 0 } })
    })

    test('transform value in array field', async () => {
      let query = gql`
        {
          a
            @create(value: [{ b: 1, c: 2 }])
            @map(to: "{ b: c + 1, c: b - 1 }") {
            b
            c
          }
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: [{ b: 3, c: 0 }] })
    })

    test('access `this` in array field', async () => {
      let query = gql`
        {
          a @create(value: [{ b: 1, c: 2 }]) @map(to: "{ ...this, c: b - 1 }") {
            b
            c
          }
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: [{ b: 1, c: 0 }] })
    })

    test('merge context into @map', async () => {
      let query = gql`
        {
          a @create(value: { b: 1, c: 2 }) @map(to: "{...this}", d: 3, e: 4)
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: {
          b: 1,
          c: 2,
          d: 3,
          e: 4
        }
      })
    })

    test('access meta variables', async () => {
      let query = gql`
        {
          a @create(value: 1) @map(to: "$value")
          b @create(value: 2) @map(to: "$index")
          c
            @create(value: [{ d: 1 }, { d: 2 }])
            @map(to: "{ d: d * $index + $list.length } ")
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: 1,
        b: 0,
        c: [
          {
            d: 2
          },
          {
            d: 4
          }
        ]
      })
    })
  })

  describe('@filter', () => {
    test('boolean arg works like @include', async () => {
      let query = gql`
        {
          a @create(value: 1) @filter(if: false)
          b @create(value: 2) @filter(if: true)
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        b: 2
      })
    })

    test('access filedName in non-object field', async () => {
      let query = gql`
        {
          a @create(value: 1) @filter(if: "a === 1")
          b @create(value: 2) @filter(if: "b === 1")
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: 1
      })
    })

    test('access children fieldNames in object field', async () => {
      let query = gql`
        {
          a @create(value: { b: 1, c: 2 }) @filter(if: "b === 1 && c === 2")
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: {
          b: 1,
          c: 2
        }
      })
    })

    test('merge context into @filter', async () => {
      let query = gql`
        {
          a @create(value: { b: 1, c: 2 }) {
            b @filter(if: "test", test: true)
            c @filter(if: "test", test: false)
          }
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: {
          b: 1
        }
      })
    })

    test('access meta variables', async () => {
      let query = gql`
        {
          a @create(value: 1) @filter(if: "$value === 1")
          b @create(value: 2) @filter(if: "$index !== 0")
          c @create(value: [{ d: 1 }, { d: 2 }]) @filter(if: "$list.length")
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: 1,
        c: [
          {
            d: 1
          },
          {
            d: 2
          }
        ]
      })
    })
  })

  describe('@fetch', async () => {
    let server

    beforeAll(async () => {
      server = await createServer(async (req, res) => {
        let body = await readBody(req)
        res.end(
          JSON.stringify({
            url: req.url,
            options: { method: req.method, body, headers: req.headers }
          })
        )
      })
    })

    afterAll(async () => {
      server.close()
    })

    test('fetch data', async () => {
      let query = gql`
        {
          a
            @fetch(
              url: "http://localhost:2333/fetch"
              options: {
                method: "GET"
                headers: [
                  ["Content-Type", "application/json"]
                  ["Cookie", "a=1&b=2"]
                ]
              }
            )
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data.a.url).toEqual('/fetch')
      expect(result.data.a.options.method).toEqual('GET')
      expect(result.data.a.options.headers['content-type']).toBe(
        'application/json'
      )
      expect(result.data.a.options.headers['cookie']).toBe('a=1&b=2')
    })

    test('set responseType to text', async () => {
      let query = gql`
        {
          a
            @fetch(
              url: "http://localhost:2333/fetch"
              options: {
                method: "GET"
                headers: [
                  ["Content-Type", "application/json"]
                  ["Cookie", "a=1&b=2"]
                ]
              }
              responseType: "text"
            )
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(typeof result.data.a).toBe('string')
      let data = JSON.parse(result.data.a)
      expect(data.url).toEqual('/fetch')
      expect(data.options.method).toEqual('GET')
      expect(data.options.headers['content-type']).toBe('application/json')
      expect(data.options.headers['cookie']).toBe('a=1&b=2')
    })

    test('set bodyType to json', async () => {
      let query = gql`
        {
          a
            @fetch(
              url: "http://localhost:2333/fetch"
              options: {
                method: "POST"
                headers: [
                  ["Content-Type", "application/json"]
                  ["Cookie", "a=1&b=2"]
                ]
                body: { a: 1, b: 2 }
              }
              bodyType: "json"
            )
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data.a.url).toEqual('/fetch')
      expect(result.data.a.options.method).toEqual('POST')
      expect(result.data.a.options.headers['content-type']).toBe(
        'application/json'
      )
      expect(result.data.a.options.headers['cookie']).toBe('a=1&b=2')
      expect(result.data.a.options.body).toEqual(JSON.stringify({ a: 1, b: 2 }))
    })

    test('set bodyType to text', async () => {
      let query = gql`
        {
          a
            @fetch(
              url: "http://localhost:2333/fetch"
              options: {
                method: "POST"
                headers: [
                  ["Content-Type", "application/json"]
                  ["Cookie", "a=1&b=2"]
                ]
                body: { a: 1, b: 2 }
              }
              bodyType: "text"
            )
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data.a.url).toEqual('/fetch')
      expect(result.data.a.options.method).toEqual('POST')
      expect(result.data.a.options.headers['content-type']).toBe(
        'application/json'
      )
      expect(result.data.a.options.headers['cookie']).toBe('a=1&b=2')
      expect(result.data.a.options.body).toEqual('[object Object]')
    })
  })

  describe('@get', async () => {
    let server

    beforeAll(async () => {
      server = await createServer(async (req, res) => {
        let body = await readBody(req)
        res.end(
          JSON.stringify({
            url: req.url,
            options: { method: req.method, body, headers: req.headers }
          })
        )
      })
    })

    afterAll(async () => {
      server.close()
    })

    test('get data', async () => {
      let query = gql`
        {
          a
            @get(
              url: "http://localhost:2333/get"
              query: { a: 1, b: 2 }
              options: { headers: [["Cookie", "a=1&b=2"]] }
            )
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data.a.url).toEqual('/get?a=1&b=2')
      expect(result.data.a.options.method).toEqual('GET')
      expect(result.data.a.options.headers['cookie']).toBe('a=1&b=2')
    })

    test('set responseType to text', async () => {
      let query = gql`
        {
          a
            @get(
              url: "http://localhost:2333/get"
              query: { a: 1, b: 2 }
              options: { headers: [["Cookie", "a=1&b=2"]] }
              responseType: "text"
            )
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(typeof result.data.a).toBe('string')
      let data = JSON.parse(result.data.a)
      expect(data.url).toEqual('/get?a=1&b=2')
      expect(data.options.method).toEqual('GET')
      expect(data.options.headers['cookie']).toBe('a=1&b=2')
    })
  })

  describe('@post', async () => {
    let server

    beforeAll(async () => {
      server = await createServer(async (req, res) => {
        let body = await readBody(req)
        res.end(
          JSON.stringify({
            url: req.url,
            options: { method: req.method, body, headers: req.headers }
          })
        )
      })
    })

    afterAll(async () => {
      server.close()
    })

    test('post data', async () => {
      let query = gql`
        {
          a @post(url: "http://localhost:2333/post", body: { a: 1, b: 2 })
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data.a.url).toEqual('/post')
      expect(result.data.a.options.method).toEqual('POST')
      expect(result.data.a.options.headers['content-type']).toBe(
        'application/json'
      )
      expect(result.data.a.options.body).toEqual(JSON.stringify({ a: 1, b: 2 }))
    })

    test('post data multiple times', async () => {
      let query = gql`
        {
          a @create(value: [{ b: 1 }, { b: 2 }]) {
            b @post(url: "http://localhost:2333/post", body: { c: 1, e: 2 })
          }
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(Array.isArray(result.data.a)).toBe(true)
      result.data.a.forEach(data => {
        expect(data.b.url).toEqual('/post')
        expect(data.b.options.method).toEqual('POST')
        expect(data.b.options.headers['content-type']).toBe('application/json')
        expect(data.b.options.body).toEqual(JSON.stringify({ c: 1, e: 2 }))
      })
    })

    test('set responseType to text', async () => {
      let query = gql`
        {
          a
            @post(
              url: "http://localhost:2333/post"
              body: { a: 1, b: 2 }
              responseType: "text"
            )
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(typeof result.data.a).toBe('string')
      let data = JSON.parse(result.data.a)
      expect(data.url).toEqual('/post')
      expect(data.options.method).toEqual('POST')
      expect(data.options.headers['content-type']).toBe('application/json')
      expect(data.options.body).toEqual(JSON.stringify({ a: 1, b: 2 }))
    })

    test('set bodyType to json', async () => {
      let query = gql`
        {
          a
            @post(
              url: "http://localhost:2333/post"
              body: { a: 1, b: 2 }
              bodyType: "json"
            )
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data.a.url).toEqual('/post')
      expect(result.data.a.options.method).toEqual('POST')
      expect(result.data.a.options.headers['content-type']).toBe(
        'application/json'
      )
      expect(result.data.a.options.body).toEqual(JSON.stringify({ a: 1, b: 2 }))
    })

    test('set bodyType to text', async () => {
      let query = gql`
        {
          a
            @post(
              url: "http://localhost:2333/post"
              body: { a: 1, b: 2 }
              bodyType: "text"
            )
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data.a.url).toEqual('/post')
      expect(result.data.a.options.method).toEqual('POST')
      expect(result.data.a.options.headers['content-type']).toBe(
        'application/json'
      )
      expect(result.data.a.options.body).toEqual('[object Object]')
    })
  })

  describe('@extend', () => {
    test('extend object in nullable field', async () => {
      let query = gql`
        {
          a @extend(b: 1, c: 2)
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: { b: 1, c: 2 } })
    })

    test('extend object in non-nullable field', async () => {
      let query = gql`
        {
          a @create(value: { b: 0, d: 3 }) @extend(b: 1, c: 2)
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({ a: { b: 1, c: 2, d: 3 } })
    })

    test('extend object in array field', async () => {
      let query = gql`
        {
          a
            @create(value: [{ b: 0, d: 3 }, { b: -1, d: 4 }])
            @extend(b: 1, c: 2)
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: [{ b: 1, c: 2, d: 3 }, { b: 1, c: 2, d: 4 }]
      })
    })
  })

  describe('@append', () => {
    test('append value in nullable field', async () => {
      let query = gql`
        {
          a @append(value: 1)
          b @append(value: "1")
          c @append(value: [1, 2])
          d @append(value: { value: 1 })
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: [1],
        b: ['1'],
        c: [1, 2],
        d: [{ value: 1 }]
      })
    })

    test('append value in non-nullable field', async () => {
      let query = gql`
        {
          a @create(value: 0) @append(value: 1)
          b @create(value: "0") @append(value: "1")
          c @create(value: 0) @append(value: [1, 2])
          d @create(value: { value: 0 }) @append(value: { value: 1 })
          e @create(value: [0, 1, 2]) @append(value: [3, 4, 5])
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: [0, 1],
        b: ['0', '1'],
        c: [0, 1, 2],
        d: [{ value: 0 }, { value: 1 }],
        e: [0, 1, 2, 3, 4, 5]
      })
    })
  })

  describe('@prepend', () => {
    test('prepend value in nullable field', async () => {
      let query = gql`
        {
          a @prepend(value: 1)
          b @prepend(value: "1")
          c @prepend(value: [1, 2])
          d @prepend(value: { value: 1 })
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: [1],
        b: ['1'],
        c: [1, 2],
        d: [{ value: 1 }]
      })
    })

    test('prepend value in non-nullable field', async () => {
      let query = gql`
        {
          a @create(value: 0) @prepend(value: 1)
          b @create(value: "0") @prepend(value: "1")
          c @create(value: 0) @prepend(value: [1, 2])
          d @create(value: { value: 0 }) @prepend(value: { value: 1 })
          e @create(value: [0, 1, 2]) @prepend(value: [3, 4, 5])
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(result.data).toEqual({
        a: [1, 0],
        b: ['1', '0'],
        c: [1, 2, 0],
        d: [{ value: 1 }, { value: 0 }],
        e: [3, 4, 5, 0, 1, 2]
      })
    })
  })

  describe("'use' arg in directive", () => {
    let server

    beforeAll(async () => {
      server = await createServer(async (req, res) => {
        let body = await readBody(req)
        res.end(
          JSON.stringify({
            url: req.url,
            options: { method: req.method, body, headers: req.headers }
          })
        )
      })
    })

    afterAll(async () => {
      server.close()
    })

    test('use dynamic args', async () => {
      let query = gql`
        {
          a @create(value: [{ b: 1 }, { b: 2 }]) {
            b
              @post(
                url: "http://localhost:2333/map-post"
                test: 1
                use: "{ body: { b, url, test }  }"
              )
            c: b
          }
        }
      `
      let result = await loader.load(query)
      expect(result.errors).toEqual([])
      expect(Array.isArray(result.data.a)).toBe(true)
      result.data.a.forEach((data, i) => {
        expect(data.c).toBe(i + 1)
        expect(data.b.url).toBe('/map-post')
        expect(data.b.options.method).toBe('POST')
        expect(data.b.options.body).toBe(
          JSON.stringify({
            b: data.c,
            url: 'http://localhost:2333/map-post',
            test: 1
          })
        )
      })
    })
  })
})
