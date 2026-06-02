# PionterCloud

PionterCloud is a bring-your-own-server cloud dashboard and secure web file manager built with Go, Next.js, PostgreSQL, SSH, and SFTP.

The idea is simple:

Users add their own server, choose an isolated folder, and manage files on that server through a web interface.

> This project is in active development and is not production-ready yet.

## Current Status

PionterCloud has completed its local/portfolio MVP stage, the v0.2 Security Gate phase, and the v0.3 Core File Manager Polish phase.

Current phase status:

* v0.1 Local/Portfolio MVP: completed
* v0.2 Security Gate: completed
* v0.3 Core File Manager Polish: completed
* v0.4 Server Monitoring: planned
* v0.5 File Preview and Editor: planned
* v0.6 Terminal: planned
* v0.7 AI Features: planned
* v0.8 Deployment / Production Hardening: planned
* v1.0 Public-ready strong release: future goal

## What PionterCloud Does

PionterCloud lets users:

* Create a PionterCloud account
* Add their own SSH/SFTP server
* Define an isolated folder for file operations
* Browse files and folders
* Upload and download files
* Create folders
* Rename files and folders
* Delete files and empty folders
* Move files and folders
* Select multiple files and folders
* Bulk delete selected files and folders
* Bulk move selected files and folders
* Pin frequently used servers
* Use a collapsible left sidebar for server navigation
* Use the interface in Turkish or English
* Switch between dark and light mode

The project is evolving toward a broader bring-your-own-server dashboard with:

* secure file management
* server monitoring
* file preview/editor support
* optional web terminal access
* optional AI-assisted file/code explanations

## Current Features

### Authentication

* User registration
* Login with username or email
* Password hashing with bcrypt
* Automatic migration of old plain text development passwords after successful login
* Token-based session authentication
* Logout support
* Token expiration
* Frontend session cleanup on expired/invalid token

### Server Management

* Add servers
* List servers
* Edit saved servers
* Delete saved servers
* Pin/unpin frequently used servers
* Pinned servers appear first
* SSH/SFTP connection test before saving or updating servers
* Prevent saving invalid server connection settings
* Password-based SSH authentication
* SSH private key authentication
* Isolated folder validation
* Cleaner empty state when no servers exist

### File Manager

* List files and folders
* Open folders
* Breadcrumb navigation
* Search/filter files in the current folder
* Folders-first alphabetical sorting
* Upload files
* Multi-file upload
* Download files
* Create folders
* Delete files and empty folders
* Rename files and folders
* Move files and folders
* Nested target folder picker for move
* Safeguards against moving folders into themselves
* Multi-select support
* Select listed/visible items
* Clear selection
* Bulk delete selected items
* Bulk move selected items
* Preview selected items inside bulk move and bulk delete modals
* File metadata display

  * file size
  * last modified date

### UI/UX

* Toast notifications

* Loading states

* Custom modal dialogs

  * rename modal
  * move modal
  * delete confirmation modal
  * bulk move modal
  * bulk delete confirmation modal
  * server delete confirmation modal
  * server edit modal

* Click outside to close menus and modals

* Drag and drop upload

* Upload progress indicator

* Collapsible left sidebar

* Server preview inside the sidebar

* Profile/settings controls moved into the sidebar

* Improved My Servers empty state

* Dark/light mode

* Turkish/English language switch

## v0.3 Completed Summary

v0.3 focused on improving the core file manager experience and making multi-item operations usable.

Completed in v0.3:

* Collapsible left sidebar for server navigation
* Server preview inside the sidebar
* Profile/settings controls moved into the sidebar
* Cleaner My Servers empty state
* Multi-select toolbar for file and folder selections
* Select listed/visible items
* Clear selection behavior
* Bulk delete support
* Bulk move support
* Shared move modal behavior for single-item and bulk move flows
* Selected-item preview inside bulk move modal
* Selected-item preview inside bulk delete modal
* State cleanup after bulk operations
* Improved drag-and-drop upload behavior
* Improved upload/new-folder/selection UX
* v0.3 smoke test completed
* `npm run lint` completed with 0 errors and 2 non-blocking warnings

Known non-blocking lint warnings after v0.3:

* `postcss.config.mjs` anonymous default export warning
* React Hook dependency warning for the drag/drop upload effect in `page.js`

## v0.4 Completed Summary

v0.4 focused on adding a lightweight server monitoring panel for the selected server.

Completed in v0.4:

* Added `/api/server/stats` backend endpoint.
* Added SSH-based server stats collection.
* Added CPU usage calculation.
* Added RAM usage information.
* Added disk usage information.
* Added clean uptime output.
* Added server monitoring card to the selected server view.
* Added CPU/RAM/Disk progress bars.
* Added manual Refresh support.
* Added silent auto refresh.
* Added backend stats cache to reduce repeated SSH load.
* Added Last updated timestamp.
* Added SSH OK status badge.
* Improved Turkish uppercase behavior with the `lang` attribute.
* v0.4 final smoke test completed with no blocking errors.

Known notes:

* Monitoring currently targets Linux servers.
* Auto refresh is frontend-driven.
* Backend stats cache is in-memory.
* Cache cleanup is deferred to a later refactor.

## Security Status

PionterCloud is safer than the initial v0.1 local MVP, but it is still not production-ready.

Completed security improvements:

