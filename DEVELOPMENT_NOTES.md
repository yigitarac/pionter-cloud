# Development Notes

This file tracks technical debt and future refactor plans for PionterCloud.

## Current Frontend Status

The frontend currently lives mostly inside a single `src/app/page.js` file.

This was useful during the early learning and prototyping phase because it made the data flow easier to see in one place.

As the project grows, the file should be split into smaller components and helper functions.

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

## Auth Screen Refactor

The login/register screen needs a proper centered auth card layout.

Planned improvements:

- Center the auth form vertically and horizontally
- Add a stronger PionterCloud branding area
- Improve login/register button placement
- Improve form spacing and width
- Prepare the UI for future username/email login support

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

## Security Refactor Notes

Before production, the following must be improved:

- Password hashing
- Session/token based authentication
- Secure server credential storage
- SSH host key verification
- Better backend validation
- Rate limiting
- HTTPS deployment
