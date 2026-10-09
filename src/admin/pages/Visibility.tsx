import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckField } from '../components/FormField'
import {
  flagValues,
  VISIBILITY_GROUPS,
  withFlag,
  type SettingKey,
  type StoredFlags,
} from '../lib/visibility'
import {
  loadVisibility,
  saveVisibility,
  type SettingsData,
} from '../lib/visibilityData'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

export default function Visibility() {
  const { t } = useTranslation()
  const { notify } = useToast()
  const { state, reload } = useLoad(loadVisibility)

  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [synced, setSynced] = useState<unknown>(null)
  if (state.status === 'ready' && synced !== state.data) {
    setSynced(state.data)
    setSettings(state.data)
  }
  const [busy, setBusy] = useState<string | null>(null)

  const toggle = async (setting: SettingKey, key: string, value: boolean) => {
    if (!settings) return
    const previous: StoredFlags = settings[setting]
    const next = withFlag(previous, key, value)
    setSettings({ ...settings, [setting]: next })
    setBusy(`${setting}.${key}`)
    try {
      await saveVisibility(setting, next)
      notify(
        t(
          value
            ? 'admin.visibility.toast.shown'
            : 'admin.visibility.toast.hidden',
        ),
      )
    } catch {
      // Zurück auf den alten Stand, damit die Anzeige nie vom Gespeicherten abweicht
      setSettings((current) =>
        current ? { ...current, [setting]: previous } : current,
      )
      notify(t('admin.visibility.toast.failed'), 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {t('admin.visibility.title')}
      </h1>
      <p className="mt-6 max-w-prose text-muted">
        {t('admin.visibility.intro')}
      </p>

      {state.status === 'loading' && (
        <p className="label mt-10" role="status">
          {t('admin.loading')}
        </p>
      )}
      {state.status === 'error' && (
        <div className="mt-10" role="alert">
          <p>{t('admin.loadError')}</p>
          <p className="mt-2 text-sm text-muted">{state.message}</p>
          <p className="mt-4">
            <button type="button" className="btn" onClick={reload}>
              {t('admin.retry')}
            </button>
          </p>
        </div>
      )}

      {settings &&
        VISIBILITY_GROUPS.map((group) => {
          const values = flagValues(settings[group.setting], group)
          return (
            <fieldset
              key={group.id}
              className="m-0 mt-12 max-w-2xl border-0 border-t border-line p-0 pt-6"
              data-visibility-group={group.id}
            >
              <legend className="label p-0">
                {t(`admin.visibility.groups.${group.id}.title`)}
              </legend>
              <p className="mt-3 text-sm text-muted">
                {t(`admin.visibility.groups.${group.id}.hint`)}
              </p>
              <div className="mt-4 space-y-2">
                {group.flags.map((flag) => (
                  <div
                    key={flag.key}
                    data-flag={`${group.id}.${flag.key}`}
                    aria-busy={busy === `${group.setting}.${flag.key}`}
                  >
                    <CheckField
                      id={`vis-${group.id}-${flag.key}`}
                      label={t(
                        `admin.visibility.flags.${group.id}.${flag.key}.label`,
                      )}
                      checked={values[flag.key]}
                      hint={t(
                        `admin.visibility.flags.${group.id}.${flag.key}.hint`,
                      )}
                      onChange={(checked) =>
                        void toggle(group.setting, flag.key, checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          )
        })}
    </main>
  )
}
