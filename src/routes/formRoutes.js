const express = require("express");
const formController = require("../controllers/formController");

const router = express.Router();

// Routes for forms
router.post("/", formController.createForm);
router.get("/", formController.getAllForms);
router.get("/:id", formController.getForm);
router.put("/:id", formController.updateForm);
router.delete("/:id", formController.deleteForm);

module.exports = router;
