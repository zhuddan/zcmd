import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as ejs from 'ejs'
import * as vscode from 'vscode'
import { createTempFile } from '../utils'

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
      urlName,
      model,
      modelName,
      access,
    } = getUrl(urlPath, action)

    const businessName = await vscode.window.showInputBox({
      prompt: '请输入业务名称',
      value: modelName,
    })

    const data = {
      urlName,
      model,
      businessName,
      urlPath,
      modelName,
      access,
    }

    const actionMappings: Record<Action, string> = {
      [Action.ADD]: 'add.ts',
      [Action.EDIT]: 'edit.ts',
      [Action.DEL]: 'del.ts',
      [Action.DETAIL]: 'detail.ts',
      [Action.LIST]: 'list.ts',
    }

    const output = await vscode.window.showQuickPick(
      ['constants.ts', 'model.d.ts', actionMappings[action]].map(name => ({
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
      if (_output.includes(actionMappings[action])) {
        await createTempFile(
          actionMappings[action],
          ejs.render(templatePath(actionMappings[action]), data),
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

function getUrl(input: string, action: Action) {
  let urlName = input.slice(1)
  const _names = input.split('/')

  const access = _names.includes('api') ? '' : 'Access'

  const names = _names.filter(e => e !== 'api' && e !== 'business' && e !== '')

  const modelName = names[0]
  const model = toPascalCase(modelName)

  if (action === Action.DETAIL) {
    names.push('detail')
  }
  urlName = [access, ...names]
    .filter(e => !!e)
    .map(e => e.toLocaleUpperCase())
    .join('_')

  return {
    urlName,
    model,
    modelName,
    access,
  }
}

/**
 * 将字符串转换为大驼峰（PascalCase）格式
 * @param str 输入的字符串
 * @returns 转换后的大驼峰格式字符串
 */
function toPascalCase(str: string): string {
  return str
    .replace(/^\w|[A-Z]|\b\w|\s+/g, (match, index) =>
      index === 0 ? match.toUpperCase() : match.toLowerCase())
    .replace(/\s+/g, '') // 删除空格
}
