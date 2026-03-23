const express = require("express");
const contactController = require("../controllers/contactController");

const contactRouter = express.Router();

contactRouter.post("/", contactController.createContactController);
contactRouter.get("/", contactController.getContactsController);

module.exports = contactRouter;