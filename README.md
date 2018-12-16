# graphql-dynamic

dynamic, schema-less, directive-drive Graphql

# Table of Contents 👇

- [Usage](#usage)
- [Directives](#directives)
- [Api](#Api)

## Usage

```shell
npm install graphq-dynamic
```

```javascript
import createLoader from 'graphql-dynamic'

const loader = createLoader()
const query = `
  {
    test @create(value: 1)
  }
`
const result = await loader.load(query) // output: { test: 1 }
```

## Directives

- graphql 的指令以 @ 符号开头
- 指令按出现顺序执行
- 每个指令都有一个特殊参数 `use`，用于动态计算指令参数。

### fetch|get|post 指令里的 url 参数

```graphql
{
  testUrlString @post(url: "http://example.com/api/name?a=1&b=2")
  testUrlObject
    @post(
      url: { host: "example.com", pathanme: "/api/name", query: { a: 1, b: 2 } }
    )
}
```

### fetch|get|post 指令里的 headers 参数

headers 必须是数组[[key, value]] 格式，而不是 { [key]: value }。

（graphql 的 key 不允许出现横杠，也不像 json 那样可以用双引号包裹）

```graphql
{
  test
    @post(
      options: {
        headers: [
          ["Content-Type", "application/json"]
          ["Accept", "application/json"]
        ]
      }
    )
}
```

### @post(url, body, options, bodyType, responseType)

发送 post 请求

- url，可以是 url string，也可以是 [url object](https://nodejs.org/api/url.html#url_url_strings_and_url_objects)
- body，post 请求发送的数据
- options, 跟 fetch(url, options) 的 [options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) 结构一致，（除了 headers 要求特殊形式，见“fetch|get|post 指令里的 headers 参数”一节）
- bodyType，发送 post 请求时 body 的编码类型，默认为 json，可以设置为 text 文本格式。
- responseType，获取 post 请求的响应数据的编码类型，默认为 json，可以设置为 text 文本格式。

```graphql
{
  test
    @post(
      url: "/my/api"
      data: { a: 1, b: 2 }
      options: {
        headers: [
          ["Content-Type", "application/json"]
          ["Accept", "application/json"]
        ]
      }
      bodyType: "json"
      responseType: "json"
    )
}
```

### @get(url, query, options, responseType)

发送 get 请求

- url，可以是 url string，也可以是 [url object](https://nodejs.org/api/url.html#url_url_strings_and_url_objects)
- body，post 请求发送的数据
- options, 跟 fetch(url, options) 的 [options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) 结构一致，（除了 headers 要求特殊形式，见“fetch|get|post 指令里的 headers 参数”一节）
- responseType，获取 post 请求的响应数据的编码类型，默认为 json，可以设置为 text 文本格式。

```graphql
{
  test
    @get(
      url: "/my/api"
      query: { a: 1, b: 2 }
      options: {
        headers: [
          ["Content-Type", "application/json"]
          ["Accept", "application/json"]
        ]
      }
      bodyType: "json"
      responseType: "json"
    )
}
```

### @fetch(url, options, bodyType, responseType)

发送 fetch 请求

- url，可以是 url string，也可以是 [url object](https://nodejs.org/api/url.html#url_url_strings_and_url_objects)
- options, 跟 fetch(url, options) 的 [options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters) 结构一致，（除了 headers 要求特殊形式，见“fetch|get|post 指令里的 headers 参数”一节）
- bodyType，发送 post 请求时 body 的编码类型，默认为 json，可以设置为 text 文本格式。
- responseType，获取 post 请求的响应数据的编码类型，默认为 json，可以设置为 text 文本格式。

```graphql
{
  test
    @fetch(
      url: "/my/api"
      options: {
        method: "POST"
        body: { a: 1, b: 2 }
        headers: [
          ["Content-Type", "application/json"]
          ["Accept", "application/json"]
        ]
      }
      bodyType: "json"
      responseType: "json"
    )
}
```

### @create(value)

用 value 参数的值作为当前字段的值，该指令如果存在，必须是第一个

```graphql
{
  number @create(value: 1)
  string @create(value: "1")
  object @create(value: { a: 1, b: 2 })
  array @create(value: [{ a: 1 }, { b: 2 }])
}
```

返回

```javascript
{
  number: 1,
  string: '1',
  object: { a: 1, b: 2 }
  array: [{ a: 1 }, {b: 2}]
}
```

### @variable(name)

将当前字段的值定义为 graphql 变量，如果该指令存在，必须是最后一个

如果 name 参数没有指定，默认为当前字段的名称（fieldName）。

变量的使用，不依赖定义顺序。可以先使用，后定义。子字段可以使用父字段定义的变量，但父字段不能使用子字段的定义的变量。

```graphql
{
  a @create(value: 1) @variable # 将 a 定义为变量
  b @create(value: $a) @variable(name: "c") # 使用变量 a，并将 b 定义为变量，变量名为 c
  c @create(value: $c) # 使用来自字段 b 定义的变量 c
}
```

### @map(to, ...context)

将当前字段的值映射成另一个，to 参数为一个 js 表达式，在表达式里可以使用 context 里的参数

- 如果当前字段的值不是对象或数组，则 to 参数里可以用当前字段的名字访问它的值。
- 如果当前字段的值是对象，则 to 参数里可以用对象里的 key 去访问对应的 value 值，通过 $value 元参数访问整个对象，通过 this 关键字访问$value + context 的 mergedObject 合并对象。
- 如果当前字段的值是数组，则循环这个数组，按上面的规则读取值。
- 可以用过`元参数` $value|$index|\$list 分别访问整个字段值、数组索引和数组本身。

```graphql
{
  a @create(value: 1) @map(to: "a + b", b: 1) # a 最终为 2
  objcet @create(value: { a: 1, b: 2 }) @map(to: "{ a: a + 1, b: b + n }", n: 1) # object 最终为 { a: 2, b: 3 }
  array @create(value: [{ a: 1 }, { a: 2 }]) @map(to: "{ a: a + 1 }") # array 最终为 [{ a: 2 }, { a: 3 }]
  array1
    @create(value: [{ a: 1 }, { a: 2 }])
    @map(to: "{ value: $value， index: $index, length: $list.length  }") # 通过 $value 访问整个字段的值，通过 $index 访问数组索引（如果它原始值不是数组，$index 为 0），通过 $list 访问循环的数组（如果它的原始值不是数组，$list 为只包含该原始值的、长度为1的数组）
}
```

### @filter(if, ...context)

过滤当前字段的值，if 参数为一个 js 表达式，在表达式里可以使用 context 里的参数

- 如果当前字段的值不是对象或数组，则 if 参数里可以用当前字段的名字访问它的值。
- 如果当前字段的值是对象，则 if 参数里可以用对象里的 key 去访问对应的 value 值，通过 $value 元参数访问整个对象，通过 this 关键字访问$value + context 的 mergedObject 合并对象。
- 如果当前字段的值是数组，则循环这个数组，按上面的规则读取值。
- 可以用过`元参数` $value|$index|\$list 分别访问整个字段值、数组索引和数组本身。

```graphql
{
  a @create(value: 1) @filter(if: "a > 1") # a 不会被输出
  b @create(value: 1) @filter(if: "b === 1") # b 输出为 1
  objcet @create(value: { a: 1, b: 2 }) @filter(if: "b <= n", n: 1) # object 最终为 { a: 1, b: 2 }
  array @create(value: [{ a: 1 }, { a: 2 }]) @map(to: "a < 2") # array 最终为 [{ a: 1 }]
}
```

### @extend(...object)

用 object 拓展当前的字段值

- 如果当前的字段值不是对象，用 object 替换当前字段的值
- 如果当前字段值为对象，用 object 里的 key 覆盖当前对象的值
- 如果当前对象值为数组，对数组每一项执行 extend 操作

```graphql
{
  a @extend(b: 1, c: 2) # a 输出为 { b: 1, c: 2 }
  b @create(value: { b: 0, d: 3 }) @extend(b: 1, c: 2) # b 输出为 { b: 1, c: 2, d: 3 }
  c @create(value: [{ b: 0, d: 3 }, { b: -1, d: 4 }]) @extend(b: 1, c: 2) # c 输出为 [{ b: 1, c: 2, d: 3 }, { b: 1, c: 2, d: 4 }]
}
```

### @prepend(value)

从当前字段的数组首位拼接 value 值

```graphql
{
  a @prepend(value: 1)
  b @prepend(value: "1")
  c @prepend(value: [1, 2])
  d @prepend(value: { value: 1 })
}

# 输出
# {
#   a: [1],
#   b: ['1'],
#   c: [1, 2],
#   d: [{ value: 1 }]
# }

{
  a @create(value: 0) @prepend(value: 1)
  b @create(value: "0") @prepend(value: "1")
  c @create(value: 0) @prepend(value: [1, 2])
  d @create(value: { value: 0 }) @prepend(value: { value: 1 })
  e @create(value: [0, 1, 2]) @prepend(value: [3, 4, 5])
}

# 输出
# {
#   a: [1, 0],
#   b: ['1', '0'],
#   c: [1, 2, 0],
#   d: [{ value: 1 }, { value: 0 }],
#   e: [3, 4, 5, 0, 1, 2]
# }
```

### @append(value)

从当前字段的数组末尾拼接 value 值，用法见 @prepend

## Api

graphql-dynamic 基于 [graphql-anywhere](https://github.com/apollographql/apollo-client/tree/master/packages/graphql-anywhere) 实现，部分 api 及概念需参考 graphql-anywhere 文档帮助理解。

### createLoader(config)

createLoader 创建查询 graphql 的 loader 对象。

config 参数类型为对象

- variableTimeout 字段表示等待动态的 graphql 变量的超时时间，默认为 3000
- fetchTimeout 字段表示等待 fetch 请求的超时时间，默认为 3000

loader 字段拥有两个方法：

- load(query, variables?, context?, rootValue?)
  - query 为 graphql 查询语句(字符串)或者 graphql document，必传
  - variables 为传入 graphql 语句的变量对象
  - context 为传入 resolver 的 context
  - rootValue 为 resolver 开始的根节点的值
  - load 方法返回数据格式为 { errors, logs, data } 的 promise 对象
  - errors 为数组，包含此次 graphql 查询包含的错误信息
  - logs 为数组，包含此次 graphql 查询包含的日志信息（内置的日志为 fetch 的耗时）
  - data 为对象，包含我们查询的结果
- use(...middlewares)
  - middlewares 为 koa style 的中间件的数组: (ctx, next) -> promise
  - ctx 里合并了上述 config 和 context 对象，此外还包含
    - fieldName，当前字段名
    - rootValue，当前字段的父节点的值
    - args 当前字段的参数对象
    - context 当前对象
    - info 当前字段的附加信息（比如指令，或者 isLeaf 是否枝叶节点）
    - result 当前字段的值，默认为 rootValue[fieldName]，可能被前置中间件（如 @create, @map）进行过更新

在第一次执行 loader.load 方法之前，可以使用 loader.use 添加自定义中间件。在执行过 loader.load 之后，loader.use 传入的参数会被忽略。
