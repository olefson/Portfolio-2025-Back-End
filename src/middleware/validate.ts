import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('=== Validation Middleware ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request headers:', JSON.stringify(req.headers, null, 2));
      
      // Validate the request body directly
      const result = await schema.parseAsync(req.body);
      console.log('Validation successful:', JSON.stringify(result, null, 2));
      return next();
    } catch (error) {
      console.error('=== Validation Error ===');
      console.error('Error details:', error);
      if (error instanceof ZodError) {
        console.error('ZodError details:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }; 