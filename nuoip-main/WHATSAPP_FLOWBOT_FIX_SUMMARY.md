# 🛠️ WhatsApp Flowbot Fix Summary

This document summarizes the issue where the WhatsApp Flowbot was echoing messages instead of responding, and the "fetch failed" error that followed.

## 🚨 The Issue

The Baileys Worker (which handles WhatsApp) runs as a separate service from the main NestJS backend.
1.  **Echoing:** Initially caused by incorrect parsing logic (fixed in code).
2.  **Fetch Failed:** The worker was trying to call the chatbot API at `http://127.0.0.1:8080/api/v1/chatbot/stream`.
    *   **Why?** It defaulted to localhost because no backend URL was configured.
    *   **Problem:** The API lives in the **NestJS Backend Service**, not inside the worker itself.

## ✅ The Fix

We updated the code to respect the `BACKEND_URL` environment variable. Now we need to tell Railway where the backend is.

### 1. Code Changes (Already Deployed)
*   Updated `message-handler.ts` to prioritize accumulated response chunks (fixes echo).
*   Updated `message-handler.ts` to use `127.0.0.1` as fallback and log detailed errors.

### 2. Configuration Change (Required)

You must set an environment variable on the **Baileys Worker** service in Railway so it knows how to reach the NestJS backend.

**Variable:** `BACKEND_URL`
**Value:** `http://nuoip.railway.internal:3001` (or your specific internal URL)

## 📝 Steps to Apply

1.  Go to your **Railway Dashboard**.
2.  Select the **Baileys Worker** service.
3.  Go to the **Variables** tab.
4.  Add:
    *   **Key:** `BACKEND_URL`
    *   **Value:** `http://nuoip.railway.internal:3001`
5.  **Redeploy** the Baileys Worker service.

## 🧪 Verification

After redeployment, send the message **"Necesito un link de pago"** to the WhatsApp bot.

**Expected Log Output:**
```
🔗 Calling unified chatbot stream endpoint...
endpoint: "http://nuoip.railway.internal:3001/api/v1/chatbot/stream"
```
**Expected Behavior:**
The bot should respond with the product list instead of echoing your message.
