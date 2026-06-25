# Setup Guide — Bhumika & Darshil Invitation Tool

Complete setup takes about 15–20 minutes.

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it **"B&D Invitations"** (or anything you like)
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/  ← COPY THIS PART →  /edit
   ```

---

## Step 2 — Deploy the Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Copy and paste the entire contents of `apps-script.gs` from this folder
4. At the top of the script, fill in your values:
   ```javascript
   const SHEET_ID = "paste-your-sheet-id-here";
   const ADMIN_TOKEN = "choose-a-strong-password";  // e.g. "sunshine2025!"
   ```
5. Click **Deploy → New deployment**
6. Set:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy** and authorize when prompted
8. Copy the **Web app URL** — it looks like:
   ```
   https://script.google.com/macros/s/ABC.../exec
   ```

---

## Step 3 — Update the HTML files

You need to paste your Web App URL and admin password into **3 files**:

### `rsvp/index.html`
Find this line and replace the placeholder:
```javascript
const SCRIPT_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL";
```

### `admin/index.html`
Find **both** of these lines:
```javascript
const SCRIPT_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL";
const ADMIN_PW   = "YOUR_SECURE_ADMIN_PASSWORD";
```
The password must match exactly what you set in `apps-script.gs`.

---

## Step 4 — Create a GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
   - Name it anything (e.g., `wedding-invite`)
   - Set it to **Public**
2. Upload all the files from this folder:
   ```
   index.html
   rsvp/index.html
   admin/index.html
   apps-script.gs    ← optional, can exclude
   ```
3. Go to **Settings → Pages**
4. Under "Source", select **Deploy from a branch**, branch: **main**, folder: **/ (root)**
5. Click Save. GitHub will give you a URL like `https://yourusername.github.io/wedding-invite`

---

## Step 5 — Connect your custom domain

1. In your GitHub Pages settings, under "Custom domain", enter:
   ```
   bhumikaanddarshil.com
   ```
2. Go to your domain registrar (wherever you bought the domain)
3. Add these DNS records:
   ```
   Type: A     Name: @    Value: 185.199.108.153
   Type: A     Name: @    Value: 185.199.109.153
   Type: A     Name: @    Value: 185.199.110.153
   Type: A     Name: @    Value: 185.199.111.153
   Type: CNAME Name: www  Value: yourusername.github.io
   ```
4. Wait up to 24 hours for DNS to propagate
5. Check "Enforce HTTPS" in GitHub Pages settings once the domain is verified

---

## Step 6 — Start using it!

**Admin dashboard:** `bhumikaanddarshil.com/admin`
- Log in with your admin password
- Add events first (e.g., "Engagement Party", "Wedding")
- Add guests and select which events they're invited to
- Copy their invite link and send it via text, email, or WhatsApp

**Guest experience:**
- Guests receive a link like: `bhumikaanddarshil.com/rsvp/?code=abc123`
- They see their personalized invite, event details, and RSVP options
- They cannot see other guests or RSVPs

---

## Updating the Apps Script

If you ever redeploy the Apps Script (to fix something), you **must** choose
"Manage deployments → Edit" and create a **new version** — otherwise the URL won't update.
Always use the **latest deployment URL**.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Invite not found" error | Check the Script URL is correct in rsvp/index.html |
| Admin login fails | Make sure ADMIN_PW in admin/index.html matches ADMIN_TOKEN in apps-script.gs |
| RSVPs not saving | Re-deploy the Apps Script and update the URL |
| Domain not working | Check DNS records and wait up to 24h |
