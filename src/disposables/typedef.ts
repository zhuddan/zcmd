import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as vscode from 'vscode'

type JsonValue = string | number | boolean | null | JsonObject | JsonArray
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[]

interface TypeDefInfo {
  name: string
  content: string
}

class JsonToTypedef {
  private typedefMap: Map<string, TypeDefInfo> = new Map()
  private usedNames: Set<string> = new Set()

  generateTypedefs(obj: JsonObject, mainTypeName: string = 'TypeDef'): string {
    this.typedefMap.clear()
    this.usedNames.clear()

    this.processObject(obj, mainTypeName)

    // Sort typedefs to ensure nested types come before their parents
    const sortedTypedefs = Array.from(this.typedefMap.values())
      .sort((a, b) => {
        const aHasB = a.content.includes(b.name)
        const bHasA = b.content.includes(a.name)
        if (aHasB)
          return 1
        if (bHasA)
          return -1
        return 0
      })

    return sortedTypedefs.map(info => info.content).join('\n\n')
  }

  private getTypeName(baseName: string): string {
    let name = baseName
    let counter = 1

    while (this.usedNames.has(name)) {
      name = `${baseName}_${counter}`
      counter++
    }

    this.usedNames.add(name)
    return name
  }

  private getPropertyType(value: JsonValue, parentTypeName: string, propertyName: string): string {
    if (value === null)
      return 'null'
    if (Array.isArray(value)) {
      const itemType = value.length > 0 ? this.getPropertyType(value[0], parentTypeName, propertyName) : 'any'
      return `Array<${itemType}>`
    }
    if (typeof value === 'object') {
      const typeName = this.getTypeName(propertyName.charAt(0).toUpperCase() + propertyName.slice(1))
      this.processObject(value as JsonObject, typeName)
      return typeName
    }
    return typeof value
  }

  private processObject(obj: JsonObject, typeName: string) {
    const lines = ['/**']
    lines.push(` * @typedef {object} ${typeName}`)

    Object.entries(obj).forEach(([key, value]) => {
      const type = this.getPropertyType(value, typeName, key)
      lines.push(` * @property {${type}} ${key}`)
    })

    lines.push(' */')

    this.typedefMap.set(typeName, {
      name: typeName,
      content: lines.join('\n'),
    })
  }
}

const converter = new JsonToTypedef()

export default function createTypeDefDisposable() {
  const disposable = vscode.commands.registerCommand('zcmd.type-def', async (
    _uri: vscode.Uri) => {
    const editor = vscode.window.activeTextEditor
    if (editor && editor.selection) {
      // 获取选中的文本
      const selectedText = editor.document.getText(editor.selection)
      if (selectedText) {
        const json = stringToJSON(selectedText)
        if (!json) {
          vscode.window.showWarningMessage('选中文本不是json格式')
          return
        }
        // 获取临时文件路径
        const tempDir = os.tmpdir()
        const tempFilePath = path.join(tempDir, `zcmd.type-def-${Date.now()}.js`)

        // 写入选中的文本到临时文件
        // fs.writeFileSync(tempFilePath, JSON.stringify(json))
        fs.writeFileSync(tempFilePath, converter.generateTypedefs(json))

        // 打开临时文件
        const tempDocument = await vscode.workspace.openTextDocument(tempFilePath)
        // await vscode.workspace.openTextDocument(tempFilePath)
        await vscode.window.showTextDocument(tempDocument, {
          viewColumn: vscode.ViewColumn.Beside,
        })

        // 监听文档关闭事件，关闭时删除临时文件
        vscode.workspace.onDidCloseTextDocument((closedDocument) => {
          if (closedDocument.uri.fsPath === tempFilePath) {
            // 删除临时文件
            try {
              fs.unlinkSync(tempFilePath)
              // console.log(`临时文件已删除: ${tempFilePath}`)
            }
            catch (error) {
              console.error(`删除临时文件时出错: ${error}`)
            }
          }
        })
        vscode.window.showInformationMessage(`JSDoc @typedef 生成成功!`)
      }
      else {
        vscode.window.showWarningMessage('没有选中文本')
      }
    }
    else {
      vscode.window.showWarningMessage('没有打开编辑器或没有选中文本')
    }
  })
  return disposable
}

function stringToJSON(str: any) {
  try {
    // 1. 如果输入的字符串本身就是有效的 JSON，直接解析
    try {
      return JSON.parse(str)
    }
    catch {
      // 继续进行其他处理
    }

    // 2. 移除可能存在的 var x = 这样的前缀
    str = str.replace(/^\s*var\s+\w+\s*=\s*/, '')

    // 3. 处理单引号
    str = str.replace(/'/g, '"')

    // 4. 处理未加引号的键名
    str = str.replace(/(\{|,)\s*(\w+)\s*:/g, '$1"$2":')

    // 5. 处理末尾可能多余的分号
    str = str.replace(/;+$/, '')

    // 6. 尝试解析处理后的字符串
    return JSON.parse(str)
  }
  catch {
    return null
  }
}
