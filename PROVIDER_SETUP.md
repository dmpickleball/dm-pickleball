# Setting Up Sign-In Providers

The app already has Google working. Follow these steps to activate Apple, Microsoft, and Yahoo.
After adding a Client ID, set it in `src/App.jsx` near the top (look for `APPLE_SERVICE_ID`, `MICROSOFT_CLIENT_ID`, `YAHOO_CLIENT_ID`).

---

## Apple Sign In

1. Go to [developer.apple.com](https://developer.apple.com) → Account → Certificates, Identifiers & Profiles
2. Click **Identifiers** → **+** → choose **Services IDs** → Continue
3. Fill in Description (e.g. "DM Pickleball Web") and Identifier (e.g. `com.dmpickleball.web`)
4. Enable **Sign In with Apple** → Configure
5. Add your domain: `dmpickleball.com`
6. Add Return URL: `https://dmpickleball.com` (must be HTTPS, exact match)
7. Save → Register
8. Copy the **Identifier** (e.g. `com.dmpickleball.web`) → paste as `APPLE_SERVICE_ID` in App.jsx

**Note:** Apple only sends the user's name on the very first sign-in. After that, the name won't come through automatically — the student will just fill it in on the registration form.

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
