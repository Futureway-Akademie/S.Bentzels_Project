// Felder der Anfrageformulare. Beschriftungen stehen in de.json unter forms.fields.<name>,
// Auswahlwerte unter forms.options.<name>.<schlüssel>. Die Regeln selbst stehen in
// supabase/functions/_shared/schemas.ts und gelten auch auf dem Server.
export type FieldKind =
  'text' | 'email' | 'tel' | 'textarea' | 'select' | 'number'

export type FieldDef = {
  name: string
  kind: FieldKind
  required?: boolean
  /** Schlüssel der Auswahlwerte unter forms.options.<name>, sonst übergibt die Seite die Werte */
  options?: readonly string[]
  autoComplete?: string
  rows?: number
}

const name: FieldDef = {
  name: 'name',
  kind: 'text',
  required: true,
  autoComplete: 'name',
}
const email: FieldDef = {
  name: 'email',
  kind: 'email',
  required: true,
  autoComplete: 'email',
}
const phone: FieldDef = { name: 'phone', kind: 'tel', autoComplete: 'tel' }
const message: FieldDef = { name: 'message', kind: 'textarea', rows: 5 }

export const werkFields: FieldDef[] = [name, email, phone, message]

export const becomingFields: FieldDef[] = [
  name,
  {
    name: 'company',
    kind: 'text',
    required: true,
    autoComplete: 'organization',
  },
  { name: 'position', kind: 'text', autoComplete: 'organization-title' },
  email,
  phone,
  { name: 'participants', kind: 'select', options: ['s', 'm', 'l', 'xl'] },
  { name: 'period', kind: 'text' },
  {
    name: 'location',
    kind: 'select',
    options: ['unternehmen', 'location', 'offen'],
  },
  message,
]

export const vortragFields: FieldDef[] = [
  name,
  {
    name: 'organization',
    kind: 'text',
    required: true,
    autoComplete: 'organization',
  },
  email,
  phone,
  { name: 'topic', kind: 'select' },
  { name: 'occasion', kind: 'text' },
  { name: 'date', kind: 'text' },
  { name: 'guests', kind: 'text' },
  message,
]

export const kunstkursFields: FieldDef[] = [
  name,
  email,
  phone,
  { name: 'course', kind: 'select', required: true },
  { name: 'persons', kind: 'number' },
  { name: 'experience', kind: 'select', options: ['keine', 'etwas', 'viel'] },
  message,
]

export const clubFields: FieldDef[] = [
  name,
  email,
  phone,
  { name: 'background', kind: 'text' },
  { name: 'meaning', kind: 'textarea', rows: 5 },
  { name: 'source', kind: 'text' },
]

export const kontaktFields: FieldDef[] = [
  name,
  email,
  { name: 'subject', kind: 'text' },
  { name: 'message', kind: 'textarea', required: true, rows: 6 },
]

export const veranstaltungFields: FieldDef[] = [
  name,
  email,
  phone,
  { name: 'persons', kind: 'number' },
  message,
]

export const anmeldungFields: FieldDef[] = [
  name,
  email,
  phone,
  { name: 'company', kind: 'text', autoComplete: 'organization' },
  { name: 'guests', kind: 'select', options: ['0', '1', '2', '3'] },
]
