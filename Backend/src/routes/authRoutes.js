import express from 'express';
import {
  signup,
  login,
  logout,
  update,
  getUser,
} from '../controllers/authController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/signup', signup);

router.post('/login', login);

router.post('/logout', logout);

router.put('/update', verifyToken, update);

router.get('/user', verifyToken, getUser);

export default router;
