const vscode = require('vscode');

/** @type {vscode.WebviewPanel | null} */
let panel = null;

function createDashboard(context) {
  if (panel) return;

  panel = vscode.window.createWebviewPanel(
    'hyperlinkDashboard',
    'Welcome',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  panel.webview.html = getWebviewContent();

  panel.onDidDispose(() => {
    panel = null;
  }, null, context.subscriptions);

  panel.webview.onDidReceiveMessage(async (message) => {
    if (message && message.command) {
      try {
        await vscode.commands.executeCommand(message.command);
      } catch (err) {
        console.error('Command execution failed', err);
      }
    }
  }, null, context.subscriptions);
}

function updateVisibility(context) {
  const editorsOpen = vscode.window.visibleTextEditors.length > 0;
  if (!editorsOpen) {
    // Show dashboard when no editors are open
    createDashboard(context);
  } else {
    if (panel) {
      panel.dispose();
    }
  }
}

function activate(context) {
  context.subscriptions.push(vscode.commands.registerCommand('extension.showDashboard', () => {
    createDashboard(context);
  }));

  // Update on visible editors change
  context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(() => updateVisibility(context)));

  // Update on window state (covers startup)
  updateVisibility(context);
}

function deactivate() {
  if (panel) {
    panel.dispose();
    panel = null;
  }
}

function getWebviewContent() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light dark">
    <title>Welcome</title>
    <style>
      :root {
        color: var(--vscode-editor-foreground);
        background: var(--vscode-editor-background);
      }
      html,body { height:100%; margin:0; }
      body {
        display:flex;
        align-items:center;
        justify-content:center;
        background: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial);
      }
      .container {
        text-align:center;
      }
      .logo { width:96px; height:96px; margin:0 auto 24px; }
      .links { display:flex; flex-direction:column; gap:12px; align-items:center; }
      a.link {
        color: var(--vscode-textLink-foreground);
        text-decoration:none;
        font-size:18px;
      }
      a.link:hover { text-decoration:underline; }
      .hint { color: var(--vscode-editorHint.foreground, rgba(128,128,128,0.7)); margin-left:8px; font-size:13px; }
      .row { display:flex; align-items:center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo" aria-hidden="true">
        <!-- Inline VS Code logo SVG -->
        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="none">
          <rect width="48" height="48" rx="6" fill="var(--vscode-editor-background)" />
          <path d="M9 7v34l14-9 14 9V7L23 16 9 7z" fill="var(--vscode-icon-foreground, #007ACC)" />
        </svg>
      </div>

      <div class="links">
        <div class="row"><a class="link" href="#" data-command="workbench.action.showCommands">Show All Commands</a><span class="hint">Ctrl+Shift+P</span></div>
        <div class="row"><a class="link" href="#" data-command="workbench.action.files.openFile">Open File</a><span class="hint">Ctrl+O</span></div>
        <div class="row"><a class="link" href="#" data-command="workbench.action.files.openFolder">Open Folder</a><span class="hint">Ctrl+K Ctrl+O</span></div>
        <div class="row"><a class="link" href="#" data-command="workbench.action.openRecent">Open Recent</a><span class="hint">Ctrl+R</span></div>
      </div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();

      document.querySelectorAll('a.link').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const cmd = a.getAttribute('data-command');
          if (cmd) {
            vscode.postMessage({ command: cmd });
          }
        });
      });
    </script>
  </body>
</html>`;
}

module.exports = {
  activate,
  deactivate
};
