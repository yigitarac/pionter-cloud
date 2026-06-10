# PionterCloud Development Notes

This document describes the current state, development rules, and testing checklist for PionterCloud.

## Current Project State

PionterCloud is a bring-your-own-server cloud file manager built with Go, PostgreSQL, Next.js, and React.

The application currently includes:

* Authentication
* Server management
* Encrypted server credentials
* File manager
* File upload/download
* File preview
* Text/code editor
* Share links
* Activity logs
* Turkish/English language support
* Dark/light mode

The project is being prepared for MVP launch.

## Main Development Goal

The current goal is to finish the product with the existing feature set and prepare it for deployment.

Priority order:

1. Keep the current app stable.
2. Polish existing user flows.
3. Improve documentation.
4. Run full smoke tests.
5. Prepare deployment settings.
6. Launch the MVP.

## Backend Notes

Backend location:

```txt
pionter-backend/main.go
```

Backend responsibilities:

* User registration
* User login
* Session handling
* Server CRUD operations
* Server connection testing
* SSH/SFTP based file operations
* File upload
* File download
* File preview
* File save/edit
* Folder creation
* File creation
* Rename
* Move
* Delete
* Share link creation
* Share link listing
* Share link revoke
* Public share info
* Public share preview
* Public share download
* Activity logging
* Retention cleanup

Backend environment file:

```txt
pionter-backend/.env
```

Backend example environment file:

```txt
pionter-backend/.env.example
```

## Frontend Notes

Frontend location:

```txt
pionter-ui/src/app/page.js
```

Frontend responsibilities:

* Login/register UI
* Server dashboard
* Server add/edit flow
* File manager UI
* Grid/list view
* Upload UI
* Drag and drop handling
* Context menu actions
* Multi-select actions
* Preview modal
* Editor modal
* Share modal
* Share management
* Activity log UI
* Theme switch
* Language switch

Dictionary file:

```txt
pionter-ui/src/app/sozluk.js
```

Public share page location:

```txt
pionter-ui/src/app/share/
```

Frontend environment file:

```txt
pionter-ui/.env.local
```

Frontend example environment file:

```txt
pionter-ui/.env.example
```

## Database Notes

Database:

```txt
PostgreSQL
```

Local development database container:

```txt
pionter-db
```

