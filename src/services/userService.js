const prisma = require("./prismaService");

/**
 * User Service - Handles user operations
 */
class UserService {
  /**
   * Get all users
   * @returns {Promise<Array>} Array of users
   */
  async getAllUsers() {
    const users = await prisma.user.findMany();
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

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
      },
    });

    return user;
  }
}

module.exports = new UserService();
