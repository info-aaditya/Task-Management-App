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

export const shareTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    // Find the task by ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const shareableLink = `${process.env.FRONT_URL}/#/task/${taskId}`;

    res.status(200).json({
      success: true,
      message: 'Task shared successfully',
      link: shareableLink,
      task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId).populate(
      'createdBy',
      'name email'
    );

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTaskAnalytics = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(400).json({
        success: false,
        message: 'User not authenticated or userId not found.',
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Retrieve tasks that are either created by or assigned to the current user
    const tasks = await Task.find({
      $or: [{ createdBy: req.userId }, { assignedTo: user.email }],
    });

    // Task Analytics Data
    const analyticsData = {
      backlogTasks: tasks.filter((task) => task.category === 'Backlog').length,
      toDoTasks: tasks.filter((task) => task.category === 'To-Do').length,
      inProgressTasks: tasks.filter((task) => task.category === 'In Progress').length,
      completedTasks: tasks.filter((task) => task.category === 'Done').length,
      lowPriority: tasks.filter((task) => task.priority === 'low').length,
      moderatePriority: tasks.filter((task) => task.priority === 'moderate').length,
      highPriority: tasks.filter((task) => task.priority === 'high').length,
      dueDateTasks: tasks.filter((task) => task.dueDate && task.dueDate < new Date()).length,
    };

    res.status(200).json({
      success: true,
      analyticsData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching analytics', error });
  }
};

export const addAssignee = async (req, res) => {
  const { email } = req.body;
  const mainUserId = req.userId;

  try {
    // Retrieve if the assignee exists
    const assignee = await User.findOne({ email });

    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: `The email ${email} does not belong to any registered user.`,
      });
    }

    // Retrieve tasks created by the main user
    const tasks = await Task.find({ createdBy: mainUserId });

    if (tasks.length > 0) {
      // Iterate through each task and update the assignedTo field & Save Task
      for (const task of tasks) {
        task.assignedTo = email;
        await task.save();
      }

      return res.status(200).json({
        success: true,
        message: `All tasks have been assigned to user with email ${email}.`,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'No tasks found for the main user.',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding assignee',
      error: error.message || error,
    });
  }
};

export const sortTasks = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    // Get the filter type from the query
    const filter = req.query.filter;
    const currentDate = new Date();

    // Define the start and end of the current week (Sun to Sat)
    const weeklyStart = new Date(currentDate);
    weeklyStart.setDate(currentDate.getDate() - currentDate.getDay());
    weeklyStart.setHours(0, 0, 0, 0);

    const weeklyEnd = new Date(weeklyStart);
    weeklyEnd.setDate(weeklyStart.getDate() + 6);
    weeklyEnd.setHours(23, 59, 59, 999);

    // Define the start and end of the current month
    const monthlyStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    monthlyStart.setHours(0, 0, 0, 0);

    const monthlyEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    monthlyEnd.setHours(23, 59, 59, 999);

    // Retrieve tasks that are either created by or assigned to the current user
    const tasks = await Task.find({
      $or: [{ createdBy: req.userId }, { assignedTo: user.email }],
    });

    let filteredTasks;

    if (filter === 'Today') {
      filteredTasks = tasks.filter(
        (task) =>
          new Date(task.dueDate).toDateString() === currentDate.toDateString()
      );
    } else if (filter === 'This Week') {
      filteredTasks = tasks.filter(
        (task) =>
          new Date(task.dueDate) >= weeklyStart &&
          new Date(task.dueDate) <= weeklyEnd
      );
    } else if (filter === 'This Month') {
      filteredTasks = tasks.filter(
        (task) =>
          new Date(task.dueDate) >= monthlyStart &&
          new Date(task.dueDate) <= monthlyEnd
      );
    } else {
      filteredTasks = tasks.filter(
        (task) => new Date(task.dueDate) > monthlyEnd
      );
    }

    res.status(200).json({
      success: true,
      tasks: filteredTasks,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
