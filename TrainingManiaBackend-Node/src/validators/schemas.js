import { z } from 'zod';

// Helper to safely parse stringified JSON if received in multipart form-data
const jsonOrObject = (schema) =>
  z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
    }
    return val;
  }, schema);

// Choice schema
export const choiceSchema = z.object({
  text: z.string().min(1, 'Choice text cannot be empty'),
  is_correct: z.boolean().default(false),
});

// Question schema
export const questionSchema = z.object({
  text: z.string().min(1, 'Question text cannot be empty'),
  question_type: z.enum(['mcq', 'fib', 'short_answer']).default('mcq'),
  choices: z.array(choiceSchema).optional().default([]),
});

// Test Configuration schema
export const testConfigurationSchema = z.object({
  total_questions: z.coerce.number().int().min(1).default(20),
  mcq_percentage: z.coerce.number().min(0).max(100).default(100),
  fib_percentage: z.coerce.number().min(0).max(100).default(0),
  short_answer_percentage: z.coerce.number().min(0).max(100).default(0),
  total_marks: z.coerce.number().min(1).default(100),
  passing_marks: z.coerce.number().min(1).default(40),
  duration_minutes: z.coerce.number().min(1).default(20),
  attempts_allowed: z.coerce.number().min(1).default(3),
  is_negative_marking: z.coerce.boolean().default(false),
  negative_marking_value: z.coerce.number().default(0),
  requires_verification: z.coerce.boolean().default(false),
  no_copy_paste: z.coerce.boolean().default(false),
  no_tab_switch: z.coerce.boolean().default(false),
  no_screenshot: z.coerce.boolean().default(false),
  exam_instructions: z.string().optional().default(''),
});

// Create Training Module Schema
export const createTrainingSchema = z.object({
  title: z.string().min(1, 'Training title is required').max(255),
  description: z.string().optional().default(''),
  video_type: z.enum(['youtube', 'upload']).default('youtube'),
  video_url: z.string().optional().default(''),
  test_configuration: jsonOrObject(testConfigurationSchema).optional(),
  questions: jsonOrObject(z.array(questionSchema)).optional().default([]),
});

// Submit Test Schema
export const submitTestSchema = z.object({
  candidate_id: z.coerce.number().int().positive('Candidate ID must be a positive integer'),
  training_id: z.coerce.number().int().positive('Training ID must be a positive integer'),
  results: jsonOrObject(
    z.object({
      obtainedMarks: z.coerce.number().optional(),
      score: z.coerce.number().optional(),
      isPassed: z.coerce.boolean().default(false),
      correctCount: z.coerce.number().int().min(0).default(0),
      incorrectCount: z.coerce.number().int().min(0).default(0),
      totalMarks: z.coerce.number().min(1).default(100),
    })
  ),
  user_answers: jsonOrObject(z.record(z.any())).optional().default({}),
});

// Candidate Registration Schema (single candidate or batch array)
export const candidateItemSchema = z.object({
  email: z.string().email('Invalid email address format'),
  name: z.string().optional().default(''),
});

export const candidateRegistrationSchema = z.union([
  candidateItemSchema,
  z.array(candidateItemSchema).min(1, 'Candidates array must contain at least one item'),
]);

export { validateBody as validate } from '../middlewares/validate.middleware.js';

export default {
  choiceSchema,
  questionSchema,
  testConfigurationSchema,
  createTrainingSchema,
  submitTestSchema,
  candidateRegistrationSchema,
};
