# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Email Buddy — a Chrome Manifest V3 extension that generates AI-powered email replies in Gmail using the Google Gemini API (`gemini-1.5-flash`).

## Development Setup

No build step or package manager. The extension is plain vanilla JavaScript loaded directly into Chrome:

1. Go to `chrome://extensions/`, enable Developer mode
2. Click "Load unpacked" and select the repo root
3. Reload the extension after code changes

There is no test framework configured.

## Architecture

**Chrome extension message-passing architecture with three execution contexts:**

- **Popup** (`src/popup.html` / `src/popup.js`) — Entry point when the user clicks the extension icon. Routes to onboarding (first run) or main page based on `isOnboarded` flag in `chrome.storage.sync`.

- **Background service worker** (`src/background/background.js`) — Central message hub. Handles all Gemini API calls, stores extracted email data in memory, and relays messages between popup and content script. Constructs the AI prompt incorporating user info, email context, tone, and user intent.

- **Content script** (`src/content/content.js`) — Injected into Gmail pages. Extracts email metadata (sender, subject, body) via Gmail-specific DOM selectors (`.gD`, `.hP`, `.a3s.aiL`). Handles reply-button clicking and compose-box text insertion. Uses a MutationObserver with 300ms debounce to re-extract on DOM changes.

- **Pages** (`src/pages/`) — `main.html/js` (generate and insert replies), `onboarding.html/js` (first-time API key + user info setup), `settings.html/js` (manage API key, personal info, default tone).

**Data flow:** Content script extracts email → sends to background → popup requests email data from background → user submits prompt + tone → background calls Gemini API → response displayed in popup → user clicks insert → background tells content script to inject text into Gmail compose box.

**Storage:** All user data (API key, name, org, email, phone, default tone, onboarding flag) persists via `chrome.storage.sync`.

## Key Conventions

- No frameworks or dependencies — vanilla JS, HTML, CSS only
- All inter-component communication uses `chrome.runtime.sendMessage` / `chrome.tabs.sendMessage`
- CSS uses custom properties; primary color is `#4f46e5` (indigo)
- Popup width is optimized at 420px
