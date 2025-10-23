import fs from 'node:fs'
import path from 'node:path'
import * as ejs from 'ejs'
import _ from 'lodash'
import * as vscode from 'vscode'
// import { createTempFile, openFileAndSelectWord } from '../utils'
// function createNestJsModule(moduleName: string) {
//   const CapitalizeModuleName = _.capitalize(moduleName)
//   console.log(CapitalizeModuleName)
// }

function templatePath(name: string) {
  return fs.readFileSync(
    path.resolve(
      __dirname,
      './template/create-nest-js-module',
      `${name}.ejs`,
    ),
    'utf-8',
  )
}

export default function createNestJsModuleDisposable() {
  const disposable = vscode.commands.registerCommand('zcmd.create-nest-js-module', async (uri: vscode.Uri) => {
    // 获取页面名称

    // 获取目标目录
    let targetDir: string
    if (uri) {
      // 从右键菜单获取目录
      targetDir = uri.fsPath
      // 如果点击的是文件而不是文件夹，获取其所在目录
      if (!fs.lstatSync(targetDir).isDirectory()) {
        targetDir = path.dirname(targetDir)
      }
    }
    else {
      // 如果没有右键选择目录，使用工作区根目录
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('请打开一个工作目录')
        return
      }
      targetDir = workspaceFolder.uri.fsPath
    }

    let moduleName = await vscode.window.showInputBox({
      prompt: 'module名称',
      value: 'product',
    })

    if (!moduleName) {
      return
    }

    moduleName = moduleName.toLowerCase()

    const moduleNameCN = await vscode.window.showInputBox({
      prompt: 'module描述',
      value: '商品',
    })

    const data = {
      moduleName,
      CapitalizeModuleName: _.capitalize(moduleName),
      moduleNameCN,
    }

    function createFile(filePath: string, content: string) {
      filePath = path.join(targetDir, moduleName!, filePath)
      if (filePath.includes('/')) {
        const dirPath = path.dirname(filePath)

        fs.mkdirSync(dirPath, { recursive: true })
      }
      return new Promise<void>((resolve, reject) => {
        fs.writeFile(filePath, content, (err) => {
          if (err) {
            reject(err)
          }
          else {
            resolve()
          }
        })
      })
    }

    try {
      // ------------- dto --------------
      await createFile(
        `dto/create-${moduleName}.dto.ts`,
        ejs.render(templatePath(`dto/create.dto`), data),
      )
      await createFile(
        `dto/update-${moduleName}.dto.ts`,
        ejs.render(templatePath(`dto/update.dto`), data),
      )
      await createFile(
        `dto/${moduleName}-page.dto.ts`,
        ejs.render(templatePath(`dto/page.dto`), data),
      )
      // ------------- entities --------------
      await createFile(
        `entities/${moduleName}.entity.ts`,
        ejs.render(templatePath(`entities/entity`), data),
      )
      // ------------- controller --------------
      await createFile(
        `${moduleName}.controller.ts`,
        ejs.render(templatePath(`controller`), data),
      )
      // ------------- module --------------
      await createFile(
        `${moduleName}.module.ts`,
        ejs.render(templatePath(`module`), data),
      )
      // ------------- service --------------
      await createFile(
        `${moduleName}.service.ts`,
        ejs.render(templatePath(`service`), data),
      )
      vscode.window.showInformationMessage(`success`)
    }
    catch (error) {
      vscode.window.showErrorMessage(`创建失败: ${error}`)
    }
  })
  return disposable
}
