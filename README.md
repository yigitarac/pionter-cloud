# PionterCloud

**PionterCloud** is a web-based cloud file manager built around a simple idea:

> Bring your own server. Manage your files from anywhere.

Instead of storing files on a third-party cloud provider, PionterCloud lets users connect their own Linux servers and manage files through a modern browser interface.

Live app: **https://cloud.pionter.net**

---

## What is PionterCloud?

PionterCloud is a self-managed cloud file manager for users who want more control over where their files live.

Users can add their own servers, connect through SSH, choose an isolated folder, and manage files directly from the web UI.

The project is currently in MVP stage and is actively being developed.

---

## Key Features

* User registration and login
* Multiple server management
* SSH password and SSH key based server connection
* Isolated folder support for safer file access
* File and folder listing
* File upload and download
* Drag and drop upload
* Folder creation
* File creation
* Rename, move, and delete actions
* Recursive folder delete
* Multi-select file actions
* Grid and list view
* Breadcrumb navigation
* File preview
* Text/code editing with Monaco Editor
* Temporary public file sharing links
* Share link expiration options
* Share link revoke support
* Activity logs for file actions
* Turkish and English language support
* Dark and light mode

---

## Why PionterCloud?

Most cloud storage platforms require users to upload their files to someone else’s infrastructure.

PionterCloud takes a different approach:

* Your files stay on your server
* You manage your own storage
* You can connect multiple servers
* You access everything through a clean web interface
* You avoid being locked into a single cloud storage provider

PionterCloud is not designed to replace full server administration tools. It focuses on giving users a simple and modern way to manage files on their own servers.

---

## Security Approach

PionterCloud is designed with a cautious security-first mindset.

Current security-related decisions include:

* Server credentials are encrypted before being stored
* SSH host key pinning is used to reduce man-in-the-middle risk
* Users can restrict file access to an isolated folder
* Public share links can expire
* Share links can be revoked
* Backend CORS rules are restricted for production
* Upload request size is limited
* The backend uses HTTP server timeouts
* PostgreSQL is intended to run privately and not be exposed to the public internet

The terminal feature was intentionally removed from the project because unrestricted web-based terminal access would create a much higher security risk.

---

## Tech Stack

### Frontend

* Next.js
* React
* Monaco Editor
* CSS modules / custom UI styling

### Backend

* Go
* PostgreSQL
* SSH / SFTP integration
* REST API

### Production Deployment

* Ubuntu VPS
* Nginx reverse proxy
* Let’s Encrypt SSL
* systemd services
* PostgreSQL on the server

---

## Project Structure

```txt
Pionter-Cloud/
├── pionter-backend/
│   ├── main.go
│   ├── go.mod
│   └── .env.example
│
├── pionter-ui/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── README.md
└── DEVELOPMENT_NOTES.md
```

---

## Local Development

### Backend

```bash
cd pionter-backend
go run main.go
```

### Frontend

```bash
cd pionter-ui
npm install
npm run dev
```

The frontend expects an API base URL such as:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

The backend expects environment variables such as:

```env
DATABASE_URL=postgres://user:password@localhost:5432/piontercloud
CREDENTIAL_ENCRYPTION_KEY=your-secret-key
APP_PUBLIC_URL=http://localhost:3000
PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Do not commit real `.env` files or production secrets.

---

## Current Status

PionterCloud is currently a working MVP.

The project already supports core cloud file manager functionality, server connection, file operations, sharing links, activity logs, and production deployment.

Further improvements will focus on security hardening, UI polish, reliability, and better user experience.

---

## License

This project is currently maintained as a personal learning and product-development project.

License information will be clarified before wider public release.
