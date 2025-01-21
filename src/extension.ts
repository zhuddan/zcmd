import type * as vscode from 'vscode'
import disposables from './disposables'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    ...disposables,
  )
}

export function deactivate() {}
