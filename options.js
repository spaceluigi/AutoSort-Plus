document.addEventListener('DOMContentLoaded', async function() {
    // Initialize collapsible sections
    const sectionHeaders = document.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            const content = document.getElementById(sectionId);
            const section = this.parentElement;
            const icon = this.querySelector('.collapse-icon');
            
            if (section.classList.contains('collapsed')) {
                // Expand
                section.classList.remove('collapsed');
                content.style.display = 'block';
                icon.textContent = '▼';
                // Trigger animation
                setTimeout(() => {
                    content.style.animation = 'slideDown 0.3s ease-out';
                }, 0);
            } else {
                // Collapse
                section.classList.add('collapsed');
                content.style.display = 'none';
                icon.textContent = '▶';
            }
        });
    });
    
    const labelsContainer = document.getElementById('labels-container');
    const addLabelButton = document.getElementById('add-label');
    const saveButton = document.getElementById('save-settings');
    const apiKeyInput = document.getElementById('api-key');
    const aiProviderSelect = document.getElementById('ai-provider');
    const providerInfo = document.getElementById('provider-info');
    const getApiKeyButton = document.getElementById('get-api-key');
    const testApiButton = document.getElementById('test-api');
    const apiTestResult = document.getElementById('api-test-result');
    const geminiPaidContainer = document.getElementById('gemini-paid-container');
    const geminiPaidCheckbox = document.getElementById('gemini-paid-plan');
    const importLabelsButton = document.getElementById('import-labels');
    const bulkImportTextarea = document.getElementById('bulk-import-text');
    const loadImapFoldersButton = document.getElementById('load-imap-folders');
    const folderLoadingIndicator = document.getElementById('folder-loading');
    const folderSelection = document.getElementById('folder-selection');
    const foldersPreview = document.getElementById('folders-preview');
    const folderCount = document.getElementById('folder-count');
    const useImapFoldersButton = document.getElementById('use-imap-folders');
    const useCustomFoldersButton = document.getElementById('use-custom-folders');
    const geminiMultiKeysContainer = document.getElementById('gemini-multi-keys-container');
    const geminiKeysList = document.getElementById('gemini-keys-list');
    const addGeminiKeyButton = document.getElementById('add-gemini-key');
    
    // Ollama-specific elements  
    const ollamaModelSelect = document.getElementById('ollama-model');
    const ollamaCustomModelInput = document.getElementById('ollama-custom-model');
    const ollamaUrlInput = document.getElementById('ollama-url');
    const ollamaAuthTokenInput = document.getElementById('ollama-auth-token');
    const ollamaCpuOnlyCheckbox = document.getElementById('ollama-cpu-only');
    const testOllamaButton = document.getElementById('test-ollama');
    const listOllamaModelsButton = document.getElementById('list-ollama-models');
    const downloadOllamaModelButton = document.getElementById('download-ollama-model');
    const ollamaDownloadModelInput = document.getElementById('ollama-download-model');
    const ollamaDownloadStatus = document.getElementById('ollama-download-status');
    const ollamaTestResult = document.getElementById('ollama-test-result');
    const diagnoseOllamaButton = document.getElementById('diagnose-ollama');
    const ollamaDiagnostics = document.getElementById('ollama-diagnostics');
    
    // Update endpoint URLs when Ollama URL changes
    if (ollamaUrlInput) {
        ollamaUrlInput.addEventListener('input', () => {
            const url = ollamaUrlInput.value.trim() || 'http://localhost:11434';
            const chatEndpoint = document.getElementById('ollama-chat-endpoint');
            const pullEndpoint = document.getElementById('ollama-pull-endpoint');
            const tagsEndpoint = document.getElementById('ollama-tags-endpoint');
            
            if (chatEndpoint) chatEndpoint.textContent = `${url}/api/chat`;
            if (pullEndpoint) pullEndpoint.textContent = `${url}/api/pull`;
            if (tagsEndpoint) tagsEndpoint.textContent = `${url}/api/tags`;
        });
    }
    
    let loadedFolders = [];
    let geminiKeys = []; // Array to store multiple Gemini API keys
    
    // Helper function to escape HTML entities (prevents XSS vulnerabilities)
    function escapeHTML(str) {
        if (str === undefined || str === null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    // AI Provider configurations
    const aiProviders = {
        gemini: {
            name: 'Google Gemini',
            signupUrl: 'https://aistudio.google.com/app/apikey',
            info: '✓ Free tier: 5 requests/minute, 20/day per API key (enforced by addon)<br>✓ Tip: Create multiple API keys in different projects, switch keys when limit reached<br>✓ Check usage: <a href="https://aistudio.google.com/usage" target="_blank">AI Studio Usage</a><br>✓ Best for: General use, multilingual support<br>✓ Models: Gemini 2.5 Flash<br>✓ Check "paid plan" option to remove limits',
            isFree: true
        },
        openai: {
            name: 'OpenAI',
            signupUrl: 'https://platform.openai.com/signup',
            info: '✓ Free trial: $5 credit<br>✓ Best for: High accuracy, English content<br>✓ Models: GPT-4o-mini ($0.15/1M tokens)',
            isFree: false
        },
        anthropic: {
            name: 'Anthropic Claude',
            signupUrl: 'https://console.anthropic.com/',
            info: '✓ Free tier: Limited requests<br>✓ Best for: Long emails, detailed analysis<br>✓ Models: Claude 3 Haiku',
            isFree: true
        },
        groq: {
            name: 'Groq',
            signupUrl: 'https://console.groq.com/',
            info: '✓ Free tier: 30 requests/minute<br>✓ Best for: Speed (fastest)<br>✓ Models: Llama 3.3 (Mixtral deprecated)',
            isFree: true
        },
        mistral: {
            name: 'Mistral AI',
            signupUrl: 'https://console.mistral.ai/',
            info: '✓ Free tier: Limited requests<br>✓ Best for: European users, GDPR compliance<br>✓ Models: Mistral Small',
            isFree: true
        },
        ollama: {
            name: 'Ollama (Local LLM)',
            signupUrl: 'https://ollama.ai/',
            info: '✓ 100% Free: Runs locally on your machine<br>✓ Privacy: No data sent to external servers<br>✓ No rate limits: Process unlimited emails<br>✓ Models: Llama 2/3, Mistral, Phi, Gemma, Qwen, and more<br>✓ Requires: <a href="https://ollama.ai/download" target="_blank">Ollama installed</a> and running locally<br>✓ Setup: Install Ollama, run "ollama pull llama3.2" to download a model',
            isFree: true
        }
    };
    
    // Update provider info when selection changes
    function updateProviderInfo() {
        const provider = aiProviderSelect.value;
        const config = aiProviders[provider];
        
        // Get subsection elements
        const ollamaSubsection = document.getElementById('ollama-settings-subsection');
        const apiKeySubsection = document.getElementById('api-key-subsection');
        const geminiModelSubsection = document.getElementById('gemini-model-subsection');
        const geminiMultiKeysSubsection = document.getElementById('gemini-multi-keys-subsection');
        const geminiUsageSubsection = document.getElementById('gemini-usage-subsection');
        const rateLimitWarning = document.getElementById('rate-limit-warning');
        
        // Show/hide rate limit warning (not for Ollama)
        if (rateLimitWarning) {
            rateLimitWarning.style.display = provider === 'ollama' ? 'none' : 'block';
        }
        
        // Show/hide Gemini-specific elements
        if (provider === 'gemini') {
            geminiPaidContainer.style.display = 'block';
            if (geminiMultiKeysSubsection) geminiMultiKeysSubsection.style.display = 'block';
            if (geminiModelSubsection) geminiModelSubsection.style.display = 'block';
            if (geminiUsageSubsection) geminiUsageSubsection.style.display = 'block';
            if (apiKeySubsection) apiKeySubsection.style.display = 'none';
            if (ollamaSubsection) ollamaSubsection.style.display = 'none';
            updateGeminiUsageDisplay();
        } else if (provider === 'ollama') {
            // Show Ollama settings, hide API key and Gemini sections
            geminiPaidContainer.style.display = 'none';
            if (geminiMultiKeysSubsection) geminiMultiKeysSubsection.style.display = 'none';
            if (geminiModelSubsection) geminiModelSubsection.style.display = 'none';
            if (geminiUsageSubsection) geminiUsageSubsection.style.display = 'none';
            if (apiKeySubsection) apiKeySubsection.style.display = 'none';
            if (ollamaSubsection) ollamaSubsection.style.display = 'block';
        } else {
            geminiPaidContainer.style.display = 'none';
            if (geminiMultiKeysSubsection) geminiMultiKeysSubsection.style.display = 'none';
            if (geminiModelSubsection) geminiModelSubsection.style.display = 'none';
            if (geminiUsageSubsection) geminiUsageSubsection.style.display = 'none';
            if (apiKeySubsection) apiKeySubsection.style.display = 'block';
            if (ollamaSubsection) ollamaSubsection.style.display = 'none';
        }
        
        providerInfo.innerHTML = `
            <div class="provider-details">
                <strong>${config.name}</strong> ${config.isFree ? '<span class="free-badge">FREE</span>' : '<span class="paid-badge">PAID</span>'}
                <p>${config.info}</p>
            </div>
        `;
        
        if (provider !== 'ollama') {
            apiKeyInput.placeholder = `Enter your ${config.name} API key`;
        }
    }
    
    // Update Gemini usage display
    async function updateGeminiUsageDisplay() {
        const data = await browser.storage.local.get(['geminiRateLimits', 'currentGeminiKeyIndex', 'geminiApiKeys', 'geminiRateLimit']);
        const currentIndex = data.currentGeminiKeyIndex || 0;
        const keys = data.geminiApiKeys || geminiKeys;
        
        if (keys.length > 1) {
            // Multi-key mode
            document.getElementById('single-key-usage').style.display = 'none';
            document.getElementById('multi-key-usage').style.display = 'block';
            const rateLimits = data.geminiRateLimits || [];
            updateMultiKeyUsageDisplay(keys, rateLimits, currentIndex);
        } else if (keys.length === 1) {
            // Single-key mode but stored in new format
            document.getElementById('single-key-usage').style.display = 'block';
            document.getElementById('multi-key-usage').style.display = 'none';
            const rateLimits = data.geminiRateLimits || [{ requests: [], dailyCount: 0, dailyResetTime: Date.now() }];
            updateSingleKeyUsageDisplay(rateLimits[0]);
        } else {
            // Legacy single-key mode (backward compatibility)
            document.getElementById('single-key-usage').style.display = 'block';
            document.getElementById('multi-key-usage').style.display = 'none';
            const rateLimit = data.geminiRateLimit || { requests: [], dailyCount: 0, dailyResetTime: Date.now() };
            updateSingleKeyUsageDisplay(rateLimit);
        }
    }
    
    // Update single key usage display (backward compatibility)
    async function updateSingleKeyUsageDisplay(rateLimit) {
        const now = Date.now();
        
        // Update daily count
        document.getElementById('gemini-daily-count').textContent = rateLimit.dailyCount;
        
        // Update last request time
        if (rateLimit.requests && rateLimit.requests.length > 0) {
            const lastRequest = Math.max(...rateLimit.requests);
            const minutesAgo = Math.floor((now - lastRequest) / 60000);
            if (minutesAgo < 1) {
                document.getElementById('gemini-last-request').textContent = 'Just now';
            } else if (minutesAgo < 60) {
                document.getElementById('gemini-last-request').textContent = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
            } else {
                const hoursAgo = Math.floor(minutesAgo / 60);
                document.getElementById('gemini-last-request').textContent = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
            }
        } else {
            document.getElementById('gemini-last-request').textContent = 'Never';
        }
        
        // Update reset time
        if (rateLimit.dailyResetTime > now) {
            const hoursUntil = Math.ceil((rateLimit.dailyResetTime - now) / (1000 * 60 * 60));
            document.getElementById('gemini-reset-time').textContent = `In ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`;
        } else {
            document.getElementById('gemini-reset-time').textContent = 'Expired (will reset on next request)';
        }
        
        // Update status and show warnings
        const usageMessage = document.getElementById('usage-message');
        const statusSpan = document.getElementById('gemini-status');
        
        if (rateLimit.dailyCount >= 20) {
            statusSpan.textContent = '🔴 Limit Reached';
            statusSpan.style.color = '#dc3545';
            usageMessage.className = 'usage-message warning';
            usageMessage.textContent = '⚠️ Daily limit reached! Create a new API key in a different project and update it above to continue processing emails.';
        } else if (rateLimit.dailyCount >= 15) {
            statusSpan.textContent = '🟡 Nearly Full';
            statusSpan.style.color = '#ffc107';
            usageMessage.className = 'usage-message warning';
            usageMessage.textContent = `⚠️ Only ${20 - rateLimit.dailyCount} requests remaining today. Consider switching to a new API key soon.`;
        } else {
            statusSpan.textContent = '🟢 Ready';
            statusSpan.style.color = '#28a745';
            usageMessage.style.display = 'none';
        }
    }
    
    // Update multi-key usage display
    function updateMultiKeyUsageDisplay(keys, rateLimits, currentIndex) {
        const container = document.getElementById('all-keys-usage-stats');
        const now = Date.now();
        container.innerHTML = '';
        
        keys.forEach((key, index) => {
            const rateLimit = rateLimits[index] || { requests: [], dailyCount: 0, dailyResetTime: now };
            const isActive = index === currentIndex;
            
            const card = document.createElement('div');
            card.className = `key-usage-card${isActive ? ' active' : ''}`;
            
            // Determine status
            let statusBadge = '';
            if (isActive) {
                statusBadge = '<span class="key-status active">🔵 ACTIVE</span>';
            } else if (rateLimit.dailyCount >= 20) {
                statusBadge = '<span class="key-status limit">🔴 LIMIT</span>';
            } else if (rateLimit.dailyCount >= 15) {
                statusBadge = '<span class="key-status warning">🟡 NEAR LIMIT</span>';
            } else {
                statusBadge = '<span class="key-status ready">🟢 READY</span>';
            }
            
            // Calculate reset time
            let resetText = '--';
            if (rateLimit.dailyResetTime > now) {
                const hoursUntil = Math.ceil((rateLimit.dailyResetTime - now) / (1000 * 60 * 60));
                resetText = `${hoursUntil}h`;
            }
            
            // Last request time
            let lastRequestText = 'Never';
            if (rateLimit.requests && rateLimit.requests.length > 0) {
                const lastRequest = Math.max(...rateLimit.requests);
                const minutesAgo = Math.floor((now - lastRequest) / 60000);
                if (minutesAgo < 1) {
                    lastRequestText = 'Just now';
                } else if (minutesAgo < 60) {
                    lastRequestText = `${minutesAgo}m ago`;
                } else {
                    lastRequestText = `${Math.floor(minutesAgo / 60)}h ago`;
                }
            }
            
            // Mask key for display
            const maskedKey = key ? `...${key.slice(-8)}` : 'Not set';
            
            card.textContent = '';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'key-header';
            
            const keyTitleSpan = document.createElement('span');
            keyTitleSpan.className = 'key-title';
            keyTitleSpan.textContent = `Key ${index + 1}: ${maskedKey}`;
            
            const badgeSpan = document.createElement('span');
            if (isActive) {
                badgeSpan.className = 'key-status active';
                badgeSpan.textContent = '🔵 ACTIVE';
            } else if (rateLimit.dailyCount >= 20) {
                badgeSpan.className = 'key-status limit';
                badgeSpan.textContent = '🔴 LIMIT';
            } else if (rateLimit.dailyCount >= 15) {
                badgeSpan.className = 'key-status warning';
                badgeSpan.textContent = '🟡 NEAR LIMIT';
            } else {
                badgeSpan.className = 'key-status ready';
                badgeSpan.textContent = '🟢 READY';
            }
            
            headerDiv.appendChild(keyTitleSpan);
            headerDiv.appendChild(badgeSpan);
            
            const statsDiv = document.createElement('div');
            statsDiv.className = 'key-stats';
            
            const addStatItem = (label, value) => {
                const item = document.createElement('div');
                item.className = 'stat-item';
                
                const labelSpan = document.createElement('span');
                labelSpan.className = 'stat-label';
                labelSpan.textContent = label;
                
                const valueSpan = document.createElement('span');
                valueSpan.className = 'stat-value';
                valueSpan.textContent = value;
                
                item.appendChild(labelSpan);
                item.appendChild(valueSpan);
                statsDiv.appendChild(item);
            };
            
            addStatItem('Usage:', `${rateLimit.dailyCount}/20`);
            addStatItem('Last:', lastRequestText);
            addStatItem('Resets:', resetText);
            addStatItem('Available:', (20 - rateLimit.dailyCount).toString());
            
            card.appendChild(headerDiv);
            card.appendChild(statsDiv);
            
            container.appendChild(card);
        });
    }
    
    // Add Gemini key input field
    function addGeminiKeyInput(value = '', index = -1) {
        if (index === -1) {
            index = geminiKeys.length;
            geminiKeys.push(value);
        }
        
        const keyItem = document.createElement('div');
        keyItem.className = 'gemini-key-item';
        keyItem.dataset.index = index;
        
        const keyIndex = document.createElement('span');
        keyIndex.className = 'key-index';
        keyIndex.textContent = `#${index + 1}`;
        
        const input = document.createElement('input');
        input.type = 'password';
        input.className = 'gemini-api-key-input';
        input.placeholder = 'Enter Gemini API key from another project';
        input.value = value;
        input.dataset.index = index;
        input.addEventListener('input', (e) => {
            const newKey = e.target.value.trim();
            geminiKeys[index] = newKey;
            
            // Check for duplicates in real-time
            if (newKey) {
                const isDuplicate = geminiKeys.some((key, i) => i !== index && key.trim() === newKey);
                if (isDuplicate) {
                    input.style.borderColor = '#dc3545';
                    input.title = '⚠️ This key is already added!';
                } else {
                    input.style.borderColor = '';
                    input.title = '';
                }
            } else {
                input.style.borderColor = '';
                input.title = '';
            }
        });
        
        const testButton = document.createElement('button');
        testButton.className = 'button';
        testButton.textContent = 'Test';
        testButton.addEventListener('click', () => {
            const keyValue = input.value.trim();
            if (!keyValue) {
                statusSpan.textContent = '⚠️ Enter key first';
                statusSpan.className = 'key-test-result error';
                return;
            }
            
            // Check for duplicates before testing
            const isDuplicate = geminiKeys.some((key, i) => i !== index && key.trim() === keyValue);
            if (isDuplicate) {
                statusSpan.textContent = '⚠️ Duplicate key';
                statusSpan.className = 'key-test-result error';
                statusSpan.title = 'This key is already added in the list';
                return;
            }
            
            testGeminiKey(keyValue, index, keyItem);
        });
        
        const removeButton = document.createElement('button');
        removeButton.className = 'button';
        removeButton.textContent = '×';
        removeButton.addEventListener('click', () => removeGeminiKey(index));
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'key-test-result';
        statusSpan.dataset.index = index;
        
        keyItem.appendChild(keyIndex);
        keyItem.appendChild(input);
        keyItem.appendChild(testButton);
        keyItem.appendChild(removeButton);
        keyItem.appendChild(statusSpan);
        geminiKeysList.appendChild(keyItem);
    }
    
    // Remove Gemini key
    function removeGeminiKey(index) {
        if (geminiKeys.length <= 1) {
            alert('You must have at least one API key configured.');
            return;
        }
        
        if (confirm(`Remove API key #${index + 1}?`)) {
            geminiKeys.splice(index, 1);
            refreshGeminiKeysList();
        }
    }
    
    // Refresh Gemini keys list display
    function refreshGeminiKeysList() {
        geminiKeysList.innerHTML = '';
        geminiKeys.forEach((key, index) => {
            addGeminiKeyInput(key, index);
        });
    }
    
    // Test individual Gemini key
    async function testGeminiKey(apiKey, index, keyItemElement) {
        const statusSpan = keyItemElement.querySelector('.key-test-result');
        
        if (!apiKey) {
            statusSpan.textContent = '⚠️ Enter key first';
            statusSpan.className = 'key-test-result error';
            return;
        }
        
        try {
            statusSpan.textContent = 'Testing...';
            statusSpan.className = 'key-test-result testing';
            
            const geminiModelSelectElement = document.getElementById('gemini-model');
            const geminiCustomModelInputElement = document.getElementById('gemini-custom-model');
            
            let modelToUse = 'gemini-2.5-flash';
            if (geminiModelSelectElement) {
                if (geminiModelSelectElement.value === 'custom' && geminiCustomModelInputElement && geminiCustomModelInputElement.value.trim()) {
                    modelToUse = geminiCustomModelInputElement.value.trim();
                } else {
                    modelToUse = geminiModelSelectElement.value;
                }
            }
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Test" }] }],
                    generationConfig: { maxOutputTokens: 10 }
                })
            });
            
            if (response.ok) {
                statusSpan.textContent = '✓ Valid';
                statusSpan.className = 'key-test-result success';
            } else if (response.status === 429) {
                statusSpan.textContent = '⚠️ Limit reached';
                statusSpan.className = 'key-test-result error';
                statusSpan.title = 'This key has reached its daily rate limit (20/day). Will reset in ~24 hours.';
                console.error('Key #%d has reached rate limit (429)', index + 1);
            } else if (response.status === 401 || response.status === 403) {
                statusSpan.textContent = '✗ Invalid key';
                statusSpan.className = 'key-test-result error';
                statusSpan.title = 'API key is invalid or expired. Check your key in Google AI Studio.';
                console.error('Key #%d test failed: %s', index + 1, response.status);
            } else {
                statusSpan.textContent = `✗ Failed (${response.status})`;
                statusSpan.className = 'key-test-result error';
                console.error('Key #%d test failed:', index + 1, response.status);
            }
        } catch (error) {
            statusSpan.textContent = `✗ Error`;
            statusSpan.className = 'key-test-result error';
            console.error('Key #%d test error:', index + 1, error);
        }
    }
    
    // Initialize provider info
    updateProviderInfo();
    aiProviderSelect.addEventListener('change', updateProviderInfo);
    
    // Google Model selector change listener
    const geminiModelSelect = document.getElementById('gemini-model');
    const geminiCustomModelInput = document.getElementById('gemini-custom-model');
    if (geminiModelSelect && geminiCustomModelInput) {
        geminiModelSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                geminiCustomModelInput.style.display = 'block';
            } else {
                geminiCustomModelInput.style.display = 'none';
            }
        });
    }
    
    // Add Gemini key button
    addGeminiKeyButton.addEventListener('click', () => {
        addGeminiKeyInput('');
    });
    
    // Reset Gemini counter button
    document.getElementById('reset-gemini-counter').addEventListener('click', async () => {
        if (confirm('Reset usage counter? Do this only after switching to a new API key.')) {
            await browser.storage.local.set({ 
                geminiRateLimit: { 
                    requests: [], 
                    dailyCount: 0, 
                    dailyResetTime: Date.now() + (24 * 60 * 60 * 1000)
                } 
            });
            await updateGeminiUsageDisplay();
            const usageMessage = document.getElementById('usage-message');
            usageMessage.className = 'usage-message info';
            usageMessage.textContent = '✓ Usage counter reset. You can now process up to 20 more emails today with your new API key.';
        }
    });
    
    // Refresh usage button (single key)
    document.getElementById('refresh-usage').addEventListener('click', async () => {
        await updateGeminiUsageDisplay();
        const usageMessage = document.getElementById('usage-message');
        usageMessage.className = 'usage-message info';
        usageMessage.textContent = '✓ Usage information refreshed.';
        setTimeout(() => {
            if (usageMessage.classList.contains('info')) {
                usageMessage.style.display = 'none';
            }
        }, 3000);
    });
    
    // Refresh all usage button (multi key)
    document.getElementById('refresh-all-usage').addEventListener('click', async () => {
        await updateGeminiUsageDisplay();
        showMessage('✓ All usage information refreshed.', true);
    });
    
    // Get API Key button
    getApiKeyButton.addEventListener('click', async () => {
        const provider = aiProviderSelect.value;
        const config = aiProviders[provider];
        
        try {
            // Try to open in new tab
            await browser.tabs.create({ url: config.signupUrl });
        } catch (error) {
            console.error('Failed to open tab:', error);
            // Fallback: show URL and copy to clipboard
            const url = config.signupUrl;
            try {
                await navigator.clipboard.writeText(url);
                showMessage(`URL copied to clipboard:\n${url}`, true);
            } catch (e) {
                // Last resort: show alert with URL
                alert(`Please visit:\n${url}`);
            }
        }
    });

    // Function to validate and update save button state
    function updateSaveButtonState() {
        const labels = Array.from(document.querySelectorAll('.label-input'))
            .map(input => input.value.trim())
            .filter(label => label !== '');
        
        const provider = aiProviderSelect.value;
        let hasValidApiKey = true; // Default to true for Ollama and other providers
        
        if (provider === 'gemini') {
            const validGeminiKeys = geminiKeys.filter(key => key && key.trim() !== '');
            hasValidApiKey = validGeminiKeys.length > 0;
        } else if (provider !== 'ollama') {
            // Non-Ollama providers (OpenAI, Anthropic, Groq, Mistral) require API key
            const apiKey = apiKeyInput.value.trim();
            hasValidApiKey = !!apiKey;
        }
        // Ollama doesn't require an API key, so hasValidApiKey stays true
        
        if (labels.length === 0 || !hasValidApiKey) {
            saveButton.disabled = true;
            saveButton.classList.add('disabled');
            
            let missingItems = [];
            if (labels.length === 0) missingItems.push('folders/labels');
            if (!hasValidApiKey) missingItems.push('API key');
            
            saveButton.title = `Please configure: ${missingItems.join(' and ')}`;
        } else {
            saveButton.disabled = false;
            saveButton.classList.remove('disabled');
            saveButton.title = '';
        }
    }

    // Load saved settings
    browser.storage.local.get(['labels', 'apiKey', 'geminiApiKeys', 'aiProvider', 'enableAi', 'geminiPaidPlan', 'ollamaUrl', 'ollamaModel', 'ollamaCustomModel', 'ollamaCpuOnly', 'geminiModel', 'geminiCustomModel', 'enableLogging']).then(result => {
        if (result.labels && result.labels.length > 0) {
            result.labels.forEach(label => {
                addLabelInput(label);
            });
        } else {
            // Show instruction if no labels
            labelsContainer.innerHTML = '<div class="instruction-message">No folders/labels configured. Click "Load Folders from Mail Account" above or add custom labels below.</div>';
        }
        
        // Load API keys
        if (result.geminiApiKeys && result.geminiApiKeys.length > 0) {
            // Multi-key mode
            geminiKeys = result.geminiApiKeys;
            geminiKeys.forEach((key, index) => {
                addGeminiKeyInput(key, index);
            });
        } else if (result.apiKey) {
            // Migrate from single key to multi-key
            geminiKeys = [result.apiKey];
            addGeminiKeyInput(result.apiKey, 0);
            apiKeyInput.value = result.apiKey;
        } else {
            // No keys configured yet - add one empty field
            addGeminiKeyInput('', 0);
        }
        
        // Load Ollama settings
        if (result.ollamaUrl && ollamaUrlInput) {
            ollamaUrlInput.value = result.ollamaUrl;
        }
        if (result.ollamaAuthToken && ollamaAuthTokenInput) {
            ollamaAuthTokenInput.value = result.ollamaAuthToken;
        }
        if (result.ollamaModel && ollamaModelSelect) {
            ollamaModelSelect.value = result.ollamaModel;
            if (result.ollamaModel === 'custom' && result.ollamaCustomModel && ollamaCustomModelInput) {
                ollamaCustomModelInput.value = result.ollamaCustomModel;
                ollamaCustomModelInput.style.display = 'block';
            }
        }
        if (ollamaCpuOnlyCheckbox) {
            ollamaCpuOnlyCheckbox.checked = result.ollamaCpuOnly === true;
        }
        
        if (result.aiProvider) {
            aiProviderSelect.value = result.aiProvider;
            updateProviderInfo();
        }
        // Set enableAi to true by default if not set
        document.getElementById('enable-ai').checked = result.enableAi !== false;
        
        // Set gemini paid plan checkbox
        geminiPaidCheckbox.checked = result.geminiPaidPlan === true;
        
        // Load Google model settings
        if (result.geminiModel && document.getElementById('gemini-model')) {
            const geminiModelSelectElement = document.getElementById('gemini-model');
            geminiModelSelectElement.value = result.geminiModel;
            const geminiCustomModelInputElement = document.getElementById('gemini-custom-model');
            if (result.geminiModel === 'custom' && result.geminiCustomModel && geminiCustomModelInputElement) {
                geminiCustomModelInputElement.value = result.geminiCustomModel;
                geminiCustomModelInputElement.style.display = 'block';
            }
        }
        
        // Load detailed logging checkbox
        if (document.getElementById('enable-logging')) {
            document.getElementById('enable-logging').checked = result.enableLogging === true;
        }
        
        updateSaveButtonState();
    });
    
    // Add input listeners for validation
    apiKeyInput.addEventListener('input', updateSaveButtonState);
    labelsContainer.addEventListener('input', updateSaveButtonState);

    // Test API connection
    testApiButton.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const provider = aiProviderSelect.value;
        
        // Skip for Ollama as it has its own test button
        if (provider === 'ollama') {
            showApiTestResult('Please use the "Test Ollama Connection" button below', false);
            return;
        }
        
        if (!apiKey) {
            showApiTestResult('Please enter an API key', false);
            return;
        }

        try {
            showApiTestResult('Testing connection...', false);
            
            let response;
            if (provider === 'gemini') {
                const geminiModelSelectElement = document.getElementById('gemini-model');
                const geminiCustomModelInputElement = document.getElementById('gemini-custom-model');
                
                let modelToUse = 'gemini-2.5-flash';
                if (geminiModelSelectElement) {
                    if (geminiModelSelectElement.value === 'custom' && geminiCustomModelInputElement && geminiCustomModelInputElement.value.trim()) {
                        modelToUse = geminiCustomModelInputElement.value.trim();
                    } else {
                        modelToUse = geminiModelSelectElement.value;
                    }
                }
                
                response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Test" }] }],
                        generationConfig: { maxOutputTokens: 10 }
                    })
                });
            } else if (provider === 'openai') {
                response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [{ role: 'user', content: 'Test' }],
                        max_tokens: 10
                    })
                });
            } else if (provider === 'anthropic') {
                response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-haiku-20240307',
                        messages: [{ role: 'user', content: 'Test' }],
                        max_tokens: 10
                    })
                });
            } else if (provider === 'groq') {
                response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [{ role: 'user', content: 'Test' }],
                        max_tokens: 10
                    })
                });
            } else if (provider === 'mistral') {
                response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'mistral-small-latest',
                        messages: [{ role: 'user', content: 'Test' }],
                        max_tokens: 10
                    })
                });
            }

            if (response.ok) {
                showApiTestResult('✓ API connection successful!', true);
            } else {
                const error = await response.json();
                showApiTestResult(`API Error: ${error.error?.message || error.message || 'Unknown error'}`, false);
            }
        } catch (error) {
            showApiTestResult(`Connection Error: ${error.message}`, false);
        }
    });

    // Load IMAP folders
    loadImapFoldersButton.addEventListener('click', async () => {
        folderLoadingIndicator.style.display = 'block';
        folderSelection.style.display = 'none';
        
        try {
            const accounts = await browser.accounts.list();
            const allFolders = [];
            
            for (const account of accounts) {
                const folders = await getAllFolders(account);
                allFolders.push(...folders);
            }
            
            // Filter out system folders and duplicates
            loadedFolders = [...new Set(allFolders
                .filter(f => !['Inbox', 'Trash', 'Drafts', 'Sent', 'Spam', 'Junk', 'Templates', 'Outbox', 'Archives'].includes(f))
                .map(f => f.replace(/^INBOX\./i, '').trim())
            )].sort();
            
            if (loadedFolders.length === 0) {
                showMessage('No folders found. You can create custom folders instead.', false);
                folderLoadingIndicator.style.display = 'none';
                return;
            }
            
            foldersPreview.textContent = '';
            loadedFolders.slice(0, 10).forEach(f => {
                const item = document.createElement('div');
                item.className = 'folder-preview-item';
                item.textContent = f;
                foldersPreview.appendChild(item);
            });
            if (loadedFolders.length > 10) {
                const moreItem = document.createElement('div');
                moreItem.className = 'folder-preview-item';
                moreItem.textContent = `...and ${loadedFolders.length - 10} more`;
                foldersPreview.appendChild(moreItem);
            }
            
            folderSelection.style.display = 'block';
        } catch (error) {
            showMessage(`Error loading folders: ${error.message}`, false);
            console.error('Error loading folders:', error);
        } finally {
            folderLoadingIndicator.style.display = 'none';
        }
    });
    
    // Use IMAP folders
    useImapFoldersButton.addEventListener('click', () => {
        if (confirm(`This will replace any existing folders/labels with ${loadedFolders.length} folders from your mail account. Continue?`)) {
            labelsContainer.innerHTML = '';
            loadedFolders.forEach(folder => {
                addLabelInput(folder);
            });
            folderSelection.style.display = 'none';
            updateSaveButtonState();
            showMessage(`Loaded ${loadedFolders.length} folders from your mail account. Don't forget to save!`, true);
        }
    });
    
    // Use custom folders
    useCustomFoldersButton.addEventListener('click', () => {
        folderSelection.style.display = 'none';
        showMessage('You can now add custom folders below', true);
    });
    
    // Helper function to recursively get all folders
    async function getAllFolders(account) {
        const folders = [];
        
        async function processFolder(folder) {
            if (folder.type !== 'inbox' && folder.type !== 'trash' && folder.type !== 'sent' && 
                folder.type !== 'drafts' && folder.type !== 'junk' && folder.type !== 'templates' &&
                folder.type !== 'outbox' && folder.type !== 'archives') {
                folders.push(folder.name);
            }
            
            if (folder.subFolders) {
                for (const subFolder of folder.subFolders) {
                    await processFolder(subFolder);
                }
            }
        }
        
        for (const folder of account.folders) {
            await processFolder(folder);
        }
        
        return folders;
    }

    // Import categories/folders in bulk
    importLabelsButton.addEventListener('click', () => {
        const bulkText = bulkImportTextarea.value.trim();
        const labels = bulkText.split('\n').map(l => l.trim()).filter(l => l !== '');
        
        // Validation
        if (labels.length === 0) {
            showMessage('Please add at least one folder/label before importing. Enter labels one per line.', false);
            return;
        }

        // Confirm if there are existing labels
        const existingLabels = Array.from(document.querySelectorAll('.label-input'))
            .map(input => input.value.trim())
            .filter(label => label !== '');
            
        if (existingLabels.length > 0) {
            if (!confirm(`This will replace your ${existingLabels.length} existing folders/labels with ${labels.length} new ones. Continue?`)) {
                return;
            }
        }

        // Clear existing categories/folders
        labelsContainer.innerHTML = '';

        // Add each category/folder
        labels.forEach(label => {
            addLabelInput(label);
        });

        updateSaveButtonState();
        showMessage(`Imported ${labels.length} categories/folders. Don't forget to save!`, true);
        bulkImportTextarea.value = ''; // Clear the textarea
    });

    // Add new label input
    
    // Show/hide custom model input based on selection
    if (ollamaModelSelect) {
        ollamaModelSelect.addEventListener('change', () => {
            if (ollamaModelSelect.value === 'custom') {
                ollamaCustomModelInput.style.display = 'block';
            } else {
                ollamaCustomModelInput.style.display = 'none';
            }
        });
    }
    
    // Test Ollama connection
    if (testOllamaButton) {
        testOllamaButton.addEventListener('click', async () => {
            const ollamaUrl = ollamaUrlInput.value.trim() || 'http://localhost:11434';
            let selectedModel = ollamaModelSelect.value;
            
            if (selectedModel === 'custom') {
                selectedModel = ollamaCustomModelInput.value.trim();
                if (!selectedModel) {
                    ollamaTestResult.textContent = '⚠️ Please enter a custom model name first';
                    ollamaTestResult.className = 'api-test-result error';
                    return;
                }
            }
            
            try {
                ollamaTestResult.textContent = 'Testing connection and checking model...';
                ollamaTestResult.className = 'api-test-result';
                
                const testUrl = `${ollamaUrl}/api/tags`;
                console.log('[Ollama Test] Connecting to:', testUrl);
                
                const headers = {};
                if (ollamaAuthTokenInput && ollamaAuthTokenInput.value.trim()) {
                    headers['Authorization'] = `Bearer ${ollamaAuthTokenInput.value.trim()}`;
                }

                const response = await fetch(testUrl, {
                    method: 'GET',
                    headers
                });
                
                console.log('[Ollama Test] Response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('[Ollama Test] Success:', data);
                    const installedModels = data.models && data.models.length > 0 
                        ? data.models.map(m => m.name)
                        : [];
                    
                    if (installedModels.length === 0) {
                        ollamaTestResult.textContent = `⚠️ Ollama is running but no models installed. Enter a model name in "Download Model" and click "Download" to get started.`;
                        ollamaTestResult.className = 'api-test-result error';
                    } else {
                        // Extract base model name (before colon) for regex matching
                        const selectedBase = selectedModel.split(':')[0].toLowerCase();
                        const installedBases = installedModels.map(m => m.split(':')[0].toLowerCase());
                        
                        const modelFound = installedBases.some(base => base === selectedBase);
                        if (modelFound) {
                            ollamaTestResult.textContent = `✓ Connected! Model "${selectedModel}" is installed and ready. Available: ${installedModels.join(', ')}`;
                            ollamaTestResult.className = 'api-test-result success';
                        } else {
                            ollamaTestResult.textContent = `✗ Model "${selectedModel}" not installed. Available models: ${installedModels.join(', ')}. Use "Download Model" to install it.`;
                            ollamaTestResult.className = 'api-test-result error';
                        }
                    }
                } else {
                    const errorText = await response.text();
                    console.error('[Ollama Test] Error response:', errorText);
                    let errorMsg = 'Connection failed';
                    if (response.status === 403) {
                        errorMsg = 'Access denied (403). Check if Ollama is running and the URL is correct.';
                    } else if (response.status === 404) {
                        errorMsg = 'Ollama not found (404). Check the server URL.';
                    } else {
                        try {
                            const errorData = JSON.parse(errorText);
                            errorMsg = errorData.error || errorText;
                        } catch (e) {
                            errorMsg = errorText || `HTTP ${response.status}`;
                        }
                    }
                    ollamaTestResult.textContent = `✗ Error: ${errorMsg}`;
                    ollamaTestResult.className = 'api-test-result error';
                }
            } catch (error) {
                console.error('[Ollama Test] Exception:', error);
                ollamaTestResult.textContent = `✗ Connection failed: ${error.message}. Make sure Ollama is running (try: ollama serve)`;
                ollamaTestResult.className = 'api-test-result error';
            }
        });
    }
    
    // Run comprehensive Ollama diagnostics
    if (diagnoseOllamaButton) {
        diagnoseOllamaButton.addEventListener('click', async () => {
            const ollamaUrl = ollamaUrlInput.value.trim() || 'http://localhost:11434';
            let diagnosticOutput = '🔍 OLLAMA DIAGNOSTICS\n' + '='.repeat(50) + '\n\n';
            
            ollamaDiagnostics.style.display = 'block';
            ollamaDiagnostics.className = 'diagnostics-result';
            ollamaDiagnostics.textContent = diagnosticOutput + 'Running tests...\n';
            
            try {
                // Test 1: Check /api/tags endpoint
                diagnosticOutput += '📋 Test 1: List Models Endpoint\n';
                diagnosticOutput += `   URL: ${ollamaUrl}/api/tags\n`;
                try {
                    const tagsResponse = await fetch(`${ollamaUrl}/api/tags`);
                    diagnosticOutput += `   Status: ${tagsResponse.status} ${tagsResponse.statusText}\n`;
                    
                    if (tagsResponse.ok) {
                        const data = await tagsResponse.json();
                        diagnosticOutput += `   ✓ SUCCESS - Found ${data.models?.length || 0} models\n`;
                        if (data.models && data.models.length > 0) {
                            diagnosticOutput += '   Installed models: ' + data.models.map(m => m.name).join(', ') + '\n';
                        } else {
                            diagnosticOutput += '   ⚠️ No models installed\n';
                        }
                    } else {
                        diagnosticOutput += `   ✗ FAILED\n`;
                    }
                } catch (error) {
                    diagnosticOutput += `   ✗ ERROR: ${error.message}\n`;
                }
                
                // Test 2: Check /api/version endpoint
                diagnosticOutput += '\n🔢 Test 2: Version Endpoint\n';
                diagnosticOutput += `   URL: ${ollamaUrl}/api/version\n`;
                try {
                    const versionResponse = await fetch(`${ollamaUrl}/api/version`);
                    diagnosticOutput += `   Status: ${versionResponse.status} ${versionResponse.statusText}\n`;
                    
                    if (versionResponse.ok) {
                        const data = await versionResponse.json();
                        diagnosticOutput += `   ✓ SUCCESS - Ollama version: ${data.version || 'unknown'}\n`;
                    } else {
                        diagnosticOutput += `   ⚠️ Endpoint not available (older Ollama version)\n`;
                    }
                } catch (error) {
                    diagnosticOutput += `   ✗ ERROR: ${error.message}\n`;
                }
                
                // Test 3: Test pull endpoint (without actually downloading)
                diagnosticOutput += '\n⬇️ Test 3: Pull Endpoint Check\n';
                diagnosticOutput += `   URL: ${ollamaUrl}/api/pull\n`;
                diagnosticOutput += `   Note: This endpoint is used for downloading models\n`;
                
                // Summary
                diagnosticOutput += '\n' + '='.repeat(50) + '\n';
                diagnosticOutput += '📊 SUMMARY:\n\n';
                
                if (diagnosticOutput.includes('✓ SUCCESS - Found')) {
                    diagnosticOutput += '✓ Ollama is running and accessible\n';
                    diagnosticOutput += `✓ API base URL: ${ollamaUrl}\n`;
                    ollamaDiagnostics.className = 'diagnostics-result success';
                } else {
                    diagnosticOutput += '✗ Cannot connect to Ollama\n';
                    diagnosticOutput += '\nTroubleshooting:\n';
                    diagnosticOutput += '1. Check if Ollama is running: ps aux | grep ollama\n';
                    diagnosticOutput += '2. Start Ollama: ollama serve\n';
                    diagnosticOutput += `3. Test manually: curl ${ollamaUrl}/api/tags\n`;
                    diagnosticOutput += '4. Check if port 11434 is in use: lsof -i :11434\n';
                    ollamaDiagnostics.className = 'diagnostics-result error';
                }
                
            } catch (error) {
                diagnosticOutput += '\n❌ CRITICAL ERROR:\n';
                diagnosticOutput += error.message + '\n';
                ollamaDiagnostics.className = 'diagnostics-result error';
            }
            
            ollamaDiagnostics.textContent = diagnosticOutput;
        });
    }
    
    // List Ollama models
    if (listOllamaModelsButton) {
        listOllamaModelsButton.addEventListener('click', async () => {
            const ollamaUrl = ollamaUrlInput.value.trim() || 'http://localhost:11434';
            
            try {
                ollamaTestResult.textContent = 'Fetching models...';
                ollamaTestResult.className = 'api-test-result';
                
                const response = await fetch(`${ollamaUrl}/api/tags`);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.models && data.models.length > 0) {
                        const modelNames = data.models.map(m => m.name).join(', ');
                        ollamaTestResult.textContent = `✓ Available models: ${modelNames}`;
                        ollamaTestResult.className = 'api-test-result success';
                    } else {
                        ollamaTestResult.textContent = '⚠️ No models installed. Run "ollama pull llama3.2" to download one.';
                        ollamaTestResult.className = 'api-test-result error';
                    }
                } else {
                    ollamaTestResult.textContent = '✗ Failed to fetch models';
                    ollamaTestResult.className = 'api-test-result error';
                }
            } catch (error) {
                ollamaTestResult.textContent = `✗ Connection failed: ${error.message}. Is Ollama running?`;
                ollamaTestResult.className = 'api-test-result error';
            }
        });
    }

    // Download Ollama model via tab proxy
    if (downloadOllamaModelButton) {
        downloadOllamaModelButton.addEventListener('click', async () => {
            const ollamaUrl = (ollamaUrlInput.value.trim() || 'http://localhost:11434').replace(/\/$/, '');
            const modelName = ollamaDownloadModelInput.value.trim();
            const token = ollamaAuthTokenInput && ollamaAuthTokenInput.value.trim();
            if (!modelName) {
                ollamaDownloadStatus.textContent = '⚠️ Please enter a model name to download';
                ollamaDownloadStatus.className = 'api-test-result error';
                ollamaDownloadStatus.style.display = 'block';
                return;
            }
            try {
                downloadOllamaModelButton.disabled = true;
                ollamaDownloadStatus.textContent = `Starting download of ${modelName}...`;
                ollamaDownloadStatus.className = 'api-test-result';
                ollamaDownloadStatus.style.display = 'block';

                // Ask background to open a hidden tab and start pull
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                await browser.runtime.sendMessage({
                    action: 'startOllamaPull',
                    ollamaUrl,
                    model: modelName,
                    headers
                });
            } catch (e) {
                ollamaDownloadStatus.textContent = `✗ Failed to start: ${e.message}`;
                ollamaDownloadStatus.className = 'api-test-result error';
            } finally {
                downloadOllamaModelButton.disabled = false;
            }
        });
        // Listen for progress events from content.js
        browser.runtime.onMessage.addListener((msg) => {
            if (msg.action === 'ollamaPullProgress') {
                const parts = [];
                if (msg.status) parts.push(msg.status);
                if (typeof msg.percent === 'number') parts.push(`${msg.percent}%`);
                ollamaDownloadStatus.textContent = parts.join(' — ');
                ollamaDownloadStatus.className = 'api-test-result';
                ollamaDownloadStatus.style.display = 'block';
            } else if (msg.action === 'ollamaPullComplete') {
                if (msg.ok) {
                    ollamaDownloadStatus.textContent = '✓ Download complete';
                    ollamaDownloadStatus.className = 'api-test-result success';
                } else {
                    ollamaDownloadStatus.textContent = `✗ Download failed: ${msg.error || 'unknown error'}`;
                    ollamaDownloadStatus.className = 'api-test-result error';
                }
                ollamaDownloadStatus.style.display = 'block';
            }
        });
    }
    
    addLabelButton.addEventListener('click', () => {
        // Clear instruction message if present
        const instructionMsg = labelsContainer.querySelector('.instruction-message');
        if (instructionMsg) {
            labelsContainer.innerHTML = '';
        }
        addLabelInput('');
        updateSaveButtonState();
    });

    // Save settings
    saveButton.addEventListener('click', () => {
        const labels = Array.from(document.querySelectorAll('.label-input'))
            .map(input => input.value.trim())
            .filter(label => label !== '');
        
        const apiKey = apiKeyInput.value.trim();
        const provider = aiProviderSelect.value;
        
        // Validation
        if (labels.length === 0) {
            showMessage('Please add at least one folder/label before saving. Use "Load Folders from Mail Account" or add custom labels.', false);
            return;
        }
        
        // Validate API keys based on provider
        if (provider === 'gemini') {
            // Filter out empty Gemini keys
            const validGeminiKeys = geminiKeys.filter(key => key && key.trim() !== '');
            
            if (validGeminiKeys.length === 0) {
                showMessage('Please add at least one Gemini API key before saving.', false);
                return;
            }
            
            // Check for duplicate keys
            const uniqueKeys = new Set(validGeminiKeys.map(key => key.trim().toLowerCase()));
            if (uniqueKeys.size !== validGeminiKeys.length) {
                showMessage('⚠️ Duplicate API keys detected! Each key must be unique. Please remove duplicates before saving.', false);
                return;
            }
            
            const settings = {
                labels: labels,
                geminiApiKeys: validGeminiKeys,
                currentGeminiKeyIndex: 0, // Start with first key
                aiProvider: provider,
                enableAi: document.getElementById('enable-ai').checked,
                enableLogging: document.getElementById('enable-logging').checked,
                geminiPaidPlan: geminiPaidCheckbox.checked,
                geminiModel: document.getElementById('gemini-model').value,
                geminiCustomModel: document.getElementById('gemini-custom-model').value.trim()
            };
            
            // Initialize rate limits array for all keys if not exists
            browser.storage.local.get(['geminiRateLimits']).then(result => {
                if (!result.geminiRateLimits || result.geminiRateLimits.length !== validGeminiKeys.length) {
                    settings.geminiRateLimits = validGeminiKeys.map(() => ({
                        requests: [],
                        dailyCount: 0,
                        dailyResetTime: Date.now() + (24 * 60 * 60 * 1000)
                    }));
                }
                
                browser.storage.local.set(settings).then(() => {
                    showMessage('✓ Settings saved successfully! Multiple Gemini API keys configured for automatic rotation.', true);
                    updateSaveButtonState();
                }).catch(error => {
                    showMessage('Error saving settings: ' + error, false);
                });
            });
        } else if (provider === 'ollama') {
            // Ollama doesn't need API key, just save URL and model
            let ollamaModel = ollamaModelSelect.value;
            if (ollamaModel === 'custom') {
                ollamaModel = ollamaCustomModelInput.value.trim();
                if (!ollamaModel) {
                    showMessage('Please enter a custom model name for Ollama.', false);
                    return;
                }
            }
            
            const settings = {
                labels: labels,
                aiProvider: provider,
                enableAi: document.getElementById('enable-ai').checked,
                enableLogging: document.getElementById('enable-logging').checked,
                ollamaUrl: ollamaUrlInput.value.trim() || 'http://localhost:11434',
                ollamaModel: ollamaModel,
                ollamaCustomModel: ollamaCustomModelInput.value.trim(),
                ollamaAuthToken: ollamaAuthTokenInput ? ollamaAuthTokenInput.value.trim() : '',
                ollamaCpuOnly: ollamaCpuOnlyCheckbox.checked
            };

            browser.storage.local.set(settings).then(() => {
                const cpuMode = ollamaCpuOnlyCheckbox.checked ? ' (CPU-only mode)' : '';
                showMessage(`✓ Settings saved successfully! Ollama is configured for local email processing${cpuMode}.`, true);
                updateSaveButtonState();
            }).catch(error => {
                showMessage('Error saving settings: ' + error, false);
            });
        } else {
            // Other providers use single key
            if (!apiKey) {
                showMessage('Please enter your API key before saving. Click "Get API Key" to obtain one.', false);
                return;
            }

            const settings = {
                labels: labels,
                apiKey: apiKey,
                aiProvider: provider,
                enableAi: document.getElementById('enable-ai').checked,
                enableLogging: document.getElementById('enable-logging').checked,
                geminiPaidPlan: geminiPaidCheckbox.checked
            };

            browser.storage.local.set(settings).then(() => {
                showMessage('✓ Settings saved successfully! You can now use AutoSort+ to analyze emails.', true);
                updateSaveButtonState();
            }).catch(error => {
                showMessage('Error saving settings: ' + error, false);
            });
        }
    });

    // Add category/folder input field
    function addLabelInput(value = '') {
        const labelItem = document.createElement('div');
        labelItem.className = 'label-item';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'label-input';
        input.placeholder = 'Enter category/folder name';
        input.value = value;
        input.addEventListener('input', updateSaveButtonState);

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-label';
        removeButton.textContent = '×';
        removeButton.addEventListener('click', () => {
            labelItem.remove();
            updateSaveButtonState();
            
            // Show instruction if no labels left
            const remainingLabels = document.querySelectorAll('.label-input');
            if (remainingLabels.length === 0) {
                labelsContainer.innerHTML = '<div class="instruction-message">No folders/labels configured. Click "Load Folders from Mail Account" above or add custom labels below.</div>';
            }
        });

        labelItem.appendChild(input);
        labelItem.appendChild(removeButton);
        labelsContainer.appendChild(labelItem);
    }

    // Show API test result
    function showApiTestResult(message, isSuccess) {
        apiTestResult.textContent = message;
        apiTestResult.className = `api-test-result ${isSuccess ? 'success' : 'error'}`;
    }

    // Show message to user
    function showMessage(message, isSuccess = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.textContent = message;
        messageDiv.style.backgroundColor = isSuccess ? 'var(--success-color)' : 'var(--error-color)';
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Function to format timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    // Function to update history table
    async function updateHistoryTable() {
        const historyBody = document.getElementById('history-body');
        const data = await browser.storage.local.get('moveHistory');
        const history = data.moveHistory || [];
        
        historyBody.textContent = '';
        history.forEach(entry => {
            const tr = document.createElement('tr');
            
            const tdTime = document.createElement('td');
            tdTime.className = 'timestamp';
            tdTime.textContent = formatTimestamp(entry.timestamp);
            
            const tdSubject = document.createElement('td');
            tdSubject.textContent = entry.subject;
            
            const tdStatus = document.createElement('td');
            tdStatus.className = entry.status.toLowerCase();
            tdStatus.textContent = entry.status;
            
            const tdDest = document.createElement('td');
            tdDest.textContent = entry.destination;
            
            tr.appendChild(tdTime);
            tr.appendChild(tdSubject);
            tr.appendChild(tdStatus);
            tr.appendChild(tdDest);
            
            historyBody.appendChild(tr);
        });
    }

    // Function to clear history
    async function clearHistory() {
        if (confirm('Are you sure you want to clear the move history?')) {
            await browser.storage.local.set({ moveHistory: [] });
            await updateHistoryTable();
        }
    }

    // ==========================================
    // AI MAILBOX ONBOARDING & KNOWLEDGE GRAPH
    // ==========================================

    const btnStartOnboarding = document.getElementById('btn-start-onboarding');
    const btnApplyArchitecture = document.getElementById('btn-apply-architecture');
    const onboardingSampleSize = document.getElementById('onboarding-sample-size');
    const onboardingLoadingCard = document.getElementById('onboarding-loading-card');
    const onboardingLoadingText = document.getElementById('onboarding-loading-text');
    const onboardingProgressBar = document.getElementById('onboarding-progress-bar');
    const onboardingResultsPanel = document.getElementById('onboarding-results-panel');
    const graphNodesContainer = document.getElementById('graph-nodes-container');
    const proposedArchitectureList = document.getElementById('proposed-architecture-list');

    // Helper to recursively parse email body parts safely
    function extractSnippetFromParts(parts) {
        let text = "";
        if (!parts) return text;
        for (const part of parts) {
            if (part.parts) {
                text += extractSnippetFromParts(part.parts);
            }
            if (part.contentType === "text/plain" && part.body) {
                text += part.body + "\n";
            } else if (part.contentType === "text/html" && part.body && !text) {
                text += part.body.replace(/<[^>]*>/g, ' ') + "\n";
            }
        }
        return text;
    }

    // Helper to update onboarding progress display
    function updateOnboardingProgress(percent, message) {
        if (onboardingProgressBar) onboardingProgressBar.style.width = `${percent}%`;
        if (onboardingLoadingText) onboardingLoadingText.textContent = message;
        console.log(`[AutoSort+ Onboarding Progress] ${percent}% - ${message}`);
    }

    // Event listener to trigger AI Analysis and Knowledge Graph build
    if (btnStartOnboarding) {
        btnStartOnboarding.addEventListener('click', async () => {
            btnStartOnboarding.disabled = true;
            if (onboardingResultsPanel) onboardingResultsPanel.style.display = 'none';
            if (onboardingLoadingCard) onboardingLoadingCard.style.display = 'block';
            
            try {
                const sampleSize = parseInt(onboardingSampleSize.value, 10) || 30;
                updateOnboardingProgress(10, "Connecting to mail servers...");
                
                // 1. Get email accounts
                const accounts = await browser.accounts.list();
                if (accounts.length === 0) {
                    throw new Error("No active email accounts found in Thunderbird.");
                }
                
                // 2. Recursively find active Inbox
                let inboxFolder = null;
                function findInbox(folderList) {
                    for (const folder of folderList) {
                        if (folder.type === 'inbox' || folder.name.toLowerCase() === 'inbox') {
                            return folder;
                        }
                        if (folder.subFolders && folder.subFolders.length > 0) {
                            const found = findInbox(folder.subFolders);
                            if (found) return found;
                        }
                    }
                    return null;
                }
                
                for (const account of accounts) {
                    inboxFolder = findInbox(account.folders);
                    if (inboxFolder) break;
                }
                
                if (!inboxFolder) {
                    throw new Error("Could not automatically locate your primary Inbox folder.");
                }
                
                updateOnboardingProgress(25, "Reading recent Inbox messages...");
                
                // 3. Fetch Inbox messages list
                const messageList = await browser.messages.list(inboxFolder);
                const rawMessages = messageList.messages || [];
                if (rawMessages.length === 0) {
                    throw new Error("Inbox is currently empty. Please make sure you have emails to analyze.");
                }
                
                const messagesToAnalyze = rawMessages.slice(0, sampleSize);
                const extractedEmails = [];
                let count = 0;
                
                for (const msg of messagesToAnalyze) {
                    count++;
                    updateOnboardingProgress(
                        25 + Math.floor((count / messagesToAnalyze.length) * 35),
                        `Extracting message snippet ${count} of ${messagesToAnalyze.length}...`
                    );
                    
                    const fullMessage = await browser.messages.getFull(msg.id);
                    let bodyContent = "";
                    if (fullMessage) {
                        if (fullMessage.parts) {
                            bodyContent = extractSnippetFromParts(fullMessage.parts);
                        } else if (fullMessage.body) {
                            bodyContent = fullMessage.body;
                        }
                    }
                    
                    extractedEmails.push({
                        subject: msg.subject || "(No Subject)",
                        author: msg.author || "Unknown Sender",
                        snippet: bodyContent.substring(0, 150).replace(/\s+/g, ' ').trim()
                    });
                }
                
                updateOnboardingProgress(65, "Querying Google AI to build Knowledge Graph...");
                
                // 4. Retrieve model settings
                const keyData = await browser.storage.local.get([
                    'apiKey', 
                    'geminiApiKeys', 
                    'currentGeminiKeyIndex', 
                    'geminiModel', 
                    'geminiCustomModel'
                ]);
                
                let activeApiKey = keyData.apiKey;
                if (keyData.geminiApiKeys && keyData.geminiApiKeys.length > 0) {
                    activeApiKey = keyData.geminiApiKeys[keyData.currentGeminiKeyIndex || 0];
                }
                
                if (!activeApiKey) {
                    throw new Error("No API Key found. Please add an API Key under API Key Configuration first.");
                }
                
                let selectedModel = keyData.geminiModel || 'gemini-2.5-flash';
                if (selectedModel === 'custom' && keyData.geminiCustomModel) {
                    selectedModel = keyData.geminiCustomModel;
                }
                
                updateOnboardingProgress(75, `Generating sorting structures via ${selectedModel}...`);
                
                // 5. Structure prompt
                const promptPayload = `You are an expert AI email organization assistant. Your task is to analyze the following list of recent email subjects, senders, and snippets to build a mailbox relational Knowledge Graph and propose an optimal, tailored sorting category architecture.

Here are the emails in JSON:
${JSON.stringify(extractedEmails)}

Instructions:
1. Analyze common themes, recurring senders, and active projects/topics.
2. Create a relational Knowledge Graph represented as nodes (types: "topic", "sender"). Propose at most 10-15 key nodes.
3. Recommend 5 to 10 highly specific custom category/folder names customized specifically to this mailbox's context (e.g., 'Work/Projects', 'Finances/Invoices', 'Online Shopping', 'Newsletters', 'Personal', etc.).
4. For each category, provide a clear 1-sentence rationale.

You MUST respond with a single valid JSON object containing exactly the keys "knowledgeGraph" and "proposedArchitecture" matching this schema:
{
  "knowledgeGraph": {
    "nodes": [
      { "id": "node1", "label": "Sender or Topic Name", "type": "sender|topic|relation" }
    ]
  },
  "proposedArchitecture": [
    { "category": "Category/Folder Name", "rationale": "Why this category fits the email patterns." }
  ]
}

CRITICAL: Your entire output must be parseable as a valid JSON object. Do not include markdown code block backticks (like \`\`\`json) or any preamble or explanation.`;

                // 6. Make Generative Language fetch
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${activeApiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: promptPayload }]
                        }],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                });
                
                const resData = await response.json();
                if (!response.ok) {
                    throw new Error(resData.error?.message || "Failed to contact Google Generative Language API");
                }
                
                let rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!rawText) {
                    throw new Error("AI returned an empty response.");
                }
                
                // Strip markdown backticks if present
                rawText = rawText.trim();
                if (rawText.startsWith('```')) {
                    rawText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
                }
                
                const resultObj = JSON.parse(rawText);
                updateOnboardingProgress(90, "Rendering visualizers...");
                
                // 7. Paint Visuals
                renderOnboardingResults(resultObj);
                
                // Done!
                if (onboardingLoadingCard) onboardingLoadingCard.style.display = 'none';
                if (onboardingResultsPanel) onboardingResultsPanel.style.display = 'block';
                showMessage("✓ Mailbox analysis and Knowledge Graph generated successfully!", true);
                
            } catch (err) {
                console.error("Error during AI Onboarding:", err);
                if (onboardingLoadingCard) onboardingLoadingCard.style.display = 'none';
                showMessage(`Onboarding Error: ${err.message}`, false);
            } finally {
                btnStartOnboarding.disabled = false;
            }
        });
    }

    // Dynamic Nodes & Architecture Card Renderer
    function renderOnboardingResults(data) {
        if (!graphNodesContainer || !proposedArchitectureList) return;
        
        graphNodesContainer.textContent = '';
        proposedArchitectureList.textContent = '';
        
        // 1. Render Knowledge Graph Nodes
        const nodes = data.knowledgeGraph?.nodes || [];
        if (nodes.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.textContent = 'No relationship nodes extracted.';
            placeholder.style.padding = '10px';
            placeholder.style.color = '#64748b';
            graphNodesContainer.appendChild(placeholder);
        } else {
            nodes.forEach(node => {
                const nodePill = document.createElement('div');
                nodePill.className = `graph-node type-${node.type || 'topic'}`;
                nodePill.textContent = node.label;
                graphNodesContainer.appendChild(nodePill);
            });
        }
        
        // 2. Render Proposed Folders
        const suggestions = data.proposedArchitecture || [];
        if (suggestions.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.textContent = 'No custom category layouts proposed.';
            placeholder.style.padding = '10px';
            proposedArchitectureList.appendChild(placeholder);
        } else {
            suggestions.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'proposed-category-card';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `prop-cat-${index}`;
                checkbox.checked = true;
                checkbox.dataset.category = item.category;
                
                const details = document.createElement('div');
                details.className = 'proposed-category-details';
                
                const name = document.createElement('div');
                name.className = 'proposed-category-name';
                name.textContent = item.category;
                
                const rationale = document.createElement('div');
                rationale.className = 'proposed-category-rationale';
                rationale.textContent = item.rationale;
                
                details.appendChild(name);
                details.appendChild(rationale);
                
                card.appendChild(checkbox);
                card.appendChild(details);
                
                proposedArchitectureList.appendChild(card);
            });
        }
    }

    // Bind Apply Architecture action
    if (btnApplyArchitecture) {
        btnApplyArchitecture.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('#proposed-architecture-list input[type="checkbox"]:checked');
            const checkedCategories = Array.from(checkboxes).map(cb => cb.dataset.category);
            
            if (checkedCategories.length === 0) {
                showMessage("Please select at least one category layout to import.", false);
                return;
            }
            
            // Clear default/empty labels container before bulk adding if needed
            const emptyInstruction = document.querySelector('#labels-container .instruction-message');
            if (emptyInstruction) {
                labelsContainer.textContent = '';
            }
            
            // Add the dynamic category boxes
            checkedCategories.forEach(cat => {
                addLabelInput(cat);
            });
            
            showMessage(`✓ Successfully imported ${checkedCategories.length} categories! Click 'Save Settings' at the bottom to write.`, true);
            
            // Auto expand the folder configuration panel and scroll down to show imports
            const foldersHeader = document.querySelector('.section-header[data-section="folders-settings"]');
            if (foldersHeader) {
                const parentSection = foldersHeader.parentElement;
                if (parentSection && parentSection.classList.contains('collapsed')) {
                    foldersHeader.click();
                }
                setTimeout(() => {
                    foldersHeader.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        });
    }

    // Initialize the page
    await updateHistoryTable();

    // Add event listeners for history controls
    document.getElementById('clear-history').addEventListener('click', clearHistory);
    document.getElementById('refresh-history').addEventListener('click', updateHistoryTable);

    // Handle URL hash on load to auto-expand targeted collapsible sections (e.g., #history-settings)
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const header = document.querySelector(`.section-header[data-section="${hash}"]`);
        if (header) {
            setTimeout(() => {
                const section = header.parentElement;
                if (section && section.classList.contains('collapsed')) {
                    header.click();
                }
                header.scrollIntoView({ behavior: 'smooth' });
            }, 150);
        }
    }
}); 