const prisma = require("./prismaService");
const bcrypt = require("bcrypt");

/**
 * User Service - Handles user operations
 */
class UserService {
  /**
   * Get all users
   * @returns {Promise<Array>} Array of users
   */
  async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly exclude password
      },
    });
    return users;
  }
  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly exclude password
      },
    });
    return user;
  }
  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User
   */
  async getUserByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly exclude password
      },
    });
    return user;
  }

  /**
   * Get a user by email with password (for authentication)
   * @param {string} email - User email
   * @returns {Promise<Object>} User with password
   */
  async getUserByEmailWithPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  }
  /**
   * Create a new user
   * @param {Object} userData - User data with name, email, password and optional role
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    const { name, email, password, role = "user" } = userData;

    // Hash the password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly exclude password
      },
    });

    return user;
  }

  /**
   * Verify user password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} Whether passwords match
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = new UserService();
