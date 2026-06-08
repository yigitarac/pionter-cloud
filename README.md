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

PionterCloud is not intended to be a full server administration panel like cPanel or Plesk.

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
* v0.7 Share Links, New File and Context Menu: completed
* v0.8 Activity Logs and File Activity UI: completed
* v0.9 Editor Polish: completed
* v1.0 Public hardening checkpoint: completed
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
* Switch between grid and list file views
* Upload and download files
* Upload multiple files
* Create folders
* Create empty files
* Rename files and folders
* Move files and folders
* Delete files and folders, including non-empty folders
* Select multiple files and folders
* Select listed/visible files
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
* Share files through expiring or unlimited public links
* Open public share landing pages
* Preview shared image and text/code files
* Download shared files from public links
* Manage and revoke created share links
* View activity logs
* View latest file activity labels on file cards and list rows
* Open file/folder properties
* Use a custom right-click context menu for file actions
* Use a custom right-click context menu for folder actions
* Use a custom right-click context menu for empty-folder actions
* Use a three-dot menu with actions aligned with the context menu
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
* Basic in-memory IP-based rate limiting is applied to login and registration endpoints.
* Auth rate limit records are cleaned periodically in memory.

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
* Grid view
* List view
* Single-button grid/list view toggle
* Open folders
* Breadcrumb navigation
* Search/filter files in the current folder
* Folders-first alphabetical sorting
* Upload files
* Multi-file upload
* Download files
* Create folders
* Create empty files
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
  * latest PionterCloud activity, when available

### Context Menus and File Actions

* Custom right-click menu for files
* Custom right-click menu for folders
* Custom right-click menu for empty file-area space
* Three-dot menu for file/folder actions
* Three-dot menu actions aligned with right-click actions
* File context menu actions:

  * edit, for supported text/code files
  * preview
  * download
  * rename
  * move
  * share
  * delete
  * properties

* Folder context menu actions:

  * open
  * rename
  * move
  * delete
  * properties

* Empty-area context menu actions:

  * upload
  * new file
  * new folder

### File Preview and Editor

* Text/code file preview
* Image preview
* Image thumbnails in the file grid
* File preview modal
* Preview cache
* Preview size limits
* Text/code preview hard limit: 5 MB
* Text/code save hard limit: 5 MB
* Large text/code files show a warning before Monaco preview
* Users can still choose to preview large text/code files up to the backend hard limit
* Normal read-only Monaco previews auto-size based on content height
* File type icon system
* Language-specific code file icon colors
* Monaco-based text/code editor
* Direct edit action for supported text/code files
* Safe text/code file saving through SFTP
* Edit / Save / Cancel Edit flow inside the preview modal
* Preview mode toolbar shows Edit / Settings / Download / Close
* Edit mode toolbar shows Save / Cancel Edit / Settings / Close
* Download is hidden while editing to keep the toolbar clean
* Shiki-powered Monaco syntax highlighting
* Gruvbox Dark Monaco theme
* Gruvbox Light Monaco theme
* Read-only Monaco preview for supported text/code files
* Editable Monaco mode for supported text/code files
* Shared text/code file previews use read-only Monaco
* Shared Monaco previews auto-size based on content height
* Ctrl+S / Cmd+S save shortcut
* Custom unsaved-changes confirmation modal for in-app close/cancel actions
* Optional editor settings for text/code preview and edit mode
* Editor settings are saved locally in the browser
* Configurable editor font size
* Configurable word wrap
* Configurable Monaco minimap
* Editor settings include a reset-to-defaults action
* Editor settings menu supports clean outside-click and Escape closing behavior
* Browser before-unload warning for unsaved editor changes

### Share Links

* File share link creation
* Expiring share links:

  * 1 hour
  * 1 day
  * 1 week
  * 1 month
  * 1 year

* Unlimited share links
* Secure random share tokens
* Stored token hashes instead of storing raw tokens
* Public share landing page
* Public share info endpoint
* Public share download endpoint
* Public share preview endpoint
* Shared image preview
* Shared text/code preview
* Shared file download
* Turkish/English controls on the public share page
* Dark/light mode controls on the public share page
* Share link management modal
* Active / expired / revoked share link states
* Revoke share link support
* Custom revoke confirmation modal
* Share list limited to the most recent 100 records
* Public share pages do not expose server credentials, server IP, isolated folders, or real server paths
* Shared text/code files use read-only Monaco preview
* Shared text/code previews use the same Gruvbox theme system as the main editor
* Shared Monaco preview height auto-sizes for short files and scrolls for longer files

### Activity Logs

* Activity log database table
* Backend activity log helper
* Activity log list endpoint
* Activity log UI modal
* Recent activity list
* Success/error status display
* Localized activity action labels
* File operation activity tracking
* Share link activity tracking
* Latest file activity labels on file cards and list rows
* Latest file activity tooltip with timestamp
* File/folder properties modal with latest activity details

Tracked activity examples:

* login
* logout
* upload
* download
* create file
* create folder
* rename
* move
* delete
* editor save
* share link create
* share link revoke

