import createApiDisposable from './create-api'
import createNestJsModuleDisposable from './create-nest-js-module'
import createTaroPageDisposable from './create-taro-page'
import createTypeDefDisposable from './typedef'

const disposables = [
  createTaroPageDisposable(),
  createTypeDefDisposable(),
  createApiDisposable(),
  createNestJsModuleDisposable(),
]

export default disposables
