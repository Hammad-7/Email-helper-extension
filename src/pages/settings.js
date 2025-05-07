document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const form = document.getElementById('settings-form');
    const apiKeyInput = document.getElementById('api-key');
    const nameInput = document.getElementById('name');
    const organizationInput = document.getElementById('organization');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const defaultToneSelect = document.getElementById('default-tone');
    const saveApiKeyButton = document.getElementById('save-api-key');
    const editApiKeyButton = document.getElementById('edit-api-key');
    const deleteApiKeyButton = document.getElementById('delete-api-key');
    const saveSettingsButton = document.getElementById('save-settings');
    const backButton = document.getElementById('back-btn');
    const apiKeyForm = document.getElementById('api-key-form');
    const apiKeyDisplay = document.getElementById('api-key-display');
    const apiKeyMessage = document.getElementById('api-key-message');
    const apiKeyStatus = document.getElementById('api-key-status');
    const statusMessage = document.getElementById('status-message');
    const loadingElement = document.getElementById('loading');

    // Initialize loading state
    loadingElement.style.display = 'none';

    // Load saved settings
    loadSettings();

    // Event listeners
    saveApiKeyButton.addEventListener('click', saveApiKey);
    editApiKeyButton.addEventListener('click', editApiKey);
    deleteApiKeyButton.addEventListener('click', deleteApiKey);
    form.addEventListener('submit', saveAllSettings);
    backButton.addEventListener('click', goBack);

    // Functions
    function loadSettings() {
        chrome.storage.sync.get([
            'apiKey', 
            'userName', 
            'organization', 
            'email', 
            'phone', 
            'defaultTone'
        ], function(data) {
            // Check and populate API key
            checkApiKeyStatus(data.apiKey);
            
            // Populate other fields
            nameInput.value = data.userName || '';
            organizationInput.value = data.organization || '';
            emailInput.value = data.email || '';
            phoneInput.value = data.phone || '';
            
            // Set default tone if saved
            if (data.defaultTone) {
                defaultToneSelect.value = data.defaultTone;
            }
        });
    }

    function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showApiKeyMessage('Please enter a valid API key.', 'error');
            return;
        }

        chrome.storage.sync.set({ apiKey: apiKey }, function() {
            // Check for chrome runtime errors
            if (chrome.runtime.lastError) {
                showApiKeyMessage('Error saving API key: ' + chrome.runtime.lastError.message, 'error');
                return;
            }
            
            showApiKeyMessage('API key saved successfully!', 'success');
            checkApiKeyStatus(apiKey);
            
            // Notify background script about the key change
            chrome.runtime.sendMessage({ action: 'apiKeyUpdated', apiKey: apiKey });
        });
    }

    function editApiKey() {
        apiKeyForm.style.display = 'block';
        apiKeyDisplay.style.display = 'none';
        
        // Retrieve and show the current key for editing
        chrome.storage.sync.get(['apiKey'], function(result) {
            if (result.apiKey) {
                apiKeyInput.value = result.apiKey;
            }
            apiKeyInput.focus();
        });
    }

    function deleteApiKey() {
        if (confirm('Are you sure you want to delete your API key? The extension will not work without a valid key.')) {
            chrome.storage.sync.remove(['apiKey'], function() {
                if (chrome.runtime.lastError) {
                    showApiKeyMessage('Error deleting API key: ' + chrome.runtime.lastError.message, 'error');
                    return;
                }
                
                apiKeyInput.value = '';
                showApiKeyMessage('API key deleted successfully!', 'success');
                checkApiKeyStatus(null);
                
                // Notify background script about the key removal
                chrome.runtime.sendMessage({ action: 'apiKeyUpdated', apiKey: null });
            });
        }
    }

    function saveAllSettings(event) {
        event.preventDefault();
        
        // Get form values
        const userName = nameInput.value.trim();
        const organization = organizationInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const defaultTone = defaultToneSelect.value;

        // Basic validation
        if (!userName) {
            showStatusMessage('Your name is required', 'error');
            return;
        }

        // Show loading state
        loadingElement.style.display = 'flex';
        saveSettingsButton.disabled = true;
        
        // Save to Chrome storage
        chrome.storage.sync.set({
            userName,
            organization,
            email,
            phone,
            defaultTone
        }, function() {
            // Hide loading state
            loadingElement.style.display = 'none';
            saveSettingsButton.disabled = false;
            
            // Check for errors
            if (chrome.runtime.lastError) {
                showStatusMessage('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
                return;
            }

            showStatusMessage('Settings saved successfully!', 'success');
            
            // Notify any listeners that settings have changed
            chrome.runtime.sendMessage({ action: 'settingsUpdated' });
        });
    }

    function checkApiKeyStatus(apiKey) {
        if (apiKey) {
            apiKeyForm.style.display = 'none';
            apiKeyDisplay.style.display = 'block';
            apiKeyStatus.className = 'status-dot active';
        } else {
            apiKeyForm.style.display = 'block';
            apiKeyDisplay.style.display = 'none';
            apiKeyStatus.className = 'status-dot inactive';
        }
    }

    function showApiKeyMessage(message, type) {
        apiKeyMessage.innerText = message;
        apiKeyMessage.className = `message ${type}`;
        apiKeyMessage.style.display = 'block';
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                apiKeyMessage.style.display = 'none';
            }, 3000);
        }
    }

    function showStatusMessage(message, type) {
        statusMessage.innerText = message;
        statusMessage.className = `message ${type}`;
        statusMessage.style.display = 'block';
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 3000);
        }
    }

    function goBack() {
        window.location.href = 'main.html';
    }
});