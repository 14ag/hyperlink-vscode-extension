const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const patcher = require(path.join(__dirname, '..', '..', 'patcher'));

describe('Whitebox: patcher.js', function () {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hl-test-'));
    const workbenchHtml = path.join(tmpDir, 'workbench.html');
    const settingsPath = path.join(tmpDir, 'settings.json');

    before(function () {
        // setup minimal html and settings
        fs.writeFileSync(workbenchHtml, '<html><body>hello</body></html>', 'utf8');
        fs.writeFileSync(settingsPath, JSON.stringify({}), 'utf8');
    });

    it('patch should inject css and js and update settings', function () {
        patcher.patch({ workbenchHtml, settingsPath });

        const html = fs.readFileSync(workbenchHtml, 'utf8');
        assert.ok(html.includes('watermark-style.css'));
        assert.ok(html.includes('watermark-patch.js'));

        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        assert.ok(settings['vscode_custom_css.imports']);
        const hasJs = settings['vscode_custom_css.imports'].some(i => i.includes('watermark-patch.js'));
        const hasCss = settings['vscode_custom_css.imports'].some(i => i.includes('watermark-style.css'));
        assert.ok(hasJs && hasCss, 'settings should reference js and css imports');
        assert.strictEqual(settings['vscode_custom_css.policy'], true);
    });

    it('unpatch should remove injected references', function () {
        patcher.unpatch({ workbenchHtml, settingsPath });

        const html = fs.readFileSync(workbenchHtml, 'utf8');
        assert.ok(!html.includes('watermark-style.css'));
        assert.ok(!html.includes('watermark-patch.js'));

        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const imports = settings['vscode_custom_css.imports'] || [];
        const stillHas = imports.some(i => i.includes('watermark-patch.js') || i.includes('watermark-style.css'));
        assert.ok(!stillHas, 'settings should not reference watermark assets');
    });
});
