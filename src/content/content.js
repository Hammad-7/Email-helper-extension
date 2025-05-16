function initializeExtension() {
  console.log("Gmail buddy launched!");
  getEmail();
}

function getEmail() {
  const emailNode = document.querySelector(".gD");
  const senderName = emailNode ? emailNode.getAttribute("name") : null;
  const senderEmail = emailNode ? emailNode.getAttribute("email") : null;
  
  const subjectElement = document.querySelector(".hP");
  const emailSubject = subjectElement ? subjectElement.innerText : null;
  
  const bodyElement = document.querySelector(".a3s.aiL");
  const emailBody = bodyElement ? bodyElement.innerHTML : null;
  
  if (senderName || senderEmail || emailSubject || emailBody) {
    chrome.runtime.sendMessage({
      action: "getEmail",
      senderName: senderName,
      senderEmail: senderEmail,
      emailSubject: emailSubject,
      emailBody: emailBody
    }, function(response) {
      console.log("Response from background script:", response);
    });
  }
}

function debounce(func, wait) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func();
    }, wait);
  };
}

const debouncedGetEmail = debounce(getEmail, 300);

const observer = new MutationObserver(() => {
  debouncedGetEmail();
});

const emailContainer = document.querySelector('.AO') || document.body;
observer.observe(emailContainer, {
  childList: true,
  subtree: true
});

setTimeout(() => {
  initializeExtension();
}, 1500);

function findGmailComposeBox() {
  const selectors = [
    '[role="textbox"][aria-label="Message Body"]',
    '[role="textbox"][aria-label*="Body"]',
    '[contenteditable="true"][g_editable="true"]',
    '[data-tooltip="Message Body"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log("Found compose box with selector:", selector);
      return element;
    }
  }
  
  return null;
}

function clickReplyButton() {
  const replySelectors = [
    '[data-tooltip="Reply"]',
    '[aria-label="Reply"]',
    '.T-I.J-J5-Ji.T-I-Js-Gs.aap.T-I-ax7.L3'
  ];
  
  for (const selector of replySelectors) {
    const replyButton = document.querySelector(selector);
    if (replyButton) {
      console.log("Found reply button, clicking it");
      replyButton.click();
      return true;
    }
  }
  
  console.error("Could not find reply button");
  return false;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "insertDraft") {
    const generatedReply = message.generatedReply;
    console.log("Received request to insert draft");
    
    let composeBox = findGmailComposeBox();
    
    if (composeBox) {
      composeBox.innerHTML = generatedReply;
      console.log("Text inserted successfully into existing compose box");
      sendResponse({ status: "success" });
    } else {
      console.log("No compose box found, attempting to click reply");
      
      if (clickReplyButton()) {
        console.log("Clicked reply, waiting for compose box to appear");

        setTimeout(() => {
          composeBox = findGmailComposeBox();
          
          if (composeBox) {
            composeBox.innerHTML = generatedReply;
            console.log("Text inserted successfully after clicking reply");
            sendResponse({ status: "success" });
          } else {
            console.error("Could not find compose box after clicking reply");
            sendResponse({ 
              status: "error", 
              message: "Could not find compose box after clicking reply" 
            });
          }
        }, 1000); 
      } else {
        sendResponse({ 
          status: "error", 
          message: "Could not find reply button" 
        });
      }
    }
    
    return true; 
  } else if (message.action === "collectEmailData") {
    getEmail();
    sendResponse({status: "collecting"});
    return true;
  }
});
