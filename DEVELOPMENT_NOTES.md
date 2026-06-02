# Development Notes

This file tracks the current technical status, security decisions, technical debt, and future roadmap for PionterCloud.

PionterCloud is a learning-focused full-stack project, but the goal is to keep the codebase honest, maintainable, and security-aware as it grows.

## Current Project Status

PionterCloud has passed the v0.1 local/portfolio MVP stage, completed the v0.2 Security Gate phase, and completed the v0.3 Core File Manager Polish phase.

Current high-level status:

* v0.1 Local/Portfolio MVP: completed
* v0.2 Security Gate: completed
* v0.3 Core File Manager Polish: completed
* v0.4 Server Monitoring: planned
* v0.5 File Preview and Editor: planned
* v0.6 Terminal: planned
* v0.7 AI Features: planned
* v0.8 Deployment / Production Hardening: planned
* v1.0 Public-ready strong release: future goal

## Product Direction

PionterCloud started as a bring-your-own-server cloud file manager.

The product direction is evolving toward:

* bring-your-own-server cloud dashboard
* secure web-based file manager
* server monitoring panel
* lightweight web editor
* optional terminal access
* optional AI-assisted file/code explanation features

The project should continue to prioritize correctness, security, and maintainability over speed.

## Current Architecture

### Backend

The backend is written in Go.

Current backend responsibilities:

* User registration
* User login
* Password hashing
* Token/session management
* Server management
* SSH/SFTP connection validation
* File listing
* File upload
* File download
* Folder creation
* Delete
* Rename
* Move
* Server credential encryption and decryption

### Frontend

The frontend is written with Next.js, React, and Tailwind CSS.

Current frontend responsibilities:

* Login/register UI
* Server list UI
* Server add/edit/delete/pin UI
* File manager UI
* Upload/download UI
* Folder creation UI
* Rename/delete/move modals
* Bulk move and bulk delete modals
* Multi-select toolbar
* Sidebar navigation
* Toast notifications
* Loading states
* Dark/light mode
* Turkish/English language switch

### Database

PostgreSQL is used for local development.

Current main tables:

* `kullanicilar`
* `sunucular`
* `oturumlar`

## v0.1 Local/Portfolio MVP Summary

The v0.1 phase focused on making the core product usable locally.

Completed in v0.1:

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
* Final v0.1 smoke test

v0.1 was considered a local/portfolio MVP, not a production-ready release.

## v0.2 Security Gate Summary

The v0.2 phase focused on improving authentication, session handling, and credential storage.

Completed security improvements:

* New Pionter account passwords are stored with bcrypt hashing.
* Older plain text development passwords are migrated to bcrypt after successful login.
* A dedicated `/api/login` endpoint was added.
* Login returns a session token.
* Session tokens are stored in the `oturumlar` table.
* Protected backend endpoints now use token-based authentication.
* Protected backend endpoints no longer accept username/password fallback.
* The frontend no longer sends the Pionter account password after login.
* Logout support was added.
* Logout deletes the active session token from the database.
* Session tokens now have an expiration timestamp.
* Expired tokens are rejected by the backend.
* Expired sessions are cleaned up during login.
* The frontend handles `401 Unauthorized` responses by clearing the local session and returning to the login screen.
* Server passwords and SSH private keys are encrypted before being stored.
* Existing plain text server credentials are lazily migrated to encrypted values when the server is used.
* Saved server credentials are not returned to the frontend.

v0.2 final smoke test status:

* Backend startup verified.
* Frontend startup verified.
* Register/login/logout flow verified.
* Token expiration/session invalidation behavior verified.
* Server management flow verified.
* File manager flow verified.
* Credential encryption behavior verified.
* Secret tracking checks passed.

v0.2 is considered complete.

## v0.3 Core File Manager Polish Summary

The v0.3 phase focused on making the file manager feel more like a real product interface and adding stable multi-item operations.

Completed in v0.3:

* Reworked the server navigation experience with a collapsible left sidebar.
* Added a mini sidebar state and expanded sidebar state.
* Added server previews inside the sidebar.
* Moved profile/settings actions into the sidebar.
* Improved dark/light sidebar styling.
* Improved the My Servers empty-state UX.
* Added multi-select support improvements.
* Added a selection toolbar for selected files/folders.
* Added Select listed/visible behavior.
* Added Clear selection behavior.
* Added Bulk delete flow.
* Added Bulk move flow using the existing move modal infrastructure.
* Added selected-item previews to the bulk move modal.
* Added selected-item previews to the bulk delete modal.
* Added state cleanup after bulk move operations.
* Improved drag-and-drop upload behavior.
* Improved upload, folder creation, and selection UX.
* Ran a v0.3 smoke test covering:

  * login
  * server selection
  * sidebar behavior
  * folder navigation
  * upload
  * folder creation
  * rename
  * single move
  * single delete
  * bulk move
  * bulk delete
  * search selection
  * Clear selection
  * Back to Servers
  * My Servers empty state

v0.3 final validation:

* `npm run lint` completed with 0 errors.
* 2 non-blocking warnings remain.
* Core v0.3 user flows passed manual smoke testing.

Known non-blocking warnings after v0.3:

* `postcss.config.mjs` has an anonymous default export warning.
* `page.js` has a React Hook dependency warning for the drag/drop upload effect.

v0.3 is considered complete.

## v0.4 Server Monitoring Summary

The v0.4 phase focused on adding basic server monitoring for the currently selected server.

Completed in v0.4:

* Added `/api/server/stats` endpoint.
* Added stats request/response structs.
* Added SSH command execution helper.
* Added RAM parsing from `free -m`.
* Added disk parsing from `df -m /`.
* Added load average parsing from `/proc/loadavg`.
* Added CPU usage calculation using two `/proc/stat` reads.
* Changed uptime output to use `uptime -p`.
* Added frontend stats state and fetch logic.
* Added monitoring card inside the selected server panel.
* Added CPU/RAM/Disk progress bars.
* Removed Load Avg from the main UI to keep the panel simple.
* Added SSH OK status badge.
* Added Last updated timestamp.
* Added manual refresh.
* Added silent auto refresh every 60 seconds.
* Auto refresh does not run while the browser tab is hidden.
* Auto refresh does not replace the current stats card with loading state.
* Added in-memory backend stats cache.
* Manual refresh and first load use fresh stats.
* Silent refresh can use cache.
* Added Turkish uppercase fix by setting the root `lang` attribute.
* Ran final v0.4 smoke test.

Current limitations:

* Monitoring is Linux-focused.
* Stats are collected over SSH.
* Each fresh stats request may open an SSH connection.
* Backend cache is in-memory and resets when the backend restarts.
* Cache cleanup is not implemented yet.
* Historical charts are not implemented.
* Alerting is not implemented.
* Multi-server dashboard monitoring is not implemented.

## v0.5A File Preview Summary

The v0.5A phase focused on adding safe file previews and improving file type recognition in the UI.

Backend changes:

* Added `/api/file/preview`.
* Added preview request and response structs.
* Added file extension detection helper.
* Added supported text/code file whitelist.
* Added image file whitelist.
* Added preview type detection.
* Added text preview reader through SFTP.
* Added image preview reader through SFTP.
* Added base64 image response support.
* Added preview limits:
  * Text preview max: 1 MB
  * Image preview max: 5 MB
* Added support for special filenames:
  * `.env`
  * `.env.example`
  * `Dockerfile`
  * `Makefile`
  * `CMakeLists.txt`

Frontend changes:

* Added preview modal state.
* Added preview cache.
* Added preview fetch function.
* Added file type helper functions.
* Added image thumbnail loading.
* Added image thumbnail rendering inside file cards.
* Added file preview modal.
* Added outside-click close behavior.
* Added Escape key close behavior.
* Changed file click behavior:
  * Folders open normally.
  * Preview-supported files open in preview modal.
  * Unsupported files keep download behavior.
* Added file icon system v2.
* Added language-specific code icon colors.
* Added fixed-width mini icons for bulk move/delete modals.
* Added expanded language/config file support.

Current limitations:

* PDF preview is not implemented yet.
* Office document preview is not implemented yet.
* Video/audio preview is not implemented yet.
* Large files are intentionally blocked.
* Thumbnail loading is simple and limited; future improvement can use IntersectionObserver.
* Text editor/save support is not implemented yet.

## Current Authentication Behavior

Current auth flow:

1. User registers with username, email, and password.
2. Backend hashes the password before saving it.
3. User logs in with username/email and password.
4. Backend verifies the password.
5. Backend creates a session token.
6. Frontend stores the token in React state.
7. Protected requests send the token.
8. Backend validates the token.
9. Logout deletes the token.
10. Expired tokens are rejected.

Current limitation:

* Tokens are currently sent in request bodies.
* A future improvement should move tokens to the `Authorization: Bearer <token>` header.

## Current Credential Encryption Behavior

Saved server credentials are encrypted before being stored.

Encrypted fields:

* `sunucu_sifre`
* `ssh_private_key`

Encryption behavior:

* AES-GCM is used.
* Encrypted values use the `enc:v1:` prefix.
* The encryption key is loaded from `CREDENTIAL_ENCRYPTION_KEY`.
* The real encryption key must never be committed.
* `.env.example` only contains a placeholder value.
* Plain text old development credentials are lazily migrated when the server is used.

Important note:

If the encryption key is lost, encrypted server credentials cannot be recovered.

## Server Connection Validation Notes

Current behavior:

* When adding a new server, the backend tests the SSH/SFTP connection before saving it.
* When updating an existing server, the backend tests the SSH/SFTP connection before applying the update.
* If the connection test fails, the server is not saved or updated.
* The connection test checks:

  * SSH connection
  * SSH authentication
  * SFTP client creation
  * isolated folder accessibility

Frontend behavior:

* The separate manual "Test Connection" button was removed.
* Save/update now means:

  * validate form fields
  * send request to backend
  * backend checks the connection
  * backend saves only if the connection is valid

Important limitation:

* SSH host key verification is still not implemented.
* The backend still uses insecure host key behavior during SSH connections.
* This must be improved before production use.

## Current Security Status

The project is significantly safer than the v0.1 local MVP.

Current improvements:

* Pionter account passwords are no longer stored as plain text.
* Frontend no longer sends the Pionter password after login.
* Protected endpoints use token authentication.
* Logout and token expiration exist.
* Saved server credentials are encrypted.
* Existing plain server credentials are lazily migrated.

Still not production-ready.

Remaining security work before serious public usage:

* Move tokens from request body to `Authorization` header.
* Improve CORS configuration.
* Add rate limiting.
* Add stricter request size limits.
* Add SSH host key verification.
* Add stable backend error codes.
* Improve logging without leaking secrets.
* Add production deployment hardening.
* Add HTTPS deployment.
* Add backup and recovery planning.
* Review database migration strategy.
* Review token cleanup strategy outside login.

## Current Frontend Refactor Status

The frontend has started to move away from a single large `page.js` file, but more refactoring is still needed.

Already extracted:

* Loading state component
* Toast component
* Helper functions
* Dictionary file

Still needed:

* Split large file manager UI into smaller components.
* Extract repeated button/input/modal styles.
* Extract server form logic.
* Extract file action menu.
* Extract modal components.
* Extract API helper functions.
* Reduce repeated fetch/error/loading logic.
* Clean up remaining lint warnings during a refactor pass.
* Improve mobile/tablet sidebar behavior.

Possible future frontend components:

* `TextInput`
* `PrimaryButton`
* `SecondaryButton`
* `DangerButton`
* `Modal`
* `Toast`
* `ServerForm`
* `AuthForm`
* `FileGrid`
* `FileCard`
* `Breadcrumb`
* `FileActionMenu`
* `RenameModal`
* `MoveModal`
* `DeleteConfirmationModal`
* `BulkActionToolbar`
* `Sidebar`

## Current Backend Refactor Status

The backend is functional but still mostly lives in a single `main.go` file.

Already improved:

* CORS helper
* POST request helper
* JSON read helper
* Password hashing helpers
* Token/session helpers
* Credential encryption helpers
* Server credential lookup helper
* Connection validation helper

Still needed:

* Split backend code into packages/files.
* Add middleware-style auth helpers.
* Improve error response format.
* Add stable error codes.
* Reduce repeated SSH/SFTP connection setup.
* Centralize response helpers.
* Improve config/env loading.
* Add structured logging.
* Add database migration tooling later.

Possible future backend structure:

```text
pionter-backend/
  main.go
  config/
  db/
  handlers/
  middleware/
  auth/
  servers/
  files/
  sshclient/
  crypto/
  models/
```

## API/Error Response Notes

Backend error responses currently use user-facing text messages.

Future goal:

```json
{
  "success": false,
  "code": "FOLDER_EMPTY",
  "message": "Folder is empty."
}
```

The frontend should eventually translate user-facing messages based on stable backend error codes.

## Known Technical Debt

Current known technical debt:

* Frontend `page.js` is still too large.
* Backend `main.go` is still too large.
* Tokens are sent in request bodies instead of headers.
* CORS is still too permissive.
* SSH host key verification is not implemented.
* Rate limiting is not implemented.
* Request size limits need improvement.
* Error responses are not standardized.
* Logging is basic.
* No formal migration system yet.
* No deployment guide yet.
* No automated tests yet.
* No CI pipeline yet.
* Mobile/tablet sidebar behavior is deferred.
* Lint warnings exist but no lint errors are currently present.

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
* Server status dashboard

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
* Strong user warning before opening terminal
* WebSocket-based command session
* Research restricted user/chroot/limited shell options

Important risk:

Terminal access can be dangerous. It should not be added before the security foundation is strong.

### v0.7 AI Features

Possible improvements:

* User-provided AI API key
* Explain selected file
* Summarize code file
* Analyze log file
* Explain error messages
* Suggest refactors
* Privacy warning before sending file content to an AI provider

Important decisions:

* Where API keys are stored
* Whether API keys are encrypted
* Whether file content is sent only with explicit user confirmation
* How large files are handled

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

v1.0 should not mean “perfect,” but it should mean:

* The app has a strong security foundation.
* Core file manager flows are polished.
* Server monitoring exists.
* Preview/editor functionality exists.
* Deployment documentation exists.
* Known limitations are clearly documented.
* Public usage risks are understood and reduced.

## Deployment Position

Recommended deployment strategy:

* v0.1: local/portfolio only
* v0.2: possible private deployment after careful setup
* v0.3/v0.4: stronger portfolio/demo visibility
* v0.8/v1.0: serious public deployment consideration

Domain can be purchased earlier, but public usage should wait until deployment hardening is complete.

## Current Recommendation

Do not treat PionterCloud as production-ready yet.

It is suitable for:

* learning
* local testing
* portfolio development
* controlled private testing after v0.2/v0.3

It is not yet suitable for:

* broad public signup
* untrusted users
* production server credential storage without further hardening
* terminal access in public environments
