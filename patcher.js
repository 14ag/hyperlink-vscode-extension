const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_DIR = __dirname;
const JS_PATH = path.join(PROJECT_DIR, 'watermark-patch.js');
const CSS_PATH = path.join(PROJECT_DIR, 'watermark-style.css');

function getPaths() {
    const platform = os.platform();
    let vscodePath = '';
    let settingsPath = '';

    if (platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA;
        const appData = process.env.APPDATA;
        vscodePath = path.join(localAppData, 'Programs', 'Microsoft VS Code');
        if (!fs.existsSync(path.join(vscodePath, 'Code.exe'))) {
            vscodePath = 'C:\\Program Files\\Microsoft VS Code';
        }
        settingsPath = path.join(appData, 'Code', 'User', 'settings.json');
    } else if (platform === 'darwin') {
        vscodePath = '/Applications/Visual Studio Code.app/Contents/Resources/app';
        settingsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json');
    } else if (platform === 'linux') {
        vscodePath = '/usr/share/code';
        settingsPath = path.join(os.homedir(), '.config', 'Code', 'User', 'settings.json');
    }

    const workbenchHtml = platform === 'darwin'
        ? path.join(vscodePath, 'out', 'vs', 'code', 'browser', 'workbench', 'workbench.html')
        : path.join(vscodePath, 'resources', 'app', 'out', 'vs', 'code', 'browser', 'workbench', 'workbench.html');

    return { workbenchHtml, settingsPath };
}

function patch() {
    const { workbenchHtml, settingsPath } = getPaths();
    if (!fs.existsSync(workbenchHtml)) throw new Error(`Could not find workbench.html at ${workbenchHtml}`);

    // 1. Patch workbench.html
    let html = fs.readFileSync(workbenchHtml, 'utf8');
    const jsInjection = `<script src="file:///${JS_PATH.replace(/\\/g, '/')}"></script>`;
    const cssInjection = `<link rel="stylesheet" href="file:///${CSS_PATH.replace(/\\/g, '/')}">`;

    if (!html.includes(jsInjection)) {
        const backupPath = workbenchHtml + '.bak';
        if (!fs.existsSync(backupPath)) fs.copyFileSync(workbenchHtml, backupPath);

        html = html.replace('</body>', `${cssInjection}${jsInjection}</body>`);
        fs.writeFileSync(workbenchHtml, html, 'utf8');
        console.log('Patched workbench.html');
    }

    // 2. Patch settings.json
    if (fs.existsSync(settingsPath)) {
        let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const jsUrl = `file:///${JS_PATH.replace(/\\/g, '/')}`;
        const cssUrl = `file:///${CSS_PATH.replace(/\\/g, '/')}`;

        settings['vscode_custom_css.imports'] = settings['vscode_custom_css.imports'] || [];
        if (!settings['vscode_custom_css.imports'].includes(jsUrl)) settings['vscode_custom_css.imports'].push(jsUrl);
        if (!settings['vscode_custom_css.imports'].includes(cssUrl)) settings['vscode_custom_css.imports'].push(cssUrl);
        settings['vscode_custom_css.policy'] = true;

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf8');
        console.log('Updated settings.json');
    }
}

function unpatch() {
    const { workbenchHtml, settingsPath } = getPaths();

    // 1. Unpatch workbench.html
    if (fs.existsSync(workbenchHtml)) {
        let html = fs.readFileSync(workbenchHtml, 'utf8');
        const jsInjectionPattern = /<script src="file:\/\/\/.*?watermark-patch\.js"><\/script>/g;
        const cssInjectionPattern = /<link rel="stylesheet" href="file:\/\/\/.*?watermark-style\.css">/g;

        html = html.replace(jsInjectionPattern, '').replace(cssInjectionPattern, '');
        fs.writeFileSync(workbenchHtml, html, 'utf8');
        console.log('Unpatched workbench.html');
    }

    // 2. Unpatch settings.json
    if (fs.existsSync(settingsPath)) {
        let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const jsUrlPart = 'watermark-patch.js';
        const cssUrlPart = 'watermark-style.css';

        if (settings['vscode_custom_css.imports']) {
            settings['vscode_custom_css.imports'] = settings['vscode_custom_css.imports'].filter(item =>
                !item.includes(jsUrlPart) && !item.includes(cssUrlPart)
            );
            if (settings['vscode_custom_css.imports'].length === 0) delete settings['vscode_custom_css.imports'];
        }

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), 'utf8');
        console.log('Cleaned up settings.json');
    }
}

const args = process.argv.slice(2);
if (args[0] === 'patch') {
    patch();
} else if (args[0] === 'unpatch') {
    unpatch();
}

module.exports = { patch, unpatch };
