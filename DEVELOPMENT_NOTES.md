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
* v0.6.5 Stability, Permission Errors and Public SaaS Hardening: completed
* v0.7 Share Links, New File and Context Menu: completed
* v0.8 Activity Logs and File Activity UI: completed
* v0.9 Editor Polish: in progress
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
* Empty file creation
* Delete, including recursive folder delete
* Rename
* Move
* Server stats collection
* In-memory server stats cache
* Permission-aware file operation error handling
* Share link creation
* Share link listing
* Share link revocation
* Public share info
* Public share preview
* Public share download
* Activity log creation
* Activity log listing
* Latest file activity lookup for current folders

### Frontend

The frontend is written with Next.js, React, and Tailwind CSS.

Current frontend responsibilities:

* Login/register UI
* Server list UI
* Server add/edit/delete/pin UI
* Sidebar navigation
* File manager UI
* Grid file view
* List file view
* Grid/list view toggle
* Upload/download UI
* New file UI
* New folder UI
* File preview UI
* Monaco-based text/code editor UI
* Direct edit action for supported text/code files
* Folder creation UI
* File creation UI
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
* Custom unsaved-change confirmation modal
* Shared frontend API error parsing
* User-friendly permission error messages
* Share link modal
* Share link management modal
* Public share landing page
* Public share page theme/language controls
* Public share preview UI
* Activity logs modal
* Latest file activity labels
* File/folder properties modal
* Custom right-click context menus
* Three-dot action menus aligned with context menu actions
* Shiki-powered Monaco syntax highlighting
* Gruvbox Dark/Light Monaco themes
* Read-only Monaco preview for supported text/code files
* Shared text/code file preview with read-only Monaco
* Auto-sized shared Monaco preview height
* Browser-local editor settings
* Configurable editor font size
* Configurable word wrap
* Configurable Monaco minimap

### Database

PostgreSQL is used.

Current main tables:

* `kullanicilar`
* `sunucular`
* `oturumlar`
* `share_links`
* `activity_logs`

Potential future tables:

* `email_verifications`
* `password_resets`
* `user_security_settings`
* `file_versions`
* `share_retention_jobs`

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
* Empty file creation uses SFTP.
* Recursive delete is supported but remains behind isolated-folder path checks.
* Move operations block moving folders into themselves.
* Text preview and text save operations have size limits.
* Unsupported file types are blocked from editing.
* Permission denied errors are detected and returned with clearer error codes.
* The frontend maps permission denied errors to localized user-facing messages.

### Share Links

* Share links are file-only for now.
* Folder sharing is intentionally deferred.
* Share links support expiring and unlimited durations.
* Share tokens are generated with secure random bytes.
* Raw share tokens are shown only at creation time.
* Raw share tokens are not stored in the database.
* Share token hashes are stored in the database.
* Public share info exposes only safe metadata.
* Public share preview supports image and text/code files.
* Public share download streams the original file without re-encoding or quality loss.
* Public endpoints do not expose server credentials, server IPs, SSH users, isolated folders, or raw internal paths.
* Revoked and expired links are blocked.
* Share management currently lists the most recent 100 share records.
* A future retention policy should clean old expired/revoked records.

### Activity Logs

* Activity logs are stored in `activity_logs`.
* Activity logs are scoped by `user_id`.
* Server-specific activity records may include `server_id`.
* Activity logs include:

  * action type
  * target path
  * target name
  * status
  * optional error code
  * metadata JSON
  * timestamp
* Latest file activity is fetched in bulk for the current folder.
* Latest file activity currently uses meaningful file-changing actions only.
* Activity logs do not store raw share tokens.
* Activity logs should not expose saved server credentials.

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

  * text: 5 MB
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
* Shiki improves syntax highlighting and theme consistency, but it still does not provide full language-server semantics.
* Advanced IntelliSense is not implemented.
* Language servers are deferred.
* Custom PionterCloud Gruvbox Monaco themes are planned for a future editor polish phase.

## v0.6.5 Stability, Permission Errors and Public SaaS Hardening Summary

The v0.6.5 phase focused on making file operation failures clearer and more user-friendly before adding larger public-product features.

Backend changes:

* Added shared API error response struct.
* Added shared JSON API error helper.
* Added file-list JSON error helper.
* Added permission denied detection helper.
* Added localized base permission-denied backend message.
* Added `kod` support to file listing responses.
* Added permission-aware folder preparation errors.
* Added permission-aware folder read errors.
* Added permission-aware text preview errors.
* Added permission-aware image preview errors.
* Added permission-aware editor save errors.
* Added permission-aware delete errors.
* Added permission-aware upload errors.
* Added permission-aware folder creation errors.
* Added permission-aware file creation errors.
* Added permission-aware rename errors.
* Added permission-aware move errors.
* Added JSON error responses for download failures.
* Added permission-aware download open errors.
* Added clearer backend error codes for common SSH/SFTP operation failures.

Frontend changes:

