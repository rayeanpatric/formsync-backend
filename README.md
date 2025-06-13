# Collaborative Form Filling System

A real-time collaborative form filling application that allows multiple users to edit form responses simultaneously, similar to Google Docs but for forms.

## ✨ Features

### 🔐 **Authentication & Security**

- **Separate Login/Signup Pages**: Beautiful authentication interface with demo accounts
- **Role-Based Access Control**: Admin and User roles with different permissions
- **Secure Session Management**: JWT-like authentication with localStorage

### 📝 **Form Management**

- **Dynamic Form Builder**: Create forms with text, number, and dropdown fields (Admin only)
- **Form Editing**: Edit existing forms and their fields (Admin only)
- **Form Deletion**: Remove forms from the system with confirmation (Admin only)
- **Form Inspection**: View forms in Prisma Studio for detailed inspection (Admin only)
- **Form Filling**: All users can fill and submit forms

### 🤝 **Real-time Collaboration**

- **Real-time Collaborative Editing**: Multiple users can edit the same form simultaneously
- **Field-Level Locking**: Visual indicators when other users are editing specific fields
- **Live User Presence**: See who's currently online and editing the form
- **Enhanced Activity Log**: Track detailed activities with user names, actions, and field names
- **Live Synchronization**: Changes appear instantly across all connected clients

### 🎨 **User Interface**

- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Modern UI**: Clean, professional interface with animations
- **Role-based UI**: Different interfaces for Admin and User roles
- **Activity Animations**: Real-time visual feedback for user actions

### 🛠️ **Technical Features**

- **RESTful API**: Complete backend API for form management
- **Socket.IO Integration**: Real-time communication between clients
- **SQLite Database**: Lightweight database with Prisma ORM
- **Docker Support**: Easy deployment with Docker and Docker Compose

## 🚀 Quick Start

### Option 1: Using Setup Scripts (Recommended)

**Windows:**

```bash
.\setup.bat
npm run dev
```

**Linux/Mac:**

```bash
chmod +x setup.sh
./setup.sh
npm run dev
```

