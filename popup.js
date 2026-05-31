document.addEventListener('DOMContentLoaded', async function() {
    // 1. Get background page context synchronously
    const bg = browser.extension.getBackgroundPage();

    const statusPulse = document.getElementById('status-pulse');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');
    const progressPanel = document.getElementById('progress-panel');
    const progressText = document.getElementById('progress-text');
    const btnSortSelected = document.getElementById('btn-sort-selected');
    const btnSortUnread = document.getElementById('btn-sort-unread');
    const activeModelSpan = document.getElementById('active-model');
    const openSettingsLink = document.getElementById('open-settings');
    const viewHistoryLink = document.getElementById('view-history');

    // 2. Load active provider/model in footer
    async function loadActiveModelInfo() {
        const result = await browser.storage.local.get(['aiProvider', 'geminiModel', 'geminiCustomModel', 'ollamaModel']);
        const provider = result.aiProvider || 'gemini';
        
        let modelText = 'Unknown';
        if (provider === 'gemini') {
            const geminiModel = result.geminiModel || 'gemini-2.5-flash';
            if (geminiModel === 'custom') {
                modelText = result.geminiCustomModel ? `Gemini (${result.geminiCustomModel})` : 'Gemini (Custom)';
            } else {
                modelText = `Gemini (${geminiModel})`;
            }
        } else if (provider === 'ollama') {
            modelText = result.ollamaModel ? `Ollama (${result.ollamaModel})` : 'Ollama';
        } else {
            modelText = provider.charAt(0).toUpperCase() + provider.slice(1);
        }
        
        activeModelSpan.textContent = modelText;
    }

    // 3. Status Polling Loop
    function pollStatus() {
        if (!bg || !bg.appStatus) return;

        const currentStatus = bg.appStatus;
        
        // Update Title & Message
        statusTitle.textContent = currentStatus.title || 'AutoSort+ Ready';
        statusMessage.textContent = currentStatus.message || 'Select emails and click sort below';

        // Update Pulse Indicator Casing
        statusPulse.className = 'pulse-indicator';
        if (currentStatus.state === 'processing') {
            statusPulse.classList.add('pulse-processing');
            progressPanel.style.display = 'flex';
            progressText.textContent = currentStatus.message || 'Analyzing...';
            
            // Disable action buttons during processing
            btnSortSelected.classList.add('disabled');
            btnSortSelected.disabled = true;
            btnSortUnread.classList.add('disabled');
            btnSortUnread.disabled = true;
        } else if (currentStatus.state === 'completed') {
            statusPulse.classList.add('pulse-completed');
            progressPanel.style.display = 'none';
            
            btnSortSelected.classList.remove('disabled');
            btnSortSelected.disabled = false;
            btnSortUnread.classList.remove('disabled');
            btnSortUnread.disabled = false;
        } else if (currentStatus.state === 'warning') {
            statusPulse.classList.add('pulse-warning');
            progressPanel.style.display = 'none';
            
            btnSortSelected.classList.remove('disabled');
            btnSortSelected.disabled = false;
            btnSortUnread.classList.remove('disabled');
            btnSortUnread.disabled = false;
        } else {
            statusPulse.classList.add('pulse-idle');
            progressPanel.style.display = 'none';
            
            btnSortSelected.classList.remove('disabled');
            btnSortSelected.disabled = false;
            btnSortUnread.classList.remove('disabled');
            btnSortUnread.disabled = false;
        }
    }

    // Initialize polling
    await loadActiveModelInfo();
    pollStatus();
    setInterval(pollStatus, 800); // Poll status every 800ms for responsiveness

    // 4. Quick Action Button Event Listeners
    btnSortSelected.addEventListener('click', async () => {
        if (btnSortSelected.classList.contains('disabled')) return;
        
        statusTitle.textContent = 'Initiating Sort...';
        statusMessage.textContent = 'Querying highlighted messages';
        statusPulse.className = 'pulse-indicator pulse-processing';
        
        try {
            // Trigger background execution helper
            if (bg && typeof bg.runAutoSortOnSelected === 'function') {
                bg.runAutoSortOnSelected();
            } else {
                throw new Error('Background runner not initialized');
            }
        } catch (err) {
            statusTitle.textContent = 'Sorting Error';
            statusMessage.textContent = err.message;
            statusPulse.className = 'pulse-indicator pulse-warning';
        }
    });

    btnSortUnread.addEventListener('click', async () => {
        if (btnSortUnread.classList.contains('disabled')) return;
        
        statusTitle.textContent = 'Scanning Folder...';
        statusMessage.textContent = 'Finding unread messages';
        statusPulse.className = 'pulse-indicator pulse-processing';
        
        try {
            if (bg && typeof bg.runAutoSortOnUnread === 'function') {
                bg.runAutoSortOnUnread();
            } else {
                throw new Error('Background runner not initialized');
            }
        } catch (err) {
            statusTitle.textContent = 'Sorting Error';
            statusMessage.textContent = err.message;
            statusPulse.className = 'pulse-indicator pulse-warning';
        }
    });

    // 5. Settings / Navigation Links
    openSettingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        try {
            browser.tabs.create({ url: browser.runtime.getURL("options.html") });
        } catch (err) {
            browser.runtime.openOptionsPage();
        }
        window.close(); // Close popup
    });

    viewHistoryLink.addEventListener('click', (e) => {
        e.preventDefault();
        try {
            browser.tabs.create({ url: browser.runtime.getURL("options.html#history-settings") });
        } catch (err) {
            browser.runtime.openOptionsPage();
        }
        window.close();
    });
});
