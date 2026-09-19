import { z } from 'zod'

export const fieldWorkerPhoneSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, 'Enter an 11-digit phone number.')
