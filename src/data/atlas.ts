import type { Site, TradeRoute } from './types'
import { bce, wp } from './sources'

// Ancient settlements and archaeological sites. Periods are approximate occupation ranges.
export const SITES: Site[] = [
  { id: 'uruk', name: 'Uruk', lat: 31.32, lon: 45.64, start: bce(4000), end: 700, culture: 'Sumer / Mesopotamia', note: 'One of the earliest cities; early cuneiform.', source: wp('Uruk') },
  { id: 'ur', name: 'Ur', lat: 30.96, lon: 46.1, start: bce(3800), end: bce(500), culture: 'Sumer', note: 'Royal Cemetery and the Great Ziggurat.', source: wp('Ur') },
  { id: 'memphis', name: 'Memphis', lat: 29.85, lon: 31.25, start: bce(3100), end: 641, culture: 'Ancient Egypt', note: 'Capital of the Old Kingdom.', source: wp('Memphis,_Egypt') },
  { id: 'giza', name: 'Giza pyramids', lat: 29.98, lon: 31.13, start: bce(2600), end: 2026, culture: 'Ancient Egypt', note: 'Built in the 26th century BCE.', source: wp('Giza_pyramid_complex') },
  { id: 'thebes', name: 'Thebes (Luxor)', lat: 25.7, lon: 32.64, start: bce(3200), end: 2026, culture: 'Ancient Egypt', note: 'New Kingdom capital; Karnak and Luxor temples.', source: wp('Thebes,_Egypt') },
  { id: 'mohenjo', name: 'Mohenjo-daro', lat: 27.33, lon: 68.14, start: bce(2500), end: bce(1900), culture: 'Indus Valley', note: 'Planned city with the Great Bath.', source: wp('Mohenjo-daro') },
  { id: 'harappa', name: 'Harappa', lat: 30.63, lon: 72.86, start: bce(3300), end: bce(1300), culture: 'Indus Valley', note: 'Type site of the Harappan civilization.', source: wp('Harappa') },
  { id: 'dholavira', name: 'Dholavira', lat: 23.89, lon: 70.21, start: bce(3000), end: bce(1500), culture: 'Indus Valley', note: 'Water reservoirs; UNESCO site.', source: wp('Dholavira') },
  { id: 'lothal', name: 'Lothal', lat: 22.52, lon: 72.25, start: bce(2400), end: bce(1900), culture: 'Indus Valley', note: 'Possible dockyard.', source: wp('Lothal') },
  { id: 'knossos', name: 'Knossos', lat: 35.3, lon: 25.16, start: bce(1900), end: bce(1100), culture: 'Minoan', note: 'Largest Minoan palace (occupied far earlier as a Neolithic site).', source: wp('Knossos') },
  { id: 'mycenae', name: 'Mycenae', lat: 37.73, lon: 22.76, start: bce(1600), end: bce(1100), culture: 'Mycenaean Greece', note: 'Lion Gate and shaft graves.', source: wp('Mycenae') },
  { id: 'troy', name: 'Troy (Hisarlik)', lat: 39.96, lon: 26.24, start: bce(3000), end: 500, culture: 'Anatolia', note: 'Layered city with nine main levels.', source: wp('Troy') },
  { id: 'hattusa', name: 'Hattusa', lat: 40.02, lon: 34.62, start: bce(1650), end: bce(1180), culture: 'Hittite', note: 'Hittite capital.', source: wp('Hattusa') },
  { id: 'babylon', name: 'Babylon', lat: 32.54, lon: 44.42, start: bce(2300), end: 141, culture: 'Babylonia', note: 'Ishtar Gate (Neo-Babylonian).', source: wp('Babylon') },
  { id: 'nineveh', name: 'Nineveh', lat: 36.36, lon: 43.15, start: bce(3000), end: bce(612), culture: 'Assyria', note: 'Library of Ashurbanipal.', source: wp('Nineveh') },
  { id: 'caral', name: 'Caral', lat: -10.89, lon: -77.52, start: bce(2600), end: bce(2000), culture: 'Norte Chico', note: 'Among the oldest cities in the Americas.', source: wp('Caral') },
  { id: 'anyang', name: 'Yinxu (Anyang)', lat: 36.13, lon: 114.31, start: bce(1300), end: bce(1046), culture: 'Shang dynasty', note: 'Oracle bones found here.', source: wp('Yinxu') },
  { id: 'persepolis', name: 'Persepolis', lat: 29.93, lon: 52.89, start: bce(518), end: bce(330), culture: 'Achaemenid Persia', note: 'Ceremonial capital burned by Alexander.', source: wp('Persepolis') },
  { id: 'athens', name: 'Athens', lat: 37.97, lon: 23.73, start: bce(3000), end: 2026, culture: 'Greece', note: 'Acropolis; classical democracy.', source: wp('Athens') },
  { id: 'pataliputra', name: 'Pataliputra', lat: 25.61, lon: 85.14, start: bce(490), end: 2026, culture: 'Magadha / Maurya / Gupta', note: 'Modern Patna.', source: wp('Pataliputra') },
  { id: 'taxila', name: 'Taxila', lat: 33.75, lon: 72.82, start: bce(1000), end: 500, culture: 'Gandhara', note: 'Centre of learning on routes into India.', source: wp('Taxila') },
  { id: 'carthage-site', name: 'Carthage', lat: 36.85, lon: 10.32, start: bce(814), end: 698, culture: 'Punic / Roman', note: 'Rebuilt as a Roman city after 146 BCE.', source: wp('Carthage') },
  { id: 'petra', name: 'Petra', lat: 30.33, lon: 35.44, start: bce(312), end: 663, culture: 'Nabataean', note: 'Rock-cut caravan city.', source: wp('Petra') },
  { id: 'meroe', name: 'Meroë', lat: 16.94, lon: 33.75, start: bce(800), end: 350, culture: 'Kingdom of Kush', note: 'Royal pyramids.', source: wp('Mero%C3%AB') },
  { id: 'teotihuacan-site', name: 'Teotihuacan', lat: 19.69, lon: -98.84, start: bce(100), end: 550, culture: 'Teotihuacan', note: 'Pyramids of the Sun and Moon.', source: wp('Teotihuacan') },
  { id: 'tikal', name: 'Tikal', lat: 17.22, lon: -89.62, start: bce(400), end: 900, culture: 'Maya', note: 'Major Classic Maya city.', source: wp('Tikal') },
  { id: 'mamallapuram', name: 'Mamallapuram', lat: 12.62, lon: 80.19, start: 600, end: 2026, culture: 'Pallava', note: 'Shore Temple and rock-cut monuments.', source: wp('Mamallapuram') },
  { id: 'aksum-site', name: 'Aksum', lat: 14.13, lon: 38.72, start: 100, end: 2026, culture: 'Aksumite', note: 'Monumental stelae.', source: wp('Axum') },
  { id: 'chichen', name: 'Chichen Itza', lat: 20.68, lon: -88.57, start: 600, end: 1200, culture: 'Maya', note: 'El Castillo pyramid.', source: wp('Chichen_Itza') },
  { id: 'angkor', name: 'Angkor', lat: 13.41, lon: 103.87, start: 802, end: 1431, culture: 'Khmer', note: 'Angkor Wat and Angkor Thom.', source: wp('Angkor') },
  { id: 'cahokia', name: 'Cahokia', lat: 38.66, lon: -90.06, start: 1050, end: 1350, culture: 'Mississippian', note: 'Monks Mound.', source: wp('Cahokia') },
  { id: 'great-zimbabwe', name: 'Great Zimbabwe', lat: -20.27, lon: 30.93, start: 1100, end: 1450, culture: 'Kingdom of Zimbabwe', note: 'Dry-stone enclosures.', source: wp('Great_Zimbabwe') },
  { id: 'hampi', name: 'Hampi (Vijayanagara)', lat: 15.33, lon: 76.46, start: 1336, end: 1565, culture: 'Vijayanagara', note: 'Ruins of the imperial capital.', source: wp('Hampi') },
  { id: 'machu-picchu', name: 'Machu Picchu', lat: -13.16, lon: -72.55, start: 1450, end: 1572, culture: 'Inca', note: 'Royal estate of Pachacuti.', source: wp('Machu_Picchu') },
  { id: 'timbuktu', name: 'Timbuktu', lat: 16.77, lon: -3.01, start: 1100, end: 2026, culture: 'Mali / Songhai', note: 'Manuscript libraries and Djinguereber Mosque.', source: wp('Timbuktu') },
]

