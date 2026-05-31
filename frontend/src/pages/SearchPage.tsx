import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { api } from '../services/api';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  property_type: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  appraiser_district?: string;
  parcel_number?: string;
}

interface AddressForm {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

function parseAddressForm(form: AddressForm): AddressForm {
  let { address, city, state, zipCode } = form;

  if (address.includes(',')) {
    const parts = address.split(',').map((part) => part.trim());
    address = parts[0];
    if (!city && parts[1]) city = parts[1];
    if (parts.length >= 3) {
      const stateZip = parts[parts.length - 1].split(/\s+/).filter(Boolean);
      if (stateZip[0]) state = stateZip[0].slice(0, 2).toUpperCase();
      if (stateZip[1]) zipCode = stateZip[1];
    }
  }

  return {
    address: address.trim(),
    city: city.trim(),
    state: state.trim().toUpperCase().slice(0, 2),
    zipCode: zipCode.trim()
  };
}

function formatCurrency(value?: number | string) {
  if (value == null || value === '') return '—';
  return `$${Number(value).toLocaleString()}`;
}

interface AddressLookupResult {
  property: Property;
  appraiser: {
    district?: string;
    landValue?: number;
    improvementValue?: number;
    legalDescription?: string;
  };
  ownerContact: {
    name?: string;
    phone?: string;
    email?: string;
    mailingAddress?: string;
    source?: string;
  };
}

export const SearchPage: React.FC = () => {
  const [mode, setMode] = useState<'filter' | 'address'>('address');
  const [searchParams, setSearchParams] = useState({
    location: '',
    min_price: '',
    max_price: '',
    property_type: '',
    bedrooms: '',
    bathrooms: ''
  });
  const [addressForm, setAddressForm] = useState({
    address: '',
    city: '',
    state: 'FL',
    zipCode: ''
  });
  const [results, setResults] = useState<Property[]>([]);
  const [addressResult, setAddressResult] = useState<AddressLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [errorSamples, setErrorSamples] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setError('');
    setAddressResult(null);

    try {
      const locationParts = searchParams.location.split(',').map((part) => part.trim());
      const payload: Record<string, string | number> = {};

      if (locationParts.length >= 3) {
        payload.address = locationParts[0];
        payload.city = locationParts[1];
        payload.state = locationParts[2].slice(0, 2).toUpperCase();
      } else if (locationParts.length >= 2 && locationParts[locationParts.length - 1].length === 2) {
        payload.city = locationParts[0];
        payload.state = locationParts[locationParts.length - 1].toUpperCase();
      } else if (searchParams.location.trim()) {
        payload.searchText = searchParams.location.trim();
      }

      if (searchParams.min_price) payload.priceMin = Number(searchParams.min_price);
      if (searchParams.max_price) payload.priceMax = Number(searchParams.max_price);
      if (searchParams.property_type) payload.propertyType = searchParams.property_type;
      if (searchParams.bedrooms) payload.bedroomsMin = Number(searchParams.bedrooms);
      if (searchParams.bathrooms) payload.bathroomsMin = Number(searchParams.bathrooms);

      const response = await api.post('/search', payload);
      const properties = (response.data.data || []).map((property: any) => ({
        ...property,
        price: property.price ?? property.tax_assessed_value
      }));
      setResults(properties);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setError('');
    setErrorSamples([]);
    setResults([]);

    const payload = parseAddressForm(addressForm);

    if (!payload.address) {
      setError('Enter a street address.');
      setLoading(false);
      return;
    }

    if (!payload.city) {
      setError('City is required. Paste a full address like "123 Main Street, Austin, TX 78701".');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/search/address', payload, { timeout: 120000 });
      setAddressResult(response.data.data);
    } catch (err: any) {
      const hint = err.response?.data?.details?.hint;
      const samples = err.response?.data?.details?.sampleAddresses;
      const message = err.response?.data?.error || err.response?.data?.message || (err.code === 'ECONNABORTED' ? 'Lookup timed out — Florida parcel searches can take up to 2 minutes. Try again.' : 'Address lookup failed');
      setError(hint ? `${message}. ${hint}` : message);
      setErrorSamples(Array.isArray(samples) ? samples : []);
      setAddressResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    if (propertyId) navigate(`/properties/${propertyId}`);
  };

  const openMaps = (result: AddressLookupResult) => {
    const query = encodeURIComponent(
      `${result.property.address}, ${result.property.city}, ${result.property.state} ${result.property.zip_code || ''}`
    );
    window.open(`https://maps.google.com/?q=${query}`, '_blank', 'noopener,noreferrer');
  };

  const copyOwnerInfo = async (result: AddressLookupResult) => {
    const text = [
      result.property.address,
      `${result.property.city}, ${result.property.state}`,
      result.ownerContact.name && `Owner: ${result.ownerContact.name}`,
      result.ownerContact.mailingAddress && `Mail: ${result.ownerContact.mailingAddress}`,
      result.property.parcel_number && `Parcel: ${result.property.parcel_number}`
    ]
      .filter(Boolean)
      .join('\n');
    await navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Header
        title="Property Lookup"
        subtitle="Owner, tax values, and parcel data — built for investors on the go"
      />

      <div className="p-4 sm:p-8">
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setMode('address')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              mode === 'address' ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Address Lookup
          </button>
          <button
            onClick={() => setMode('filter')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              mode === 'filter' ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Filter Search
          </button>
        </div>

        {mode === 'address' ? (
          <div className="mb-8 rounded-xl bg-white p-4 shadow-md sm:p-6">
            <p className="mb-4 text-sm text-gray-600">
              Paste a full Florida address while driving for sale or door-knocking. Live county appraiser data — cached on your device session.
            </p>
            <form onSubmit={handleAddressSearch} className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property address</label>
                <input
                  name="address"
                  required
                  autoComplete="street-address"
                  placeholder="100 NE 10 St, Pompano Beach, FL 33060"
                  value={addressForm.address}
                  onChange={handleAddressChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    name="city"
                    autoComplete="address-level2"
                    placeholder="Pompano Beach"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    name="state"
                    required
                    maxLength={2}
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-3 text-base uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ZIP</label>
                  <input
                    name="zipCode"
                    inputMode="numeric"
                    placeholder="33069"
                    value={addressForm.zipCode}
                    onChange={handleAddressChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-3 text-base"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-brand-600 py-3.5 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? 'Pulling owner record…' : 'Look Up Property'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={handleFilterSearch} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Location or address</label>
                <input
                  type="text"
                  name="location"
                  placeholder="123 Main Street, Austin, TX or Austin, TX"
                  value={searchParams.location}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Price</label>
                <input type="number" name="min_price" value={searchParams.min_price} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Price</label>
                <input type="number" name="max_price" value={searchParams.max_price} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Type</label>
                <select name="property_type" value={searchParams.property_type} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 sm:text-sm">
                  <option value="">All Types</option>
                  <option value="single-family">Single Family</option>
                  <option value="multi-family">Multi-Family</option>
                  <option value="vacant-land">Vacant Land</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <button type="submit" disabled={loading} className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                  {loading ? 'Searching...' : 'Search Properties'}
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
            {errorSamples.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-red-700">
                {errorSamples.map((sample) => (
                  <li key={sample}>
                    <button
                      type="button"
                      className="text-left underline hover:text-red-900"
                      onClick={() => {
                        setAddressForm(parseAddressForm({ address: sample, city: '', state: 'FL', zipCode: '' }));
                        setError('');
                        setErrorSamples([]);
                      }}
                    >
                      {sample}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {searched && mode === 'address' && addressResult && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                  {addressResult.appraiser.district}
                </p>
                <h3 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{addressResult.property.address}</h3>
                <p className="text-gray-600">{addressResult.property.city}, {addressResult.property.state}</p>
                <p className="mt-2 text-lg font-semibold text-brand-700">
                  Assessed {formatCurrency(addressResult.property.price)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button
                  onClick={() => handlePropertyClick(addressResult.property.id)}
                  className="rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Full Details
                </button>
                <button
                  onClick={() => openMaps(addressResult)}
                  className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Open Maps
                </button>
                <button
                  onClick={() => copyOwnerInfo(addressResult)}
                  className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Copy Info
                </button>
                <button
                  onClick={() => navigate('/calculator')}
                  className="col-span-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-100 sm:col-span-1"
                >
                  Run Deal Calc
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-semibold text-gray-900">Tax / Appraiser</h4>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-gray-500">Land</dt><dd>{formatCurrency(addressResult.appraiser.landValue)}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Improvements</dt><dd>{formatCurrency(addressResult.appraiser.improvementValue)}</dd></div>
                  <div><dt className="text-gray-500">Legal</dt><dd className="mt-1 text-gray-900">{addressResult.appraiser.legalDescription || '—'}</dd></div>
                </dl>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-semibold text-gray-900">Owner (public record)</h4>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="text-gray-500">Name</dt><dd className="font-medium">{addressResult.ownerContact.name || '—'}</dd></div>
                  <div><dt className="text-gray-500">Mailing address</dt><dd>{addressResult.ownerContact.mailingAddress || '—'}</dd></div>
                  <div className="text-xs text-gray-400">Phone/email not in appraiser records — skip trace required</div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {searched && mode === 'filter' && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {loading ? 'Searching...' : `Found ${results.length} properties`}
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((property) => (
                <div key={property.id} onClick={() => handlePropertyClick(property.id)} className="cursor-pointer rounded-lg bg-white p-6 shadow-md hover:shadow-lg">
                  <h4 className="text-lg font-semibold">{property.address}</h4>
                  <p className="text-sm text-gray-500">{property.city}, {property.state}</p>
                  <p className="mt-3 text-lg font-bold text-brand-600">${property.price?.toLocaleString()}</p>
                  {(property.owner_phone || property.owner_email) && (
                    <p className="mt-2 text-xs text-gray-500">Owner contact available</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
