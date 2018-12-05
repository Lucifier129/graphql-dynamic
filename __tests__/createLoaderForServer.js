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
					a
						@create(value: { b: 1, c: 2 })
						@map(to: "{...this}", context: { d: 3, e: 4 })
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
					a @create(value: 1) @map(to: "$item")
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
						b @filter(if: "test", context: { test: true })
						c @filter(if: "test", context: { test: false })
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
					a @create(value: 1) @filter(if: "$item === 1")
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
})
