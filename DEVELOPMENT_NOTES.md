# Development Notes

This file tracks technical debt and future refactor plans for PionterCloud.

## Current Frontend Status

The frontend currently lives mostly inside a single `src/app/page.js` file.

This was useful during the early learning and prototyping phase because it made the data flow easier to see in one place.

As the project grows, the file should be split into smaller components and helper functions.

### Completed frontend cleanup

The translation dictionary has been moved out of `page.js` into:

- `src/app/sozluk.js`

This keeps user-facing text in a separate file and makes `page.js` easier to read.

Small frontend helper functions have also been moved out of `page.js` into:

- `src/app/yardimcilar.js`

Current helper functions include:

- `dosyaBoyutuYaz`
- `gecersizDosyaVeyaKlasorAdiMi`
- `gecersizYolMu`

This keeps repeated formatting and validation logic outside the main UI file.

Small UI components have started to move out of `page.js` into:

- `src/app/components/Toast.jsx`
- `src/app/components/LoadingState.jsx`

Current extracted components:

- `Toast`
- `LoadingState`

This is the first step toward splitting the large frontend page into smaller UI components.

Further frontend cleanup can still split the UI into components later, such as:

- `AuthForm`
- `ServerCard`
- `ServerForm`
- `FileGrid`
- `FileCard`
- `MoveModal`
- `DeleteModal`

## Repeated UI Classes

There are repeated Tailwind class groups for:

- Inputs
- Buttons
- Modal containers
- Toast styles
- Card layouts
- File/folder menu items

These should eventually be extracted into reusable components or shared class constants.

Possible future components:

- `TextInput`
- `PrimaryButton`
- `SecondaryButton`
- `DangerButton`
- `Modal`
- `Toast`
- `ServerForm`
- `AuthForm`
- `FileGrid`
- `FileCard`
- `Breadcrumb`

## File Manager Refactor

The file manager area should eventually be split into:

- Server selection screen
- Selected server header
- Upload dropzone
- Folder creation bar
- Search bar
- Breadcrumb navigation
- File grid
- File action menu
- Rename modal
- Move modal
- Delete confirmation modal

## API Helper Refactor

Frontend fetch calls are currently written directly inside `page.js`.

Later, these should be moved into API helper functions such as:

- `registerUser`
- `fetchServers`
- `saveServer`
- `fetchFiles`
- `uploadFile`
- `downloadFile`
- `createFolder`
- `deleteItem`
- `renameItem`
- `moveItem`

This will make the UI code cleaner and easier to maintain.

## Backend Refactor Notes

Backend error responses should eventually use stable error codes instead of user-facing text messages.

Example:

```json
{
  "success": false,
  "code": "FOLDER_EMPTY",
  "message": "Folder is empty."
}
```

The frontend should translate user-facing messages based on the code.

### Completed backend cleanup

The backend now has small request helper functions for repeated request setup logic:

- `corsAyarla`
- `postIstekKontrolu`
- `jsonOku`

These helpers are used across the main JSON-based API endpoints to reduce repeated boilerplate.

Current helper coverage includes:

- auth/register
- server management
- file listing
- download
- upload request setup
- folder creation
- delete
- rename
- move

Further backend refactor work can still split `main.go` into smaller files later, such as:

- handlers
- request/response models
- database helpers
- SSH/SFTP helpers
- validation helpers

## Security Refactor Notes

Before production, the following must be improved:

- Password hashing
- Session/token based authentication
- Secure server credential storage
- SSH host key verification
- Better backend validation
- Rate limiting
- HTTPS deployment

## Auth Notes

Current auth behavior:

- Users register with:
  - username
  - email
  - password
- Users can login with:
  - username + password
  - email + password
- Email addresses are normalized to lowercase during registration.
- Login checks email case-insensitively.
- Frontend and backend trim username/email input before authentication.

Current limitations:

- Passwords are currently stored in plain text.
- There is no real session or token system yet.
- The frontend sends username/email and password with each backend request.
- This is acceptable for the current learning/development stage, but must be replaced before production use.

Future auth/security improvements:

- Hash passwords before saving them.
- Add real session/token based authentication.
- Stop sending the password with every file/server request.
- Add logout/session expiration behavior.
- Improve backend error responses for auth failures.
- Consider email verification later.
