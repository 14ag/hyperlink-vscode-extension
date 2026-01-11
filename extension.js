const vscode = require('vscode');
const path = require('path');
const patcher = require('./patcher');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Hyperlink VS Code extension is now active!');

    // Function to run the patch
    const runPatch = () => {
        try {
            patcher.patch();
            vscode.window.showInformationMessage('Watermark patch checked/applied successfully! Please restart VS Code.');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to apply watermark patch: ${error.message}. You might need to run VS Code as Administrator.`);
        }
    };

    // Function to run the unpatch
    const runUnpatch = () => {
        try {
            patcher.unpatch();
            vscode.window.showInformationMessage('Watermark patch removed successfully! Please restart VS Code.');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to remove watermark patch: ${error.message}. You might need to run VS Code as Administrator.`);
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
