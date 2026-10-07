import type { VitaCategory, VitaEntry } from './types'

type Row = [year: number, category: VitaCategory, title: string, place?: string]

const rows: Row[] = [
  [2003, 'ausbildung', 'Bachelor of Fine Arts, London Institute'],
  [2003, 'ausbildung', 'Studium in München und London'],
  [
    2003,
    'ausbildung',
    'Klassische künstlerische Ausbildung bei Alexander Schwartz',
  ],

  [2019, 'messe', 'Parallel Vienna Art Fair', 'Wien'],
  [2016, 'messe', 'Parallel Vienna Art Fair', 'Wien'],
  [2014, 'messe', 'Parallel Vienna Art Fair', 'Wien'],

  [2017, 'kuratorisch', 'Gründung der Contemporary Art Gallery', 'Forchheim'],
  [2017, 'kuratorisch', 'Kuration Silvia Wawarta', 'Forchheim'],
  [2017, 'kuratorisch', 'Kuration Christina Soler', 'Forchheim'],
  [2010, 'kuratorisch', 'Kuration Philip Baben der Erde', 'München'],
  [2009, 'kuratorisch', 'Kuration Haman Alimardani', 'München'],
  [2009, 'kuratorisch', 'Kuration Sasha Schwartz', 'München'],
  [2009, 'kuratorisch', 'Gründung Sturmfeder Projects', 'München'],

  [2019, 'ausstellung', 'Galerie Gromann', 'Weßling'],
  [2018, 'ausstellung', 'Schloss Pörnbach'],
  [2018, 'ausstellung', 'Tragic Hero, Stadtwerke Erlangen'],
  [2017, 'ausstellung', 'Tragic Hero, Hearthouse München'],
  [
    2017,
    'ausstellung',
    'Gruppenausstellung Wawarta – Soler – Bentzel',
    'Forchheim',
  ],
  [2017, 'ausstellung', 'Tragic Hero, PopUp Gallery Forchheim'],
  [2016, 'ausstellung', 'Blood and Opium', 'München'],
  [2016, 'ausstellung', 'Open Studio', 'Landkreis Forchheim'],
  [2016, 'ausstellung', 'Gruppenausstellung Kreul Colors', 'Hallerndorf'],
  [2015, 'ausstellung', 'Galerie Box32, Friedrichshain', 'Berlin'],
  [
    2015,
    'ausstellung',
    'International Art Colony',
    'Počitelj, Bosnien und Herzegowina',
  ],
  [
    2015,
    'ausstellung',
    'Nationale und internationale Kunstausstellung',
    'Jägersburg',
  ],
  [2015, 'ausstellung', 'Weingut Sturmfeder, Künstleretikett'],
  [2014, 'ausstellung', 'Conzil, Galerie Weber', 'München'],
  [
    2014,
    'ausstellung',
    'Gruppenausstellung Longing, Mainzeit Carée',
    'München',
  ],
  [2014, 'ausstellung', 'WienOne, Brick 5', 'Wien'],
  [2014, 'ausstellung', 'Microturbine', 'München'],
  [2014, 'ausstellung', 'Open Studio', 'Landkreis Forchheim'],
  [2013, 'ausstellung', 'Galerie Robert Weber', 'München'],
  [2013, 'ausstellung', 'Gruppenausstellung StuttgartOne', 'Stuttgart'],
  [2013, 'ausstellung', 'Zammerhof', 'Erding'],
  [2013, 'ausstellung', 'Kao Ono, Neumarkter', 'München'],
  [
    2012,
    'ausstellung',
    'Gruppenausstellung „Bleiben ist nirgends“',
    'Jägersburg',
  ],
  [2011, 'ausstellung', 'Kunstauktion Weisser Ring', 'Nürnberg'],
  [2010, 'ausstellung', 'Artothek Forchheim'],
  [2008, 'ausstellung', 'Order of Malta, Galerie Reygers', 'München'],
  [2007, 'ausstellung', 'Gerhard Mair', 'München'],
  [2001, 'ausstellung', 'Gruppenausstellung Paint Explosion', 'London'],
  [1998, 'ausstellung', 'Gruppenausstellung Blocherer Akademie', 'München'],
  [1995, 'ausstellung', 'Schloss Thurn', 'Heroldsbach'],
  [1994, 'ausstellung', 'Gruppenausstellung Weingut Sturmfeder'],
]

export const vitaEntries: VitaEntry[] = rows.map(
  ([year, category, title, place], i) => ({
    id: `vita-${i + 1}`,
    year,
    yearEnd: null,
    category,
    titleDe: title,
    titleEn: '',
    place: place ?? null,
    sortOrder: i + 1,
    isPublished: true,
  }),
)
