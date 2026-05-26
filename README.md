# PionterCloud

PionterCloud is a bring-your-own-server cloud file manager built with Go, Next.js, PostgreSQL, SSH and SFTP.

The idea is simple: users add their own server, choose an isolated folder, and manage files on that server through a web interface.

> This project is currently in active development and is not production-ready yet.

## Current Features

- User registration and login flow
- Add and list multiple servers
- Connect to a selected server over SSH/SFTP
- List files and folders
- Upload files
- Download files
- Create folders
- Delete files and empty folders
- Rename files and folders
- Move files and folders
- Breadcrumb navigation
- Search/filter files in the current folder
- File metadata display
  - size
  - last modified date
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
