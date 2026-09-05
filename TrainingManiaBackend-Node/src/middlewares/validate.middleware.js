import { z } from 'zod';

/**
 * Reusable Express middleware factory for validating request body with Zod
 * @param {z.ZodSchema} schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const errorMessage = firstIssue
          ? `${firstIssue.path.join('.') || 'payload'}: ${firstIssue.message}`
          : 'Validation failed';

        return res.status(400).json({
          error: errorMessage,
          details: err.flatten().fieldErrors,
        });
      }
      next(err);
    }
  };
}

export default { validateBody };