* Pionter account passwords are hashed with bcrypt.
* Old plain text development passwords are migrated to bcrypt after successful login.
* Login returns a session token.
* Protected backend endpoints use token-based authentication.
* The frontend no longer sends the Pionter account password after login.
* Logout deletes the active session token.
* Session tokens expire.
* Expired tokens are rejected by the backend.
* The frontend clears the local session on `401 Unauthorized`.
* Saved server passwords and SSH private keys are encrypted before being stored.
* Existing plain text server credentials are lazily migrated to encrypted values when used.
* Saved server credentials are not returned to the frontend.

Credential encryption behavior:

* AES-GCM is used.
* Encrypted values use the `enc:v1:` prefix.
* The encryption key is loaded from `CREDENTIAL_ENCRYPTION_KEY`.
* The real encryption key must never be committed.

Still required before production use:

* Move tokens from request body to `Authorization: Bearer <token>` headers.
* Improve CORS configuration.
* Add rate limiting.
* Add stricter request size limits.
* Add SSH host key verification.
* Add stable backend error codes.
* Improve logging without leaking secrets.
* Add HTTPS deployment.
* Add deployment hardening.
* Add backup and recovery planning.
* Add a proper database migration strategy.

## Important Warning

This project handles sensitive information such as:

* Pionter account credentials
* server IP addresses
* server usernames
* server passwords
* SSH private keys
* remote file access

Do not expose this project to untrusted public users yet.

For now, it is intended for:

* learning
* local development
* portfolio development
* controlled private testing

## Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS

### Backend

* Go
* PostgreSQL
* SSH
* SFTP

### Development Tools

* Docker for local PostgreSQL
* Environment variables with `.env`
* Git/GitHub for version control

## Project Structure

```text
Pionter-Cloud/
  README.md
  DEVELOPMENT_NOTES.md

  pionter-backend/
    main.go
    go.mod
    go.sum
    .env.example
    .gitignore

  pionter-ui/
    src/app/page.js
    src/app/sozluk.js
    src/app/yardimcilar.js
    src/app/components/
      LoadingState.jsx
      Toast.jsx
    package.json
    package-lock.json
```

## Environment Variables

Create a `.env` file inside the `pionter-backend` folder.

Example:

```env
DATABASE_URL=postgres://admin:password@localhost:5432/piontercloud
CREDENTIAL_ENCRYPTION_KEY=base64-encoded-32-byte-key
```

Generate a local credential encryption key with:

```bash
openssl rand -base64 32
```

Do not commit the real `.env` file.

Only `.env.example` should be committed.

## Local Development Setup

### 1. Start PostgreSQL

The project currently uses PostgreSQL locally, commonly through Docker.

Example database URL:

```env
DATABASE_URL=postgres://admin:password@localhost:5432/piontercloud
```

### 2. Start Backend

```bash
cd pionter-backend
go run main.go
```

Expected output:

```text
Veritabanına başarıyla bağlandım!
Sunucu 8080 portunda çalışmaya başladı!
```

### 3. Start Frontend

```bash
cd pionter-ui
npm install
npm run dev
```

Then open the frontend in the browser.

## Current Development Philosophy

This project is learning-focused, but quality is prioritized over speed.

Main goals:

* Learn backend development with Go.
* Learn frontend development with Next.js.
* Learn database usage with PostgreSQL.
* Learn SSH/SFTP file operations.
* Build a real-world cloud/file-manager style application.
* Improve security and architecture step by step.
* Keep technical debt visible instead of hiding it.

## Roadmap

### v0.4 Server Monitoring

Planned improvements:

* CPU usage
* RAM usage
* Disk usage
* Uptime
* Load average
* Manual refresh
* Optional auto-refresh
* Server dashboard panel

### v0.5 File Preview and Editor

Planned improvements:

* Text file preview
* Image preview
* Unsupported file warning
* Large file limit
* Binary file detection
* Basic text/code editor
* Save edited file
* Unsaved changes warning
* Monaco editor integration
* Syntax highlighting

### v0.6 Terminal

Planned improvements:

* Web terminal for selected server
* Terminal starts in isolated folder
* Strong warning before opening terminal
* WebSocket-based command session
* Research restricted user/chroot/limited shell options

Terminal access is powerful but risky. It should not be treated casually.

### v0.7 AI Features

Possible improvements:

* User-provided AI API key
* Explain selected file
* Summarize code file
* Analyze log file
* Explain error messages
* Suggest refactors
* Privacy warning before sending file content to an AI provider

### v0.8 Deployment / Production Gate

Planned improvements:

* HTTPS deployment
* Production environment configuration
* Safer CORS
* Rate limiting
* Request size limits
* SSH host key verification
* Stable backend error codes
* Safer logging
* Backup strategy
* Docker/deployment guide
* Production checklist

### v1.0 Public-ready Strong Release

v1.0 should mean:

* strong security foundation
* polished core file manager
* server monitoring
* preview/editor functionality
* deployment documentation
* known limitations clearly documented
* public usage risks reduced and understood

## Deployment Position

Recommended deployment strategy:

* v0.1: local/portfolio only
* v0.2: possible private deployment after careful setup
* v0.3/v0.4: stronger portfolio/demo visibility
* v0.8/v1.0: serious public deployment consideration

A domain can be purchased earlier, but broad public usage should wait until deployment hardening is complete.

## Known Limitations

Current limitations:

* Frontend `page.js` is still large.
* Backend `main.go` is still large.
* Tokens are sent in request bodies instead of headers.
* CORS is still permissive.
* SSH host key verification is not implemented.
* Rate limiting is not implemented.
* Error responses are not standardized.
* No formal database migration tool is used yet.
* No automated tests yet.
* No CI pipeline yet.
* No deployment guide yet.
* Mobile/tablet sidebar behavior is deferred.
* Lint warnings exist but no lint errors are currently present.

## License

This project does not have a license yet.
