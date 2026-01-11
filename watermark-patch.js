(function () {
    const COMMAND_MAP = {
        'Show All Commands': 'workbench.action.showCommands',
        'Open File': 'workbench.action.files.openFile',
        'Open Folder': 'workbench.action.files.openFolder',
        'Open Recent': 'workbench.action.openRecent'
    };

    function patchWatermark() {
        const watermarkLabels = document.querySelectorAll('.part.editor .empty-label .watermark-label');
        watermarkLabels.forEach(label => {
            if (label.querySelector('.custom-hyperlink')) return;

            const text = label.textContent.trim();
            const commandId = COMMAND_MAP[text];

            if (commandId) {
                const wrapper = document.createElement('span');
                wrapper.className = 'custom-hyperlink';
                wrapper.textContent = text;
                wrapper.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Using the command URI scheme as a reliable way to trigger commands from the renderer
                    const uri = `command:${commandId}`;
                    const link = document.createElement('a');
                    link.href = uri;
                    link.click();
                };

                label.innerHTML = '';
                label.appendChild(wrapper);
            }
        });
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                patchWatermark();
                break;
            }
        }
    });

    const workbench = document.querySelector('.monaco-workbench');
    if (workbench) {
        observer.observe(workbench, {
            childList: true,
            subtree: true
        });
        // Initial run
        patchWatermark();
    }
})();
