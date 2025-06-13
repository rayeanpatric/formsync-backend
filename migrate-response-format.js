// Script to migrate existing form responses from field IDs to field labels
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrateResponseFormat() {
  console.log(
    "Starting migration of form responses from field IDs to field labels..."
  );

  try {
    // Get all forms with their fields
    const forms = await prisma.form.findMany({
      include: {
        fields: true,
      },
    });

    console.log(`Found ${forms.length} forms`);

    // For each form, find and update its responses
    for (const form of forms) {
      console.log(`Processing Form: ${form.title} (ID: ${form.id})`);

      // Get all responses for this form
      const responses = await prisma.formResponse.findMany({
        where: { formId: form.id },
      });

      console.log(`  Found ${responses.length} responses`);

      // Process each response
      for (const response of responses) {
        try {
          // Parse the existing response data
          const responseData = JSON.parse(response.response);
          const newResponseData = {};

          // Map each field ID to its label
          for (const [fieldId, value] of Object.entries(responseData)) {
            const field = form.fields.find((f) => f.id === fieldId);
            if (field) {
              newResponseData[field.label] = value;
            } else {
              // If the field doesn't exist anymore, keep the original ID as key
              newResponseData[fieldId] = value;
            }
          }

          // Update the response with the new format
          await prisma.formResponse.update({
            where: { id: response.id },
            data: { response: JSON.stringify(newResponseData) },
          });

          console.log(`  Migrated response ${response.id}`);
        } catch (error) {
          console.error(`  Error processing response ${response.id}:`, error);
        }
      }
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the migration
migrateResponseFormat();
