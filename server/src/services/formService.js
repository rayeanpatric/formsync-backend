const prisma = require("./prismaService");

/**
 * Form Service - Handles form operations
 */
class FormService {
  /**
   * Create a new form
   * @param {Object} formData - Form data with title, createdById, and fields array
   * @returns {Promise<Object>} Created form
   */
  async createForm(formData) {
    const { title, createdById, fields } = formData;

    // Create the form with fields in a transaction
    const form = await prisma.$transaction(async (prisma) => {
      // Create the form first
      const newForm = await prisma.form.create({
        data: {
          title,
          createdById,
        },
      });

      // Add fields to the form
      if (fields && fields.length > 0) {
        const fieldPromises = fields.map((field, index) => {
          return prisma.field.create({
            data: {
              label: field.label,
              type: field.type,
              options: field.options ? JSON.stringify(field.options) : null,
              required: field.required || false,
              order: index,
              formId: newForm.id,
            },
          });
        });

        await Promise.all(fieldPromises);
      }

      // Return the created form with fields
      return prisma.form.findUnique({
        where: { id: newForm.id },
        include: { fields: true },
      });
    });

    return form;
  }

  /**
   * Get a form by ID
   * @param {string} formId - The form ID
   * @returns {Promise<Object>} Form with fields
   */
  async getFormById(formId) {
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Parse options strings to JSON for each field
    if (form && form.fields) {
      form.fields = form.fields.map((field) => {
        if (field.options) {
          return {
            ...field,
            options: JSON.parse(field.options),
          };
        }
        return field;
      });
    }

    return form;
  }

  /**
   * Get all forms
   * @returns {Promise<Array>} Array of forms
   */
  async getAllForms() {
    const forms = await prisma.form.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { fields: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return forms;
  }

  /**
   * Update a form
   * @param {string} formId - Form ID
   * @param {Object} formData - Updated form data
   * @returns {Promise<Object>} Updated form
   */
  async updateForm(formId, formData) {
    const { title, fields } = formData;

    // Update the form in a transaction
    const form = await prisma.$transaction(async (prisma) => {
      // Update form title
      await prisma.form.update({
        where: { id: formId },
        data: { title },
      });

      // If fields are provided, update them
      if (fields && fields.length > 0) {
        // Delete existing fields
        await prisma.field.deleteMany({
          where: { formId },
        });

        // Create new fields
        const fieldPromises = fields.map((field, index) => {
          return prisma.field.create({
            data: {
              label: field.label,
              type: field.type,
              options: field.options ? JSON.stringify(field.options) : null,
              required: field.required || false,
              order: index,
              formId,
            },
          });
        });

        await Promise.all(fieldPromises);
      }

      // Return the updated form with fields
      return prisma.form.findUnique({
        where: { id: formId },
        include: { fields: true },
      });
    });

    return form;
  }

  /**
   * Delete a form
   * @param {string} formId - Form ID
   * @returns {Promise<Object>} Deleted form
   */
  async deleteForm(formId) {
    // This will cascade delete all fields and responses
    const deletedForm = await prisma.form.delete({
      where: { id: formId },
    });

    return deletedForm;
  }
  /**
   * Get all responses for a specific form
   * @param {string} formId - Form ID
   * @returns {Promise<Array>} Array of responses
   */
  async getFormResponses(formId) {
    const responses = await prisma.formResponse.findMany({
      where: { formId },
      include: {
        form: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse JSON response string to object
    return responses.map((response) => ({
      ...response,
      data: response.response ? JSON.parse(response.response) : {},
    }));
  }
}

module.exports = new FormService();
