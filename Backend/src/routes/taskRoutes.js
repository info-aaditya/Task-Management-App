import express from 'express';
import {
  createTask,
  deleteTask,
  getTasks,
  shareTask,
  getTaskById,
  editTask,
  getTaskAnalytics,
  addAssignee,
  sortTasks,
} from '../controllers/taskController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

//Routes for Tasks
router.post('/', verifyToken, createTask);

router.get('/', verifyToken, getTasks);

router.put('/:taskId', verifyToken, editTask);

router.delete('/:taskId', deleteTask);

router.post('/share/:taskId', shareTask);

router.get('/:taskId', getTaskById);

router.get('/analytics', verifyToken, getTaskAnalytics);

router.post('/add', verifyToken, addAssignee);

router.get('/sort', verifyToken, sortTasks);

export default router;
