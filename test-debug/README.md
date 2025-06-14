# Test & Debug Directory

This directory contains all testing, debugging, and development utility files for the Collaborative Form Application.

## 📁 Directory Structure

```
test-debug/
├── backend-tests/          # Server-side testing utilities
├── frontend-tests/         # Client-side testing and debug pages
├── postman-tests/          # API testing with Postman
├── setup-scripts/          # Environment setup and deployment scripts
└── README.md              # This documentation
```

## 🔧 Backend Tests (`backend-tests/`)

### Database Connection Tests

- **`test-db-connection.js`** - Basic database connectivity test
- **`test-db-connection-simple.js`** - Simplified database test
- **`test-db-connection-working.js`** - Working database connection validation
- **`vercel-db-check.js`** - Vercel deployment database verification

### Redis Connection Tests

- **`test-redis-connection.js`** - Redis connectivity test
- **`test-redis-upstash.js`** - Upstash Redis service testing

### API Integration Tests

- **`test-api.js`** - Backend API endpoint testing
- **`test-all-connections.js`** - Comprehensive connection testing

### Database Migration & Utilities

- **`migrate-response-format.js`** - Script to migrate response format from field IDs to labels

### Usage:

```bash
# Run database tests
node test-debug/backend-tests/test-db-connection.js

# Test Redis connection
node test-debug/backend-tests/test-redis-connection.js

# Test all connections
node test-debug/backend-tests/test-all-connections.js

# Run database migration
node test-debug/backend-tests/migrate-response-format.js
```

## 🛠️ Setup Scripts (`setup-scripts/`)

### Environment Setup Scripts

- **`setup-fullstack.sh`** - Complete fullstack setup for Linux/Mac
- **`setup-fullstack.ps1`** - Complete fullstack setup for Windows PowerShell
- **`setup-fullstack.bat`** - Complete fullstack setup for Windows Command Prompt
- **`verify-structure.ps1`** - Project structure verification script

### Features:

- Automated environment variable setup
- Database initialization
- Redis configuration
- Service deployment helpers
- Port configuration
- CORS setup validation

### Usage:

```bash
# Linux/Mac
chmod +x test-debug/setup-scripts/setup-fullstack.sh
./test-debug/setup-scripts/setup-fullstack.sh

# Windows PowerShell
.\test-debug\setup-scripts\setup-fullstack.ps1

# Windows Command Prompt
test-debug\setup-scripts\setup-fullstack.bat

# Verify project structure
.\test-debug\setup-scripts\verify-structure.ps1
```

## 🌐 Frontend Tests (`frontend-tests/`)

### Debug Pages

- **`debug-login.html`** - Login functionality debugging
- **`debug-auth.html`** - Authentication system debugging

### Test Pages

- **`api-test.html`** - Frontend API connectivity testing
- **`test-backend.html`** - Backend connection verification
- **`production-test.html`** - Production environment testing
- **`socket-test.html`** - Socket.IO connection testing
- **`realtime-test.html`** - Real-time features testing
- **`railway-test.html`** - Railway deployment testing

### Usage:

1. Start your local servers:

   ```bash
   # Backend (from server directory)
   npm run dev

   # Frontend (from client directory)
   python -m http.server 3001
   ```

2. Open test pages in browser:
   - `http://localhost:3001/test-debug/frontend-tests/api-test.html`
   - `http://localhost:3001/test-debug/frontend-tests/socket-test.html`
   - etc.

## 📮 Postman Tests (`postman-tests/`)

### Files

- **`environment.json`** - Environment variables (local/production)
- **`collection.json`** - Complete API test suite
- **`package.json`** - Newman CLI test runner configuration
- **`run-tests.sh`** - Linux/Mac test runner script
- **`run-tests.bat`** - Windows test runner script
- **`README.md`** - Detailed Postman testing documentation

### API Test Coverage

- ✅ Health checks
- ✅ User registration/login
- ✅ Form CRUD operations
- ✅ Form response handling
- ✅ Error handling
- ✅ Data validation

### Usage:

```bash
# Install Newman (Postman CLI)
npm install -g newman

# Run all tests locally
cd test-debug/postman-tests
./run-tests.sh

# Run tests on production
./run-tests.sh --env production

# Windows
run-tests.bat
```

## 🚀 Quick Start Testing

### 1. Backend Health Check

```bash
# Test database
node test-debug/backend-tests/test-db-connection.js

# Test Redis (if configured)
node test-debug/backend-tests/test-redis-connection.js
```

### 2. Frontend Connectivity

1. Start servers
2. Open `test-debug/frontend-tests/api-test.html`
3. Check console for connection status

### 3. Full API Testing

```bash
cd test-debug/postman-tests
npm install
npm run test
```

## 🐛 Debugging Guide

### Common Issues

#### Backend Connection Issues

1. **Database Connection Failed**

   - Check `.env` file configuration
   - Verify DATABASE_URL
   - Run `test-db-connection.js`

2. **Redis Connection Failed**
   - Check REDIS_URL in `.env`
   - Verify Upstash credentials
   - Run `test-redis-connection.js`

#### Frontend Connection Issues

1. **API Not Accessible**

   - Check server is running on correct port
   - Verify CORS configuration
   - Use `api-test.html` to debug

2. **Socket.IO Connection Failed**
   - Check Socket.IO server configuration
   - Verify client connection settings
   - Use `socket-test.html` to debug

#### Authentication Issues

1. **Login/Signup Failing**
   - Use `debug-login.html` for detailed logging
   - Check network requests in browser dev tools
   - Verify user service endpoints

### Debug Tools

#### Browser Console Commands

```javascript
// Check app state (in main application)
window.debugAppState();

// Test form builder (in form builder page)
window.debugFormBuilder.testModule();
window.debugFormBuilder.testButtons();

// Force leave form (in form view)
window.debugLeaveForm("form-id");
```

#### Server Debug Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Database status (if implemented)
curl http://localhost:3000/debug/db

# Redis status (if implemented)
curl http://localhost:3000/debug/redis
```

## 📊 Test Reports

### Postman Test Reports

- HTML reports generated in `postman-tests/` directory
- Timestamped files: `test-report-YYYYMMDD-HHMMSS.html`

### Manual Test Results

- Document results in issue tracker
- Include browser console logs
- Note environment (local/production)
- Include steps to reproduce

## 🔒 Security Notes

### Test Data

- All test files use example data
- No production credentials in test files
- Test users: `admin@example.com`, `test@example.com`
- Default passwords: `admin123`, `user123`

### Production Testing

- Use separate test accounts
- Don't test with real user data
- Clean up test data after testing
- Monitor production logs during testing

## 📝 Contributing

### Adding New Tests

1. Place backend tests in `backend-tests/`
2. Place frontend tests in `frontend-tests/`
3. Update this README with new test descriptions
4. Include usage instructions

### Test Standards

- Include error handling
- Provide clear output/logging
- Document expected results
- Handle cleanup of test data
