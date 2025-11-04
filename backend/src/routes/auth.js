import express from 'express';
import { signup, login } from '../services/authService.js';
import { signupSchema, loginSchema, validate } from '../utils/validation.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const data = validate(req.body, signupSchema);
    const result = await signup(data.name, data.email, data.password);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = validate(req.body, loginSchema);
    const result = await login(data.email, data.password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

export default router;
