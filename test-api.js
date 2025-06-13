// Quick API test script
const https = require("https");
const http = require("http");
const { URL } = require("url");

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === "https:" ? https : http;

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || "GET",
        headers: options.headers || {},
      };

      const req = client.request(requestOptions, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          // Handle different status codes
          if (res.statusCode >= 400) {
            try {
              const errorData = JSON.parse(data);
              resolve({
                success: false,
                message:
                  errorData.message ||
                  `Server returned status ${res.statusCode}`,
                statusCode: res.statusCode,
              });
            } catch (e) {
              resolve({
                success: false,
                message: `Server returned status ${res.statusCode}`,
                statusCode: res.statusCode,
              });
            }
            return;
          }

          // Handle normal responses
          try {
            // If empty response
            if (!data.trim()) {
              resolve({ success: true, data: {} });
              return;
            }

            // Try to parse as JSON
            const jsonData = JSON.parse(data);

            // If the API already returns a success flag, use that structure
            if (typeof jsonData.success !== "undefined") {
              resolve(jsonData);
            } else {
              // If it's just the raw data (array or object), wrap it
              resolve({ success: true, data: jsonData });
            }
          } catch (e) {
            // Failed to parse as JSON, but still a successful request
            resolve({
              success: true,
              data: data,
              message: "Response is not JSON format",
            });
          }
        });
      });

      req.on("error", (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      // Add a timeout
      req.setTimeout(5000, () => {
        req.abort();
        reject(new Error("Request timeout after 5 seconds"));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

const BASE_URL = "http://localhost:3000/api";

async function testAPI() {
  console.log("Testing API Endpoints...\n");

  let allTestsPassed = true;
  let testResults = [];

  try {
    // Test 1: Server connectivity
    console.log("1. Testing server connectivity...");
    try {
      await makeRequest(`${BASE_URL}/users`);
      console.log("Server is running and accessible");
      testResults.push({ test: "Server Connectivity", passed: true });
    } catch (error) {
      console.log("Server is not accessible");
      console.log("   Make sure the server is running on port 3000");
      testResults.push({
        test: "Server Connectivity",
        passed: false,
        error: error.message,
      });
      allTestsPassed = false;
      return;
    }

    // Test 2: Admin login
    console.log("\n2. Testing admin login...");
    const loginResult = await makeRequest(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "admin123",
      }),
    });
    if (loginResult.success) {
      console.log("Admin login: SUCCESS");
      const adminUser = loginResult.user; // Changed from data to user
      console.log(`   Admin user: ${adminUser.name} (${adminUser.role})`);
      testResults.push({ test: "Admin Login", passed: true });
    } else {
      console.log("Admin login: FAILED");
      console.log(`   Error: ${loginResult.message || "Unknown error"}`);
      testResults.push({
        test: "Admin Login",
        passed: false,
        error: loginResult.message,
      });
      allTestsPassed = false;
    }

    // Test 3: Get forms
    console.log("\n3. Testing get forms...");
    const formsResult = await makeRequest(`${BASE_URL}/forms`);

    if (formsResult.success || Array.isArray(formsResult)) {
      const forms = formsResult.data || formsResult;
      console.log("Get forms: SUCCESS");
      console.log(`   Found ${forms.length} forms`);
      forms.forEach((form, index) => {
        console.log(
          `      ${index + 1}. ${form.title} (${
            form._count?.fields || 0
          } fields)`
        );
      });
      testResults.push({ test: "Get Forms", passed: true });
    } else {
      console.log("Get forms: FAILED");
      console.log(`   Error: ${formsResult.message || "Unknown error"}`);
      testResults.push({
        test: "Get Forms",
        passed: false,
        error: formsResult.message,
      });
      allTestsPassed = false;
    }

    // Test 4: Regular user login
    console.log("\n4. Testing regular user login...");
    const userLoginResult = await makeRequest(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "john@example.com",
        password: "password123",
      }),
    });
    if (userLoginResult.success) {
      console.log("User login: SUCCESS");
      const regularUser = userLoginResult.user; // Changed from data to user
      console.log(`   Regular user: ${regularUser.name} (${regularUser.role})`);
      testResults.push({ test: "User Login", passed: true });
    } else {
      console.log("User login: FAILED");
      console.log(`   Error: ${userLoginResult.message || "Unknown error"}`);
      testResults.push({
        test: "User Login",
        passed: false,
        error: userLoginResult.message,
      });
      allTestsPassed = false;
    }

    // Test 5: Get users
    console.log("\n5. Testing get all users...");
    const usersResult = await makeRequest(`${BASE_URL}/users`);

    if (usersResult.success || Array.isArray(usersResult)) {
      const users = usersResult.data || usersResult;
      console.log("Get users: SUCCESS");
      console.log(`   � Found ${users.length} users`);
      testResults.push({ test: "Get Users", passed: true });
    } else {
      console.log("Get users: FAILED");
      console.log(`   Error: ${usersResult.message || "Unknown error"}`);
      testResults.push({
        test: "Get Users",
        passed: false,
        error: usersResult.message,
      });
      allTestsPassed = false;
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("TEST SUMMARY");
    console.log("=".repeat(50));

    testResults.forEach((result) => {
      const status = result.passed ? "PASS" : "FAIL";
      console.log(`${status} ${result.test}`);
      if (!result.passed && result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });

    const passedTests = testResults.filter((r) => r.passed).length;
    const totalTests = testResults.length;

    console.log("\n" + "=".repeat(50));
    if (allTestsPassed) {
      console.log("ALL TESTS PASSED! API is working correctly.");
      process.exit(0);
    } else {
      console.log(
        `${totalTests - passedTests} out of ${totalTests} tests failed.`
      );
      console.log("Please check the server and database configuration.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Unexpected error during testing:", error.message);
    console.log("\nThis might indicate:");
    console.log("  - Server is not running (start with: npm start)");
    console.log("  - Database is not set up (run: npm run prisma:seed)");
    console.log("  - Network connectivity issues");
    process.exit(1);
  }
}

testAPI();