// Schematic trade routes: lines connect documented hubs and are not surveyed paths.
export const TRADE_ROUTES: TradeRoute[] = [
  {
    id: 'incense', name: 'Incense Route', start: bce(700), end: 200, color: '#b5833f',
    coords: [[47.5, 14.5], [45.3, 15.4], [42.5, 19.5], [39.6, 24.5], [36.6, 28.4], [35.44, 30.33], [34.45, 31.5]],
    note: 'Frankincense and myrrh carried from southern Arabia to the Mediterranean through Nabataean Petra.', source: wp('Incense_trade_route'),
  },
  {
    id: 'silk-road', name: 'Silk Road (overland)', start: bce(130), end: 1453, color: '#a8433a',
    coords: [[108.9, 34.27], [103.8, 36.06], [94.66, 40.14], [87.6, 43.8], [75.99, 39.47], [66.96, 39.65], [62.19, 37.66], [51.4, 35.7], [44.58, 33.09], [36.2, 36.2], [28.98, 41.01]],
    note: "Network of caravan routes linking Han and later Chinese states with Central Asia, Persia and the Mediterranean. Line follows major hubs: Chang'an, Dunhuang, Kashgar, Samarkand, Merv, Ctesiphon, Antioch, Constantinople.", source: wp('Silk_Road'),
  },
  {
    id: 'maritime-silk', name: 'Indian Ocean maritime routes', start: bce(100), end: 1600, color: '#2f6f8f',
    coords: [[113.26, 23.13], [106.6, 10.8], [102.25, 2.19], [95.3, 5.5], [80.0, 7.3], [79.84, 11.0], [75.78, 11.25], [72.8, 19.0], [56.3, 25.0], [45.03, 12.78], [43.0, 15.0], [39.0, 21.5], [33.0, 28.5], [29.92, 31.2]],
    note: 'Monsoon-driven sea lanes connecting China, Southeast Asia, India, Arabia, East Africa and Egypt.', source: wp('Maritime_Silk_Road'),
  },
  {
    id: 'trans-saharan', name: 'Trans-Saharan trade', start: 700, end: 1600, color: '#b9853a',
    coords: [[-3.01, 16.77], [-4.0, 19.5], [-4.97, 23.3], [-4.27, 31.28], [-5.0, 34.03]],
    note: 'Camel caravans exchanging West African gold for Saharan salt and North African goods (Timbuktu – Taghaza – Sijilmasa – Fez).', source: wp('Trans-Saharan_trade'),
  },
  {
    id: 'cape-route', name: 'Portuguese Cape Route (Carreira da Índia)', start: 1498, end: 1800, color: '#5b6fa6',
    coords: [[-9.14, 38.72], [-17.0, 14.7], [-25.0, -5.0], [-10.0, -30.0], [18.42, -34.0], [35.0, -25.0], [40.7, -15.0], [39.66, -4.04], [55.0, 5.0], [73.83, 15.49], [75.78, 11.25]],
    note: 'Sea route from Lisbon around the Cape of Good Hope to Goa and Calicut, opened by Vasco da Gama.', source: wp('Portuguese_India_Armadas'),
  },
  {
    id: 'manila-galleon', name: 'Manila Galleons', start: 1565, end: 1815, color: '#c08a2f',
    coords: [[120.98, 14.6], [140.0, 33.0], [180.0, 38.0], [210.0, 37.0], [235.0, 30.0], [260.1, 16.85]],
    note: 'Annual Spanish crossings between Manila and Acapulco carrying silver west and Asian goods east.', source: wp('Manila_galleon'),
  },
  {
    id: 'atlantic', name: 'Transatlantic slave trade routes', start: 1526, end: 1867, color: '#6b5a5a',
    coords: [[-9.0, 38.7], [-17.4, 14.7], [3.4, 6.45], [13.23, -8.83], [-38.5, -12.97], [-72.34, 18.54], [-76.8, 18.0], [-79.93, 32.78]],
    note: 'Forced transport of an estimated 12.5 million enslaved Africans to the Americas. Line is schematic, joining principal embarkation and arrival regions.', source: wp('Atlantic_slave_trade'),
  },
]

