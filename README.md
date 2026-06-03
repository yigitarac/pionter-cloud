# PionterCloud

PionterCloud is a public bring-your-own-server cloud file manager and lightweight server dashboard.

Users connect their own SSH/SFTP server, choose an isolated folder, and manage their files through a clean web interface.

> This project is in active development and is not production-ready yet.

## Product Direction

PionterCloud is designed as:

```txt
BYOS cloud file manager first, lightweight server dashboard second.
```

The public product focuses on:

* file management
* file preview
* safe text/code editing
* lightweight read-only server visibility
* sharing
* activity logs
* future AI-assisted file and activity workflows

PionterCloud is not intended to be a full server admin panel like cPanel or Plesk.

## Current Status

Current phase status:

* v0.1 Local/Portfolio MVP: completed
* v0.2 Security Gate: completed
* v0.3 Core File Manager Polish: completed
* v0.4 Server Monitoring: completed
* v0.5A File Preview: completed
* v0.5A.5 Core File Operations Reliability: completed
* v0.5B Basic Text Editor + Monaco: completed
* v0.6.5 Stability, Permission Errors and Public SaaS Hardening: completed
* v0.7 Share Links: planned
* v0.8 Activity Logs: planned
* v0.9 Editor Polish: planned
* v1.0 Public-ready strong release: future goal

## What PionterCloud Does

PionterCloud lets users:

* Create a PionterCloud account
* Login with username or email
* Add their own SSH/SFTP server
* Use password-based SSH authentication
* Use SSH private key authentication
* Define an isolated folder for file operations
* Browse files and folders
* Upload and download files
* Upload multiple files
* Create folders
* Rename files and folders
* Move files and folders
* Delete files and folders, including non-empty folders
* Select multiple files and folders
* Bulk move selected files and folders
* Bulk delete selected files and folders
* Drag files and folders onto folder cards to move them
* Drag selected multiple items as a group
* Drag files and folders onto breadcrumb folders to move them upward
* Upload files directly into folder cards or breadcrumb target folders
* Preview text/code files
* Preview images
* Edit supported text/code files with Monaco Editor
* Save edited files back to the connected server over SFTP
* View basic read-only server status
* Pin frequently used servers
* Use a collapsible left sidebar for server navigation
* Use the interface in Turkish or English
* Switch between dark and light mode

## Current Features

### Authentication

* User registration
* Login with username or email
* Password hashing with bcrypt
* Automatic migration of old plain-text development passwords after successful login
* Token-based session authentication
* Logout support
* Token expiration
* Frontend session cleanup on expired or invalid token

### Server Management

* Add servers
* List servers
* Edit saved servers
* Delete saved servers
* Pin/unpin frequently used servers
* Pinned servers appear first
* SSH/SFTP connection test before saving or updating servers
* Password-based SSH authentication
* SSH private key authentication
* Isolated folder validation
* Saved server credentials are encrypted before storage
* Saved credentials are not returned to the frontend

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
* Delete files and folders, including non-empty folders
* Preview folder contents before deleting a folder
* Rename files and folders
* Move files and folders
* Nested target folder picker for move
* Drag files and folders onto folder cards to move them
* Drag selected multiple items as a group
* Drag files and folders onto breadcrumb folders to move them upward
* Upload files directly into folder cards or breadcrumb target folders
* Safeguards against moving folders into themselves
* Multi-select support
* Select listed/visible items
* Clear selection
* Bulk delete selected items
* Bulk move selected items
* Preview selected items inside bulk move and bulk delete modals
* File metadata display:

  * file size
  * last modified date

### File Preview and Editor

* Text/code file preview
* Image preview
* Image thumbnails in the file grid
* File preview modal
* Preview cache
* Preview size limits
* File type icon system
* Language-specific code file icon colors
* Monaco-based text/code editor
* Safe text/code file saving through SFTP
* Edit / Save / Cancel Edit flow inside the preview modal
* Ctrl+S / Cmd+S save shortcut
* Unsaved-change warning before closing the modal
* Browser before-unload warning for unsaved editor changes
* Download is disabled while an edited file has unsaved changes

### Server Monitoring

* Lightweight read-only server status panel
* SSH OK status badge
* CPU usage
* RAM usage
* Disk usage
* Uptime
* Last updated timestamp
* Manual refresh
* Silent auto refresh
* In-memory backend stats cache

