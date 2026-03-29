import { User } from '../models/User.js';
import { ALL_ROLES } from '../utils/roles.js';

function normalizePayload(payload, { partial = false } = {}) {
  const out = {};
  if (!partial || payload.name !== undefined) out.name = payload.name?.trim();
  if (!partial || payload.email !== undefined) out.email = payload.email?.trim().toLowerCase();
  if (!partial || payload.role !== undefined) out.role = payload.role;
  if (!partial || payload.isActive !== undefined) out.isActive = Boolean(payload.isActive);
  if (payload.password !== undefined) out.password = payload.password;
  return out;
}

function validatePayload(payload, { partial = false } = {}) {
  if (!partial && (!payload.name || !payload.email)) {
    return 'name and email are required';
  }

  if (payload.role !== undefined && !ALL_ROLES.includes(payload.role)) {
    return 'Invalid role';
  }

  if (payload.password !== undefined && String(payload.password).length < 8) {
    return 'Password must be at least 8 characters';
  }

  return null;
}

export async function listUsers(req, res) {
  const { q, role, isActive } = req.query;
  const query = {};

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ];
  }
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const items = await User.find(query).select('-password').sort({ createdAt: -1 });
  return res.status(200).json({ items });
}

export async function getUser(req, res) {
  const item = await User.findById(req.params.id).select('-password');
  if (!item) return res.status(404).json({ message: 'User not found' });
  return res.status(200).json({ item });
}

export async function createUser(req, res) {
  const payload = normalizePayload(req.body);
  const error = validatePayload(payload);
  if (error) return res.status(400).json({ message: error });

  const existing = await User.findOne({ email: payload.email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const autoPassword = !payload.password;
  const user = await User.create({
    ...payload,
    password: payload.password || 'Temp@12345'
  });

  return res.status(201).json({
    item: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    },
    temporaryPassword: autoPassword ? 'Temp@12345' : undefined
  });
}

export async function updateUser(req, res) {
  const payload = normalizePayload(req.body, { partial: true });
  const error = validatePayload(payload, { partial: true });
  if (error) return res.status(400).json({ message: error });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (payload.email && payload.email !== user.email) {
    const duplicate = await User.findOne({ email: payload.email });
    if (duplicate) return res.status(409).json({ message: 'Email already in use' });
  }

  if (payload.name !== undefined) user.name = payload.name;
  if (payload.email !== undefined) user.email = payload.email;
  if (payload.role !== undefined) user.role = payload.role;
  if (payload.isActive !== undefined) user.isActive = payload.isActive;
  if (payload.password !== undefined) user.password = payload.password;

  await user.save();

  return res.status(200).json({
    item: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  });
}

export async function resetUserPassword(req, res) {
  const { password } = req.body;
  if (!password || String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.password = password;
  await user.save();

  return res.status(200).json({ message: 'Password reset successfully' });
}

export async function deleteUser(req, res) {
  if (req.auth?.sub === req.params.id) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }

  const item = await User.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'User not found' });
  return res.status(200).json({ message: 'User deleted' });
}
