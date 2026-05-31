/**

 * Florida county codes for statewide cadastral ArcGIS queries.

 *

 * ArcGIS CO_NO = FDOR alphabetical county code + 10

 * (e.g. Broward DOR 6 → ArcGIS 16; Alachua DOR 1 → ArcGIS 11)

 *

 * @see https://floridarevenue.com/property/Documents/PTO_CountyCodes.pdf

 */

const COUNTY_BY_DOR_CO_NO = {

  1: 'ALACHUA',

  2: 'BAKER',

  3: 'BAY',

  4: 'BRADFORD',

  5: 'BREVARD',

  6: 'BROWARD',

  7: 'CALHOUN',

  8: 'CHARLOTTE',

  9: 'CITRUS',

  10: 'CLAY',

  11: 'COLLIER',

  12: 'COLUMBIA',

  13: 'DADE',

  14: 'DESOTO',

  15: 'DIXIE',

  16: 'DUVAL',

  17: 'ESCAMBIA',

  18: 'FLAGLER',

  19: 'FRANKLIN',

  20: 'GADSDEN',

  21: 'GILCHRIST',

  22: 'GLADES',

  23: 'GULF',

  24: 'HAMILTON',

  25: 'HARDEE',

  26: 'HENDRY',

  27: 'HERNANDO',

  28: 'HIGHLANDS',

  29: 'HILLSBOROUGH',

  30: 'HOLMES',

  31: 'INDIAN RIVER',

  32: 'JACKSON',

  33: 'JEFFERSON',

  34: 'LAFAYETTE',

  35: 'LAKE',

  36: 'LEE',

  37: 'LEON',

  38: 'LEVY',

  39: 'LIBERTY',

  40: 'MADISON',

  41: 'MANATEE',

  42: 'MARION',

  43: 'MARTIN',

  44: 'MONROE',

  45: 'NASSAU',

  46: 'OKALOOSA',

  47: 'OKEECHOBEE',

  48: 'ORANGE',

  49: 'OSCEOLA',

  50: 'PALM BEACH',

  51: 'PASCO',

  52: 'PINELLAS',

  53: 'POLK',

  54: 'PUTNAM',

  55: 'ST JOHNS',

  56: 'ST LUCIE',

  57: 'SANTA ROSA',

  58: 'SARASOTA',

  59: 'SEMINOLE',

  60: 'SUMTER',

  61: 'SUWANNEE',

  62: 'TAYLOR',

  63: 'UNION',

  64: 'VOLUSIA',

  65: 'WAKULLA',

  66: 'WALTON',

  67: 'WASHINGTON'

};



const ARCGIS_CO_OFFSET = 10;

const FL_ARCGIS_CO_NOS = Array.from({ length: 67 }, (_, index) => index + 1 + ARCGIS_CO_OFFSET);



const COUNTY_NAME_TO_DOR = Object.fromEntries(

  Object.entries(COUNTY_BY_DOR_CO_NO).map(([coNo, name]) => [name, Number(coNo)])

);



function dorToArcGisCoNo(dorCoNo) {

  const value = Number(dorCoNo);

  if (!Number.isFinite(value) || value < 1 || value > 67) return null;

  return value + ARCGIS_CO_OFFSET;

}



function arcGisToDorCoNo(arcGisCoNo) {

  const value = Number(arcGisCoNo);

  if (!Number.isFinite(value) || value <= ARCGIS_CO_OFFSET) return null;

  const dor = value - ARCGIS_CO_OFFSET;

  return dor >= 1 && dor <= 67 ? dor : null;

}



/** ArcGIS CO_NO keyed by normalized city name */

