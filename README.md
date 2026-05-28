# PionterCloud

PionterCloud is a bring-your-own-server cloud file manager built with Go, Next.js, PostgreSQL, SSH and SFTP.

The idea is simple: users add their own server, choose an isolated folder, and manage files on that server through a web interface.

> This project is currently in active development and is not production-ready yet.

## Current Features

- User registration and login flow
  - register with username, email and password
  - login with username or email
- Server management
  - add servers
  - list servers
  - edit saved servers
  - delete saved servers
  - pin/unpin frequently used servers
  - pinned servers appear first
  - test SSH/SFTP connection before saving or updating servers
  - prevent saving invalid server connection settings
- Connect to a selected server over SSH/SFTP
- List files and folders
- Upload files
- Download files
- Create folders
- Delete files and empty folders
- Rename files and folders
- Move files and folders
  - nested target folder picker
  - breadcrumb navigation in move modal
  - safeguards against moving folders into themselves
- Breadcrumb navigation
- Search/filter files in the current folder
- Folders-first alphabetical file listing
- File metadata display
  - size
  - last modified date
- Toast notification system
- Custom modal dialogs for:
  - rename
  - move
  - delete confirmation
- Improved form validation feedback
- Click outside to close menus and modals
- Dark/light mode
- Turkish/English language switch

## Tech Stack

### Frontend

- Next.js
- React
- Tailwind CSS

### Backend

- Go
- PostgreSQL
- SFTP
- SSH

### Development Tools

- Docker for local PostgreSQL
- Environment variables with `.env`

## Project Structure

```text
pionter-backend/
  main.go
  .env.example

pionter-ui/
  src/app/page.js
```

## Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
DATABASE_URL=postgres://admin:password@localhost:5432/piontercloud
```

Do not commit your real `.env` file.

## Development Status

This project is being built as a learning-focused full-stack project.

Main goals:

- Learn backend development with Go
- Learn frontend development with Next.js
- Learn database usage with PostgreSQL
- Learn SSH/SFTP file operations
- Build a real-world cloud/file-manager style application

## Security Notes

This project is not ready for production yet.

Before production use, the following areas need to be improved:

- Password hashing
- Real session/token based authentication
- Secure storage for server passwords and SSH keys
- SSH host key verification
- Better validation and error handling
- Rate limiting
- HTTPS deployment

## Roadmap

Planned improvements:

- Right-click context menu
- Multi-file selection
- Recursive folder delete with confirmation
- File preview
- Upload progress indicator
- Better loading states and optimistic UI
- Drag and drop files/folders into folders
- Deployment guide
- Authentication and production security improvements
- Performance improvements for large folders

## License

This project does not have a license yet.
