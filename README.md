# DM Pickleball — Deployment Guide

## Project Structure
```
dm-pickleball/
├── public/
│   ├── favicon.svg
│   └── images/          ← DROP YOUR IMAGES HERE (see below)
├── src/
│   ├── main.jsx
│   └── App.jsx
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

---

## STEP 1 — Add Your Images

Rename and copy your image files into `public/images/`:

| Your original file              | Rename to               |
|---------------------------------|-------------------------|
| 1773169775757_image.png         | barrage.png             |
| IMG_5034.png                    | logo-crbn.png           |
| IMG_5036.png                    | logo-vatic.png          |
| IMG_5035.png                    | logo-sixzero.png        |
| IMG_5037.png                    | logo-engage.png         |
| 1773178886822_IMG_2962.JPG      | david.jpg               |

Create the folder if it doesn't exist: `public/images/`

---

## STEP 2 — Set Up Formspree (Contact Form)

1. Go to https://formspree.io and sign up (free)
2. Click **+ New Form** → name it "DM Pickleball Contact"
3. Copy your **Form ID** (e.g. `xrgvkpqz`)
4. Open `src/App.jsx` and find this line near the top:
   ```js
   const FORMSPREE_ID = "YOUR_FORM_ID";
   ```
5. Replace `YOUR_FORM_ID` with your actual ID
6. In Formspree dashboard, set the notification email to where you want contact form submissions sent

---

## STEP 3 — Test Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and verify everything looks correct.

---

## STEP 4 — Deploy to Vercel

### Option A: Via GitHub (Recommended)

1. Create a free account at https://github.com
2. Create a new repository called `dm-pickleball`
3. Push this project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/dm-pickleball.git
   git push -u origin main
   ```
4. Go to https://vercel.com → **Sign up** (use your GitHub account)
5. Click **Add New Project** → Import your `dm-pickleball` repo
6. Vercel auto-detects Vite — just click **Deploy**
7. Done! You'll get a live URL like `dm-pickleball.vercel.app`

### Option B: Vercel CLI (No GitHub needed)

```bash
npm install -g vercel
vercel
```

Follow the prompts — it deploys automatically.

---

## STEP 5 — Connect Your Domain

1. Buy `dmpickleball.com` at https://namecheap.com or https://domains.google
2. In Vercel dashboard → your project → **Settings → Domains**
3. Click **Add Domain** → enter `dmpickleball.com`
4. Vercel shows you DNS records to add — copy them into your domain registrar's DNS settings
5. Takes 5–30 minutes to propagate — then your site is live at your domain ✅

---

## Test Accounts

| Role    | Email                    | Password  |
|---------|--------------------------|-----------|
| Student | student@email.com        | test123   |
| Menlo   | menlo@email.com          | test123   |
| Admin   | david@dmpickleball.com   | admin123  |

⚠️ Before going fully live, remove the "Test Accounts" hint from the Login page in `App.jsx` (search for the `<div>` block with "Students: student@email.com").

---

## Build for Production

```bash
npm run build
```

Output goes to `/dist` — this is what Vercel deploys automatically.

---

## Questions?
Contact form submissions go to your Formspree dashboard and email.
