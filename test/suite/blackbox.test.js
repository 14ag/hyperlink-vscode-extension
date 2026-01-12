const assert = require('assert');
const vscode = require('vscode');

describe('Blackbox: extension activation and commands', function () {
    this.timeout(10000);

    it('activates and registers commands', async function () {
        const ext = vscode.extensions.getExtension('14ag.hlink-dashb');
        assert.ok(ext, 'Extension should be installed in test host');

        await ext.activate();
        assert.ok(ext.isActive, 'Extension should be active after activation');

        const commands = await vscode.commands.getCommands(true);
        const hasPatch = commands.includes('hyperlink-vscode-extension.patch');
        const hasUnpatch = commands.includes('hyperlink-vscode-extension.unpatch');

        assert.ok(hasPatch && hasUnpatch, 'Extension should register patch/unpatch commands');
    });
});
