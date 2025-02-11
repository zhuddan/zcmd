import createApiDisposable from './create-api'
import createTaroPageDisposable from './create-taro-page'
import createTypeDefDisposable from './typedef'

const disposables = [
  createTaroPageDisposable(),
  createTypeDefDisposable(),
  createApiDisposable(),
]

export default disposables
