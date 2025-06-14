const responseService = require("../services/responseService");

/**
 * Response Controller - Handles form response HTTP requests
 */
class ResponseController {
  /**
   * Get a form response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFormResponse(req, res) {
    try {
      const { formId } = req.params;
      const response = await responseService.getFormResponse(formId);
      if (!response) {
        return res.status(200).json({
          success: true,
          data: { response: {} },
          response: {}, // Added for consistency
        });
      }

      return res.status(200).json({
        success: true,
        data: response,
        response: response.response || {}, // Added for consistency
      });
    } catch (error) {
      console.error("Error getting form response:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get form response",
        error: error.message,
      });
    }
  }

  /**
   * Save a form response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async saveFormResponse(req, res) {
    try {
      const { formId } = req.params;
      const responseData = req.body;
      const savedResponse = await responseService.saveFormResponse(
        formId,
        responseData
      );

      // Return direct response format for Postman tests
      return res.status(200).json({
        success: true,
        data: savedResponse,
        response: savedResponse.response, // Add this to match expected format
      });
    } catch (error) {
      console.error("Error saving form response:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to save form response",
        error: error.message,
      });
    }
  }

  /**
   * Update a single field in a form response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateResponseField(req, res) {
    try {
      const { formId, fieldId } = req.params;
      const { value } = req.body;

      const updatedResponse = await responseService.updateResponseField(
        formId,
        fieldId,
        value
      );

      return res.status(200).json({
        success: true,
        data: updatedResponse,
      });
    } catch (error) {
      console.error("Error updating response field:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update response field",
        error: error.message,
      });
    }
  }
}

module.exports = new ResponseController();
