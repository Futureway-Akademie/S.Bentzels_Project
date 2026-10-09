import { useTranslation } from 'react-i18next'
import type { PublicStatus } from '../../lib/eventCalendar'

/** Status als ruhiges Textetikett. Ohne Status erscheint nichts. */
export default function EventStatus({
  status,
}: {
  status: PublicStatus | null
}) {
  const { t } = useTranslation()
  if (!status) return null
  return <span className="label">{t(`events.status.${status}`)}</span>
}
