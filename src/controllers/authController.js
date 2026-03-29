import { loginWithEmailPassword, registerUser } from '../services/authService.js';
import { ROLES } from '../utils/roles.js';

const ADMIN_LOGIN_ROLES = [ROLES.ADMIN, ROLES.STOCK_MANAGER, ROLES.DELIVERY_PERSONNEL];
const ADMIN_REGISTER_ROLES = [ROLES.ADMIN, ROLES.STOCK_MANAGER];
const WEBSITE_LOGIN_ROLES = [ROLES.CUSTOMER];

function validateLoginPayload(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return null;
  }

  return { email, password };
}

function validateRegistrationPayload(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required' });
    return null;
  }

  if (password.length < 8) {
    res.status(400).json({ message: 'Password must be at least 8 characters' });
    return null;
  }

  return { name, email, password };
}

function handleRegistrationError(error, res) {
  if (error.message === 'Email already in use') {
    return res.status(409).json({ message: error.message });
  }
  if (error.message === 'Invalid role') {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: 'Registration failed' });
}

export async function login(req, res) {
  const payload = validateLoginPayload(req, res);
  if (!payload) return undefined;

  try {
    const result = await loginWithEmailPassword(payload.email, payload.password, {
      allowedRoles: ADMIN_LOGIN_ROLES
    });
    return res.status(200).json(result);
  } catch {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
}

export async function register(req, res) {
  const payload = validateRegistrationPayload(req, res);
  if (!payload) return undefined;

  try {
    const result = await registerUser(
      {
        ...payload,
        role: req.body.role
      },
      {
        defaultRole: ROLES.STOCK_MANAGER,
        allowedRoles: ADMIN_REGISTER_ROLES
      }
    );
    return res.status(201).json(result);
  } catch (error) {
    return handleRegistrationError(error, res);
  }
}

export async function loginStoreAccount(req, res) {
  const payload = validateLoginPayload(req, res);
  if (!payload) return undefined;

  try {
    const result = await loginWithEmailPassword(payload.email, payload.password, {
      allowedRoles: WEBSITE_LOGIN_ROLES
    });
    return res.status(200).json(result);
  } catch {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
}

export async function registerStoreAccount(req, res) {
  const payload = validateRegistrationPayload(req, res);
  if (!payload) return undefined;

  try {
    const result = await registerUser(
      {
        ...payload,
        role: ROLES.CUSTOMER
      },
      {
        defaultRole: ROLES.CUSTOMER,
        allowedRoles: WEBSITE_LOGIN_ROLES
      }
    );
    return res.status(201).json(result);
  } catch (error) {
    return handleRegistrationError(error, res);
  }
}

export function me(req, res) {
  return res.status(200).json({ auth: req.auth });
}
