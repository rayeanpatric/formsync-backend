const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// Routes for users
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);

// Authentication routes
router.post("/register", userController.register);
router.post("/login", userController.login);

module.exports = router;
