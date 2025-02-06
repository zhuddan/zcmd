import fs from 'node:fs'
import path from 'node:path'
import * as ejs from 'ejs'
import * as vscode from 'vscode'

export default function createTaroPageDisposable() {
  const disposable = vscode.commands.registerCommand('zcmd.create-taro-page', async (uri: vscode.Uri) => {
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

    // 获取页面名称
    const pageName = await vscode.window.showInputBox({
      prompt: '请输入页面名称',
      placeHolder: 'index',
    })

    if (!pageName) {
      return
    }

    try {
      createTaroPage(targetDir, pageName)

      vscode.window.showInformationMessage(`成功创建页面: ${pageName}`)
      // 打开创建的文件
      const tsxFile = vscode.Uri.file(path.join(targetDir, `${pageName}.tsx`))
      await vscode.workspace.openTextDocument(tsxFile)
      await vscode.window.showTextDocument(tsxFile)
    }
    catch (error) {
      vscode.window.showErrorMessage(`创建页面失败: ${error}`)
    }
  })
  return disposable
}

function createTaroPage(targetDir: string, pageName: string) {
  function templatePath(name: string) {
    return fs.readFileSync(
      path.resolve(
        __dirname,
        './template/create-taro-page',
        `${name}.ejs`,
      ),
      'utf-8',
    )
  }


  fs.writeFileSync(
    path.join(targetDir, `${pageName}.tsx`),
    ejs.render(templatePath('page.tsx'), { pageName }),
  )


  fs.writeFileSync(
    path.join(targetDir, `${pageName}.config.ts`),
    ejs.render(templatePath('page.config.ts'), { pageName }),
  )

  fs.writeFileSync(
    path.join(targetDir, `${pageName}.scss`),
    ejs.render(templatePath('page.scss'), { pageName }),
  )
}
