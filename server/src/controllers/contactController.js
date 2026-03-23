const contactModel = require("../models/contact.model");

async function createContactController(req, res) {
  const { name, email, phone, message } = req.body;

  // Validation
  if (!name || !email || !phone || !message) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  try {
    const contact = await contactModel.create({
      name,
      email,
      phone,
      message
    });

    res.status(201).json({
      message: "Contact form submitted successfully",
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        message: contact.message,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Invalid data provided",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: "Internal server error"
    });
  }
}

async function getContactsController(req, res) {
  try {
    const contacts = await contactModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: "Contacts retrieved successfully",
      contacts
    });
  } catch (error) {
    console.error("Error retrieving contacts:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
}

module.exports = {
  createContactController,
  getContactsController
};