import React from 'react';
import { Bell, MapPin } from 'lucide-react';
import { MarketLocation } from '../../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  location?: MarketLocation;
  onLocationChange?: (location: MarketLocation) => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, location, onLocationChange }) => {
  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>

        <div className="hidden shrink-0 items-center gap-4 sm:flex">
          {location && onLocationChange && (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={location.city}
                onChange={(e) => onLocationChange({ ...location, city: e.target.value })}
                className="w-24 border-none bg-transparent text-sm font-medium text-gray-700 outline-none"
                placeholder="City"
              />
              <span className="text-gray-300">,</span>
              <input
                type="text"
                value={location.state}
                onChange={(e) => onLocationChange({ ...location, state: e.target.value.toUpperCase().slice(0, 2) })}
                className="w-10 border-none bg-transparent text-sm font-medium text-gray-700 outline-none"
                placeholder="ST"
                maxLength={2}
              />
            </div>
          )}

          <button className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