// Region gazetteer used by natural-language search and the "what was here?" panel. bbox: [west, south, east, north]
export const REGIONS: { id: string; names: string[]; bbox: [number, number, number, number] }[] = [
  { id: 'india', names: ['india', 'indian subcontinent', 'south asia', 'bharat'], bbox: [66, 6, 98, 36] },
  { id: 'tamil', names: ['tamil nadu', 'south india', 'tamilakam'], bbox: [76, 8, 81, 14] },
  { id: 'europe', names: ['europe'], bbox: [-11, 35, 40, 70] },
  { id: 'egypt', names: ['egypt', 'nile'], bbox: [24, 21, 36, 32] },
  { id: 'china', names: ['china', 'east asia'], bbox: [97, 20, 125, 45] },
  { id: 'asia', names: ['asia'], bbox: [26, -10, 150, 75] },
  { id: 'africa', names: ['africa'], bbox: [-18, -35, 52, 37] },
  { id: 'americas', names: ['americas', 'america'], bbox: [-170, -56, -34, 72] },
  { id: 'north-america', names: ['north america', 'usa', 'united states', 'canada'], bbox: [-170, 15, -50, 72] },
  { id: 'south-america', names: ['south america', 'andes', 'peru'], bbox: [-82, -56, -34, 13] },
  { id: 'mesoamerica', names: ['mexico', 'mesoamerica', 'central america'], bbox: [-118, 7, -82, 32] },
  { id: 'middle-east', names: ['middle east', 'near east', 'levant', 'west asia'], bbox: [25, 12, 63, 42] },
  { id: 'mesopotamia', names: ['mesopotamia', 'iraq', 'babylon'], bbox: [38, 29, 49, 38] },
  { id: 'iran', names: ['iran', 'persia'], bbox: [44, 25, 63, 40] },
  { id: 'anatolia', names: ['turkey', 'anatolia', 'asia minor'], bbox: [26, 35.8, 45, 42.2] },
  { id: 'greece', names: ['greece', 'aegean'], bbox: [19.5, 34.5, 28.5, 41.8] },
  { id: 'italy', names: ['italy', 'italian peninsula'], bbox: [6.5, 36.5, 18.6, 47.1] },
  { id: 'germany', names: ['germany'], bbox: [5.8, 47.3, 15.1, 55.1] },
  { id: 'france', names: ['france', 'gaul'], bbox: [-5, 42.3, 8.3, 51.1] },
  { id: 'britain', names: ['britain', 'england', 'united kingdom', 'uk', 'british isles'], bbox: [-10.6, 49.9, 1.8, 58.7] },
  { id: 'spain', names: ['spain', 'iberia', 'portugal'], bbox: [-9.5, 36, 3.3, 43.8] },
  { id: 'russia', names: ['russia', 'siberia'], bbox: [27, 41, 180, 78] },
  { id: 'japan', names: ['japan'], bbox: [129, 31, 146, 45.5] },
  { id: 'southeast-asia', names: ['southeast asia', 'indochina', 'cambodia', 'vietnam', 'thailand'], bbox: [92, -10, 141, 28] },
  { id: 'central-asia', names: ['central asia', 'steppe'], bbox: [46, 35, 88, 55] },
  { id: 'arabia', names: ['arabia', 'arabian peninsula', 'saudi arabia'], bbox: [34.5, 12.5, 59.8, 32] },
  { id: 'west-africa', names: ['west africa', 'mali', 'sahel'], bbox: [-17.5, 4, 16, 25] },
  { id: 'australia', names: ['australia'], bbox: [112, -44, 154, -10] },
  { id: 'world', names: ['world', 'earth', 'globe'], bbox: [-180, -60, 180, 80] },
]

