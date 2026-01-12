const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const PROJECT_DIR = __dirname;
const JS_PATH = path.join(PROJECT_DIR, 'watermark-patch.js');
const CSS_PATH = path.join(PROJECT_DIR, 'watermark-style.css');

function getPaths() {
    const platform = os.platform();
    let vscodePath = process.env.VSCODE_PATH || '';
    let settingsPath = '';

    if (!vscodePath) {
        try {
            const command = platform === 'win32' ? 'where code' : 'which code';
            const output = execSync(command).toString().trim();
            const codePath = output.split('\r\n')[0];

            if (codePath) {
                let potentialRoot = path.dirname(path.dirname(codePath));

                if (platform === 'win32') {
                    if (fs.existsSync(path.join(potentialRoot, 'resources', 'app'))) {
                        vscodePath = potentialRoot;
                    } else {
                        let dir = path.dirname(codePath);
                        if (fs.existsSync(path.join(dir, 'Code.exe'))) vscodePath = dir;
                        else if (fs.existsSync(path.join(path.dirname(dir), 'Code.exe'))) vscodePath = path.dirname(dir);
                    }
                } else {
                    if (fs.existsSync(path.join(potentialRoot, 'resources', 'app'))) {
                        vscodePath = potentialRoot;
                    }
                }
            }
        } catch (e) { }
    }

    if (platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA;
        const appData = process.env.APPDATA;

        if (!vscodePath) {
            // Try common paths
            const commonPaths = [
                path.join(localAppData, 'Programs', 'Microsoft VS Code'),
                'C:\\Program Files\\Microsoft VS Code',
                path.join(localAppData, 'Programs', 'Antigravity')
            ];
            for (const p of commonPaths) {
                if (fs.existsSync(p)) {
                    vscodePath = p;
                    break;
                }
            }
        }

        // Settings path for Antigravity might be different, but usually it's the same as Code
        settingsPath = path.join(appData, 'Code', 'User', 'settings.json');
        if (!fs.existsSync(settingsPath)) {
            const antigravitySettings = path.join(appData, 'Antigravity', 'User', 'settings.json');
            if (fs.existsSync(antigravitySettings)) settingsPath = antigravitySettings;
        }
    } else if (platform === 'darwin') {
        if (!vscodePath) vscodePath = '/Applications/Visual Studio Code.app/Contents/Resources/app';
        settingsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json');
    } else if (platform === 'linux') {
        if (!vscodePath) vscodePath = '/usr/share/code';
        settingsPath = path.join(os.homedir(), '.config', 'Code', 'User', 'settings.json');
    }

    if (!vscodePath) {
        throw new Error(`Could not detect VS Code installation path. Please set the VSCODE_PATH environment variable.`);
    }

    const potentialHtmlPaths = platform === 'darwin'
        ? [path.join(vscodePath, 'out', 'vs', 'code', 'browser', 'workbench', 'workbench.html')]
        : [
            path.join(vscodePath, 'resources', 'app', 'out', 'vs', 'code', 'browser', 'workbench', 'workbench.html'),
            path.join(vscodePath, 'resources', 'app', 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html'),
            path.join(vscodePath, 'out', 'vs', 'code', 'browser', 'workbench', 'workbench.html'),
            path.join(vscodePath, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html')
        ];

    let workbenchHtml = '';
    for (const p of potentialHtmlPaths) {
        if (fs.existsSync(p)) {
            workbenchHtml = p;
            break;
        }
    }

    if (!workbenchHtml) {
        throw new Error(`Could not find workbench.html in ${vscodePath}. Checked:\n${potentialHtmlPaths.join('\n')}`);
    }

    return { workbenchHtml, settingsPath };
}

function patch(customPaths) {
    const { workbenchHtml, settingsPath } = customPaths || getPaths();
    console.log(`Using workbenchHtml: ${workbenchHtml}`);
    console.log(`Using settingsPath: ${settingsPath}`);

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
    } else {
        console.log(`Settings file not found at ${settingsPath}, skipping settings patch.`);
    }
}

function unpatch(customPaths) {
    const { workbenchHtml, settingsPath } = customPaths || getPaths();

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
    try {
        patch();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
} else if (args[0] === 'unpatch') {
    try {
        unpatch();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

module.exports = { patch, unpatch, getPaths };
