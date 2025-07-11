# Collaborative Forms - Frontend

A real-time collaborative form application frontend built with vanilla JavaScript and Socket.IO.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3001`

## 🏗️ Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with flexbox/grid
- **Vanilla JavaScript** - No framework dependencies
- **Socket.IO Client** - Real-time communication
- **Live Server** - Development server

## 📁 Project Structure

```
client/
├── index.html              # Home page
├── login.html              # User login
├── signup.html             # User registration
├── form-details.html       # Form management
├── css/
│   ├── styles.css          # Main styles
│   └── auth.css           # Authentication styles
└── js/
    ├── app.js             # Main application logic
    ├── auth.js            # Authentication handling
    ├── config.js          # Configuration
    ├── form-builder.js    # Form creation/editing
    ├── form-details.js    # Form management
    ├── form-filler-enhanced.js  # Form filling logic
    └── script-init.js     # Script initialization helper
```

## ⚙️ Configuration

Update `js/config.js` with your backend URL:

```javascript
const API_BASE_URL = "http://localhost:3000"; // Development
// const API_BASE_URL = 'https://your-backend.railway.app'; // Production
```

## 🔧 Features

- **User Authentication** - Login/signup interface
- **Form Builder** - Drag-and-drop form creation
- **Real-time Collaboration** - Live user presence indicators
- **Form Filling** - Interactive form completion
- **Responsive Design** - Mobile-friendly interface

## 📱 Pages

- **Home (`index.html`)** - Dashboard and form list
- **Login (`login.html`)** - User authentication
- **Signup (`signup.html`)** - User registration
- **Form Details (`form-details.html`)** - Form management and editing

## 🚀 Deployment

The frontend is deployed on Vercel. Push to main branch for automatic deployment.

## 🔗 Backend

This frontend connects to the collaborative forms backend server. Make sure the backend is running and the API URL is correctly configured.