const ARCGIS_CITY_TO_CO_NO = {

  miami: 23,

  'miami beach': 23,

  'coral gables': 23,

  hialeah: 23,

  'north miami': 23,

  homestead: 23,

  'key biscayne': 23,

  doral: 23,

  'fort lauderdale': 16,

  hollywood: 16,

  pembroke: 16,

  'pembroke pines': 16,

  plantation: 16,

  davie: 16,

  sunrise: 16,

  'pompano beach': 16,

  'coral springs': 16,

  'deerfield beach': 16,

  miramar: 16,

  lauderhill: 16,

  tamarac: 16,

  margate: 16,

  'coconut creek': 16,

  hallandale: 16,

  'hallandale beach': 16,

  weston: 16,

  'cooper city': 16,

  'lauderdale lakes': 16,

  'oakland park': 16,

  'wilton manors': 16,

  'lighthouse point': 16,

  parkland: 16,

  'north lauderdale': 16,
  margate: 16,

  'dania beach': 16,

  'southwest ranches': 16,

  tampa: 39,

  'st petersburg': 62,

  'saint petersburg': 62,

  clearwater: 62,

  orlando: 58,

  kissimmee: 59,

  jacksonville: 26,

  tallahassee: 47,

  gainesville: 11,

  naples: 21,

  sarasota: 68,

  bradenton: 51,

  lakeland: 63,

  'daytona beach': 74,

  'palm beach': 60,

  'west palm beach': 60,

  'boca raton': 60,

  delray: 60,

  'delray beach': 60,

  'fort myers': 46,

  'cape coral': 46,

  pensacola: 27,

  ocala: 52,

  melbourne: 15,

  'port st lucie': 66,

  'st augustine': 65,

  'saint augustine': 65

};



const NEIGHBOR_ARCGIS_CO_NOS = {

  16: [23, 60, 36],

  23: [16, 44, 66],

  60: [16, 43, 59],

  39: [61, 51, 63],

  58: [59, 35, 63]

};



const CITY_TO_CO_NO = ARCGIS_CITY_TO_CO_NO;



function normalizeCity(city = '') {

  return city.trim().toLowerCase().replace(/\s+/g, ' ');

}



function normalizeCountyName(county = '') {

  return county

    .trim()

    .toUpperCase()

    .replace(/\s+COUNTY$/i, '')

    .replace(/\s+/g, ' ');

}



function toArcGisCity(city = '') {

  return city.trim().toUpperCase().replace(/\s+/g, ' ');

}



function resolveCoNo(city) {

  const normalized = normalizeCity(city);

  if (!normalized) return null;

  if (ARCGIS_CITY_TO_CO_NO[normalized]) return ARCGIS_CITY_TO_CO_NO[normalized];



  for (const [name, coNo] of Object.entries(ARCGIS_CITY_TO_CO_NO)) {

    if (normalized.includes(name) || name.includes(normalized)) {

      return coNo;

    }

  }



  return null;

}



function resolveCoNoFromCounty(countyName) {

  const normalized = normalizeCountyName(countyName);

  if (!normalized) return null;

  const dor = COUNTY_NAME_TO_DOR[normalized];

  return dor ? dorToArcGisCoNo(dor) : null;

}



function getCountyName(arcGisCoNo) {

  const dor = arcGisToDorCoNo(arcGisCoNo);

  return dor ? COUNTY_BY_DOR_CO_NO[dor] : null;

}



function getQueryCoNos({ city, county, geocodeCity }) {

  const candidates = [

    resolveCoNo(city),

    resolveCoNo(geocodeCity),

    resolveCoNoFromCounty(county)

  ].filter(Boolean);



  const primary = candidates[0] || null;

  const neighbors = primary ? NEIGHBOR_ARCGIS_CO_NOS[primary] || [] : [];

  const prioritized = [...new Set([...candidates, ...neighbors])];

  const rest = FL_ARCGIS_CO_NOS.filter((coNo) => !prioritized.includes(coNo));

  return { primary, all: [...prioritized, ...rest] };

}



module.exports = {

  CITY_TO_CO_NO,

  ARCGIS_CITY_TO_CO_NO,

  COUNTY_BY_DOR_CO_NO,

  FL_ARCGIS_CO_NOS,

  resolveCoNo,

  resolveCoNoFromCounty,

  getCountyName,

  getQueryCoNos,

  toArcGisCity,

  dorToArcGisCoNo,

  arcGisToDorCoNo

};


