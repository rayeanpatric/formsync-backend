# Collaborative Form System

A real-time collaborative form application with user authentication and live editing features.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

## 🏗️ Tech Stack

**Frontend:** HTML, CSS, JavaScript, Socket.IO Client  
**Backend:** Node.js, Express, Socket.IO, Prisma  
**Database:** PostgreSQL (Neon DB)  
**Cache:** Redis (Upstash)  
**Deployment:** Vercel (Frontend), Railway (Backend)

## 📁 Project Structure

```
├── client/          # Frontend application
├── server/          # Backend API server
├── docs/            # Technical documentation
└── test-debug/      # Testing and debugging tools
```

## ⚙️ Environment Setup

Create `.env` files in both client and server directories:

**Server (.env):**

```env
DATABASE_URL="your-neon-db-url"
JWT_SECRET="your-jwt-secret"
REDIS_URL="your-redis-url"
```

## 🔧 Features

- **User Authentication** - Login/signup with JWT
- **Form Builder** - Dynamic form creation and editing
- **Real-time Collaboration** - Live user presence and updates
- **Response Management** - Form submission and data collection

## 📚 Documentation

- **[Technical Docs](docs/)** - Implementation guides
- **[Testing Tools](test-debug/)** - Debugging and API testing

## 🌐 Deployment

- **Frontend:** Deploy to Vercel [https://proactively-backend-one.vercel.app/](https://proactively-backend-one.vercel.app/)
- **Backend:** Deploy to Railway
- **Database:** Neon PostgreSQL
- **Cache:** Upstash Redis

## 🔗 External Link

- Project Link: [https://github.com/rayeanpatric/provital-backend](https://github.com/rayeanpatric/provital-backend)
- Quick Demo: [Google Drive](https://drive.google.com/file/d/1s_7mQYqrhP_1aIFScp9pyfXJsrbWi7RV/view?usp=sharing)

***Made with*** ❤️ ***by [Rayean Patric](https://github.com/rayeanpatric)***
