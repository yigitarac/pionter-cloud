# PionterCloud

PionterCloud is a bring-your-own-server cloud file manager.

It lets users connect their own Linux servers and manage files from a modern web interface. Users can browse folders, upload and download files, edit text/code files, create share links, and track file activity without moving their data to a third-party storage provider.

## Features

* User registration and login
* Multiple server management
* Password or SSH key based server connection
* Isolated folder path per server
* File and folder listing
* Folder navigation with breadcrumbs
* File upload and download
* Drag and drop upload
* Folder and file creation
* Rename, move, and delete actions
* Recursive folder delete
* Multi-select file actions
* Grid and list view modes
* File preview
* Text/code file editing with Monaco Editor
* Time-limited public file share links
* Share link revoke support
* Public share page
* Activity logs
* Turkish and English language support
* Dark and light mode

## Tech Stack

### Backend

* Go
* PostgreSQL
* SSH/SFTP connection handling
* HTTP API
* Cookie-based session flow
* Encrypted server credentials
* File sharing system
* Activity logging

### Frontend

* Next.js
* React
* JavaScript
* Monaco Editor
* Custom UI components
* Responsive file manager interface

### Database

* PostgreSQL
* Docker-based local development database

## Project Structure

```txt
Pionter-Cloud/
├── pionter-backend/
│   ├── main.go
│   ├── .env
│   └── .env.example
│
├── pionter-ui/
│   ├── src/
│   │   └── app/
│   │       ├── page.js
│   │       ├── sozluk.js
│   │       ├── components/
│   │       └── share/
│   ├── .env.local
│   └── .env.example
│
├── README.md
└── DEVELOPMENT_NOTES.md
```

## Environment Variables

### Backend

Create a `.env` file inside `pionter-backend`.

```env
DATABASE_URL=postgres://admin:supergizli@localhost:5432/piontercloud
CREDENTIAL_ENCRYPTION_KEY=base64-encoded-32-byte-key
APP_PUBLIC_URL=http://localhost:3000
PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000
SHARE_LINK_RETENTION_DAYS=90
ACTIVITY_LOG_RETENTION_DAYS=180
```

Generate a credential encryption key:

```bash
openssl rand -base64 32
```

Important:

* Do not commit the real `.env` file.
* Do not share the real `CREDENTIAL_ENCRYPTION_KEY`.
* Keep `CREDENTIAL_ENCRYPTION_KEY` backed up securely.
* Saved server credentials depend on this key.

### Frontend

Create a `.env.local` file inside `pionter-ui`.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Local Development

### 1. Start PostgreSQL

```bash
docker start pionter-db
```

If the database container does not exist:

```bash
docker run --name pionter-db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=supergizli \
  -e POSTGRES_DB=piontercloud \
  -p 5432:5432 \
  -d postgres
```

### 2. Start Backend

```bash
cd pionter-backend
go run main.go
```

Backend runs on:

```txt
http://localhost:8080
```

### 3. Start Frontend

```bash
cd pionter-ui
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:3000
```

## Basic Usage

1. Create an account or log in.
2. Add a server from the server dashboard.
3. Choose the connection method: password or SSH key.
4. Set the isolated folder path.
5. Open the server file manager.
6. Manage files and folders from the web interface.
7. Create share links when needed.
8. Track actions from the activity log.

## Share Links

PionterCloud supports time-limited file sharing.

Available durations:

* 1 hour
* 1 day
* 1 week
* 1 month
* 1 year
* Unlimited

Share links can be revoked manually. Public share pages allow supported files to be previewed and downloaded.

## Activity Logs

PionterCloud records important file actions such as:

* Upload
* Create
* Edit
* Rename
* Move
* Delete
* Share
* Revoke share link

Activity logs help users track what happened inside their connected server folders.

## Security Notes

PionterCloud stores server credentials in encrypted form.

Security-related behavior:

* Server passwords are not shown back in the interface.
* SSH private keys are not shown back in the interface.
* Real environment files are not committed.
* Public share pages do not expose saved server credentials.
* Share links can expire.
* Share links can be revoked.
* File actions are tracked with activity logs.

## Production Checklist

Before deployment:

* Configure production PostgreSQL.
* Set production backend environment variables.
* Set production frontend environment variables.
* Use HTTPS.
* Configure allowed CORS origins.
* Keep real secrets outside git.
* Back up `CREDENTIAL_ENCRYPTION_KEY`.
* Test authentication.
* Test server connection.
* Test file upload/download.
* Test editor save.
* Test share links.
* Test activity logs.
* Run final frontend build.
* Run final backend smoke test.

## Status

PionterCloud is in MVP launch preparation stage.

The current focus is stabilizing the existing feature set, improving documentation, testing the main flows, and preparing the project for deployment.
