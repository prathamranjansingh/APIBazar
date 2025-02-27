import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';


const userSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(3, 'Name must be at least 3 characters long'),
});

const profileSchema = z.object({
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
});


const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.format() });
  }
  next();
};


export const validateUserRegistration = validate(userSchema);
export const validateProfileUpdate = validate(profileSchema);
