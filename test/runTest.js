const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
    try {
        const workspaceRoot = path.resolve(__dirname, '..');

        // Allow passing the VS Code executable path via env or CLI arg
        let vscodeExecutablePath = process.env.VSCODE_TEST_EXECUTABLE;
        const argIndex = process.argv.indexOf('--vscodeExecutablePath');
        if (argIndex !== -1 && process.argv[argIndex + 1]) {
            vscodeExecutablePath = process.argv[argIndex + 1];
        }

        await runTests({
            extensionDevelopmentPath: workspaceRoot,
            extensionTestsPath: path.join(__dirname, 'suite', 'index.js'),
            vscodeExecutablePath
        });
    } catch (err) {
        console.error('Failed to run tests', err);
        process.exit(1);
    }
}

main();
