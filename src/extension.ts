import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('zcmd.create-taro-page', async (uri: vscode.Uri) => {
        // 获取目标目录
        let targetDir: string;
        if (uri) {
            // 从右键菜单获取目录
            targetDir = uri.fsPath;
            // 如果点击的是文件而不是文件夹，获取其所在目录
            if (!fs.lstatSync(targetDir).isDirectory()) {
                targetDir = path.dirname(targetDir);
            }
        } else {
            // 如果没有右键选择目录，使用工作区根目录
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('请打开一个工作目录');
                return;
            }
            targetDir = workspaceFolder.uri.fsPath;
        }

        // 获取页面名称
        const pageName = await vscode.window.showInputBox({
            prompt: '请输入页面名称',
            placeHolder: 'home'
        });

        if (!pageName) {
            return;
        }

        // 创建文件内容
        const tsxContent = `import { View } from '@tarojs/components';
import { useLoad } from '@tarojs/taro';
import './${pageName}.scss';

export default function Page() {
  useLoad(() => {
    console.log('Page loaded');
  });

  return (
    <View className="${pageName}-container">
      
    </View>
  );
}`;

        const configContent = `export default {
  navigationBarTitleText: '${pageName}',
  navigationBarBackgroundColor: '#fff',
  navigationBarTextStyle: 'black',
} as const;`;

        const scssContent = `.${pageName}-container {
  
}`;

        try {
            const pageDir = path.join(targetDir, pageName);

            // 创建目录
            // if (!fs.existsSync(pageDir)) {
            //     fs.mkdirSync(pageDir, { recursive: true });
            // }

            // 创建文件
            fs.writeFileSync(path.join(targetDir, pageName+'.tsx'), tsxContent);
            fs.writeFileSync(path.join(targetDir, pageName+'.config.ts'), configContent);
            fs.writeFileSync(path.join(targetDir, pageName+'.scss'), scssContent);

            vscode.window.showInformationMessage(`成功创建页面: ${pageName}`);

            // 打开创建的文件
            const tsxFile = vscode.Uri.file(path.join(targetDir, pageName+'.tsx'));
            await vscode.workspace.openTextDocument(tsxFile);
            await vscode.window.showTextDocument(tsxFile);
        } catch (error) {
            vscode.window.showErrorMessage(`创建页面失败: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
