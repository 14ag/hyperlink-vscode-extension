const vscode = require('vscode');
const path = require('path');
const patcher = require('./patcher');

let outputChannel;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    outputChannel = vscode.window.createOutputChannel('Hyperlink Watermark');
    outputChannel.appendLine('Hyperlink VS Code extension is now active!');

    const restartAction = 'Restart VS Code';

    // Function to run the patch
    const runPatch = () => {
        outputChannel.appendLine('Attempting to apply watermark patch...');
        try {
            patcher.patch();
            outputChannel.appendLine('Patch applied successfully.');
            vscode.window.showInformationMessage('Watermark patch applied successfully!', restartAction).then(selection => {
                if (selection === restartAction) {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
        } catch (error) {
            outputChannel.appendLine(`Error: ${error.message}`);
            if (error.code === 'EPERM' || error.code === 'EACCES') {
                vscode.window.showErrorMessage('Permission denied. Please run VS Code as Administrator to apply the patch.');
            } else {
                vscode.window.showErrorMessage(`Failed to apply watermark patch: ${error.message}`);
            }
        }
    };

    // Function to run the unpatch
    const runUnpatch = () => {
        outputChannel.appendLine('Attempting to remove watermark patch...');
        try {
            patcher.unpatch();
            outputChannel.appendLine('Patch removed successfully.');
            vscode.window.showInformationMessage('Watermark patch removed successfully!', restartAction).then(selection => {
                if (selection === restartAction) {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
        } catch (error) {
            outputChannel.appendLine(`Error: ${error.message}`);
            if (error.code === 'EPERM' || error.code === 'EACCES') {
                vscode.window.showErrorMessage('Permission denied. Please run VS Code as Administrator to remove the patch.');
            } else {
                vscode.window.showErrorMessage(`Failed to remove watermark patch: ${error.message}`);
            }
        }
    };

    // 1. Check version on startup
    const lastVersion = context.globalState.get('lastVsCodeVersion');
    const currentVersion = vscode.version;

    if (lastVersion !== currentVersion) {
        vscode.window.showInformationMessage(`VS Code updated to ${currentVersion}. Re-applying watermark patch...`);
        runPatch();
        context.globalState.update('lastVsCodeVersion', currentVersion);
    }

    // 2. Register commands
    context.subscriptions.push(vscode.commands.registerCommand('hyperlink-vscode-extension.patch', runPatch));
    context.subscriptions.push(vscode.commands.registerCommand('hyperlink-vscode-extension.unpatch', runUnpatch));
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
};
