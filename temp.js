document.addEventListener("DOMContentLoaded", function() {

    // API KEY HANDLING
    const apiKeyInput = document.getElementById("api-key");
    const saveApiKeyButton = document.getElementById("save-api-key");
    const editApiKeyButton = document.getElementById("edit-api-key");
    const deleteApiKeyButton = document.getElementById("delete-api-key");
    const apiKeyForm = document.getElementById("api-key-form");
    const apiKeyDisplay = document.getElementById("api-key-display");
    const apiKeyMessage = document.getElementById("api-key-message");
    const apiKeyStatus = document.getElementById("api-key-status");

    checkApiKeyStatus();

    saveApiKeyButton.addEventListener("click", function() {
        const apiKey = apiKeyInput.value.trim();
        if(!apiKey) {
            showApiKeyMessage("Please enter a valid API key.", "error");
            return;
        }

        chrome.storage.sync.set({ apiKey: apiKey }, function() {
            chrome.runtime.sendMessage({ action: "setApiKey", apiKey: apiKey });
            showApiKeyMessage("API key saved successfully!", "success");
            checkApiKeyStatus();
        });
    });

    editApiKeyButton.addEventListener("click", function() {
        apiKeyForm.style.display = "block";
        apiKeyDisplay.style.display = "none";
        apiKeyInput.focus();

        chrome.storage.sync.get(["apiKey"], function(result) {
            if(result.apiKey){
                apiKeyInput.value = result.apiKey;
            }
        }
        );
    });

    deleteApiKeyButton.addEventListener("click", function() {
        if(confirm("Are you sure you want to delete the API key?")) {
            chrome.storage.sync.remove(["apiKey"], function() {
                chrome.runtime.sendMessage({ action: "apiKeyUpdated" });

                apiKeyInput.value = "";
                checkApiKeyStatus();
                showApiKeyMessage("API key deleted successfully!", "success");
        });
        }
    });

    function checkApiKeyStatus(){
        chrome.storage.sync.get(["apiKey"], function(result) {
            if(result.apiKey){
                apiKeyForm.style.display = "none";
                apiKeyDisplay.style.display = "block";
                apiKeyStatus.className = "status-dot active";
            }
            else{
                apiKeyForm.style.display = "block";
                apiKeyDisplay.style.display = "none";
                apiKeyStatus.className = "status-dot inactive";
            }
        });
    }

    function showApiKeyMessage(message, type) {
        apiKeyMessage.innerText = message;
        apiKeyMessage.className = type === "success" ? "message success" : "message error";
        setTimeout(() => {
            apiKeyMessage.innerText = "";
            apiKeyMessage.className = "";
        }, 3000);
    }


    chrome.runtime.sendMessage({ action: "getEmailData" }, function(response) {
        if(response){
            document.getElementById("email-subject").innerText = response.emailSubject;
            document.getElementById("email-from").innerText = response.senderName + "(" + response.senderEmail + ")";
        }
    });

    const promptTextArea = document.getElementById("prompt");
    const toneSelect = document.getElementById("tone");
    const draftButton = document.getElementById("draft-btn");
    const insertButton = document.getElementById("insert-btn");
    const loadingElement = document.getElementById("loading");

    loadingElement.style.display = "none";

    function generateDraft() {
        const promptText = promptTextArea.value;
        const tone = toneSelect.value;

        if(!promptText) {
            alert("Please enter a prompt.");
            return;
        }

        loadingElement.style.display = "flex";

        chrome.runtime.sendMessage({
            action: "generateDraft",
            prompt: promptText,
            tone: tone
        }, function(response) {
            loadingElement.style.display = "none";
            if(response.status === "success") {
                const draft = response.draft;
                document.getElementById("result").style.display = "block";
                document.getElementById("generated-reply").innerHTML = formatEmailText(draft);
            } else {
                alert("Error generating draft.");
            }
        });
    }

    function insertDraft() {
        const generatedReply = document.getElementById("generated-reply").innerHTML;
        
        if(generatedReply) {
            console.log("Sending draft to be inserted");
            // Show loading state
            document.getElementById("loading").style.display = "flex";
            document.getElementById("loading").innerText = "Inserting draft...";
            
            chrome.runtime.sendMessage({
                action: "insertDraft",
                generatedReply: generatedReply
            }, function(response) {
                // Hide loading
                document.getElementById("loading").style.display = "none";
                
                if(response && response.status === "success") {
                    console.log("Draft inserted successfully");
                    const messageElement = document.getElementById("message");
                    messageElement.innerText = "Draft inserted successfully!";
                    messageElement.className = "message success";
                    messageElement.style.display = "block";
                    
                    // Close popup after short delay
                    setTimeout(() => window.close(), 1500);
                } else {
                    console.error("Error inserting draft:", response);
                    const messageElement = document.getElementById("message");
                    messageElement.innerText = "Error: " + (response?.message || "Could not insert draft");
                    messageElement.className = "message error";
                    messageElement.style.display = "block";
                }
            });
        } else {
            const messageElement = document.getElementById("message");
            messageElement.innerText = "No draft generated to insert.";
            messageElement.className = "message error";
            messageElement.style.display = "block";
        }
    }

    draftButton.addEventListener("click", generateDraft);
    insertButton.addEventListener("click", insertDraft);

});

function formatEmailText(text) {
    // Replace line breaks with HTML line breaks
    let formatted = text.replace(/\n/g, '<br>');
    
    // Add handling for simple markdown-like formatting
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    return formatted;
}