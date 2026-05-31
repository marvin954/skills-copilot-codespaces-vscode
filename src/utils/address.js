/**
 * Address normalization utilities
 */
const STREET_ABBREVIATIONS = {
  street: 'st',
  avenue: 'ave',
  road: 'rd',
  drive: 'dr',
  lane: 'ln',
  boulevard: 'blvd',
  court: 'ct',
  place: 'pl',
  circle: 'cir',
  highway: 'hwy'
};

function normalizeAddress(address = '') {
  return address
    .toLowerCase()
    .replace(/[.,#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((part, index) => {
      if (index === 0) return part;
      return STREET_ABBREVIATIONS[part] || part;
    })
    .join(' ');
}

function parseAddressInput(input = '') {
  const trimmed = input.trim();
  if (!trimmed) {
    return { street: '', address: '', city: '', state: '', zipCode: '' };
  }

  const parts = trimmed.split(',').map((part) => part.trim());
  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1].split(/\s+/).filter(Boolean);
    const parsed = {
      street: parts[0],
      city: parts.slice(1, -1).join(', ') || parts[1],
      state: stateZip[0]?.toUpperCase().slice(0, 2) || '',
      zipCode: stateZip[1] || ''
    };
    parsed.address = parsed.street;
    return parsed;
  }

  if (parts.length === 2) {
    const parsed = { street: parts[0], city: parts[1], state: '', zipCode: '' };
    parsed.address = parsed.street;
    return parsed;
  }

  const parsed = { street: trimmed, city: '', state: '', zipCode: '' };
  parsed.address = parsed.street;
  return parsed;
}

function normalizeLookupInput(input = {}) {
  if (typeof input === 'string') {
    return parseAddressInput(input);
  }

  let { address, city, state, zipCode } = input;

  if (address?.includes(',')) {
    const parsed = parseAddressInput(address);
    address = parsed.street;
    city = city || parsed.city;
    state = state || parsed.state;
    zipCode = zipCode || parsed.zipCode;
  }

  return {
    address: address?.trim() || '',
    city: city?.trim() || '',
    state: state?.trim()?.toUpperCase()?.slice(0, 2) || '',
    zipCode: zipCode?.trim() || ''
  };
}

module.exports = { normalizeAddress, parseAddressInput, normalizeLookupInput };
