# Collaborative Form Filling System - Postman Testing Guide

This document provides a comprehensive guide on how to test the API endpoints of the Collaborative Form Filling System using Postman.

## Getting Started

1. **Import the Collection**

   - Open Postman
   - Click "Import" in the top-left corner
   - Select the `postman-collection.json` file from the project root directory

2. **Ensure the Server is Running**
   - Run the application using `.\run.ps1` and select option 1 or 2
   - Alternatively, run `npm start` directly in the terminal

## API Structure

The API is organized into the following sections:

### 1. User Management

- **Authentication**: Login and registration
- **User Operations**: List users, get specific user details

### 2. Form Management

- **Form CRUD**: Create, read, update, and delete forms
- **Field Management**: Add, modify, and remove form fields

### 3. Response Management

- **Submit Responses**: Save form responses
- **View Responses**: Retrieve submitted responses

## Test Sequences

### Basic Authentication Flow

1. **Register a new user**

   - `POST /api/users/register`
   - Body:
     ```json
     {
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123",
       "role": "USER"
     }
     ```

2. **Login with the new user**
   - `POST /api/users/login`
   - Body:
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```

### Admin Operations

1. **Login as admin**

   - `POST /api/users/login`
   - Body:
     ```json
     {
       "email": "admin@example.com",
       "password": "admin123"
     }
     ```

2. **Create a new form**

   - `POST /api/forms`
   - Body:
     ```json
     {
       "title": "Test Form",
       "createdBy": 1,
       "fields": [
         {
           "label": "Full Name",
           "type": "text",
           "required": true
         },
         {
           "label": "Email",
           "type": "text",
           "required": true
         }
       ]
     }
     ```

3. **List all forms**
   - `GET /api/forms`

### Form Response Flow

1. **Submit a response to a form**

   - `PUT /api/forms/:formId/response`
   - Body:
     ```json
     {
       "response": {
         "field_1": "John Doe",
         "field_2": "john@example.com"
       }
     }
     ```

2. **Retrieve responses for a form**
   - `GET /api/forms/:formId/responses`

## Advanced Testing Scenarios

### Role-Based Access Control

1. **Login as a regular user**

   - Use the login endpoint with regular user credentials

2. **Attempt to create a form**

   - This should succeed or fail based on your implementation of role-based access control

3. **Attempt to view all users**
   - This should succeed or fail based on your implementation of role-based access control

### Collaborative Testing

To test the real-time collaboration feature:

1. **Open two browser windows/tabs with the application UI**
2. **Login as different users in each window**
3. **Open the same form in both windows**
4. **Edit fields in one window and observe changes in the other**

## Error Scenarios

Test how the API handles error conditions:

1. **Invalid Credentials**

   - `POST /api/users/login` with incorrect password

2. **Duplicate Registration**

   - `POST /api/users/register` with an email that already exists

3. **Access Non-existent Resources**

   - `GET /api/forms/999` (assuming this ID doesn't exist)

4. **Invalid Form Submission**
   - Missing required fields
   - Invalid field types

## Using Environment Variables

For more efficient testing:

1. **Create an environment in Postman**

   - Set `baseUrl` to `http://localhost:3000`
   - Create variables for `userId`, `formId`, etc.

2. **Use Test scripts to extract and set variables**
   - Example: After creating a form, capture its ID:
     ```javascript
     var response = pm.response.json();
     pm.environment.set("formId", response.id);
     ```

## Automated Testing with the Collection Runner

1. **Click on "Runner" in Postman**
2. **Select the collection**
3. **Choose the environment**
4. **Configure iterations, delay, etc.**
5. **Run the collection**

This will execute all requests in the collection and show you a summary of the results.

## Troubleshooting

- **Server not responding**: Ensure the server is running on port 3000
- **Authentication fails**: Check if the database has been seeded with the correct user data
- **Database errors**: Try resetting the database with `.\run.ps1` option 5

## API Reference

### User Endpoints

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Authenticate a user
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get a specific user

### Form Endpoints

- `GET /api/forms` - List all forms
- `POST /api/forms` - Create a new form
- `GET /api/forms/:id` - Get a specific form
- `PUT /api/forms/:id` - Update a form
- `DELETE /api/forms/:id` - Delete a form

### Response Endpoints

- `GET /api/forms/:id/response` - Get responses for a form
- `PUT /api/forms/:id/response` - Submit a response to a form

---

For more details, refer to the Postman collection documentation and the API implementation in the source code.
