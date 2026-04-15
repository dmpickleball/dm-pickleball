# Setting Up Sign-In Providers

Google is already working. Follow these steps to activate Microsoft and Yahoo.
After getting a Client ID, paste it into `src/App.jsx` near the top (look for `MICROSOFT_CLIENT_ID` and `YAHOO_CLIENT_ID`).

---

## Microsoft Sign In

1. Go to [portal.azure.com](https://portal.azure.com) → Azure Active Directory → App registrations → **New registration**
2. Name: "DM Pickleball"
3. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
4. Redirect URI: Select **Single-page application (SPA)** → enter `https://dmpickleball.com`
5. Click Register
6. Go to **Authentication** → under Implicit grant, enable **Access tokens** → Save
7. Copy the **Application (client) ID** → paste as `MICROSOFT_CLIENT_ID` in App.jsx

---

## Yahoo Sign In

1. Go to [developer.yahoo.com](https://developer.yahoo.com) → My Apps → **Create an App**
2. Application Name: "DM Pickleball"
3. Application Type: **Web Application**
4. Callback Domain: `dmpickleball.com`
5. API Permissions: Check **OpenID Connect** → check **Email**, **Profile**
6. Click Create App
7. Copy the **Client ID** (not the secret) → paste as `YAHOO_CLIENT_ID` in App.jsx

---

## Google (already working)

The Google Client ID is already set. If you ever need to update it:
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Find your OAuth 2.0 Client → make sure `https://dmpickleball.com` is in **Authorized JavaScript origins**
