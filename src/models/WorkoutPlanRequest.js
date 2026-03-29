import mongoose from 'mongoose';

const workoutPlanRequestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    age: { type: Number, default: null, min: 13, max: 120 },
    ageRange: { type: String, default: '' },
    mainGoal: { type: String, required: true, trim: true },
    workoutLocation: { type: String, default: '' },
    heightCm: { type: Number, default: null, min: 50, max: 300 },
    currentWeightKg: { type: Number, default: null, min: 20, max: 500 },
    goalWeightKg: { type: Number, default: null, min: 20, max: 500 },
    importantEvent: { type: String, default: '' },
    eventDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['new', 'reviewing', 'replied'],
      default: 'new'
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'skipped'],
      default: 'pending'
    },
    emailError: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const WorkoutPlanRequest = mongoose.model('WorkoutPlanRequest', workoutPlanRequestSchema);
