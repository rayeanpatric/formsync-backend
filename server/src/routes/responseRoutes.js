const express = require("express");
const responseController = require("../controllers/responseController");

const router = express.Router();

// Routes for form responses
router.get("/:formId", responseController.getFormResponse);
router.post("/:formId", responseController.saveFormResponse);
router.patch("/:formId/:fieldId", responseController.updateResponseField);

module.exports = router;
