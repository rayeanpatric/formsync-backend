# Postman API Test Suite

This directory contains comprehensive API test cases for the Collaborative Form Application.

## Files

1. **environment.json** - Environment variables for local and production testing
2. **collection.json** - Complete test suite with all API endpoints
3. **README.md** - This file with usage instructions

## Import Instructions

### 1. Import Environment

1. Open Postman
2. Click on "Import" button
3. Select `environment.json` from this directory
4. The environment "Collaborative Form App Environment" will be imported

### 2. Import Collection

1. In Postman, click "Import" again
2. Select `collection.json` from this directory
3. The collection "Collaborative Form App API Tests" will be imported

### 3. Select Environment

1. In the top-right corner of Postman, click the environment dropdown
2. Select "Collaborative Form App Environment"

## Environment Configuration

### Local Development
- Set `baseUrl` to `http://localhost:3000` (default)
- Ensure your local server is running on port 3000

### Production Testing
- Change `baseUrl` to your production URL
- Update `productionUrl` in environment variables
- Enable `productionUrl` and disable `baseUrl` if needed

## Test Structure

### 1. Health Check
- Basic server health verification
- **Endpoint**: `GET /health`
- **Expected**: 200 status with `{status: "OK", timestamp: "..."}`

### 2. User Management
- **Register Admin User**: Creates admin user for form creation tests
- **Register Regular User**: Creates regular user for form filling tests
- **Login Admin User**: Authenticates admin user
- **Login Regular User**: Authenticates regular user
- **Get All Users**: Retrieves all users list
- **Get User by ID**: Retrieves specific user details

### 3. Form Management
- **Create Form**: Creates a test form with multiple field types
- **Get All Forms**: Retrieves all forms list
- **Get Form by ID**: Retrieves specific form with fields
- **Update Form**: Updates form title and fields

### 4. Form Responses
- **Get Form Response (Empty)**: Gets response before any data is submitted
- **Save Form Response**: Submits form data
- **Get Form Response (With Data)**: Verifies submitted data
- **Update Response Field**: Updates individual field
- **Get Form Responses (All)**: Gets all responses for a form

### 5. Error Handling Tests
- **Invalid User Login**: Tests authentication failure
- **Get Non-existent Form**: Tests 404 handling
- **Create Form Without Required Fields**: Tests validation
- **Register User with Existing Email**: Tests duplicate email handling

### 6. Cleanup
- **Delete Test Form**: Removes test data

## Running Tests

### Individual Requests
1. Select any request from the collection
2. Click "Send"
3. Check the "Test Results" tab for pass/fail status

### Full Collection Run
1. Click on the collection name "Collaborative Form App API Tests"
2. Click "Run" button
3. Select all folders or specific test folders
4. Click "Run Collaborative Form App API Tests"
5. Monitor test execution and results

## Test Validation

Each test includes multiple assertions:

### Response Status Codes
- Success operations: 200/201
- Not found: 404
- Validation errors: 400
- Authentication errors: 401
- Server errors: 500

### Response Structure
- All responses have `success` boolean field
- Success responses include `data` field
- Error responses include `message` field
- Specific data structure validation for each endpoint

### Data Integrity
- Created resources have required fields
- Passwords are never returned in responses
- User roles are correctly assigned
- Form fields maintain proper structure
- Response data is correctly stored and retrieved

## Expected Behavior

### User Registration/Login
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin|user",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Registration/Login successful"
}
```

### Form Creation
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Form Title",
    "createdById": "uuid",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "fields": [
      {
        "id": "uuid",
        "label": "Field Label",
        "type": "text|number|dropdown",
        "required": true|false,
        "order": 1,
        "options": ["option1", "option2"] // for dropdown only
      }
    ]
  }
}
```

### Form Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "formId": "uuid",
    "response": {
      "Field Label 1": "value1",
      "Field Label 2": "value2"
    },
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure server is running
   - Check baseUrl in environment
   - Verify port number

2. **404 Not Found**
   - Check API endpoint paths
   - Verify route definitions in server

3. **Test Failures**
   - Check server logs for errors
   - Verify database connection
   - Ensure test data is properly set up

4. **Environment Variable Issues**
   - Verify environment is selected
   - Check variable names match exactly
   - Ensure variables are set correctly

### Database State
- Tests create and modify data
- Run cleanup tests to remove test data
- Some tests depend on previous test data (IDs)
- Run tests in sequence for best results

## Test Data

The tests use these default values:
- Admin email: `admin@example.com`
- Regular user email: `test@example.com`
- Test passwords: `admin123`, `user123`
- Form title: "Test Survey Form"

You can modify these in the environment variables or request bodies as needed.