### Option 2: Manual Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up the database:**

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:** Navigate to [http://localhost:3000](http://localhost:3000)

### Option 3: Docker Deployment

```bash
docker-compose up --build
```

Then open [http://localhost:3000](http://localhost:3000)

## 👥 **User Accounts & Authentication**

The system comes with pre-configured demo accounts for testing:

### **Admin Account (Can create and edit forms):**

- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Capabilities:** Create forms, edit forms, fill forms, manage all aspects

### **User Accounts (Can only fill forms):**

- **Email:** `john@example.com` | **Password:** `password123`
- **Email:** `jane@example.com` | **Password:** `password123`
- **Email:** `alice@example.com` | **Password:** `password123`
- **Capabilities:** Fill forms, participate in collaborative editing

### **Authentication Flow:**

1. **First Visit:** You'll be redirected to the login page
2. **Login:** Use one of the demo accounts or create a new account
3. **Role-based Access:** Interface adapts based on your role (Admin/User)
4. **Session Management:** Stay logged in until you explicitly logout

### **Sign Up:**

- Visit `/signup.html` to create a new account
- Choose to request admin access during registration
- All new accounts default to "User" role for security

## 📁 Project Structure

```
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma       # Database schema
│   ├── seed.js            # Sample data script
│   └── migrations/        # Database migration files
├── public/                # Frontend assets
│   ├── css/               # CSS stylesheets
│   ├── js/                # JavaScript files
│   └── index.html         # Main page
├── src/                   # Backend source code
│   ├── controllers/       # Express route controllers
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   ├── middlewares/      # Express middlewares
│   └── index.js          # Entry point
├── .env                  # Environment variables
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile           # Docker container configuration
└── package.json         # Node.js dependencies
```

## 🔧 API Documentation

### Forms

| Method   | Endpoint         | Description         |
| -------- | ---------------- | ------------------- |
| `GET`    | `/api/forms`     | Get all forms       |
| `GET`    | `/api/forms/:id` | Get a specific form |
| `POST`   | `/api/forms`     | Create a new form   |
| `PUT`    | `/api/forms/:id` | Update a form       |
| `DELETE` | `/api/forms/:id` | Delete a form       |

### Form Responses

| Method  | Endpoint                          | Description              |
| ------- | --------------------------------- | ------------------------ |
| `GET`   | `/api/responses/:formId`          | Get responses for a form |
| `POST`  | `/api/responses/:formId`          | Save form responses      |
| `PATCH` | `/api/responses/:formId/:fieldId` | Update a single field    |

### Users

| Method | Endpoint         | Description         |
| ------ | ---------------- | ------------------- |
| `GET`  | `/api/users`     | Get all users       |
| `GET`  | `/api/users/:id` | Get a specific user |
| `POST` | `/api/users`     | Create a new user   |

### Example API Usage

**Create a new form:**

```javascript
POST /api/forms
Content-Type: application/json

{
  "title": "Customer Survey",
  "createdById": "user-id",
  "fields": [
    {
      "label": "Full Name",
      "type": "text",
      "required": true
    },
    {
      "label": "Satisfaction",
      "type": "dropdown",
      "required": true,
      "options": ["Very Satisfied", "Satisfied", "Neutral"]
    }
  ]
}
```

## 🧪 **Testing the Collaborative Features**

### **Step-by-Step Testing Guide:**

#### **1. Admin User Testing (Form Creation)**

1. **Login as Admin:**
   - Go to [http://localhost:3000/login.html](http://localhost:3000/login.html)
   - Use: `admin@example.com` / `admin123`
2. **Create a New Form:**

   - Click "Create New Form" (only visible to admin)
   - Add various field types (text, number, dropdown)
   - Save the form

3. **Verify Admin Capabilities:**
   - See "Edit" buttons on all forms
   - Access form builder interface
   - Create and modify forms

#### **2. User Role Testing (Form Filling)**

1. **Login as Regular User:**

   - Open a new browser tab/window
   - Go to [http://localhost:3000/login.html](http://localhost:3000/login.html)
   - Use: `john@example.com` / `password123`

2. **Verify User Limitations:**
   - "Create New Form" button should be hidden
   - "Edit" buttons should be hidden
   - Only "Fill" buttons visible

#### **3. Real-time Collaboration Testing**

1. **Open Same Form in Multiple Tabs:**

   - Tab 1: Admin user
   - Tab 2: Regular user (john@example.com)
   - Tab 3: Another user (jane@example.com)

2. **Test Collaborative Features:**
   - **Active Users:** See all users listed in the "Active Users" panel
   - **Field Locking:** Click on a field in one tab, see lock indicator in others
   - **Live Updates:** Type in one tab, see changes appear in real-time in others
   - **Activity Log:** Watch detailed activity feed with user names and field names
   - **Visual Feedback:** See update animations and lock indicators

#### **4. Advanced Collaboration Testing**

1. **Field Locking Behavior:**

   - User A clicks on "Name" field → Field locks for others
   - User B tries to edit same field → Sees "🔒 UserA is editing" message
   - User A finishes editing → Field unlocks automatically

2. **Activity Log Features:**

   - Shows "UserA started editing field Name"
   - Shows "UserB updated field Email"
   - Shows "UserC joined the form"
   - Real-time timestamps and user identification

3. **User Presence Management:**
   - Close a tab → User disappears from active users list
   - Rejoin → User reappears (no duplicates)
   - Multiple sessions per user handled correctly

### **Expected Behavior:**

- ✅ Only admins can create/edit forms
- ✅ All users can fill forms collaboratively
- ✅ Real-time field locking prevents conflicts
- ✅ Activity log shows detailed field-level actions
- ✅ Active users list updates without duplicates
- ✅ Visual indicators for all collaborative actions

## 🔄 Real-time Collaboration

The system uses Socket.IO for real-time features:

### Socket Events

- `join_form` - User joins a form editing session
- `field_lock` - User starts editing a field (locks it for others)
- `field_unlock` - User stops editing a field
- `field_change` - User updates a field value
- `user_joined` - Notification when a new user joins
- `user_left` - Notification when a user leaves
- `activity_log` - Real-time activity updates

### Collaborative Features

1. **Live User Presence**: See active users with role indicators (Admin/User)
2. **Field Locking**: Fields show a 🔒 indicator when being edited by others
3. **Real-time Updates**: Changes appear instantly for all users
4. **Activity Feed**: Live log of user actions and form updates

## 🛠️ Development Scripts

```bash
npm run dev          # Start development server with hot reload
npm start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database with sample data
npm run prisma:reset     # Reset database (WARNING: deletes all data)
npm run prisma:studio    # Open Prisma Studio (database GUI)
```

## 🐳 Docker Commands

```bash
# Build and start services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up --build --force-recreate
```

## 🌍 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
```

## 📊 Sample Data

The seed script creates:

- **4 Users**: Admin User, Alice Johnson, Bob Smith, Carol Davis
- **3 Forms**: Customer Feedback, Event Registration, Employee Survey
- **Sample responses** for demonstration

## 🎯 Usage Guide

### For Form Creators

1. **Login** by clicking the Login button
2. **Create a Form** using the "Create New Form" button
3. **Add Fields** using the form builder (text, number, dropdown)
4. **Save** the form to make it available for filling

### For Form Fillers

1. **Login** to see available forms
2. **Click "Fill"** on any form to start collaborative editing
3. **See Active Users** in the top-right panel
4. **Watch for Field Locks** when others are editing
5. **Submit** when done or leave anytime (changes auto-save)

### Collaborative Features in Action

- When you click on a field, other users see a 🔒 lock indicator
- Changes you make appear instantly for other users
- Activity log shows recent actions: "Alice joined", "Bob updated Email field"
- User presence shows who's currently active

## 🔧 Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite with Prisma ORM
- **Real-time**: Socket.IO
- **DevOps**: Docker, Docker Compose
- **Development**: Nodemon for hot reloading

## 🚀 Deployment

### Production Deployment

1. **Set environment variables:**

   ```env
   NODE_ENV=production
   DATABASE_URL="your-production-database-url"
   PORT=3000
   ```

2. **Build and start:**
   ```bash
   npm install --production
   npm run prisma:generate
   npm run prisma:migrate
   npm start
   ```

### Docker Production

```bash
# Use the production docker-compose override
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### API Testing

The project includes a comprehensive suite of API tests to ensure all endpoints are functioning correctly:

```bash
# Run API tests
npm test
# or
node test-api.js
```

Alternatively, use the PowerShell script which will automatically start the server if needed:

```powershell
.\run.ps1
# Select option 7 - Run API tests
```

### Postman Testing

For manual API testing, we've included a Postman collection:

1. Import `postman-collection.json` into Postman
2. Make sure the server is running
3. Execute requests individually or run the entire collection

See [POSTMAN_TESTING.md](POSTMAN_TESTING.md) for detailed instructions.

### UI Testing

To manually test the UI components:

1. Start the server: `npm start`
2. Open http://localhost:3000/login.html
3. Log in with:
   - Admin: email `admin@example.com`, password `admin123`
   - User: email `john@example.com`, password `password123`
4. Test form creation (admin), form filling, and real-time collaboration

## 🐛 Troubleshooting

### Common Issues

**Prisma Client not generated:**

```bash
npx prisma generate
```

**Database not migrated:**

```bash
npm run prisma:migrate
```

**Port already in use:**

```bash
# Change PORT in .env file or kill existing process
lsof -ti:3000 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :3000   # Windows
```

**Docker issues:**

```bash
# Clean restart
docker-compose down
docker system prune -f
docker-compose up --build
```

## 📝 Known Limitations

- Single database file (SQLite) - suitable for development/small deployments
- No user authentication/authorization beyond name selection
- Field types limited to text, number, and dropdown
- No file upload support
- No form versioning or audit trail beyond activity log

## 🔮 Future Enhancements

- User authentication (JWT, OAuth)
- More field types (date, file upload, checkbox, radio)
- Form templates and themes
- Export responses to CSV/Excel
- Form analytics and reporting
- User permissions and roles
- Form versioning and history
- Email notifications
- Mobile app

## 📄 License

ISC License - See package.json for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy collaborative form filling! 🎉**

For support or questions, please check the troubleshooting section or create an issue.
