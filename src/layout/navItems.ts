import { routes } from '../config/routes'

export type NavChild = { labelKey: string; to: string }
export type NavItem = { labelKey: string; to?: string; children?: NavChild[] }

export const navItems: NavItem[] = [
  {
    labelKey: 'nav.art',
    children: [
      { labelKey: 'nav.artist', to: routes.artist },
      { labelKey: 'nav.gallery', to: routes.gallery },
    ],
  },
  {
    labelKey: 'nav.seminars',
    to: routes.seminars,
    children: [
      { labelKey: 'nav.artOfBecoming', to: routes.artOfBecoming },
      { labelKey: 'nav.courses', to: routes.courses },
      { labelKey: 'nav.talks', to: routes.talks },
    ],
  },
  { labelKey: 'nav.calendar', to: routes.events },
  {
    labelKey: 'nav.network',
    to: routes.network,
    children: [
      { labelKey: 'nav.events', to: routes.network },
      { labelKey: 'circle.name', to: routes.circle },
    ],
  },
  { labelKey: 'nav.journal', to: routes.journal },
  {
    labelKey: 'nav.press',
    to: routes.press,
    children: [
      { labelKey: 'nav.pressArchive', to: routes.press },
      { labelKey: 'nav.curated', to: routes.curated },
    ],
  },
  { labelKey: 'nav.contact', to: routes.contact },
]
