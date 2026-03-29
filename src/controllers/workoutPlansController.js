import { WorkoutPlanRequest } from '../models/WorkoutPlanRequest.js';
import { sendWorkoutPlanRequestEmail } from '../services/mailerService.js';

const arrayFields = new Set([
  'additionalGoals',
  'triedMethods',
  'targetZones',
  'sensitivities',
  'eatingChallenges',
  'motivations'
]);

const numberFields = new Set(['age', 'heightCm', 'currentWeightKg', 'goalWeightKg']);

const allowedAnswerFields = [
  'fullName',
  'email',
  'age',
  'ageRange',
  'mainGoal',
  'additionalGoals',
  'bodyGoal',
  'physicalBuild',
  'weightChangePattern',
  'bestShapeTiming',
  'triedMethods',
  'pastExperience',
  'workoutLocation',
  'gymConfidence',
  'walkingDaily',
  'recentWorkoutFrequency',
  'typicalWorkoutIntensity',
  'pushUps',
  'squats',
  'crunches',
  'targetZones',
  'sensitivities',
  'workoutDuration',
  'trainingFrequencyPreference',
  'eatingHabits',
  'eatingChallenges',
  'tracksFood',
  'dietPreference',
  'proteinPriority',
  'proteinSupplements',
  'workSchedule',
  'typicalDay',
  'energyLevels',
  'sleepHours',
  'waterIntake',
  'smoking',
  'alcohol',
  'heightCm',
  'currentWeightKg',
  'goalWeightKg',
  'importantEvent',
  'eventDate',
  'motivations',
  'goalConfidence'
];

function normalizeString(value, maxLength = 240) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeString(item, 160))
    .filter(Boolean)
    .slice(0, 12);
}

function deriveAgeRange(age) {
  if (!Number.isFinite(age)) return '';
  if (age < 30) return '18-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  return '50+';
}

function buildAnswers(payload) {
  const answers = {};

  for (const field of allowedAnswerFields) {
    if (arrayFields.has(field)) {
      const value = normalizeArray(payload[field]);
      if (value.length > 0) {
        answers[field] = value;
      }
      continue;
    }

    if (numberFields.has(field)) {
      const value = normalizeNumber(payload[field]);
      if (value !== null) {
        answers[field] = value;
      }
      continue;
    }

    if (field === 'eventDate') {
      const value = normalizeDate(payload[field]);
      if (value) {
        answers[field] = value.toISOString();
      }
      continue;
    }

    const value = normalizeString(payload[field], 600);
    if (value) {
      answers[field] = value;
    }
  }

  return answers;
}

function validateCreatePayload(payload) {
  if (!payload.fullName) {
    return 'Full name is required';
  }

  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return 'A valid email is required';
  }

  if (!payload.mainGoal) {
    return 'Main goal is required';
  }

  if (!Number.isFinite(payload.age)) {
    return 'Age is required';
  }

  if (!Number.isFinite(payload.heightCm) || payload.heightCm <= 0) {
    return 'Height is required';
  }

  if (!Number.isFinite(payload.currentWeightKg) || payload.currentWeightKg <= 0) {
    return 'Current weight is required';
  }

  if (!Number.isFinite(payload.goalWeightKg) || payload.goalWeightKg <= 0) {
    return 'Goal weight is required';
  }

  return null;
}

function normalizeCreatePayload(body) {
  const fullName = normalizeString(body.fullName, 120);
  const email = normalizeString(body.email, 160).toLowerCase();
  const age = normalizeNumber(body.age);
  const heightCm = normalizeNumber(body.heightCm);
  const currentWeightKg = normalizeNumber(body.currentWeightKg);
  const goalWeightKg = normalizeNumber(body.goalWeightKg);
  const mainGoal = normalizeString(body.mainGoal, 160);
  const workoutLocation = normalizeString(body.workoutLocation, 160);
  const importantEvent = normalizeString(body.importantEvent, 160);
  const eventDate = normalizeDate(body.eventDate);
  const answers = buildAnswers(body);

  return {
    fullName,
    email,
    age,
    ageRange: normalizeString(body.ageRange, 50) || deriveAgeRange(age),
    mainGoal,
    workoutLocation,
    heightCm,
    currentWeightKg,
    goalWeightKg,
    importantEvent,
    eventDate,
    answers
  };
}

function normalizeUpdatePayload(body) {
  const out = {};
  const status = normalizeString(body.status, 50);

  if (status) {
    out.status = status;
  }

  if (body.adminNotes !== undefined) {
    out.adminNotes = normalizeString(body.adminNotes, 4000);
  }

  return out;
}

function validateUpdatePayload(payload) {
  if (payload.status && !['new', 'reviewing', 'replied'].includes(payload.status)) {
    return 'Invalid status';
  }

  return null;
}

export async function createWorkoutPlanRequest(req, res) {
  const payload = normalizeCreatePayload(req.body);
  const validationError = validateCreatePayload(payload);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const item = await WorkoutPlanRequest.create({
    ...payload,
    emailStatus: 'pending'
  });

  try {
    const emailResult = await sendWorkoutPlanRequestEmail(item);
    item.emailStatus = emailResult.emailStatus;
    item.emailError = emailResult.emailError || '';
    await item.save();
  } catch (error) {
    item.emailStatus = 'failed';
    item.emailError = error?.message || 'Failed to send notification email';
    await item.save();
  }

  return res.status(201).json({
    item,
    message: 'Workout plan request submitted successfully.'
  });
}

export async function listWorkoutPlanRequests(req, res) {
  const { status, q } = req.query;
  const query = {};

  if (status) {
    query.status = status;
  }

  if (q) {
    query.$or = [
      { fullName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { mainGoal: { $regex: q, $options: 'i' } }
    ];
  }

  const items = await WorkoutPlanRequest.find(query).sort({ createdAt: -1 });
  return res.status(200).json({ items });
}

export async function updateWorkoutPlanRequest(req, res) {
  const payload = normalizeUpdatePayload(req.body);
  const validationError = validateUpdatePayload(payload);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const item = await WorkoutPlanRequest.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  if (!item) {
    return res.status(404).json({ message: 'Workout plan request not found' });
  }

  return res.status(200).json({ item });
}
