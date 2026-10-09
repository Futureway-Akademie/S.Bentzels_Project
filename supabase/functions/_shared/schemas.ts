// Gemeinsame Prüfung aller Anfrageformulare (zod). Wird im Browser UND in der Edge Function
// verwendet, damit beide Seiten dieselben Regeln haben. Nur reines TypeScript mit zod, ohne
// Abhängigkeit von Browser oder Deno (läuft auch in den Node-Tests).
import { z } from 'zod'

/** Maximale Längen, damit Eingaben begrenzt bleiben. */
export const LIMITS = {
  name: 200,
  email: 320,
  phone: 100,
  short: 200,
  message: 10000,
} as const

const clean = (max: number) => z.string().trim().max(max)
const required = (max: number = LIMITS.short) => clean(max).min(1)
/** Leere Eingaben zählen als nicht vorhanden. */
const optional = (max: number = LIMITS.short) =>
  clean(max)
    .optional()
    .transform((value) => (value ? value : undefined))

const persons = z.coerce.number().int().min(1).max(100)

// Schlüssel der Auswahl, die Texte stehen in de.json (forms.options) und in den E-Mails
export const PARTICIPANTS = ['s', 'm', 'l', 'xl'] as const
export const LOCATIONS = ['unternehmen', 'location', 'offen'] as const
export const EXPERIENCE = ['keine', 'etwas', 'viel'] as const

const base = {
  name: required(LIMITS.name),
  email: z.email().max(LIMITS.email),
  phone: optional(LIMITS.phone),
  message: optional(LIMITS.message),
  /** Zustimmung zur Datenschutzerklärung */
  consent: z.literal(true),
  /** Köderfeld gegen Programme, Menschen sehen es nicht und lassen es leer */
  website: z.string().max(500).optional(),
  /** Zeitpunkt (Millisekunden), an dem das Formular geöffnet wurde */
  startedAt: z.number().int().nonnegative(),
}

export const werkSchema = z.object({
  ...base,
  type: z.literal('werk'),
  artworkId: z.uuid(),
})

export const becomingSchema = z.object({
  ...base,
  type: z.literal('seminar'),
  company: required(),
  position: optional(),
  participants: z.enum(PARTICIPANTS).optional(),
  period: optional(),
  location: z.enum(LOCATIONS).optional(),
})

export const vortragSchema = z.object({
  ...base,
  type: z.literal('vortrag'),
  organization: required(),
  topic: optional(),
  occasion: optional(),
  date: optional(),
  guests: optional(),
})

export const kunstkursSchema = z.object({
  ...base,
  type: z.literal('kunstkurs'),
  /** Kennung eines Kurses oder „individuell“ */
  course: required(),
  persons: persons.optional(),
  experience: z.enum(EXPERIENCE).optional(),
})

export const clubSchema = z.object({
  ...base,
  type: z.literal('bentzel_club'),
  background: optional(),
  meaning: optional(LIMITS.message),
  source: optional(),
})

export const kontaktSchema = z.object({
  ...base,
  type: z.literal('kontakt'),
  subject: optional(),
  message: required(LIMITS.message),
})

export const veranstaltungSchema = z.object({
  ...base,
  type: z.literal('veranstaltung'),
  eventId: z.uuid(),
  persons: persons.optional(),
  /** Interesse bekunden statt nur Informationen anfragen */
  interest: z.boolean().optional(),
})

/** Verbindliche Anmeldung zu einer Veranstaltung (eigene Funktion, nicht Teil der Anfragen). */
export const registrationSchema = z.object({
  name: required(LIMITS.name),
  email: z.email().max(LIMITS.email),
  phone: optional(LIMITS.phone),
  company: optional(),
  /** Begleitpersonen */
  guests: z.coerce.number().int().min(0).max(3).default(0),
  consent: z.literal(true),
  website: z.string().max(500).optional(),
  startedAt: z.number().int().nonnegative(),
  type: z.literal('anmeldung'),
  eventId: z.uuid(),
})

export type Registration = z.infer<typeof registrationSchema>

export const submissionSchema = z.discriminatedUnion('type', [
  werkSchema,
  becomingSchema,
  vortragSchema,
  kunstkursSchema,
  clubSchema,
  kontaktSchema,
  veranstaltungSchema,
])

export type Submission = z.infer<typeof submissionSchema>
export type SubmissionType = Submission['type']
export const SUBMISSION_TYPES = [
  'werk',
  'seminar',
  'vortrag',
  'kunstkurs',
  'bentzel_club',
  'kontakt',
  'veranstaltung',
] as const satisfies readonly SubmissionType[]

export type FieldErrorCode =
  'required' | 'email' | 'tooLong' | 'consent' | 'number' | 'invalid'

/** Übersetzt zod-Fehler in Codes je Feld, die die Oberfläche in Texte umwandelt. */
export function fieldErrors(error: z.ZodError): Record<string, FieldErrorCode> {
  const result: Record<string, FieldErrorCode> = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form')
    if (result[field]) continue
    let code: FieldErrorCode = 'invalid'
    const isNumber = 'origin' in issue && issue.origin === 'number'
    if (isNumber && (issue.code === 'too_small' || issue.code === 'too_big'))
      code = 'number'
    else if (issue.code === 'too_small') code = 'required'
    else if (issue.code === 'too_big') code = 'tooLong'
    else if (issue.code === 'invalid_format') code = 'email'
    else if (issue.code === 'invalid_type') {
      code =
        field === 'consent'
          ? 'consent'
          : issue.input === undefined
            ? 'required'
            : 'invalid'
    } else if (issue.code === 'invalid_value' && field === 'consent')
      code = 'consent'
    if (field === 'consent') code = 'consent'
    result[field] = code
  }
  return result
}
