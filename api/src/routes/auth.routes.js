const express = require('express');
const router = express.Router();

// Importamos a lógica (controller) que criamos!
const authController = require('../controllers/auth.controller');

// Define as URLs que o Front-end vai chamar:
// Ex: POST http://localhost:3000/api/auth/register
router.post('/register', authController.register);

// Ex: POST http://localhost:3000/api/auth/login
router.post('/login', authController.login);

module.exports = router;
