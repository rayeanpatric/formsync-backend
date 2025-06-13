<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Collaborative Form Filling System

This is a basic collaborative form filling system built with:

- Frontend: HTML/CSS/JavaScript
- Backend: Node.js + Express
- Database: Prisma ORM with SQLite
- Real-time: Socket.IO for sync between users
- DevOps: Docker

## Features

- Dynamic form builder
- Real-time collaborative form filling
- API endpoints for form management
- Dockerized application

## Project Structure

- `/prisma`: Database schema and migrations
- `/src`: Backend source code
  - `/controllers`: Express route controllers
  - `/routes`: API route definitions
  - `/models`: Data models
  - `/services`: Business logic services
  - `/middlewares`: Express middlewares
- `/public`: Frontend assets
  - `/js`: JavaScript files
  - `/css`: CSS stylesheets
  - `index.html`: Main page

## Implementation Notes

- Keep code simple and understandable for beginners
- Focus on implementing real-time collaboration with Socket.IO
- Use Prisma ORM for database operations
