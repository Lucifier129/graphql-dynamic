const createLoader = require('../src/createLoaderForServer')
const gql = require('graphql-tag')

describe('createLoaderForServer', () => {
	let loader
	beforeEach(() => {
		loader = createLoader()
	})

	afterEach(() => {
		loader = null
	})

	describe('@create', () => {
		test('should create object for non-leaf field automaticlly', async () => {
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

		test('should support create value for field', async () => {
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

		test('should support create complex value for field', async () => {
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
		test('should support access existed variables', async () => {
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

		test('should support access dynamic variables', async () => {
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

		test('should support access async and dynamic variables', async () => {
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

		test('should support rename dynamic variables', async () => {
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
		test('should support tranfrom value in non-object filed', async () => {
			let query = gql`
				{
					a @create(value: 1) @map(to: "a + 1")
				}
			`
			let result = await loader.load(query)
			expect(result.errors).toEqual([])
			expect(result.data).toEqual({ a: 2 })
		})

		test('should support tranfrom value in object filed', async () => {
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

		test('should support access `this` in object filed', async () => {
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
	})
})
