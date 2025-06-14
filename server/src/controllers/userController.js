const userService = require("../services/userService");

/**
 * User Controller - Handles user-related HTTP requests
 */
class UserController {
  /**
   * Get all users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();

      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Error getting users:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get users",
        error: error.message,
      });
    }
  }
  /**
   * Get a user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Error getting user:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get user",
        error: error.message,
      });
    }
  }
  /**
   * Create a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createUser(req, res) {
    try {
      const userData = req.body;

      // Validate input data
      if (!userData.name || !userData.email || !userData.password) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, email, password",
        });
      }
      const user = await userService.createUser(userData);

      return res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create user",
        error: error.message,
      });
    }
  }

  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      // Validate input data
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, email, password",
        });
      }

      // Check if user already exists
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }
      const userData = {
        name,
        email,
        password, // Will be hashed in userService.createUser
        role: role || "user", // Default to 'user' role
      };
      const user = await userService.createUser(userData);

      return res.status(201).json({
        success: true,
        data: user,
        message: "User registered successfully",
      });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to register user",
        error: error.message,
      });
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input data
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: email, password",
        });
      } // Find user by email (with password for authentication)
      const user = await userService.getUserByEmailWithPassword(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      } // Check password using bcrypt
      const isPasswordValid = await userService.verifyPassword(
        password,
        user.password
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      } // Remove password from response
      const { password: _, ...userResponse } = user;

      return res.status(200).json({
        success: true,
        data: userResponse,
        message: "Login successful",
      });
    } catch (error) {
      console.error("Error logging in user:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to login",
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();
