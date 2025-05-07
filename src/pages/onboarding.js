document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('onboarding-form');
    const saveButton = document.getElementById('save-button');
    const loadingElement = document.getElementById('loading');
    const statusMessage = document.getElementById('status-message');

    // Check if user already has settings saved
    chrome.storage.sync.get(['apiKey', 'userName', 'organization', 'email', 'phone'], function(data) {
        if (data.apiKey) {
            document.getElementById('api-key').value = data.apiKey;
        }
        if (data.userName) {
            document.getElementById('name').value = data.userName;
        }
        if (data.organization) {
            document.getElementById('organization').value = data.organization;
        }
        if (data.email) {
            document.getElementById('email').value = data.email;
        }
        if (data.phone) {
            document.getElementById('phone').value = data.phone;
        }
    });

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Get form values
        const apiKey = document.getElementById('api-key').value.trim();
        const userName = document.getElementById('name').value.trim();
        const organization = document.getElementById('organization').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();

        // Validate required fields
        if (!apiKey) {
            showMessage('API key is required', 'error');
            return;
        }

        if (!userName) {
            showMessage('Your name is required', 'error');
            return;
        }

        // Show loading state
        saveButton.disabled = true;
        loadingElement.style.display = 'flex';
        
        // Save to Chrome storage
        chrome.storage.sync.set({
            apiKey,
            userName,
            organization,
            email,
            phone,
            isOnboarded: true
        }, function() {
            // Check for error
            if (chrome.runtime.lastError) {
                showMessage('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
                saveButton.disabled = false;
                loadingElement.style.display = 'none';
                return;
            }

            // Success - redirect to main popup after short delay
            showMessage('Settings saved successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = '../popup.html';
            }, 1500);
        });
    });

    function showMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'message ' + type;
        statusMessage.style.display = 'block';
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 3000);
        }
    }
});