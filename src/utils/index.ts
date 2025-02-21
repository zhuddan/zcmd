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
/**
 * 将字符串转换为大驼峰（PascalCase）格式
 * @param str 输入的字符串
 * @returns 转换后的大驼峰格式字符串
 */
export function toPascalCase(str: string): string {
  // 先将字符串按照 - 或者空格分割
  return str
  // 处理 '-' 和空格的分割
    .split(/[-\s]/)
  // 处理已经是驼峰的情况（如 'loginLog'）
    .join(' ')
  // 按大写字母分割（处理驼峰情况）
    .split(/(?=[A-Z])/)
    .join(' ')
  // 处理每个单词
    .split(' ')
    .map((word) => {
      if (!word)
        return ''
      // 将单词的首字母大写，其余小写
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join('')
}

export function openFileAndSelectWord(filePath: string, word: string) {
  // 打开文件
  vscode.workspace.openTextDocument(filePath).then((document) => {
    vscode.window.showTextDocument(document).then((editor) => {
      // 查找单词的位置
      const text = document.getText()
      const wordIndex = text.indexOf(word)

      if (wordIndex !== -1) {
        // 创建光标位置并选中该单词
        const startPosition = document.positionAt(wordIndex)
        const endPosition = document.positionAt(wordIndex + word.length)
        const selection = new vscode.Selection(startPosition, endPosition)

        // 设置编辑器的选区
        editor.selection = selection
        editor.revealRange(selection) // 可选：让选中的区域可见
      }
    })
  })
}
