import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as vscode from 'vscode'

export async function createTempFile(
  filename: string,
  data: string,
) {
  const tempDir = os.tmpdir()
  const ext = path.extname(filename)
  const tempFilePath = path.join(tempDir, filename.replace(
    ext,
    `.${Date.now()}${ext}`,
  ))

  fs.writeFileSync(
    tempFilePath,
    data,
  )

  // 打开临时文件
  const tempDocument = await vscode.workspace.openTextDocument(tempFilePath)

  await vscode.window.showTextDocument(tempDocument, {
    viewColumn: vscode.ViewColumn.Beside,
  })

  vscode.workspace.onDidCloseTextDocument((closedDocument) => {
    if (closedDocument.uri.fsPath === tempFilePath) {
      // 删除临时文件
      try {
        fs.unlinkSync(tempFilePath)
      }
      catch (error) {
        console.error(`删除临时文件时出错: ${error}`)
      }
    }
  })
}
