# Email Buddy Chrome Extension

Email Buddy is a Chrome extension that helps you write better email replies using AI. The extension integrates with Gmail and uses the Gemini API to generate contextually relevant email responses based on your prompts.

## Features

- Generate AI-powered email replies with customizable tones
- One-click insertion of generated text into Gmail compose box
- Customizable user information for personalized responses
- Multiple tone options: Professional, Friendly, Formal, and Casual
- Easy API key management

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the downloaded extension folder
5. The Email Buddy extension icon should now appear in your Chrome toolbar

## Setup

When you first use the extension, you'll need to complete a one-time setup:

1. Click the Email Buddy icon in your Chrome toolbar
2. You'll be redirected to the onboarding page
3. Enter your Gemini API key ([Get one here](https://ai.google.dev/gemini-api/docs/api-key))
4. Fill in your personal information (name, organization, email, etc.)
5. Click "Save Settings" to complete the setup

## How to Use

### Generating Email Replies

1. Open Gmail in Chrome
2. Open the email you want to reply to
3. Click the Email Buddy extension icon in your toolbar
4. You'll see the email subject and sender information
5. Type your prompt in the text area (e.g., "Write a polite response declining the meeting invitation")
6. Select the desired tone from the dropdown menu
7. Click "Generate Draft" to create your AI-powered reply
8. Review the generated text

### Inserting Replies

1. After generating a draft, click "Insert Into Email"
2. The extension will:
   - Use an existing compose box if already open, or
   - Automatically click the reply button and insert text into the new compose box
3. Review and edit the inserted text before sending

### Settings Management

To update your settings:
1. Click the Email Buddy icon
2. Click the "Settings" button in the top-right corner
3. Update your API key, personal information, or default preferences
4. Click "Save All Settings"

## Troubleshooting

- **No email detected**: Make sure you have an email open in Gmail before clicking the extension
- **API errors**: Verify your API key is correct in the settings page
- **Insertion not working**: Ensure you're on a Gmail page and have permission to access mail.google.com

## Privacy

This extension:
- Stores your API key and personal information locally in your browser
- Only accesses email content when you're actively using the extension
- Never sends your emails to third-party servers (only sends to Google's Gemini API)

## License

This project is licensed under the MIT License.