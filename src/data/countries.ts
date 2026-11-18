import type { CountryHistory } from './types'
import { bce, wp } from './sources'

// Chronological histories of modern countries. `kind` distinguishes
// archaeological civilizations, cultural periods, political entities,
// colonial rule and the modern sovereign state.

export const COUNTRIES: CountryHistory[] = [
  {
    id: 'india', name: 'India', aliases: ['bharat', 'hindustan', 'indian'], modernName: 'Republic of India', bbox: [68, 6, 97.5, 35.5],
    periods: [
      { label: 'Indus Valley Civilization', start: bce(3300), end: bce(1300), circa: true, kind: 'archaeological', civId: 'indus', text: 'Bronze Age cities such as Harappa, Mohenjo-daro, Dholavira and Lothal; mostly in present-day Pakistan and north-west India.' },
      { label: 'Vedic period', start: bce(1500), end: bce(500), circa: true, kind: 'cultural', civId: 'vedic', text: 'Composition of the Vedas in northern India; known mainly from texts.' },
      { label: 'Mahajanapadas & Magadha', start: bce(600), end: bce(322), circa: true, kind: 'political', civId: 'magadha', text: 'Sixteen great realms of the Ganges plain; Magadha becomes dominant. Lifetime of the Buddha and Mahavira.' },
      { label: 'Maurya Empire', start: bce(322), end: bce(185), circa: true, kind: 'political', civId: 'maurya', text: 'First empire covering most of the subcontinent; Ashoka\'s edicts.' },
      { label: 'Sangam age & early Tamil kingdoms', start: bce(300), end: 300, circa: true, kind: 'cultural', civId: 'chola', text: 'Chera, Chola and Pandya kingdoms in the far south, known from Sangam poetry.' },
      { label: 'Kushan & Satavahana era', start: 30, end: 375, circa: true, kind: 'political', civId: 'kushan', text: 'Kushans in the north-west and north, Satavahanas in the Deccan.' },
      { label: 'Gupta Empire', start: 320, end: 550, circa: true, kind: 'political', civId: 'gupta', text: 'Sanskrit literature and science flourish.' },
      { label: 'Early medieval kingdoms', start: 550, end: 1206, circa: true, kind: 'political', text: 'Regional powers including the Pallavas, Chalukyas, Rashtrakutas, Palas and Rajput dynasties.' },
      { label: 'Chola Empire (imperial phase)', start: 848, end: 1279, kind: 'political', civId: 'chola', text: 'Maritime empire of South India and Sri Lanka.' },
      { label: 'Delhi Sultanate', start: 1206, end: 1526, kind: 'political', civId: 'delhi', text: 'Five dynasties rule from Delhi.' },
      { label: 'Vijayanagara Empire', start: 1336, end: 1646, kind: 'political', civId: 'vijayanagara', text: 'Dominant power of South India.' },
      { label: 'Mughal Empire', start: 1526, end: 1857, kind: 'political', civId: 'mughal', text: 'From Babur (1526) to Bahadur Shah II (1857).' },
      { label: 'Maratha Confederacy', start: 1674, end: 1818, kind: 'political', civId: 'maratha', text: 'Expanded across much of India in the 18th century.' },
      { label: 'East India Company rule', start: 1757, end: 1858, kind: 'colonial', civId: 'british-empire', text: 'From Plassey (1757) the Company expands its territory.' },
      { label: 'British Raj', start: 1858, end: 1947, kind: 'colonial', civId: 'british-raj', text: 'Crown rule with hundreds of princely states.' },
      { label: 'Independence & Partition', start: 1947, end: 1947, kind: 'modern', civId: 'india', text: 'Independence on 15 August 1947; partition creates India and Pakistan.' },
      { label: 'Republic of India', start: 1950, end: 2026, kind: 'modern', civId: 'india', text: 'Republic from 26 January 1950; states reorganised on linguistic lines in 1956 and later.' },
    ],
    sources: [wp('History_of_India')],
  },
  {
    id: 'egypt', name: 'Egypt', aliases: ['misr', 'egyptian'], modernName: 'Arab Republic of Egypt', bbox: [24.7, 22, 36.9, 31.7],
    periods: [
      { label: 'Pharaonic Egypt', start: bce(3100), end: bce(332), circa: true, kind: 'political', civId: 'egypt', text: 'Old, Middle and New Kingdoms and the Late Period.' },
      { label: 'Ptolemaic Kingdom', start: bce(305), end: bce(30), kind: 'political', civId: 'egypt', text: 'Macedonian Greek dynasty founded after Alexander.' },
      { label: 'Roman & Byzantine Egypt', start: bce(30), end: 641, kind: 'political', civId: 'rome', text: 'Province of Rome, then the Eastern Roman Empire.' },
      { label: 'Early caliphates', start: 641, end: 969, kind: 'political', civId: 'abbasid', text: 'Rashidun, Umayyad and Abbasid rule; founding of Fustat.' },
      { label: 'Fatimid, Ayyubid and Mamluk Cairo', start: 969, end: 1517, kind: 'political', text: 'Cairo founded (969) and becomes a capital of the Islamic world.' },
      { label: 'Ottoman Egypt', start: 1517, end: 1867, kind: 'political', civId: 'ottoman', text: 'An Ottoman province; Muhammad Ali gains autonomy after 1805.' },
      { label: 'Khedivate & British occupation', start: 1867, end: 1922, kind: 'colonial', civId: 'british-empire', text: 'British occupation from 1882; protectorate 1914–1922.' },
      { label: 'Kingdom and Republic of Egypt', start: 1922, end: 2026, kind: 'modern', text: 'Independence 1922; republic from 1953.' },
    ],
    sources: [wp('History_of_Egypt')],
  },
  {
    id: 'china', name: 'China', aliases: ['zhongguo', 'chinese', 'prc'], modernName: "People's Republic of China", bbox: [73, 18, 135, 53.5],
    periods: [
      { label: 'Shang dynasty', start: bce(1600), end: bce(1046), circa: true, kind: 'political', civId: 'shang', text: 'Earliest dynasty with contemporary writing.' },
      { label: 'Zhou dynasty', start: bce(1046), end: bce(256), circa: true, kind: 'political', civId: 'zhou', text: 'Including the Spring and Autumn and Warring States periods.' },
      { label: 'Qin and Han', start: bce(221), end: 220, kind: 'political', civId: 'han', text: 'Unification (221 BCE) and the Han dynasty.' },
      { label: 'Period of division', start: 220, end: 589, kind: 'political', text: 'Three Kingdoms, Jin and Northern and Southern dynasties.' },
      { label: 'Sui and Tang', start: 581, end: 907, kind: 'political', civId: 'tang', text: 'Reunification and a cosmopolitan Tang empire.' },
      { label: 'Song dynasty', start: 960, end: 1279, kind: 'political', civId: 'song', text: 'Northern and Southern Song alongside the Liao, Xia and Jin.' },
      { label: 'Yuan (Mongol) dynasty', start: 1271, end: 1368, kind: 'political', civId: 'mongol', text: 'Kublai Khan\'s dynasty.' },
      { label: 'Ming dynasty', start: 1368, end: 1644, kind: 'political', civId: 'ming', text: 'Capital at Nanjing, then Beijing.' },
      { label: 'Qing dynasty', start: 1636, end: 1912, kind: 'political', civId: 'qing', text: 'The last imperial dynasty.' },
      { label: 'Republic of China', start: 1912, end: 1949, kind: 'modern', text: 'Warlord era, Nationalist government and war with Japan.' },
      { label: "People's Republic of China", start: 1949, end: 2026, kind: 'modern', text: 'Founded 1 October 1949.' },
    ],
    sources: [wp('History_of_China')],
  },
  {
    id: 'italy', name: 'Italy', aliases: ['italia', 'italian'], modernName: 'Italian Republic', bbox: [6.6, 36.6, 18.5, 47.1],
    periods: [
      { label: 'Etruscans, Italic peoples & Greek colonies', start: bce(800), end: bce(264), circa: true, kind: 'cultural', text: 'Etruscan cities, Samnites, Latins and Magna Graecia.' },
      { label: 'Roman Republic', start: bce(509), end: bce(27), kind: 'political', civId: 'roman-republic', text: 'Rome conquers the peninsula by 264 BCE.' },
      { label: 'Roman Empire', start: bce(27), end: 476, kind: 'political', civId: 'rome', text: 'Italy at the heart of the empire.' },
      { label: 'Ostrogoths, Byzantines & Lombards', start: 476, end: 774, kind: 'political', civId: 'byzantine', text: 'Successor kingdoms and Byzantine reconquest.' },
      { label: 'Holy Roman Empire, Papal States & city-states', start: 774, end: 1796, kind: 'political', civId: 'holy-roman', text: 'Communes, maritime republics such as Venice and Genoa, and the Papal States.' },
      { label: 'Napoleonic era & Restoration', start: 1796, end: 1861, kind: 'political', text: 'French rule, then restored states.' },
      { label: 'Kingdom of Italy', start: 1861, end: 1946, kind: 'modern', text: 'Unification (Risorgimento); Rome becomes capital in 1871.' },
      { label: 'Italian Republic', start: 1946, end: 2026, kind: 'modern', text: 'Republic by referendum in 1946.' },
    ],
    sources: [wp('History_of_Italy')],
  },
  {
    id: 'germany', name: 'Germany', aliases: ['deutschland', 'german', 'germania'], modernName: 'Federal Republic of Germany', bbox: [5.9, 47.3, 15.0, 55.0],
    periods: [
      { label: 'Germanic peoples', start: bce(500), end: 500, circa: true, kind: 'cultural', text: 'Tribes beyond the Roman frontier (Germania).' },
      { label: 'Frankish kingdoms', start: 481, end: 843, kind: 'political', civId: 'carolingian', text: 'Merovingian and Carolingian Franks.' },
      { label: 'Holy Roman Empire', start: 962, end: 1806, kind: 'political', civId: 'holy-roman', text: 'Hundreds of principalities, bishoprics and free cities under the emperor.' },
      { label: 'German Confederation & Prussia', start: 1815, end: 1871, kind: 'political', text: 'Loose confederation dominated by Austria and Prussia.' },
      { label: 'German Empire', start: 1871, end: 1918, kind: 'modern', text: 'Unified under Prussia in 1871.' },
      { label: 'Weimar Republic & Nazi Germany', start: 1918, end: 1945, kind: 'modern', text: 'Territorial losses after 1919; expansion and defeat in WWII.' },
      { label: 'Allied occupation; East & West Germany', start: 1945, end: 1990, kind: 'modern', text: 'Four occupation zones (1945), then the FRG and GDR (1949).' },
      { label: 'Reunified Germany', start: 1990, end: 2026, kind: 'modern', text: 'Reunification on 3 October 1990.' },
    ],
    sources: [wp('History_of_Germany')],
  },
  {
    id: 'uk', name: 'United Kingdom', aliases: ['britain', 'great britain', 'england', 'uk', 'british'], modernName: 'United Kingdom of Great Britain and Northern Ireland', bbox: [-8.7, 49.9, 1.8, 59.4],
    periods: [
      { label: 'Prehistoric & Celtic Britain', start: bce(3000), end: 43, circa: true, kind: 'cultural', text: 'Stonehenge (c. 3000–2000 BCE) and Iron Age Celtic peoples.' },
      { label: 'Roman Britain', start: 43, end: 410, kind: 'political', civId: 'rome', text: 'Province of Britannia.' },
      { label: 'Anglo-Saxon kingdoms', start: 410, end: 1066, circa: true, kind: 'political', text: 'Kingdoms unified as England in the 10th century.' },
      { label: 'Norman and medieval England', start: 1066, end: 1603, kind: 'political', text: 'Separate kingdoms of England and Scotland.' },
      { label: 'Union of the Crowns & Great Britain', start: 1603, end: 1801, kind: 'political', civId: 'british-empire', text: 'Kingdom of Great Britain from 1707.' },
      { label: 'United Kingdom & British Empire', start: 1801, end: 1997, kind: 'colonial', civId: 'british-empire', text: 'Union with Ireland (1801); partition of Ireland (1921).' },
      { label: 'United Kingdom today', start: 1997, end: 2026, kind: 'modern', text: 'Devolution to Scotland, Wales and Northern Ireland (1998–99).' },
    ],
    sources: [wp('History_of_the_United_Kingdom')],
  },
  {
    id: 'turkey', name: 'Turkey', aliases: ['türkiye', 'turkiye', 'anatolia', 'turkish'], modernName: 'Republic of Türkiye', bbox: [25.7, 35.8, 44.8, 42.1],
    periods: [
      { label: 'Hittite Empire', start: bce(1650), end: bce(1180), circa: true, kind: 'political', civId: 'hittite', text: 'Bronze Age Anatolian power.' },
      { label: 'Achaemenid & Hellenistic Anatolia', start: bce(547), end: bce(133), kind: 'political', civId: 'achaemenid', text: 'Persian satrapies, then Alexander and his successors.' },
      { label: 'Roman & Byzantine Anatolia', start: bce(133), end: 1071, kind: 'political', civId: 'byzantine', text: 'Core of the Eastern Roman Empire.' },
      { label: 'Seljuk Turks', start: 1071, end: 1308, kind: 'political', text: 'Sultanate of Rum after the Battle of Manzikert.' },
      { label: 'Ottoman Empire', start: 1299, end: 1922, kind: 'political', civId: 'ottoman', text: 'Capital at Istanbul from 1453.' },
      { label: 'Republic of Turkey', start: 1923, end: 2026, kind: 'modern', text: 'Proclaimed 29 October 1923.' },
    ],
    sources: [wp('History_of_Turkey')],
  },
  {
    id: 'mexico', name: 'Mexico', aliases: ['méxico', 'mexican'], modernName: 'United Mexican States', bbox: [-117, 14.5, -86.7, 32.7],
    periods: [
      { label: 'Olmec', start: bce(1500), end: bce(400), circa: true, kind: 'archaeological', text: 'Gulf Coast culture known for colossal heads.' },
      { label: 'Teotihuacan', start: bce(100), end: 550, circa: true, kind: 'archaeological', civId: 'teotihuacan', text: 'Great city of the Valley of Mexico.' },
      { label: 'Maya city-states', start: 250, end: 1697, circa: true, kind: 'cultural', civId: 'maya', text: 'Classic and Postclassic Maya in the south-east.' },
      { label: 'Aztec Empire', start: 1428, end: 1521, kind: 'political', civId: 'aztec', text: 'Triple Alliance centred on Tenochtitlan.' },
      { label: 'New Spain', start: 1521, end: 1821, kind: 'colonial', civId: 'spanish-empire', text: 'Spanish viceroyalty.' },
      { label: 'Independent Mexico', start: 1821, end: 2026, kind: 'modern', text: 'Independence 1821; large territorial losses to the US in 1848.' },
    ],
    sources: [wp('History_of_Mexico')],
  },
  {
    id: 'iran', name: 'Iran', aliases: ['persia', 'persian', 'iranian'], modernName: 'Islamic Republic of Iran', bbox: [44, 25, 63.3, 39.8],
    periods: [
      { label: 'Elam', start: bce(3200), end: bce(539), circa: true, kind: 'political', text: 'Ancient kingdom of south-western Iran.' },
      { label: 'Achaemenid Empire', start: bce(550), end: bce(330), kind: 'political', civId: 'achaemenid', text: 'First Persian Empire.' },
      { label: 'Seleucid & Parthian', start: bce(312), end: 224, kind: 'political', civId: 'parthia', text: 'Hellenistic Seleucids, then the Arsacid Parthians.' },
      { label: 'Sasanian Empire', start: 224, end: 651, kind: 'political', civId: 'sasanian', text: 'Last pre-Islamic Persian empire.' },
      { label: 'Caliphates & Persian dynasties', start: 651, end: 1501, kind: 'political', civId: 'abbasid', text: 'Umayyad and Abbasid rule, then Samanids, Buyids, Seljuks, Ilkhanate and Timurids.' },
      { label: 'Safavid Empire', start: 1501, end: 1736, kind: 'political', civId: 'safavid', text: 'Twelver Shi\'ism becomes the state religion.' },
      { label: 'Afsharid, Zand and Qajar Persia', start: 1736, end: 1925, kind: 'political', text: 'Capital moves to Tehran under the Qajars.' },
      { label: 'Pahlavi Iran & Islamic Republic', start: 1925, end: 2026, kind: 'modern', text: 'Name "Iran" adopted internationally in 1935; revolution in 1979.' },
    ],
    sources: [wp('History_of_Iran')],
  },
]

export const COUNTRY_BY_ID = new Map(COUNTRIES.map((c) => [c.id, c]))

export const KIND_LABEL: Record<string, string> = {
  archaeological: 'Archaeological civilization',
  cultural: 'Cultural period',
  political: 'Political entity',
  colonial: 'Colonial rule',
  modern: 'Modern sovereign state',
}
