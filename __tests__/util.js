const { getValue, fromEntries } = require('../src/util')

describe('getValue', () => {
	test('get number, string, null, undefined, empty-object, empty-array correctly', () => {
		expect(getValue(1)).toBe(1)
		expect(getValue('1')).toBe('1')
		expect(getValue(null)).toBe(null)
		expect(getValue(undefined)).toBe(undefined)
		expect(getValue({})).toEqual({})
		expect(getValue([])).toEqual([])
	})

	test('get object without promise should return itself', () => {
		let obj = {
			a: 1,
			b: 2
		}
		expect(getValue(obj) === obj).toBe(true)
	})

	test('get object value with promises should return promise', async () => {
		let obj = {
			a: Promise.resolve(1),
			b: Promise.resolve(2)
		}
		let result = getValue(obj)
		expect(result instanceof Promise).toBe(true)
		expect(await result).toEqual({ a: 1, b: 2 })
	})

	test('supports nest obj without promise', async () => {
		let obj = {
			a: {
				b: {
					c: 1,
					d: {
						e: '2'
					}
				}
			},
			f: 3
		}
		expect(getValue(obj) === obj).toBe(true)
	})

	test('supports nest obj with promise', async () => {
		let obj = {
			a: {
				b: {
					c: Promise.resolve(1),
					d: {
						e: '2'
					}
				}
			},
			f: 3
		}
		let result = await getValue(obj)
		expect(result).toEqual({
			a: {
				b: {
					c: 1,
					d: {
						e: '2'
					}
				}
			},
			f: 3
		})
	})

	test('get array without promise should return itself', () => {
		let array = [1, 2, 3]
		expect(getValue(array) === array).toBe(true)
	})

	test('get array with promise should return promise', async () => {
		let array = [1, 2, Promise.resolve(3)]

		let result = getValue(array)

		expect(result instanceof Promise).toBe(true)

		expect(await result).toEqual([1, 2, 3])
	})

	test('supports nest array without promise', () => {
		let array = [1, 2, [3, 4, [5, 6, [7]]], [8]]
		expect(getValue(array) === array).toBe(true)
	})

	test('supports nest array with promise', async () => {
		let array = [
			1,
			2,
			[3, 4, [5, Promise.resolve(6), [7]]],
			[Promise.resolve(8)]
		]
		let result = await getValue(array)
		expect(result).toEqual([1, 2, [3, 4, [5, 6, [7]]], [8]])
	})

	test('supports mix array and object without promise', () => {
		let obj = {
			arr: [1, 2, { a: 1, b: [2] }],
			c: 1,
			d: {
				e: [2]
			}
		}
		let result = getValue(obj)
		expect(result === obj).toBe(true)
	})

	test('supports mix array and object with promise', async () => {
		let obj = {
			arr: [1, 2, { a: Promise.resolve(1), b: [2] }],
			c: 1,
			d: {
				e: [Promise.resolve(2)]
			}
		}
		let result = await getValue(obj)
		expect(result).toEqual({
			arr: [1, 2, { a: 1, b: [2] }],
			c: 1,
			d: {
				e: [2]
			}
		})
	})

	test('should be able to catch rejected value', async () => {
		let obj = {
			rejected: Promise.reject(new Error('rejected'))
		}
		try {
			await getValue(obj)
			// should never be called
			expect(true).toBe(false)
		} catch (error) {
			expect(error.message).toBe('rejected')
		}
	})
})

describe('fromEntries', () => {
	test('should return empty-object when receives empty-array', () => {
		let obj = fromEntries([])
		expect(obj).toEqual({})
	})

	test('should return empty-object when receives non-array argument', () => {
		expect(fromEntries(1)).toEqual({})
		expect(fromEntries('1')).toEqual({})
		expect(fromEntries({})).toEqual({})
		expect(fromEntries(null)).toEqual({})
	})

	test('should construct object correctly', () => {
		let headers = [['Content-Type', 'application/json'], ['Cookie', 'a=1&b=2']]
		let obj = fromEntries(headers)

		expect(obj).toEqual({
			'Content-Type': 'application/json',
			Cookie: 'a=1&b=2'
		})
	})
})
