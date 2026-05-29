'use strict';

const { SERVICE_CATALOG } = require('../data/serviceCatalog');
const { parseAddress } = require('./addressParser');

function findAvailability(address, catalog = SERVICE_CATALOG) {
  const parsedAddress = parseAddress(address);
  const services = catalog
    .map((service) => evaluateService(service, parsedAddress))
    .filter((result) => result.available)
    .sort(compareServices)
    .map(({ service, confidence, matchReasons }) => ({
      id: service.id,
      provider: service.provider,
      name: service.name,
      technology: service.technology,
      tiers: service.tiers,
      installation: service.installation,
      businessEligible: service.businessEligible,
      confidence,
      matchReasons
    }));

  return {
    address: parsedAddress,
    services,
    summary: buildSummary(services, parsedAddress)
  };
}

function evaluateService(service, address) {
  const coverage = service.coverage || {};
  const zipMatch = address.zip && (coverage.zips || []).includes(address.zip);
  const cityMatch = address.city && (coverage.cities || []).includes(address.city);
  const locationMatch = address.zip ? zipMatch : cityMatch;
  const streetKeywords = coverage.streetKeywords || [];
  const streetMatch = streetKeywords.length === 0
    || streetKeywords.some((keyword) => address.tokens.includes(keyword));
  const businessMatch = !service.requiresBusinessAddress || address.isBusinessAddress;
  const available = Boolean(locationMatch && streetMatch && businessMatch);
  const matchReasons = [];

  if (zipMatch) {
    matchReasons.push(`ZIP ${address.zip}`);
  }

  if (cityMatch) {
    matchReasons.push(`${titleCase(address.city)} service area`);
  }

  if (streetKeywords.length > 0 && streetMatch) {
    matchReasons.push('street-level plant confirmed');
  }

  if (service.requiresBusinessAddress && businessMatch) {
    matchReasons.push('business address eligible');
  }

  return {
    service,
    available,
    confidence: calculateConfidence({ zipMatch, cityMatch, streetMatch, businessMatch, streetKeywords }),
    matchReasons
  };
}

function calculateConfidence({ zipMatch, cityMatch, streetMatch, businessMatch, streetKeywords }) {
  if (!businessMatch) {
    return 'low';
  }

  const score = Number(Boolean(zipMatch)) * 60
    + Number(Boolean(cityMatch)) * 20
    + Number(Boolean(streetMatch && streetKeywords.length > 0)) * 20;

  if (score >= 80) {
    return 'high';
  }

  if (score >= 60) {
    return 'medium';
  }

  return 'low';
}

function compareServices(left, right) {
  const leftTopSpeed = maxDownload(left.service);
  const rightTopSpeed = maxDownload(right.service);

  if (left.service.priority !== right.service.priority) {
    return right.service.priority - left.service.priority;
  }

  return rightTopSpeed - leftTopSpeed;
}

function maxDownload(service) {
  return Math.max(...service.tiers.map((tier) => tier.downloadMbps));
}

function buildSummary(services, address) {
  if (services.length === 0) {
    return `No active internet services were found for ${address.original}. Verify the ZIP code or request a site survey.`;
  }

  const fastest = services.reduce((current, service) => {
    const currentSpeed = maxTierDownload(current);
    const serviceSpeed = maxTierDownload(service);
    return serviceSpeed > currentSpeed ? service : current;
  }, services[0]);

  return `${services.length} internet service${services.length === 1 ? '' : 's'} available. Fastest option: ${fastest.provider} ${fastest.name}.`;
}

function maxTierDownload(service) {
  return Math.max(...service.tiers.map((tier) => tier.downloadMbps));
}

function titleCase(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

module.exports = {
  findAvailability,
  evaluateService
};
