import fs from 'node:fs'
import path from 'node:path'
import * as ejs from 'ejs'
import * as vscode from 'vscode'
import { createTempFile, toPascalCase } from '../utils'

enum Action {
  LIST = '列表',
  DETAIL = '详情',
  ADD = '新增',
  EDIT = '修改',
  DEL = '删除',
}

function templatePath(name: string) {
  return fs.readFileSync(
    path.resolve(
      __dirname,
      './template/create-api',
      `${name}.ejs`,
    ),
    'utf-8',
  )
}

export default function createApiDisposable() {
  const disposable = vscode.commands.registerCommand('zcmd.create-api', async (_uri: vscode.Uri) => {
    // 获取页面名称
    const urlPath = await vscode.window.showInputBox({
      prompt: '请输入url名称',
      value: '/business/user',
    })
    if (!urlPath) {
      return
    }

    const action = await vscode.window.showQuickPick([
      Action.LIST,
      Action.DETAIL,
      Action.ADD,
      Action.EDIT,
      Action.DEL,
    ]) as unknown as Action.LIST

    if (!action) {
      return
    }
    const {
      url_constant,
      model,
      modelName,
      public_sign,
    } = generateApiUrl(urlPath, action)

    const businessName = await vscode.window.showInputBox({
      prompt: '请输入业务名称',
      value: modelName,
    })

    const businessNameDescMap: Record<Action, string> = {
      [Action.ADD]: '新增/修改/删除',
      [Action.EDIT]: '新增/修改/删除',
      [Action.DEL]: '新增/修改/删除',
      [Action.DETAIL]: '列表',
      [Action.LIST]: '详情',
    }

    const data = {
      url_constant,
      model,
      businessName,
      urlPath,
      modelName,
      public_sign,
      businessNameDesc: businessNameDescMap[action],
    }

    const actionFileMap: Record<Action, string> = {
      [Action.ADD]: 'add.ts',
      [Action.EDIT]: 'edit.ts',
      [Action.DEL]: 'del.ts',
      [Action.DETAIL]: 'detail.ts',
      [Action.LIST]: 'list.ts',
    }

    const output = await vscode.window.showQuickPick(
      ['constants.ts', 'model.d.ts', actionFileMap[action]].map(name => ({
        label: name,
        description: '',
        picked: name !== 'model.d.ts',
      })),
      {
        placeHolder: 'select output',
        canPickMany: true, // 设置为 true 允许多选
      },
    )
    if (!output?.length)
      return
    const _output = output?.map(e => e.label)

    try {
      if (_output.includes('constants.ts')) {
        await createTempFile(
          'constants.ts',
          ejs.render(templatePath('constants.ts'), data),
        )
      }
      if (_output.includes('model.d.ts')) {
        await createTempFile(
          'model.d.ts',
          ejs.render(templatePath('model.d.ts'), data),
        )
      }
      if (_output.includes(actionFileMap[action])) {
        await createTempFile(
          actionFileMap[action],
          ejs.render(templatePath(actionFileMap[action]), data),
        )
      }

      vscode.window.showInformationMessage(`success`)
    }
    catch (error) {
      vscode.window.showErrorMessage(`创建页面失败: ${error}`)
    }
  })
  return disposable
}

function generateApiUrl(input: string, action: Action) {
  let url_constant = input.slice(1)
  const _names = input.split('/')
  const public_sign = _names.includes('api') ? 'Public' : ''
  const names = _names.filter(e => e !== 'api' && e !== 'business' && e !== '')
  const modelName = names[0]
  const model = toPascalCase(modelName)
  if (action === Action.DETAIL) {
    names.push('detail')
  }
  url_constant = [public_sign, ...names]
    .filter(e => !!e)
    .map(e => e.toLocaleUpperCase())
    .join('_')

  return {
    url_constant,
    model,
    modelName,
    public_sign,
  }
}
