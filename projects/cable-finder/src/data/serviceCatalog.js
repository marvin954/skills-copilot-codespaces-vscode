'use strict';

const SERVICE_CATALOG = Object.freeze([
  {
    id: 'metro-fiber-gig',
    provider: 'MetroLink Fiber',
    technology: 'Fiber',
    name: 'Gigabit Fiber Internet',
    tiers: [
      { name: 'Fiber 300', downloadMbps: 300, uploadMbps: 300, monthlyPrice: 59 },
      { name: 'Fiber 1000', downloadMbps: 1000, uploadMbps: 1000, monthlyPrice: 89 }
    ],
    installation: 'Professional install in 2-4 business days',
    coverage: {
      zips: ['62701', '62702', '62703', '62704'],
      cities: ['springfield'],
      streetKeywords: ['main', 'capitol', 'oak', 'lincoln', 'monroe']
    },
    businessEligible: true,
    priority: 100
  },
  {
    id: 'metro-coax',
    provider: 'MetroLink Cable',
    technology: 'Cable',
    name: 'High-Speed Cable Internet',
    tiers: [
      { name: 'Cable 200', downloadMbps: 200, uploadMbps: 20, monthlyPrice: 49 },
      { name: 'Cable 500', downloadMbps: 500, uploadMbps: 35, monthlyPrice: 69 },
      { name: 'Cable 940', downloadMbps: 940, uploadMbps: 50, monthlyPrice: 99 }
    ],
    installation: 'Self-install kit or next-day technician',
    coverage: {
      zips: ['62701', '62702', '62703', '62704', '62711'],
      cities: ['springfield', 'chatham'],
      streetKeywords: []
    },
    businessEligible: true,
    priority: 80
  },
  {
    id: 'airwave-5g',
    provider: 'AirWave Wireless',
    technology: '5G Fixed Wireless',
    name: '5G Home Internet',
    tiers: [
      { name: '5G Home', downloadMbps: 250, uploadMbps: 25, monthlyPrice: 55 },
      { name: '5G Plus', downloadMbps: 500, uploadMbps: 50, monthlyPrice: 75 }
    ],
    installation: 'Plug-and-play gateway ships in 1-2 business days',
    coverage: {
      zips: ['62702', '62703', '62704', '62711', '62629'],
      cities: ['springfield', 'chatham'],
      streetKeywords: ['ridge', 'lake', 'veterans', 'wabash']
    },
    businessEligible: false,
    priority: 60
  },
  {
    id: 'copperline-dsl',
    provider: 'CopperLine',
    technology: 'DSL',
    name: 'Essential DSL',
    tiers: [
      { name: 'DSL 25', downloadMbps: 25, uploadMbps: 5, monthlyPrice: 39 },
      { name: 'DSL 75', downloadMbps: 75, uploadMbps: 10, monthlyPrice: 54 }
    ],
    installation: 'Technician install in 5-7 business days',
    coverage: {
      zips: ['62629', '62703', '62707', '62711'],
      cities: ['springfield', 'chatham', 'rochester'],
      streetKeywords: []
    },
    businessEligible: true,
    priority: 35
  },
  {
    id: 'enterprise-dia',
    provider: 'MetroLink Business',
    technology: 'Dedicated Fiber',
    name: 'Dedicated Internet Access',
    tiers: [
      { name: 'DIA 100', downloadMbps: 100, uploadMbps: 100, monthlyPrice: 299 },
      { name: 'DIA 1000', downloadMbps: 1000, uploadMbps: 1000, monthlyPrice: 799 }
    ],
    installation: 'Site survey required before quote',
    coverage: {
      zips: ['62701', '62702', '62703', '62704'],
      cities: ['springfield'],
      streetKeywords: ['suite', 'plaza', 'commerce', 'industrial', 'business']
    },
    businessEligible: true,
    requiresBusinessAddress: true,
    priority: 95
  }
]);

module.exports = {
  SERVICE_CATALOG
};