* Added shared API response error parser.
* Added shared API error message mapper.
* Added preview-specific error message mapper.
* Added Turkish and English permission denied messages.
* Added Turkish and English files-load-failed messages.
* Added Turkish and English download-failed messages.
* Updated folder listing error handling.
* Updated preview error handling.
* Updated editor save error handling.
* Updated delete error handling.
* Updated upload error handling.
* Updated folder creation error handling.
* Updated file creation error handling.
* Updated rename error handling.
* Updated single move error handling.
* Updated drag move error handling.
* Updated bulk move error handling.
* Updated download error handling.

Known limitations:

* Error handling is better, but not fully standardized across every backend endpoint yet.
* Some non-permission SSH/SFTP errors still use generic messages.
* Public SaaS features still need email verification, rate limiting, password reset, and stronger abuse-prevention planning.

## v0.7 Share Links, New File and Context Menu Summary

The v0.7 phase added file sharing and several high-impact file-manager UX features.

Backend changes:

* Added `share_links` table.
* Added secure share token generation.
* Added SHA-256 share token hashing.
* Added share duration calculation:

  * 1 hour
  * 1 day
  * 1 week
  * 1 month
  * 1 year
  * unlimited
* Added share file path generation.
* Added public share URL generation through `APP_PUBLIC_URL`.
* Added `/api/share/create`.
* Added `/api/share/info/{token}`.
* Added `/api/share/preview/{token}`.
* Added `/api/share/download/{token}`.
* Added `/api/share/list`.
* Added `/api/share/revoke`.
* Added token-format validation helpers.
* Added tokenless server credential lookup for public share access based on validated share records.
* Added public share metadata response.
* Added public share preview response for image and text/code files.
* Added public share download streaming.
* Added active/expired/revoked share status calculation.
* Added share list limiting to the most recent 100 records.
* Added empty file creation endpoint:

  * `/api/files/create`
* Added conflict detection for new file creation.
* Added permission-aware new file creation errors.

Frontend changes:

* Added file share action.
* Added share modal.
* Replaced share duration dropdown with card/chip selector.
* Added share link creation UI.
* Added share link copy behavior.
* Added public share landing page:

  * `/share/[token]`
* Added public share file metadata display.
* Added public share download button.
* Added public share image preview.
* Added public share text/code preview.
* Added public share page Turkish/English toggle.
* Added public share page dark/light toggle with icons.
* Added share links management modal.
* Added share link status badges:

  * active
  * expired
  * revoked
* Added revoke share link action.
* Replaced browser revoke confirmation with custom Gruvbox-style modal.
* Added user-friendly `Home/...` path display for share records.
* Added new file modal.
* Added new file toolbar button.
* Added file creation validation.
* Added custom right-click context menu for files.
* Added custom right-click context menu for folders.
* Added custom right-click context menu for empty file-area space.
* Added empty-area context actions:

  * upload
  * new file
  * new folder
* Polished context-menu hover spacing.
* Fixed empty-area context-menu hitbox.
* Kept three-dot menu available for mobile/tablet accessibility.
* Replaced in-app editor unsaved-change browser confirm with custom modal.
* Improved file/folder custom tooltip behavior.

Manual validation:

* Share links can be created.
* Expiring share links work.
* Unlimited share links work.
* Public share landing page opens instead of direct download.
* Public share info does not expose credentials or server details.
* Public share preview works for supported image and text/code files.
* Public share download works and preserves original file contents.
* Share links can be listed.
* Active, expired, and revoked statuses display correctly.
* Share links can be revoked.
* Revoked public links stop working.
* New file creation works.
* Duplicate file names are rejected.
* Permission errors are displayed for file creation when needed.
* File/folder item context menu works.
* Empty-area context menu works.
* Existing three-dot menu still works.
* Browser native context menu is replaced in supported file-manager areas.
* In-app unsaved-change confirmation uses custom UI.

Known limitations:

* Share link records are retained in the database for now.
* Old raw share URLs cannot be regenerated from the management list because raw tokens are intentionally not stored.
* Share retention cleanup is not implemented yet.
* Folder sharing is not implemented yet.
* Folder upload with directory structure preservation is not implemented yet.
* Public share preview does not support PDF/Office/archive preview yet.
* Context menu is currently file-manager focused; additional polish may be needed for mobile/tablet behavior.

## v0.8 Activity Logs and File Activity UI Summary

The v0.8 phase added activity logging, activity viewing, file activity labels, list view, and file/folder properties polish.

Backend changes:

* Added `activity_logs` table.
* Added activity log action/status constants.
* Added `aktiviteLogla(...)` helper.
* Added activity path helper.
* Added activity list endpoint:

  * `/api/activity/list`
* Added latest folder activity endpoint:

  * `/api/activity/latest-for-folder`
* Added activity log response helpers.
* Added successful activity logs for:

  * login
  * logout
  * create file
  * create folder
  * share create
  * share revoke
  * upload
  * download
  * editor save
  * rename
  * move
  * delete
* Added latest activity lookup for visible/current folder files.
* Limited latest activity labels to meaningful file-changing actions.

