import createTaroPageDisposable from './create-taro-page'
import createTypeDefDisposable from './typedef'

const disposables = [
  createTaroPageDisposable(),
  createTypeDefDisposable(),
]

export default disposables