### Stability and Error Handling

* Shared frontend API error parsing helper
* Standard permission denied handling for core file operations
* User-friendly permission error messages in Turkish and English
* Permission-aware folder listing errors
* Permission-aware preview errors
* Permission-aware editor save errors
* Permission-aware delete errors
* Permission-aware upload errors
* Permission-aware folder creation errors
* Permission-aware rename errors
* Permission-aware move, bulk move, and drag move errors
* Permission-aware download errors
* Clearer backend error codes for common file operation failures

### UI/UX

* Toast notifications
* Loading states
* Upload progress indicator
* Custom modal dialogs
* Click outside to close menus and modals
* Drag and drop upload
* Drag and drop move
* Multi-item drag preview
* File-type-aware drag preview colors
* Custom breadcrumb/up-folder tooltips
* Collapsible left sidebar
* Server preview inside the sidebar
* Profile/settings controls inside the sidebar
* Dark/light mode
* Turkish/English language switch

## Security Model

PionterCloud is a public BYOS application, so security is a core concern.

Current security decisions:

* Pionter account passwords are hashed with bcrypt.
* Session tokens are stored server-side.
* Expired tokens are rejected.
* Protected endpoints require token authentication.
* Saved server passwords and SSH private keys are encrypted.
* Saved server credentials are not sent back to the frontend.
* File operations are restricted to the configured isolated folder.
* File and folder names are validated against dangerous path fragments.
* Text preview and text save operations have size limits.
* Unsupported file types are blocked from editing.
* Recursive delete remains protected by isolated-folder path validation.
* Permission denied errors are detected and shown with clearer user-facing messages.

Important limitation:

The isolated folder protects PionterCloud file operations. It is not a general-purpose server sandbox.

## Roadmap

### v0.7 Share Links

Planned:

* Share files with generated links.
* Expiring share links:

  * 1 hour
  * 1 day
  * 1 week
  * 1 month
  * 1 year
  * unlimited
* Secure random share tokens.
* Share link database table.
* Expiration validation.
* Public download endpoint for shared files.
* Optional share management UI.
* Share revoke/delete support.

### v0.8 Activity Logs

Planned:

* Track important user actions:

  * login/logout
  * server add/edit/delete
  * upload
  * download
  * rename
  * move
  * delete
  * editor save
  * share link create/revoke
* Activity log database table.
* Activity log UI.
* Per-server and per-file filtering.
* Foundation for future rollback and AI-assisted activity review.

### v0.9 Editor Polish

Planned:

* PionterCloud Gruvbox Dark Monaco theme.
* PionterCloud Gruvbox Light Monaco theme.
* Better language-specific syntax colors.
* More polished editor toolbar.
* Better editor loading state.
* Better large-file handling.
* Optional editor settings.
* Keep advanced editor features lightweight and lazy-loaded.

### Future Features

Potential future features:

* Google Docs-like collaborative editing
* Server-to-server file transfer
* Advanced file versioning
* File rollback support
* AI-assisted file search and summarization
* AI-assisted activity log review
* AI-assisted safe actions with preview/confirmation
* Optional user-provided AI API keys
* More advanced monitoring
* Public deployment hardening
* Email verification
* 2FA/passkey support
* Rate limiting
* Audit logs
* Admin dashboard

## AI Direction

AI features are planned as optional and user-controlled.

Planned AI principles:

* Users provide their own API key.
* AI features should not create platform cost by default.
* AI should not perform dangerous actions without preview and confirmation.
* AI actions should rely on activity logs and safe operation APIs.
* AI should start with low-risk tasks:

  * summarize a folder
  * find large files
  * explain a code file
  * summarize activity logs
* Higher-risk AI actions should be deferred until logs, permissions, previews, confirmations, and rollback systems are stronger.

## Tech Stack

Backend:

* Go
* PostgreSQL
* SSH
* SFTP

Frontend:

* Next.js
* React
* Tailwind CSS
* Monaco Editor

Database:

* PostgreSQL

## Development Philosophy

PionterCloud prioritizes:

* security-aware design
* controlled progress
* clear UX
* maintainable code
* quality over speed

This is a learning-focused project, but the goal is to keep the codebase honest enough to grow toward a real public product.
