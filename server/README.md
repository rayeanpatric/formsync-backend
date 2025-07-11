# Collaborative Forms - Backend

A real-time collaborative form application backend built with Node.js, Express, Socket.IO, and Prisma.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and Redis URLs

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

The server will be available at `http://localhost:3000`

## 🏗️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **Prisma** - Database ORM
- **PostgreSQL** - Database (Neon DB)
- **Redis** - Caching and session storage (Upstash)
- **bcrypt** - Password hashing
- **JWT** - Authentication tokens

## 📁 Project Structure

```
server/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js           # Database seeding
└── src/
    ├── index.js          # Application entry point
    ├── controllers/      # Request handlers
    │   ├── formController.js
    │   ├── responseController.js
    │   └── userController.js
    ├── routes/           # API route definitions
    │   ├── formRoutes.js
    │   ├── responseRoutes.js
    │   └── userRoutes.js
    ├── services/         # Business logic
    │   ├── formService.js
    │   ├── responseService.js
    │   ├── userService.js
    │   └── prismaService.js
    ├── socket/           # Real-time functionality
    │   ├── socketService.js      # In-memory socket service
    │   └── socketService-redis.js # Redis-backed socket service
    └── middlewares/      # Express middlewares
        └── errorHandler.js
```

## ⚙️ Environment Variables

Create a `.env` file in the server directory:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# Redis (for real-time features)
REDIS_URL="redis://username:password@host:port"

# Server
PORT=3000
NODE_ENV=development
```

## 🗄️ Database Setup

The application uses PostgreSQL with Prisma ORM:

```bash
# Generate Prisma client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Push schema to database (alternative to migrations)
npm run prisma:push

# Reset database (development only)
npm run prisma:reset

# Seed database with sample data
npm run prisma:seed
```

## 🔧 API Endpoints

### Authentication

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login

### Forms

- `GET /api/forms` - Get all forms
- `POST /api/forms` - Create new form
- `GET /api/forms/:id` - Get specific form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form

### Responses

- `GET /api/responses/:formId` - Get form responses
- `POST /api/responses` - Submit form response

## 🔗 Real-time Features

The server uses Socket.IO for real-time collaboration:

- **User Presence** - Track online users
- **Live Form Editing** - Real-time form updates
- **Form Filling** - Live response updates
- **Notifications** - Real-time user notifications

## 🚀 Deployment

### Railway (Recommended)

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database
- `npm run prisma:reset` - Reset database
- `npm run prisma:push` - Push schema to database

## 🌐 Frontend

This backend serves the collaborative forms frontend. Make sure CORS is properly configured for your frontend domain.
