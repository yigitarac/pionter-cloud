# Development Notes

This file tracks the technical status, security decisions, technical debt, roadmap, and product direction for PionterCloud.

PionterCloud is a learning-focused full-stack project, but the goal is to keep the codebase honest, maintainable, and security-aware as it grows toward a public BYOS SaaS product.

## Product Definition

PionterCloud is a public bring-your-own-server cloud file manager and lightweight server dashboard.

The product is:

```txt
File manager first, lightweight server dashboard second.
```

The product is not:

```txt
A full cPanel/Plesk replacement.
A full server administration panel.
```

Core product direction:

* Public BYOS file manager
* Safe file operations
* File preview
* Text/code editing
* Lightweight read-only server visibility
* Sharing
* Activity logs
* Future optional AI assistance

## Current High-Level Status

* v0.1 Local/Portfolio MVP: completed
* v0.2 Security Gate: completed
* v0.3 Core File Manager Polish: completed
* v0.4 Server Monitoring: completed
* v0.5A File Preview: completed
* v0.5A.5 Core File Operations Reliability: completed
* v0.5B Basic Text Editor + Monaco: completed
* v0.6.5 Stability, Permission Errors and Public SaaS Hardening: planned
* v0.7 Share Links: planned
* v0.8 Activity Logs: planned
* v0.9 Editor Polish: planned
* v1.0 Public-ready strong release: future goal

## Current Architecture

### Backend

The backend is written in Go.

Current backend responsibilities:

* User registration
* User login
* Password hashing
* Token/session management
* Server management
* Server credential encryption and decryption
* SSH/SFTP connection validation
* File listing
* File upload
* File download
* File preview
* Safe text/code file save
* Folder creation
* Delete, including recursive folder delete
* Rename
* Move
* Server stats collection
* In-memory server stats cache

### Frontend

The frontend is written with Next.js, React, and Tailwind CSS.

Current frontend responsibilities:

* Login/register UI
* Server list UI
* Server add/edit/delete/pin UI
* Sidebar navigation
* File manager UI
* Upload/download UI
* File preview UI
* Monaco-based text/code editor UI
* Folder creation UI
* Rename/delete/move modals
* Bulk move and bulk delete modals
* Multi-select toolbar
* Drag/drop move for single and selected multiple items
* Breadcrumb drop targets for moving files/folders upward
* Targeted upload by dropping local files onto folder cards or breadcrumb folders
* Toast notifications
* Loading states
* Dark/light mode
* Turkish/English language switch
* Server monitoring UI
* Edit / Save / Cancel Edit flow for supported text/code files
* Ctrl+S / Cmd+S save shortcut
* Unsaved-change warnings for editor changes

### Database

PostgreSQL is used.

Current main tables:

* `kullanicilar`
* `sunucular`
* `oturumlar`

Expected future tables:

* `share_links`
* `activity_logs`
* possibly `email_verifications`
* possibly `password_resets`
* possibly `user_security_settings`

## Current Security Decisions

### Authentication

* New Pionter account passwords are stored with bcrypt.
* Older plain-text development passwords are migrated to bcrypt after successful login.
* Login returns a session token.
* Session tokens are stored in the `oturumlar` table.
* Protected backend endpoints require token-based authentication.
* Logout deletes the active session token from the database.
* Session tokens have an expiration timestamp.
* Expired tokens are rejected by the backend.
* Expired sessions are cleaned up during login.
* The frontend handles `401 Unauthorized` responses by clearing local session state.

### Server Credentials

* Server passwords and SSH private keys are encrypted before storage.
* Existing plain-text development credentials are lazily migrated to encrypted values when the server is used.
* Saved server credentials are not returned to the frontend.
* SSH/SFTP connection test runs before saving or updating a server.

### Isolated Folder

* File manager operations are restricted to the configured isolated folder.
* Backend path construction uses safe path joining and validation.
* File/folder names are validated against dangerous path fragments.
* The isolated folder protects PionterCloud file operations.
* The isolated folder is not a general-purpose server sandbox.

### File Operations

* File listing uses SFTP.
* Upload uses SFTP.
* Download uses SFTP.
* Preview uses SFTP.
* Editor save uses SFTP.
* Recursive delete is supported but remains behind isolated-folder path checks.
* Move operations block moving folders into themselves.
* Text preview and text save operations have size limits.
* Unsupported file types are blocked from editing.

## Completed Phase Summaries

## v0.1 Local/Portfolio MVP Summary

The v0.1 phase focused on making the core product usable locally.

Completed:

* User registration and login
* Multiple server support
* Server add/list/edit/delete
* Server pin/unpin
* SSH/SFTP file listing
* Upload files
* Download files
* Create folders
* Delete files and empty folders
* Rename files and folders
* Move files and folders
* Nested target folder picker for move
* Breadcrumb navigation
* Search/filter files in current folder
* Folders-first alphabetical listing
* File metadata display
* Toast notification system
* Custom modals
* Dark/light mode
* Turkish/English language switch
* Initial README and development notes

