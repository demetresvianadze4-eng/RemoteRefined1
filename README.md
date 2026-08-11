# RemoteRefined

A multi-page product-review website with working search and an email sign-up/contact endpoint.

## Run locally

Double-click `Start-RemoteRefined.cmd` for the simplest option. Keep the window open while using the website.

Or, open **Windows PowerShell** (not the browser Developer Console), move to this folder, and run:

```powershell
node server.js
```

Open `http://localhost:3000` on the computer. The server binds to `0.0.0.0`, so a phone on the same Wi-Fi can open `http://YOUR-COMPUTER-IP:3000` (allow the Windows Firewall prompt for private networks if it appears).

## Enable real hello emails

The contact form sends `Hello from RemoteRefined` using [Resend](https://resend.com/). Follow this one-time setup:

1. Create a Resend account, then add a domain you own in its **Domains** area. Add the DNS records Resend gives you at your domain provider and wait for it to verify.
2. In Resend, create an API key with permission to send email. Keep it private — do not paste it into chat or commit it to Git.
3. In this project folder, create your local settings file from the template:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

4. Replace the two example values with your API key and an address on your verified domain. For example:

   ```text
   RESEND_API_KEY=re_your_actual_key
   RESEND_FROM_EMAIL="RemoteRefined <hello@yourdomain.com>"
   ```

5. Save the file, close the running server window if it is open, and double-click `Start-RemoteRefined.cmd` again.

The app deliberately returns a clear setup message until both values exist. Email providers require a verified sending domain before they can send to arbitrary addresses.

## Make it public

Deploy this folder to a Node host such as Render, Railway, Fly.io, or a VPS. Configure the same two environment variables in the host dashboard and set the start command to `node server.js`. The host will supply a public HTTPS URL that works from any phone or computer.

For a custom domain, point your domain’s DNS to the host and verify that domain in Resend before using it as `RESEND_FROM_EMAIL`.
