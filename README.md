# StudyLink

Multi-Cloud Notes & File Sharing Platform for CS385

StudyLink is a cloud-native web application designed to help students organize, share, and manage course materials more efficiently through a centralized platform.

The project demonstrates a modern multi-cloud architecture using managed cloud services for hosting, authentication, storage, and deployment.

---

## Features

- Google authentication with Firebase
- Cloud-hosted notes platform
- Create, edit, and delete notes
- Owner/admin-based permissions
- Course and author filtering
- File uploads and downloads
- User profile settings
- Profile photo upload
- Multi-page interface:
  - Notes
  - Files
  - About
  - Settings
- Persistent cloud database storage
- Automatic cloud deployment

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Frontend Hosting | Vercel |
| Backend API | Node.js + Express |
| Backend Hosting | Railway |
| Authentication | Firebase Authentication |
| Database | PostgreSQL |
| File Storage | Supabase Storage |
| Version Control | GitHub |

---

## Architecture

```text
Browser
  ↓
React + Vite Frontend
  ↓
Firebase Authentication
  ↓
Express API on Railway
  ↓
PostgreSQL Database

Supabase Storage
  └── Note attachments
  └── Profile images

Vercel
  └── Frontend deployment

GitHub
  └── Source control and deployment integration
