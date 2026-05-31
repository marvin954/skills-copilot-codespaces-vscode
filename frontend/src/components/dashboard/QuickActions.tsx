import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calculator, Download, MapPin } from 'lucide-react';

const actions = [
  {
    label: 'Search Properties',
    description: 'Advanced filters across 160M+ parcels',
    icon: Search,
    path: '/search',
    color: 'bg-blue-500',
  },
  {
    label: 'Analyze Deal',
    description: 'ROI, cash flow, and MAO calculators',
    icon: Calculator,
    path: '/calculator',
    color: 'bg-emerald-500',
  },
  {
    label: 'Generate Leads',
    description: 'Build targeted lead lists',
    icon: Download,
    path: '/leads',
    color: 'bg-purple-500',
  },
  {
    label: 'Market Comps',
    description: 'Compare properties in your area',
    icon: MapPin,
    path: '/search?tab=comps',
    color: 'bg-orange-500',
  },
];

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map(({ label, description, icon: Icon, path, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex items-center gap-4 rounded-lg border border-gray-100 p-4 text-left transition-colors hover:bg-gray-50"
          >
            <div className={`rounded-lg p-2.5 ${color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
