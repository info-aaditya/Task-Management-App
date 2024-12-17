import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

// Define User Sign Up
export const signup = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    if (!name || !email || !password || !confirmPassword) {
      throw new Error('please enter all the fields');
    }

    if (password != confirmPassword) {
      throw new Error('Passwords are not matching');
    }

    const userAlreadyExists = await User.findOne({ email });
    console.log('user already exists', userAlreadyExists);

    if (userAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }
    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      name,
    });

    await user.save();
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    res.status(201).json({
      success: true,
      message: 'user created successfully',
      user: {
        ...user._doc,
        password: undefined,
        token,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Define User Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found please register' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: 'Password do not match' });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      user: {
        ...user._doc,
        password: undefined,
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Define User Logout
export const logout = async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// Define User Update
export const update = async (req, res) => {
  const { name, newEmail, oldPassword, newPassword } = req.body;
  const userId = req.userId;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if the email is being updated, and ensure that the new email is not already associated with another account.
    if (newEmail && newEmail !== user.email) {
      // Check for existing email
      const emailExists = await User.findOne({ email: newEmail });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    if (newPassword || oldPassword) {
      if (!oldPassword) {
        throw new Error('Old password is required to change the password');
      }

      const isOldPasswordValid = await bcryptjs.compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        throw new Error('Old password is incorrect');
      }

      if (!newPassword) {
        throw new Error('New password cannot be empty');
      }

      const hashedNewPassword = await bcryptjs.hash(newPassword, 10);
      user.password = hashedNewPassword;
    }

    // Update name and/or newEmail if provided
    if (name) {
      user.name = name;
    }
    if (newEmail) {
      user.email = newEmail;
    }

    // Save the updated user information
    await user.save();

    // Respond with success
    res.status(200).json({
      success: true,
      message: 'User credentials updated successfully',
      user: {
        ...user._doc, // Don't include the password field in the response
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Define Get User Detais
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password'); // Exclude password from the user data

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User data fetched successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
    });
  }
};