Frontend changes:

* Added Activity Logs modal.
* Added Activity Logs button in the server/header action area.
* Added activity log loading/error/empty states.
* Added localized activity action labels.
* Added activity status badges.
* Added activity log refresh action.
* Moved Share Links and Activity Logs out of the file toolbar into server-level actions.
* Reorganized file toolbar to focus on current-folder actions:

  * search
  * upload
  * new file
  * new folder
* Added Current Path control area.
* Added grid/list view mode.
* Added single-button grid/list toggle.
* Added list view with compact column header.
* Moved selected-item actions into the Current Path control area.
* Kept selection state across grid/list switching.
* Added latest activity labels to file cards and list rows.
* Added latest activity tooltip with timestamp.
* Added file/folder properties modal.
* Added properties action to right-click and three-dot menus.
* Added direct Edit action for supported text/code files.
* Aligned three-dot menu actions with right-click context menu actions.
* Kept passive activity such as preview/download inside the Activity Logs modal instead of showing it on file cards.

Manual validation:

* Activity logs are created for successful auth/file/share actions.
* Activity Logs modal opens and lists recent actions.
* Activity Logs modal refresh works.
* File cards show latest meaningful PionterCloud activity when available.
* File list rows show latest meaningful PionterCloud activity when available.
* Activity labels do not show fake history for files that existed before logging.
* Activity tooltip shows detailed timestamp.
* Preview/download actions do not overwrite latest file activity labels.
* Grid/List toggle works.
* Selection remains usable after view switching.
* File/folder properties modal shows metadata and latest activity.
* Right-click and three-dot menus are more consistent.
* Direct Edit opens supported text/code files in Monaco edit mode.

Known limitations:

* Activity logs are mostly success-oriented right now; richer failed-operation logging can be expanded later.
* Existing files created before activity logging do not receive fake “uploaded/created” activity.
* Latest activity is based on PionterCloud activity records, not raw SFTP modified time.
* Activity log filtering UI is still basic.
* Activity log retention/cleanup policy is not implemented yet.
* Activity logs are not yet used for rollback/versioning.
* Activity logs are not yet used by AI features.

## Planned Roadmap

## v0.9 Editor Polish

Status: in progress.

Goals:

* Improve Monaco editor look and feel.
* Improve text/code preview quality.
* Keep editor features lightweight and lazy-loaded.
* Avoid turning PionterCloud into a heavy IDE.

Completed so far:

* Added Shiki-powered Monaco highlighting.
* Added Gruvbox Dark Monaco theme.
* Added Gruvbox Light Monaco theme.
* Replaced plain text/code preview with read-only Monaco preview.
* Kept edit mode as Monaco editable mode.
* Added read-only Monaco preview to public shared text/code files.
* Added auto-sized shared Monaco preview height.
* Improved editor smooth scrolling.
* Improved cursor animation.
* Added bracket pair colorization.
* Added indentation and bracket pair guides.
* Improved editor font stack.
* Improved preview/editor light mode visual consistency.
* Added auto-sized normal read-only Monaco preview height.
* Added polished Monaco loading state.
* Added large text/code preview warning before loading Monaco.
* Increased text preview hard limit to 5 MB.
* Kept text save hard limit at 5 MB.
* Added browser-local editor settings.
* Added configurable editor font size.
* Added configurable word wrap.
* Added configurable Monaco minimap.
* Replaced the temporary Aa editor settings button with a settings icon.

Current behavior:

* Normal text/code preview uses Monaco in read-only mode.
* Editing supported text/code files uses Monaco in editable mode.
* Shared text/code files use Monaco in read-only mode.
* Shared Monaco preview height grows with content up to a safe maximum.
* Long shared previews scroll inside the Monaco area.
* Image previews still use normal image rendering.
* Unsupported files still use fallback/download behavior.
* Normal read-only Monaco preview height grows with content up to a safe maximum.
* Large text/code files show a warning before Monaco preview.
* Users can still force preview up to the backend hard limit.
* Text preview and text save currently use a 5 MB backend hard limit.
* Editor settings are saved in browser localStorage.
* Editor settings currently apply to the current browser, not the user account.
* Supported editor settings are font size, word wrap, and minimap.
* The same editor settings apply to read-only preview and editable mode.

Still planned:

* More polished editor toolbar.
* Better editor loading state.
* Further large-file UX refinements.
* More advanced editor settings later if needed.
* Better language-specific tuning where Monaco/Shiki supports it.
* More consistent editor and preview spacing.
* Keep advanced editor features lightweight and lazy-loaded.

Deferred:

* Heavy language servers.
* Full IDE behavior.
* Advanced IntelliSense.
* Semantic project-wide analysis.
* Project-wide code navigation.

## Future Features

Potential future features:

* Google Docs-like collaborative editing
* Server-to-server file transfer
* Folder upload with preserved directory structure
* Folder sharing through generated archives or safe bundles
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
* Share retention cleanup for old expired/revoked records

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
* Share link retention and cleanup policy
* Activity log retention and cleanup policy

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