/**
 * Known conflicts between the boundary dataset and the documented record.
 * Shown on the territory panel so that dataset labels are not mistaken for fact.
 */
export const DATA_NOTES: { name: string; years: number[]; note: string }[] = [
  { name: 'Mauryan Empire', years: [bce(100)], note: 'The Maurya Empire is documented as ending c. 185 BCE; this 100 BCE snapshot still labels the area "Mauryan Empire".' },
  { name: 'Inca Empire', years: [1600], note: 'The Inca Empire fell to Spain in 1532–33 (a Neo-Inca state lasted until 1572); the 1600 label reflects the source dataset, not a living empire.' },
  { name: 'Pakistan', years: [1945], note: 'Pakistan became independent in August 1947. In 1945 the area was part of British India; this snapshot uses post-1947 borders.' },
  { name: 'Bangladesh', years: [1945], note: 'Bangladesh became independent in 1971. In 1945 the area was part of British India (Bengal Presidency).' },
  { name: 'India', years: [1945], note: 'In 1945 India was under British rule; this snapshot appears to show post-1947 borders.' },
  { name: 'Israel', years: [1938, 1945], note: 'The State of Israel was proclaimed in May 1948. Before that the area was the British Mandate of Palestine.' },
  { name: 'Teotihuacan', years: [600, 700], note: 'Teotihuacan declined after c. 550 CE; the polygon for this year is the dataset\'s, not evidence of a functioning state.' },
]

export function dataNoteFor(name: string, y: number): string | null {
  return DATA_NOTES.find((n) => n.name === name && n.years.includes(y))?.note ?? null
}
