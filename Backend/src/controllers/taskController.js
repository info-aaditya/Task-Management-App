import { Task } from '../models/task.js';
import { User } from '../models/user.js';

export const createTask = async (req, res) => {
  const {
    title,
    checklist,
    dueDate,
    assignedTo = null,
    priority,
    category,
  } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (!title || !checklist || !priority) {
      throw new Error('Please fill in all required fields');
    }

    if (checklist.length > 0) {
      checklist.forEach((item) => {
        if (!item.text) {
          throw new Error('Please fill in all required fields');
        }
      });
    }
    if (!dueDate) {
      throw new Error('Please Select a Due Date');
    }

    // Check assignee if it's provided
    let assignee = null;

    if (assignedTo) {
      assignee = await User.findOne({ email: assignedTo });
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: `The assignee email ${assignedTo} has no account! Please create one.`,
        });
      }
    }

    // Calculate priority, If no priority due date is given
    const currentDate = new Date();
    const taskDueDate = new Date(dueDate);

    let calculatedPriority = priority || 'low';

    // When the priority is 'moderate' or 'low', and the due date is today or past, set priority to 'high'
    if ((priority === 'moderate' || priority === 'low') && taskDueDate <= currentDate) {
      calculatedPriority = 'high';
    }

    const userId = req.userId;

    const task = new Task({
      title,
      category,
      checklist,
      dueDate,
      assignedTo,
      priority: calculatedPriority,
      createdBy: userId,
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    // Find the current user to get their email
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    const userEmail = user.email;

    // Find tasks created by or assigned to the current user
    const tasks = await Task.find({
      $or: [{ createdBy: req.userId }, { assignedTo: userEmail }],
    });

    // Directly return the tasks with assignedTo as a string
    const transformedTasks = tasks.map((task) => ({
      ...task.toObject(),
      assignedTo: task.assignedTo || null,
    }));

    res.status(200).json({
      success: true,
      tasks: transformedTasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const editTask = async (req, res) => {
  const { title, checklist, dueDate, assignedTo, priority, category } =
    req.body;
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    // Update task details
    if (title) task.title = title;
    if (category) task.category = category;
    if (checklist) task.checklist = checklist;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;

    // Assign task if email is provided
    if (assignedTo) {
      // Check if the email exists
      const assignee = await User.findOne({ email: assignedTo });
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: `The email ${assignedTo} has no account! Please create one.`,
        });
      }
      task.assignedTo = assignedTo;
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: {
        ...task.toObject(),
        assignedTo: task.assignedTo,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const shareTask = async (req, res) => {};

export const getTaskById = async (req, res) => {};

export const getTaskAnalytics = async (req, res) => {};

export const addAssignee = async (req, res) => {};

export const sortTasks = async (req, res) => {};
