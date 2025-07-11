# Collaborative Form System

A real-time collaborative form application with user authentication and live editing features.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd base-backend-try

# Install dependencies for both client and server
npm install

# Start development servers (both frontend and backend)
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
├── client/          # Frontend application (Vanilla JS)
├── server/          # Backend API server (Node.js/Express)
├── package.json     # Root package.json for development scripts
├── docker-compose.yml
└── railway.json     # Railway deployment configuration
```

## ⚙️ Environment Setup

### Backend Setup

Navigate to the `server/` directory and create a `.env` file:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key"
REDIS_URL="redis://username:password@host:port"
PORT=3000
NODE_ENV=development
```

### Frontend Setup

Navigate to the `client/` directory and update `js/config.js`:

```javascript
const API_BASE_URL = "http://localhost:3000"; // Development
// const API_BASE_URL = 'https://your-backend.railway.app'; // Production
```

## 🔧 Features

- **User Authentication** - Secure login/signup with JWT tokens
- **Form Builder** - Intuitive drag-and-drop form creation
- **Real-time Collaboration** - Live user presence and simultaneous editing
- **Response Management** - Form submission and data collection
- **Responsive Design** - Mobile-friendly interface

## �️ Development

### Running the Full Stack

From the root directory:

```bash
# Install all dependencies
npm install

# Start both frontend and backend
npm run dev
```

### Running Individual Services

**Backend only:**

```bash
cd server
npm install
npm run dev
```

**Frontend only:**

```bash
cd client
npm install
npm run dev
```

## 🚀 Deployment

### Backend (Railway)

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set root directory to `client/`
3. Deploy automatically on push to main branch

## 📖 Learn More

- **[Frontend Documentation](client/README.md)** - Frontend setup and development
- **[Backend Documentation](server/README.md)** - Backend API and database setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🌐 Deployment

- **Frontend:** Deploy to Vercel [https://proactively-backend-one.vercel.app/](https://proactively-backend-one.vercel.app/)
- **Backend:** Deploy to Railway
- **Database:** Neon PostgreSQL
- **Cache:** Upstash Redis

## 🔗 External Link

- Project Link: [https://github.com/rayeanpatric/provital-backend](https://github.com/rayeanpatric/provital-backend)
- Quick Demo: [Google Drive](https://drive.google.com/file/d/1s_7mQYqrhP_1aIFScp9pyfXJsrbWi7RV/view?usp=sharing)

**_Made with_** ❤️ **_by [Rayean Patric](https://github.com/rayeanpatric)_**