Latest file activity labels currently focus on meaningful file-changing actions, such as:

* uploaded
* created
* edited
* renamed
* moved
* shared
* share revoked

Passive actions such as preview/download remain available in the activity log modal but are not shown as file-card activity labels by default.

### File and Folder Properties

* Properties modal for files and folders
* File/folder name
* User-facing path display
* Type
* Size
* Last modified date
* Latest PionterCloud activity, when available

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
* Permission-aware file creation errors
* Permission-aware rename errors
* Permission-aware move, bulk move, and drag move errors
* Permission-aware download errors
* Clearer backend error codes for common file operation failures

### UI/UX

* Toast notifications
* Loading states
* Upload progress indicator
* Custom modal dialogs
* Custom confirmation modals
* Click outside to close menus and modals where supported
* Escape handling for key modal flows
* Drag and drop upload
* Drag and drop move
* Multi-item drag preview
* File-type-aware drag preview colors
* Custom breadcrumb/up-folder tooltips
* Custom file/folder name tooltips
* Custom latest-activity tooltips
* Collapsible left sidebar
* Server preview inside the sidebar
* Profile/settings controls inside the sidebar
* Dark/light mode
* Turkish/English language switch

## Environment Variables

PionterCloud uses separate environment files for the backend and the frontend.

Backend environment file:

* Local file: `pionter-backend/.env`
* Example file: `pionter-backend/.env.example`

Backend variables:

* `DATABASE_URL`
  * PostgreSQL connection string.
* `APP_PUBLIC_URL`
  * Public frontend URL used by the backend when generating share links.
  * Local development example: `http://localhost:3000`
  * Production example: `https://piontercloud.com`
* `PORT`
  * Backend HTTP port.
  * Local development example: `8080`
* `CORS_ALLOWED_ORIGINS`
  * Comma-separated list of frontend origins allowed to call the backend.
  * Local development example: `http://localhost:3000`
* `SHARE_LINK_RETENTION_DAYS`
  * Number of days to keep expired/revoked share link records.
  * Default example: `90`
* `ACTIVITY_LOG_RETENTION_DAYS`
  * Number of days to keep activity log records.
  * Default example: `180`


Frontend environment file:

* Local file: `pionter-ui/.env.local`
* Example file: `pionter-ui/.env.example`

Frontend variables:

* `NEXT_PUBLIC_API_BASE_URL`
  * Backend API base URL used by the browser.
  * Local development example: `http://localhost:8080`
  * Production example: `https://api.piontercloud.com`

Important notes:

* Real `.env` and `.env.local` files must not be committed.
* `.env.example` files should be committed.
* `APP_PUBLIC_URL` points from backend to frontend.
* `NEXT_PUBLIC_API_BASE_URL` points from frontend to backend.
* If `APP_PUBLIC_URL` is missing, the backend should fail instead of generating invalid localhost share links.

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
* Share link tokens are generated with cryptographically secure randomness.
* Share link tokens are stored as hashes.
* Public share endpoints do not expose saved server credentials.
* Public share endpoints do not expose server IPs, SSH usernames, isolated folders, or raw internal server paths.
* Revoked and expired share links stop working.
* Activity logs are scoped to the authenticated user.
* Activity log list responses do not expose server credentials.
* Basic CORS origin control is supported through `CORS_ALLOWED_ORIGINS`.
* Basic security headers are added by the backend middleware.
* Expired/revoked share link records are cleaned after the configured retention period.
* Old activity log records are cleaned after the configured retention period.


Important limitation:

The isolated folder protects PionterCloud file operations. It is not a general-purpose server sandbox.

## Roadmap

### v0.9 Editor Polish

Completed.

Completed so far:

* Shiki-powered Monaco syntax highlighting
* Gruvbox Dark Monaco theme
* Gruvbox Light Monaco theme
* Read-only Monaco preview for supported text/code files
* Editable Monaco mode for supported text/code files
* Shared text/code file previews with read-only Monaco
* Auto-sized shared Monaco preview height
* Improved editor smooth scrolling, cursor animation, bracket guides, and font stack
* Better preview/editor light mode visual consistency
* Auto-sized normal read-only Monaco preview height
* Polished Monaco loading state
* Large text/code preview warning before loading Monaco
* 5 MB backend hard limit for text preview and text save
* Optional browser-local editor settings
* Configurable editor font size
* Configurable word wrap
* Configurable Monaco minimap
* Editor settings button in the preview/editor toolbar
* Editor settings reset-to-defaults action
* Polished editor settings menu close behavior
* Simplified preview/editor toolbar behavior

Deferred / future refinements:

* Further editor toolbar refinements if needed
* Further editor loading state refinements if needed
* Further large-file UX refinements
* More advanced editor settings later if needed
* Better language-specific tuning where Monaco/Shiki allows it
* Keep advanced editor features lightweight and lazy-loaded

### Future Features

Potential future features:

* Google Docs-like collaborative editing
* Server-to-server file transfer
* Folder upload with directory structure preservation
* Folder sharing through archived/safe bundles
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
* Share retention policy / automatic cleanup for old expired and revoked links

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
