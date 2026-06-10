# PionterCloud

**PionterCloud** is a bring-your-own-server cloud file manager.

Connect your own Linux server, choose an isolated folder, and manage your files from a modern web interface.

Live app: **https://cloud.pionter.net**

![PionterCloud Login](docs/screenshots/login.png)

---

## Overview

PionterCloud is a self-managed cloud file manager for users who want more control over where their files live.

Instead of uploading files to a third-party cloud storage provider, users connect their own Linux servers and manage files directly through PionterCloud.

The project is currently a working MVP and is actively being improved.

---

## Why PionterCloud?

Most cloud platforms require users to store their files on someone else’s infrastructure.

PionterCloud takes a different approach:

* Your files stay on your own server
* You control your own storage
* You can connect multiple servers
* You manage files through a clean browser interface
* You avoid being locked into a single storage provider

PionterCloud is built for users who want the convenience of a cloud file manager without giving up control of their own infrastructure.

---

## Screenshots

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Server Management

![Server Management](docs/screenshots/server-management.png)

### File Actions

![File Actions](docs/screenshots/file-actions.png)

### Public Share Page

![Public Share Page](docs/screenshots/share-link.png)

---

## Features

* User registration and login
* Multiple server management
* SSH password and SSH key based server connection
* Isolated folder support
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
* Backend HTTP server timeouts are configured
* PostgreSQL is intended to run privately and not be exposed to the public internet

A web-based terminal feature was intentionally removed from the project because unrestricted terminal access would create a much higher security risk.

---

## Tech Stack

### Frontend

* Next.js
* React
* Monaco Editor
* Custom responsive UI

### Backend

* Go
* PostgreSQL
* SSH / SFTP integration
* REST API

### Production

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
├── docs/
│   └── screenshots/
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

The frontend expects an API base URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

The backend expects environment variables:

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

The project supports core cloud file manager functionality, server connection, file operations, public sharing links, activity logs, and production deployment.

Further improvements will focus on security hardening, reliability, UI polish, and better user experience.

---

## License

This project is currently maintained as a personal learning and product-development project.

License information will be clarified before wider public release.
