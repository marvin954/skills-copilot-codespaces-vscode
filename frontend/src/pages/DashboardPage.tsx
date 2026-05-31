import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Building2, DollarSign, TrendingUp, Users } from 'lucide-react';
import Header from '../components/layout/Header';
import StatCard from '../components/dashboard/StatCard';
import MarketTrendsChart from '../components/dashboard/MarketTrendsChart';
import LeadTemplateGrid from '../components/dashboard/LeadTemplateGrid';
import QuickActions from '../components/dashboard/QuickActions';
import { api } from '../services/api';
import { DEFAULT_LOCATION, formatCurrency, formatNumber, MOCK_MARKET_TRENDS, MOCK_TEMPLATES } from '../data/mockData';
import { LeadTemplate, MarketTrend } from '../types';

export const DashboardPage: React.FC = () => {
  const [location, setLocation] = useState(DEFAULT_LOCATION);

  const { data: trends = MOCK_MARKET_TRENDS, isLoading: trendsLoading } = useQuery<MarketTrend[]>(
    ['marketTrends', location.city, location.state],
    async () => {
      const response = await api.get('/comps/market/trends', {
        params: { city: location.city, state: location.state }
      });
      return response.data.data?.length ? response.data.data : MOCK_MARKET_TRENDS;
    }
  );

  const { data: templates = MOCK_TEMPLATES, isLoading: templatesLoading } = useQuery<LeadTemplate[]>(
    'leadTemplates',
    async () => {
      const response = await api.get('/search/templates');
      return response.data.templates?.length ? response.data.templates : MOCK_TEMPLATES;
    }
  );

  const { data: savedLists = [] } = useQuery('savedLeadLists', async () => {
    try {
      const response = await api.get('/leads');
      return response.data.leads || [];
    } catch {
      return [];
    }
  });

  const stats = useMemo(() => {
    if (!trends.length) {
      return {
        totalProperties: 0,
        avgPrice: 0,
        avgPricePerSqft: 0,
        leadListCount: savedLists.length || templates.length
      };
    }

    const totalProperties = trends.reduce((sum, trend) => sum + trend.totalProperties, 0);
    const avgPrice = Math.round(
      trends.reduce((sum, trend) => sum + trend.avgPrice * trend.totalProperties, 0) / Math.max(totalProperties, 1)
    );
    const avgPricePerSqft = Math.round(
      trends.reduce((sum, trend) => sum + trend.avgPricePerSqft * trend.totalProperties, 0) / Math.max(totalProperties, 1)
    );

    return {
      totalProperties,
      avgPrice,
      avgPricePerSqft,
      leadListCount: savedLists.length || templates.length
    };
  }, [trends, templates.length, savedLists.length]);

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Market overview and lead generation"
        location={location}
        onLocationChange={setLocation}
      />

      <div className="space-y-8 p-8">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Properties"
            value={formatNumber(stats.totalProperties)}
            change={`In ${location.city}, ${location.state}`}
            icon={Building2}
            iconColor="bg-blue-500"
          />
          <StatCard
            title="Average Price"
            value={formatCurrency(stats.avgPrice)}
            change="Assessed value"
            icon={DollarSign}
            iconColor="bg-emerald-500"
          />
          <StatCard
            title="Avg $/Sq Ft"
            value={`$${stats.avgPricePerSqft}`}
            change="Market average"
            icon={TrendingUp}
            iconColor="bg-purple-500"
          />
          <StatCard
            title="Lead Templates"
            value={String(stats.leadListCount)}
            change="Ready to generate"
            icon={Users}
            iconColor="bg-orange-500"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MarketTrendsChart
              trends={trendsLoading ? [] : trends}
              city={location.city}
              state={location.state}
            />
          </div>
          <QuickActions />
        </div>

        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Lead List Templates</h3>
            <p className="text-sm text-gray-500">
              Pre-built filters for common investment strategies
            </p>
          </div>
          <LeadTemplateGrid templates={templates} isLoading={templatesLoading} />
        </div>
      </div>
    </>
  );
};