## v0.2 Security Gate Summary

The v0.2 phase focused on improving authentication, session handling, and credential storage.

Completed:

* bcrypt password hashing
* Plain-text development password migration
* Dedicated `/api/login` endpoint
* Session token generation
* Server-side session token storage
* Protected endpoint token authentication
* Logout endpoint
* Token expiration
* Frontend session cleanup on invalid token
* Server credential encryption
* Lazy migration for old plain-text server credentials
* Saved credentials hidden from frontend responses

## v0.3 Core File Manager Polish Summary

The v0.3 phase focused on making the file manager feel more like a real product interface.

Completed:

* Collapsible left sidebar
* Server preview inside sidebar
* Profile/settings controls inside sidebar
* Improved empty states
* Multi-select toolbar
* Select listed/visible behavior
* Clear selection behavior
* Bulk delete
* Bulk move
* Shared move modal behavior
* Selected-item previews in bulk move/delete modals
* Improved drag-and-drop upload behavior
* Improved upload/folder/selection UX

Known non-blocking warnings after v0.3:

* `postcss.config.mjs` anonymous default export warning
* React Hook dependency warning for the drag/drop upload effect in `page.js`

## v0.4 Server Monitoring Summary

The v0.4 phase added basic read-only server monitoring.

Completed:

* `/api/server/stats` endpoint
* SSH-based server stats collection
* CPU usage calculation
* RAM usage
* Disk usage
* Load average parsing
* Uptime output
* Monitoring card in selected server panel
* CPU/RAM/Disk progress bars
* SSH OK status badge
* Last updated timestamp
* Manual refresh
* Silent auto refresh
* In-memory backend stats cache

Limitations:

* Linux-focused
* SSH-based
* Backend cache is in-memory
* Historical charts are not implemented
* Alerting is not implemented

## v0.5A File Preview Summary

The v0.5A phase added safe file previews and improved file type recognition.

Backend changes:

* `/api/file/preview`
* Preview request/response structs
* File extension detection
* Supported text/code file whitelist
* Image file whitelist
* Preview type detection
* Text preview reader through SFTP
* Image preview reader through SFTP
* Base64 image response support
* Preview limits:

  * text: 1 MB
  * image: 5 MB

Frontend changes:

* Preview state
* Preview cache
* File preview modal
* Text/code preview
* Image preview
* Image thumbnails
* File type icon system v2
* Language-specific code icon colors
* Mini file icons in bulk modals

Known limitations:

* PDF preview currently shows fallback/download behavior.
* Office files have icons but no real preview.
* Large text/image files are blocked by preview limits.
* Image thumbnail loading is limited for safety.

## v0.5A.5 Core File Operations Reliability Summary

The v0.5A.5 phase improved core file operation reliability and UX.

Backend changes:

* Recursive folder deletion
* Recursive SFTP delete helper
* Symlink-aware delete behavior through `Lstat`
* Stronger file/folder name validation

Frontend changes:

* Folder-content preview in delete modal
* Drag/drop move from file cards to folder cards
* Drag/drop move from file cards to breadcrumb folders
* Multi-item drag move
* Targeted upload to folder cards
* Targeted upload to breadcrumb folders
* Drag/drop visual states
* Drag hover flicker fixes
* Stale drag state fixes
* Stacked drag preview cards
* File-type-aware drag preview colors
* Loading-state navigation lock
* Custom breadcrumb/up-folder tooltips

Known limitations:

* Multi-item drag move currently sends one `/api/move` request per item.
* Partial failure handling can be improved after stable backend error codes.
* Move conflict feedback is still generic.

## v0.5B Basic Text Editor + Monaco Summary

The v0.5B phase added safe lightweight text/code editing.

Backend changes:

* `/api/file/save`
* Save request/response structs
* Save response helper
* `textSaveLimit`
* SFTP-based text file save helper
* Truncate-and-write save behavior
* Existing-file-only save behavior
* Unsupported file type rejection
* Folder save rejection
* Oversized content rejection
* Token authentication and isolated-folder path validation

Frontend changes:

* Monaco Editor dynamic import
* Editor state in preview modal
* Read-only preview mode
* Edit mode
* Save action
* Cancel Edit action
* Dirty-state tracking
* Ctrl+S / Cmd+S save shortcut
* Confirmation before closing with unsaved changes
* Browser before-unload warning
* Editor information bar
* Unsaved-change badge
* Download disabled while unsaved changes exist
* Preview cache update after save
* File list refresh after save
* Monaco language detection by extension

Known limitations:

* Monaco standalone highlighting is not the same as language-server semantic highlighting.
* Advanced IntelliSense is not implemented.
* Language servers are deferred.
* Custom PionterCloud Gruvbox Monaco themes are planned for a future editor polish phase.

