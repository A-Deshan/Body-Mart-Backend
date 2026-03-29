import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ALL_ROLES, ROLES } from '../utils/roles.js';

function buildAuthPayload(user) {
  return {
    token: jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    ),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

export async function loginWithEmailPassword(email, password, options = {}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.isActive) {
    throw new Error('Invalid credentials');
  }

  const passwordOk = await user.comparePassword(password);
  if (!passwordOk) {
    throw new Error('Invalid credentials');
  }

  if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
    throw new Error('Invalid credentials');
  }

  return buildAuthPayload(user);
}

export async function registerUser({ name, email, password, role }, options = {}) {
  const normalizedRole = role || options.defaultRole || ROLES.STOCK_MANAGER;
  if (!ALL_ROLES.includes(normalizedRole)) {
    throw new Error('Invalid role');
  }

  if (options.allowedRoles && !options.allowedRoles.includes(normalizedRole)) {
    throw new Error('Invalid role');
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: normalizedRole
  });

  return buildAuthPayload(user);
}
