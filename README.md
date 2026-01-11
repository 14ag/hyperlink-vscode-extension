# Hyperlink VS Code Watermark

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/philip.hyperlink-vscode-extension.svg)](https://marketplace.visualstudio.com/items?itemName=philip.hyperlink-vscode-extension)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Transform the hardcoded Visual Studio Code "Watermark" (the text shown in an empty editor area) into interactive hyperlinks.

## Why this extension?
By default, the VS Code watermark strings like "Show All Commands" or "Open File" are static text. This extension performs "deep surgery" on the VS Code workbench to make these strings clickable, allowing you to trigger commands directly from the watermark.

## Features
- **Interactive Links**: "Show All Commands", "Open File", "Open Folder", and "Open Recent" become clickable.
- **Visual Parity**: The links look identical to the original text and only underline on hover.
- **Theme Aware**: Automatically matches your current VS Code theme using internal CSS variables.
- **Self-Healing**: Automatically detects VS Code updates and re-applies the patch on startup.

## How to Use
1. **Install** the extension from the Marketplace.
2. **Restart** VS Code.
3. The extension will automatically attempt to patch the workbench. You may see a UAC/Administrator prompt to allow the modification of system files.
4. If you ever need to manually trigger or remove the patch, use the Command Palette (`Ctrl+Shift+P`):
   - `Apply Watermark Patch`
   - `Remove Watermark Patch (Uninstall)`

## Important Notes
- **Corruption Warning**: Because this extension modifies internal VS Code files, you will see a warning saying "Your installation appears to be corrupt". This is **expected** and safe. You can click "Don't show again".
- **Permissions**: Modifying the workbench requires write access to the VS Code installation directory. You may need to run VS Code as Administrator/Sudo for the patch to be applied.

## Technical Details
This extension uses a Node.js-based patcher to inject custom JavaScript and CSS into the `workbench.html` file of your VS Code installation. It also configures the necessary settings to enable the custom loader.

## License
MIT