## Planned Roadmap

## v0.6.5 Stability, Permission Errors and Public SaaS Hardening

Goals:

* Improve stability before adding more features.
* Make backend errors more consistent.
* Make frontend error messages more user-friendly.
* Prepare the project direction for public SaaS concerns.

Planned backend work:

* Add permission denied detection helper.
* Standardize common error codes.
* Improve SFTP/SSH error classification.
* Return clearer errors for:

  * list
  * upload
  * preview
  * save
  * rename
  * move
  * delete
* Review public registration assumptions.
* Add notes for future email verification, rate limiting, and abuse prevention.

Planned frontend work:

* Show clearer permission denied messages.
* Show clearer SSH connection failure messages.
* Show clearer SFTP failure messages.
* Improve generic operation failure toasts.
* Avoid confusing users when Linux permissions block an operation.

## v0.7 Share Links

Goals:

* Allow users to share files through generated links.
* Support time-limited and unlimited links.

Planned backend work:

* Add `share_links` table.
* Generate secure random share tokens.
* Store:

  * user id
  * server id
  * file path
  * token hash or token value
  * expiration time
  * created time
  * revoked status
* Add share-create endpoint.
* Add public share-download endpoint.
* Add share-revoke endpoint.
* Validate expiration and revoked state.

Planned frontend work:

* Share action in file menu.
* Share modal.
* Expiration selector:

  * 1 hour
  * 1 day
  * 1 week
  * 1 month
  * 1 year
  * unlimited
* Copy link button.
* Revoke link behavior.
* Share management UI later.

Security notes:

* Share tokens must be long and random.
* Shared file access must not require account login.
* Shared access must not expose server credentials.
* Expired and revoked links must stop working.

## v0.8 Activity Logs

Goals:

* Track important user actions.
* Build the foundation for audit, rollback ideas, and future AI-assisted activity review.

Planned backend work:

* Add `activity_logs` table.
* Log key actions:

  * login
  * logout
  * server add/edit/delete
  * upload
  * download
  * preview
  * save
  * rename
  * move
  * delete
  * share link create/revoke
* Store:

  * user id
  * server id
  * action type
  * target path
  * metadata JSON
  * timestamp
  * status
  * error code if failed

Planned frontend work:

* Activity log page or modal.
* Filter by server.
* Filter by action type.
* Filter by date.
* Search by path.
* Basic timeline UI.

Future use:

* “What changed recently?”
* Undo/rollback research
* AI-assisted activity summaries
* Safer AI action previews

## v0.9 Editor Polish

Goals:

* Improve Monaco editor look and feel.
* Keep editor lightweight.

Planned work:

* PionterCloud Gruvbox Dark Monaco theme
* PionterCloud Gruvbox Light Monaco theme
* Better language-specific token colors
* Better editor toolbar
* Better editor loading state
* Better large-file UX
* Optional editor settings
* More consistent file/editor color system

Deferred:

* Heavy language servers
* Full IDE behavior
* Advanced IntelliSense
* Semantic highlighting
* Project-wide code analysis

These should only be added if they can be lazy-loaded or made optional.

## Future Features

Potential future features:

* Google Docs-like collaborative editing
* Server-to-server file transfer
* File versioning
* File rollback
* AI-assisted file search
* AI-assisted code/file explanation
* AI-assisted activity log review
* AI-assisted safe file operations
* User-provided AI API keys
* More advanced monitoring
* Email verification
* Password reset
* 2FA/passkey support
* Rate limiting
* Admin dashboard
* Abuse prevention tools

## Public SaaS Security Backlog

Before public release, the project should consider:

* Email verification
* Password reset flow
* Login rate limiting
* Registration rate limiting
* Stronger session management
* Refresh-token strategy or better token lifecycle
* 2FA/passkey support
* CSRF review
* CORS/origin hardening
* Security headers
* Audit logs
* Admin moderation tools
* Abuse prevention
* Better secret management
* Production-grade environment config
* Backups and recovery strategy
* Deployment hardening

## AI Direction

AI features are planned as optional and user-controlled.

Principles:

* Users should provide their own API key.
* AI should not create platform cost by default.
* AI should not perform destructive actions without preview and confirmation.
* AI should use safe backend APIs, not raw shell access.
* AI should rely on activity logs for context.
* AI actions should start read-only.

Low-risk AI ideas:

* Summarize folder contents.
* Find largest files in a folder.
* Explain a code file.
* Summarize recent activity.
* Search logs.
* Suggest cleanup candidates.

Higher-risk AI ideas are deferred until logs, permissions, previews, confirmations, and rollback systems are stronger.

## Development Philosophy

Priorities:

* correctness
* security-aware design
* maintainability
* clear UX
* controlled progress
* quality over speed

PionterCloud should grow carefully. Every powerful feature should be evaluated by how much it increases risk in a public BYOS SaaS environment.
