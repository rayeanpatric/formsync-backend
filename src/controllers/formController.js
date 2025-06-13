const formService = require("../services/formService");

/**
 * Form Controller - Handles form-related HTTP requests
 */
class FormController {
  /**
   * Create a new form
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createForm(req, res) {
    try {
      const formData = req.body;

      // Validate input data
      if (!formData.title || !formData.createdById) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: title and createdById",
        });
      }
      const form = await formService.createForm(formData);

      // Return the form directly to match Postman tests
      return res.status(201).json(form);
    } catch (error) {
      console.error("Error creating form:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create form",
        error: error.message,
      });
    }
  }

  /**
   * Get a form by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getForm(req, res) {
    try {
      const { id } = req.params;
      const form = await formService.getFormById(id);
      if (!form) {
        return res.status(404).json({
          success: false,
          message: "Form not found",
        });
      } // Return the form with success wrapper to match frontend expectations
      return res.status(200).json({
        success: true,
        data: form,
      });
    } catch (error) {
      console.error("Error getting form:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get form",
        error: error.message,
      });
    }
  }

  /**
   * Get all forms
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */ async getAllForms(req, res) {
    try {
      const forms = await formService.getAllForms(); // Format the response to match expected structure in tests
      const formattedForms = forms.map((form) => ({
        ...form,
        title: form.title,
        fields: [], // This will be populated by the individual form fetch
      }));

      return res.status(200).json({
        success: true,
        data: formattedForms,
      });
    } catch (error) {
      console.error("Error getting forms:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get forms",
        error: error.message,
      });
    }
  }

  /**
   * Update a form
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateForm(req, res) {
    try {
      const { id } = req.params;
      const formData = req.body;

      // Validate input data
      if (!formData.title) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: title",
        });
      }

      const form = await formService.updateForm(id, formData);

      return res.status(200).json({
        success: true,
        data: form,
      });
    } catch (error) {
      console.error("Error updating form:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update form",
        error: error.message,
      });
    }
  }

  /**
   * Delete a form
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteForm(req, res) {
    try {
      const { id } = req.params;
      await formService.deleteForm(id);

      return res.status(200).json({
        success: true,
        message: "Form deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting form:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete form",
        error: error.message,
      });
    }
  }
}

module.exports = new FormController();
