document.addEventListener("DOMContentLoaded", function() {
    // Check if user has completed onboarding
    chrome.storage.sync.get(["isOnboarded", "apiKey"], function(result) {
        if (!result.isOnboarded || !result.apiKey) {
            // Redirect to onboarding page if not onboarded
            window.location.href = "pages/onboarding.html";
        } else {
            // Redirect to main page if already onboarded
            window.location.href = "pages/main.html";
        }
    });
});