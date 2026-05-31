import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Home, DollarSign, AlertTriangle, Building2 } from 'lucide-react';
import { LeadTemplate } from '../../types';

const templateIcons: Record<string, React.ElementType> = {
  'flip-candidates': TrendingUp,
  'rental-holds': Home,
  wholesalers: DollarSign,
  foreclosures: AlertTriangle,
  'high-equity': Building2,
};

interface LeadTemplateGridProps {
  templates: LeadTemplate[];
  isLoading?: boolean;
  onSelect?: (templateId: string) => void;
}

const LeadTemplateGrid: React.FC<LeadTemplateGridProps> = ({ templates, isLoading, onSelect }) => {
  const navigate = useNavigate();

  const handleSelect = (templateId: string) => {
    if (onSelect) {
      onSelect(templateId);
    } else {
      navigate(`/leads?template=${templateId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => {
        const Icon = templateIcons[template.id] || Home;
        return (
          <button
            key={template.id}
            onClick={() => handleSelect(template.id)}
            className="group rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-brand-50 p-2.5">
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
            </div>
            <h4 className="mt-3 font-semibold text-gray-900">{template.name}</h4>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{template.description}</p>
          </button>
        );
      })}
    </div>
  );
};

export default LeadTemplateGrid;
