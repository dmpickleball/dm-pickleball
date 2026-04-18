# Security Configuration

This document describes the security environment variables required to enable admin token verification for the DM Pickleball app.

## Environment Variables to Add in Vercel

Add the following environment variables to your Vercel project settings:

### 1. ADMIN_SESSION_SECRET
**Purpose**: HMAC signing secret for admin session tokens

Generate a random 64-character hex string:
```bash
openssl rand -hex 32
```

**Example**: `3d4f7a2b8c9e1f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f`

### 2. ADMIN_API_KEY
**Purpose**: API key for earnings-calendar endpoint authentication

Generate a random 32-character hex string:
```bash
openssl rand -hex 16
```

**Example**: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`

### 3. ADMIN_EMAIL
**Purpose**: The primary admin's email address

This should be set to the coach's email (default: `david@dmpickleball.com`)

### 4. ADMIN_CONTACT_EMAIL
**Purpose**: Email address where contact form submissions are sent

This is the email address that receives messages from the website contact form.

**Example**: `dlogfx@gmail.com`

### 5. PARTNER_EMAILS (Optional)
**Purpose**: Comma-separated list of partner email addresses with admin access

If you have multiple admin users, add their emails here:

**Example**: `coach2@email.com,admin@email.com`

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `ADMIN_SESSION_SECRET`)
   - **Value**: The generated or specified value
   - **Environment**: Select `Production` (or all if developing locally)
4. Click **Save**

## Security Notes

- **ADMIN_SESSION_SECRET** is critical: it signs the admin tokens that verify requests from the React frontend to protected endpoints
- **ADMIN_API_KEY** is used by the earnings-calendar endpoint; it should be different from the session secret
- Tokens expire after **8 hours** of inactivity
- All admin endpoints (`/api/students?action=approve`, `delete`, etc.) require a valid `x-admin-token` header
- The `/api/send-email.js` endpoint always sends contact form submissions to `ADMIN_CONTACT_EMAIL` — the `to` field in the request body is ignored

## Testing

After setting the environment variables:

1. Restart your Vercel deployment (redeploy) for changes to take effect
2. Admin login should work normally:
   - Click "Admin Login"
   - Sign in with Google using an email in `ADMIN_EMAIL` or `PARTNER_EMAILS`
   - The React app exchanges the Google token for a server-side admin token
   - The admin token is stored in `sessionStorage` as `dm_admin_token`
3. All admin API calls automatically include the token in the `x-admin-token` header
