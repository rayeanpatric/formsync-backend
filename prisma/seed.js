const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Seeding database..."); // Create some users
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        id: "1",
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
      },
    });
    const regularUser = await prisma.user.upsert({
      where: { email: "john@example.com" },
      update: {},
      create: {
        id: "2",
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "user",
      },
    });

    const regularUser2 = await prisma.user.upsert({
      where: { email: "jane@example.com" },
      update: {},
      create: {
        id: "3",
        name: "Jane Smith",
        email: "jane@example.com",
        password: "password123",
        role: "user",
      },
    });

    const regularUser3 = await prisma.user.upsert({
      where: { email: "alice@example.com" },
      update: {},
      create: {
        id: "4",
        name: "Alice Johnson",
        email: "alice@example.com",
        password: "password123",
        role: "user",
      },
    });

    console.log("Created users:", {
      adminUser,
      regularUser,
      regularUser2,
      regularUser3,
    });

    // Create a sample form
    const sampleForm = await prisma.form.upsert({
      where: { id: "1" },
      update: {},
      create: {
        id: "1",
        title: "Customer Feedback Form",
        createdById: adminUser.id,
      },
    });

    console.log("Created form:", sampleForm);

    // Create a second sample form
    const eventForm = await prisma.form.upsert({
      where: { id: "2" },
      update: {},
      create: {
        id: "2",
        title: "Event Registration Form",
        createdById: regularUser.id,
      },
    });

    // Create a third sample form
    const surveyForm = await prisma.form.upsert({
      where: { id: "3" },
      update: {},
      create: {
        id: "3",
        title: "Employee Survey",
        createdById: adminUser.id,
      },
    });

    console.log("Created additional forms:", { eventForm, surveyForm });

    // Create some fields for the form
    const fields = [
      {
        id: "1",
        label: "Full Name",
        type: "text",
        required: true,
        order: 0,
        formId: sampleForm.id,
      },
      {
        id: "2",
        label: "Email",
        type: "text",
        required: true,
        order: 1,
        formId: sampleForm.id,
      },
      {
        id: "3",
        label: "Age",
        type: "number",
        required: false,
        order: 2,
        formId: sampleForm.id,
      },
      {
        id: "4",
        label: "Satisfaction Level",
        type: "dropdown",
        required: true,
        order: 3,
        formId: sampleForm.id,
        options: JSON.stringify([
          "Very Satisfied",
          "Satisfied",
          "Neutral",
          "Dissatisfied",
          "Very Dissatisfied",
        ]),
      },
      {
        id: "5",
        label: "Comments",
        type: "text",
        required: false,
        order: 4,
        formId: sampleForm.id,
      },
    ];

    // Event form fields
    const eventFields = [
      {
        id: "6",
        label: "Participant Name",
        type: "text",
        required: true,
        order: 0,
        formId: eventForm.id,
      },
      {
        id: "7",
        label: "Email Address",
        type: "text",
        required: true,
        order: 1,
        formId: eventForm.id,
      },
      {
        id: "8",
        label: "Phone Number",
        type: "text",
        required: false,
        order: 2,
        formId: eventForm.id,
      },
      {
        id: "9",
        label: "Event Interest",
        type: "dropdown",
        required: true,
        order: 3,
        formId: eventForm.id,
        options: JSON.stringify([
          "Workshop A",
          "Workshop B",
          "Networking Session",
          "Keynote Speech",
          "All Events",
        ]),
      },
      {
        id: "10",
        label: "Dietary Restrictions",
        type: "text",
        required: false,
        order: 4,
        formId: eventForm.id,
      },
    ];

    // Survey form fields
    const surveyFields = [
      {
        id: "11",
        label: "Employee ID",
        type: "number",
        required: true,
        order: 0,
        formId: surveyForm.id,
      },
      {
        id: "12",
        label: "Department",
        type: "dropdown",
        required: true,
        order: 1,
        formId: surveyForm.id,
        options: JSON.stringify([
          "Engineering",
          "Marketing",
          "Sales",
          "HR",
          "Finance",
          "Operations",
        ]),
      },
      {
        id: "13",
        label: "Years of Experience",
        type: "number",
        required: true,
        order: 2,
        formId: surveyForm.id,
      },
      {
        id: "14",
        label: "Job Satisfaction",
        type: "dropdown",
        required: true,
        order: 3,
        formId: surveyForm.id,
        options: JSON.stringify([
          "Very Satisfied",
          "Satisfied",
          "Neutral",
          "Dissatisfied",
          "Very Dissatisfied",
        ]),
      },
      {
        id: "15",
        label: "Additional Feedback",
        type: "text",
        required: false,
        order: 4,
        formId: surveyForm.id,
      },
    ];

    // Combine all fields
    const allFields = [...fields, ...eventFields, ...surveyFields];

    // Create or update fields
    for (const field of allFields) {
      await prisma.field.upsert({
        where: { id: field.id },
        update: field,
        create: field,
      });
    }
    console.log("Created form fields for all forms");

    // Create sample form responses
    const sampleResponse = await prisma.formResponse.upsert({
      where: { id: "1" },
      update: {},
      create: {
        id: "1",
        formId: sampleForm.id,
        response: JSON.stringify({
          1: "John Doe",
          2: "john.doe@example.com",
          3: 30,
          4: "Satisfied",
          5: "This is a sample comment for the form.",
        }),
      },
    });

    const eventResponse = await prisma.formResponse.upsert({
      where: { id: "2" },
      update: {},
      create: {
        id: "2",
        formId: eventForm.id,
        response: JSON.stringify({
          6: "Jane Smith",
          7: "jane.smith@example.com",
          8: "+1-555-0123",
          9: "Workshop A",
          10: "Vegetarian",
        }),
      },
    });

    console.log("Created sample responses:", { sampleResponse, eventResponse });
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
