document.addEventListener("DOMContentLoaded", function() {
    // Set initial UI states
    const loadingElement = document.getElementById("loading");
    loadingElement.style.display = "none";
    document.getElementById("result").style.display = "none";
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "collectEmailData"}, function(response) {
                setTimeout(fetchEmailData, 300);
            });
        } else {
            document.getElementById("email-subject").innerText = "No email page detected";
            document.getElementById("email-from").innerText = "Please open an email first";
        }
    });
    
    function fetchEmailData() {
        chrome.runtime.sendMessage({ action: "getEmailData" }, function(response) {
            if(response && (response.emailSubject || response.senderName || response.senderEmail)) {
                const emailSubject = response.emailSubject || "No subject";
                document.getElementById("email-subject").innerText = emailSubject;
                
                const senderName = response.senderName || "Unknown sender";
                const senderEmail = response.senderEmail || "No email";
                document.getElementById("email-from").innerText = senderName + " (" + senderEmail + ")";
            } else {
                document.getElementById("email-subject").innerText = "No email selected";
                document.getElementById("email-from").innerText = "Please select an email to reply to";
            }
        });
    }

    const promptTextArea = document.getElementById("prompt");
    const toneSelect = document.getElementById("tone");
    const draftButton = document.getElementById("draft-btn");
    const insertButton = document.getElementById("insert-btn");
    const messageElement = document.getElementById("message");
    const settingsButton = document.getElementById("settings-btn");

    function generateDraft() {
        const promptText = promptTextArea.value;
        const tone = toneSelect.value;

        if(!promptText) {
            showMessage("Please enter a prompt.", "error");
            return;
        }

        loadingElement.style.display = "flex";

        chrome.runtime.sendMessage({
            action: "generateDraft",
            prompt: promptText,
            tone: tone
        }, function(response) {
            loadingElement.style.display = "none";
            if(response && response.status === "success") {
                const draft = response.draft;
                document.getElementById("result").style.display = "block";
                document.getElementById("generated-reply").innerHTML = formatEmailText(draft);
            } else {
                showMessage("Error generating draft: " + (response?.message || "Unknown error"), "error");
            }
        });
    }

    function insertDraft() {
        const generatedReply = document.getElementById("generated-reply").innerHTML;
        
        if(!generatedReply) {
            showMessage("No draft generated to insert.", "error");
            return;
        }
        
        console.log("Sending draft to be inserted");
        loadingElement.style.display = "flex";
        loadingElement.textContent = "Inserting draft...";
        
        chrome.runtime.sendMessage({
            action: "insertDraft",
            generatedReply: generatedReply
        }, function(response) {
            loadingElement.style.display = "none";
            
            if(response && response.status === "success") {
                console.log("Draft inserted successfully");
                showMessage("Draft inserted successfully!", "success");
                
                setTimeout(() => window.close(), 1500);
            } else {
                console.error("Error inserting draft:", response);
                showMessage("Error: " + (response?.message || "Could not insert draft"), "error");
            }
        });
    }
    
    function showMessage(message, type) {
        messageElement.innerText = message;
        messageElement.className = "message " + type;
        messageElement.style.display = "block";
        
        if (type === "success") {
            setTimeout(() => {
                messageElement.style.display = "none";
            }, 3000);
        }
    }

    draftButton.addEventListener("click", generateDraft);
    insertButton.addEventListener("click", insertDraft);
    
    if (settingsButton) {
        settingsButton.addEventListener("click", function() {
            window.location.href = "settings.html";
        });
    }
});

function formatEmailText(text) {
    // Remove subject lines if present
    let cleanedText = text;
    cleanedText = cleanedText.replace(/^Subject:.*?(\n|$)/im, '');
    cleanedText = cleanedText.replace(/^Re:.*?(\n|$)/im, '');
    cleanedText = cleanedText.replace(/^\s+/, '');
    
    let formatted = cleanedText.replace(/\n/g, '<br>');
    
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    return formatted;
}