Default local database values:

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=supergizli
POSTGRES_DB=piontercloud
```

Default local database URL:

```env
DATABASE_URL=postgres://admin:supergizli@localhost:5432/piontercloud
```

## Critical Environment Notes

`CREDENTIAL_ENCRYPTION_KEY` is critical.

Rules:

* Do not remove it.
* Do not overwrite it.
* Do not commit the real value.
* Do not paste the real value into documentation, chat, screenshots, or issues.
* Keep a backup outside git.

Why it matters:

* Saved server passwords are encrypted with this key.
* Saved SSH private keys are encrypted with this key.
* If this key is lost, existing saved server credentials cannot be decrypted.
* Users must re-enter server credentials if the key is lost.

Protected files:

```txt
pionter-backend/.env
pionter-ui/.env.local
```

These files must not be blindly overwritten.

## Development Rules

### 1. Keep Changes Small

Prefer small commits.

Good examples:

```txt
Polish server onboarding copy
Update backend env example
Fix share page empty state
Improve activity log labels
```

Avoid mixing unrelated changes in the same commit.

### 2. Check Status Before Changes

Before making changes:

```bash
git status
git log --oneline -1
```

Expected state:

```txt
working tree clean
```

### 3. Do Not Rewrite Working Configuration

Do not replace real `.env` files with example values.

Only edit these when updating documentation:

```txt
pionter-backend/.env.example
pionter-ui/.env.example
```

### 4. Test After Each Meaningful Change

After backend-related changes:

```bash
cd pionter-backend
go run main.go
```

After frontend-related changes:

```bash
cd pionter-ui
npm run dev
```

For production readiness:

```bash
cd pionter-ui
npm run build
```

## Main User Flow

Expected MVP user flow:

1. User opens PionterCloud.
2. User registers or logs in.
3. User opens the server dashboard.
4. User adds a server.
5. User selects password or SSH key authentication.
6. User sets an isolated folder path.
7. User connects to the server.
8. User manages files from the file manager.
9. User creates share links when needed.
10. User checks activity logs when needed.

## File Manager Behavior

Expected behavior:

* Click folder: open folder.
* Click file: select/open according to current UI behavior.
* Context menu: show file/folder actions.
* Breadcrumb: navigate to parent folders.
* Upload: upload into current folder.
* Move: move selected file/folder safely.
* Delete: confirm before deleting.
* Preview: open supported preview modal.
* Edit: open editor for supported text/code files.
* Share: create public file share link.

## Share Link Behavior

Share links should support:

* Duration selection
* Public share page
* File download
* Supported preview
* Manual revoke
* Expired state
* Revoked state

Share links should not expose:

* Saved server password
* Saved SSH private key
* Internal credential data

## Activity Log Behavior

Activity logs should record important actions:

* Upload
* Create file
* Create folder
* Edit
* Rename
* Move
* Delete
* Share
* Revoke share link

Activity display should be understandable for normal users.

## UI Notes

Current UI expectations:

* Login screen should remain clean and simple.
* Server dashboard should clearly guide first-time users.
* File manager should stay fast and understandable.
* Custom modals should be used instead of browser confirm dialogs.
* Custom tooltips should be used where needed.
* Dark and light mode should both stay readable.
* Turkish and English text should stay consistent.

## Smoke Test Checklist

Run this before deployment.

### Auth

* Register works.
* Login works.
* Logout works.
* Wrong password shows readable error.
* Rate limit message is readable.

### Server Management

* Server list loads.
* Add server works.
* Server connection test works.
* Update server works.
* Delete server works.
* Pin server works.
* Password connection works.
* SSH key connection works.

### File Manager

* File list loads.
* Folder navigation works.
* Breadcrumb navigation works.
* Upload works.
* Download works.
* Create file works.
* Create folder works.
* Rename works.
* Move works.
* Delete works.
* Recursive folder delete works.
* Multi-select works.
* Grid/list toggle works.

### Preview and Editor

* Text preview works.
* Image preview works.
* Unsupported file message is readable.
* Editor opens for supported files.
* Editor save works.
* Large file limit message is readable.

### Share Links

* Share link can be created.
* Share duration works.
* Share link opens publicly.
* Shared file can be downloaded.
* Supported shared file can be previewed.
* Share link can be revoked.
* Revoked link stops working.

### Activity Logs

* Activity log opens.
* Upload activity appears.
* Edit activity appears.
* Share activity appears.
* Delete activity appears.
* Revoke activity appears.

### UI

* Turkish language works.
* English language works.
* Dark mode works.
* Light mode works.
* Main modals close correctly.
* Main actions show readable feedback.

## Launch Preparation Checklist

Before launch:

* Backend environment variables are set.
* Frontend environment variables are set.
* PostgreSQL is available.
* Backend starts successfully.
* Frontend build succeeds.
* CORS is configured.
* HTTPS is configured.
* Real secrets are not committed.
* README is updated.
* DEVELOPMENT_NOTES is updated.
* Final smoke test is completed.

## Useful Commands

Check git state:

```bash
git status
git log --oneline -5
```

Start database:

```bash
docker start pionter-db
```

Start backend:

```bash
cd pionter-backend
go run main.go
```

Start frontend:

```bash
cd pionter-ui
npm run dev
```

Build frontend:

```bash
cd pionter-ui
npm run build
```

Commit changes:

```bash
git add README.md DEVELOPMENT_NOTES.md
git commit -m "Update project documentation"
```

## Current Rule

Until launch, focus on finishing and deploying the existing MVP.

Do not add unnecessary complexity.

Do not change working infrastructure unless required.

Do not touch real environment secrets unnecessarily.

Finish, test, document, deploy.
