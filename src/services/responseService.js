const prisma = require("./prismaService");

/**
 * Response Service - Handles form response operations
 */
class ResponseService {
  /**
   * Get a form response
   * @param {string} formId - The form ID
   * @returns {Promise<Object>} Form response
   */
  async getFormResponse(formId) {
    const response = await prisma.formResponse.findFirst({
      where: { formId },
    });

    // Parse the response JSON string
    if (response) {
      return {
        ...response,
        response: JSON.parse(response.response),
      };
    }

    return null;
  }
  /**
   * Save a form response
   * @param {string} formId - The form ID
   * @param {Object} responseData - Form response data
   * @returns {Promise<Object>} Saved form response
   */
  async saveFormResponse(formId, responseData) {
    // Fetch the form fields to get the labels
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true },
    });

    if (!form) {
      throw new Error("Form not found");
    }

    // Create a new response object with field labels as keys
    const labeledResponseData = {};

    // Map the field IDs to their labels
    for (const fieldId in responseData) {
      const field = form.fields.find((f) => f.id === fieldId);
      if (field) {
        // Use field label as the key
        labeledResponseData[field.label] = responseData[fieldId];
      }
    }

    // Check if response already exists
    const existingResponse = await prisma.formResponse.findFirst({
      where: { formId },
    });

    if (existingResponse) {
      // Update existing response
      const updatedResponse = await prisma.formResponse.update({
        where: { id: existingResponse.id },
        data: { response: JSON.stringify(labeledResponseData) },
      });

      return {
        ...updatedResponse,
        response: labeledResponseData,
      };
    } else {
      // Create new response
      const newResponse = await prisma.formResponse.create({
        data: {
          formId,
          response: JSON.stringify(labeledResponseData),
        },
      });

      return {
        ...newResponse,
        response: labeledResponseData,
      };
    }
  }
  /**
   * Update a single field in a form response
   * @param {string} formId - The form ID
   * @param {string} fieldId - The field ID to update
   * @param {any} value - New value for the field
   * @returns {Promise<Object>} Updated form response
   */
  async updateResponseField(formId, fieldId, value) {
    // Get existing response or create new one
    let response = await prisma.formResponse.findFirst({
      where: { formId },
    });

    // Get the field label
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      throw new Error("Field not found");
    }

    const fieldLabel = field.label;
    let responseData = {};

    if (response) {
      // Update existing response
      responseData = JSON.parse(response.response);
      responseData[fieldLabel] = value;

      const updatedResponse = await prisma.formResponse.update({
        where: { id: response.id },
        data: { response: JSON.stringify(responseData) },
      });

      return {
        ...updatedResponse,
        response: responseData,
      };
    } else {
      // Create new response with just this field
      responseData[fieldLabel] = value;

      const newResponse = await prisma.formResponse.create({
        data: {
          formId,
          response: JSON.stringify(responseData),
        },
      });

      return {
        ...newResponse,
        response: responseData,
      };
    }
  }
}

module.exports = new ResponseService();
