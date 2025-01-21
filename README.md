# zcmd README

我的常用vscode命令

## Features

- `zcmd.create-taro-page` 创建 Taro 页面
- `zcmd.type-def` 选中 json 创建 jsdoc 的类型声明 (支持js不标准的 json)

```text
{
  a: 'x',
  n: {
    name: 'zd',
    age: 1,
    n: {
      m: 1
    },
    vvvv: [123213]
  }
}
```

你可以得到：

```js
/**
 * @typedef {object} xxx
 * @property {number} m
 */

/**
 * @typedef {object} N
 * @property {string} name
 * @property {number} age
 * @property {xxx} n
 * @property {Array<number>} vvvv
 */

/**
 * @typedef {object} TypeDef
 * @property {string} a
 * @property {N} n
 */
```
