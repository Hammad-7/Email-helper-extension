let emailData = {
    senderEmail: null,
    senderName: null,
    emailSubject: null,
    emailBody: null
};

let apiKey = null;

loadApiKey();

function loadApiKey() {
    chrome.storage.sync.get(["apiKey"], function(result) {
        if(result.apiKey) {
            apiKey = result.apiKey;
        } else {
            console.log("No API Key found.");
        }
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === "getEmail") {
        emailData = {
            senderName: message.senderName,
            senderEmail: message.senderEmail,
            emailSubject: message.emailSubject,
            emailBody: message.emailBody
        };

        console.log("Email data received:", emailData);
        sendResponse({status: "success"});
    } else if(message.action === "getEmailData") {
        console.log("Sending email data:", emailData);
        sendResponse(emailData);
    } else if(message.action === "generateDraft") {
        console.log("Generating draft with prompt:", message.prompt);
        const prompt = message.prompt;
        const tone = message.tone;

        callGeminiAPI(prompt, tone).then((draft) => {
            console.log("Draft generated:", draft);
            sendResponse({status: "success", draft: draft});
        }).catch((error) => {
            console.error("Error generating draft:", error);
            sendResponse({status: "error", message: error});
        });

        return true;
    } else if(message.action === "insertDraft") {
        console.log("Background script received insert draft request");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "insertDraft",
                    generatedReply: message.generatedReply
                }, function(response) {
                    console.log("Content script response:", response);
                    sendResponse(response || {status: "error", message: "No response from content script"});
                });
            } else {
                console.error("No active tab found");
                sendResponse({status: "error", message: "No active tab found"});
            }
        });
        return true;
    } else if (message.action === "storeEmailData") {
        emailData = message.emailData;
        sendResponse({status: "success"});
    } else if (message.action === "apiKeyUpdated") {
        loadApiKey();
        sendResponse({status: "success"});
    }
    
    return true; 
});

function callGeminiAPI(prompt, tone) {
    return new Promise((resolve, reject) => {
        if(!apiKey) {
            reject("API Key not found.");
            return;
        }

        chrome.storage.sync.get(["userName", "organization", "email", "phone"], function(userInfo) {
            const emailContext = `
            This is regarding an email with the subject: "${emailData.emailSubject}"  
            From: ${emailData.senderName || 'someone'} <${emailData.senderEmail || 'unknown email'}>  
            Email content: ${emailData.emailBody ? emailData.emailBody.substring(0, 500) + '...' : 'No content available'}  
            `;

            let userInfoText = '';
            if (userInfo.userName) userInfoText += `Name: ${userInfo.userName}\n`;
            if (userInfo.organization) userInfoText += `Organization: ${userInfo.organization}\n`;
            if (userInfo.email) userInfoText += `Email: ${userInfo.email}\n`;
            if (userInfo.phone) userInfoText += `Phone: ${userInfo.phone}\n`;

            const fullPrompt = `You are an AI assistant that helps users draft professional and context-aware email replies.

            Task:
            Write a reply to the following email based on the user's intent.

            User's intent or prompt:
            "${prompt}"

            Tone: ${tone}

            Email details:
            ${emailContext}

            Sent by:
            ${emailData.senderName || 'someone'}

            User information (the person replying):
            ${userInfoText}

            Instructions:
            - Keep the response relevant to the provided email.
            - Follow the tone specified.
            - Be concise and clear.
            - If any details are missing, make reasonable assumptions.

            Begin your reply below:
            `;


            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: fullPrompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.8,
                        topK: 40,
                    }
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("API response:", data);
                // Extract text from the correct response structure
                if (data && 
                    data.candidates && 
                    data.candidates[0] && 
                    data.candidates[0].content &&
                    data.candidates[0].content.parts && 
                    data.candidates[0].content.parts[0] &&
                    data.candidates[0].content.parts[0].text) {
                    
                    resolve(data.candidates[0].content.parts[0].text);
                } else {
                    reject("No generated text found in the response.");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                reject(error.message || "API call failed");
            });
        });
    });
}