import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { api } from '../services/api';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  property_type: string;
  owner_name: string;
  owner_phone?: string;
  owner_email?: string;
  owner_mailing_address?: string;
  appraiser_district?: string;
  land_value?: number;
  improvement_value?: number;
  legal_description?: string;
  contact_source?: string;
  parcel_number?: string;
  year_built: number;
  tax_value: number;
  condition: string;
}

interface Comp {
  id: string;
  address: string;
  price: number;
  similarity_score: number;
  distance_miles: number;
}

export const PropertyDetailsPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const propertyResponse = await api.get(`/properties/${propertyId}`);
        setProperty(propertyResponse.data.data.property);

        // Fetch comparable properties
        const compsResponse = await api.get(`/comps/${propertyId}`);
        const rawComps = compsResponse.data.data?.comps || [];
        setComps(
          rawComps.map((comp: any) => ({
            id: comp.id,
            address: comp.address,
            price: comp.price,
            distance_miles: comp.distanceMiles ?? comp.distance_miles ?? 0,
            similarity_score: comp.similarityScore ?? comp.similarity_score ?? 0
          }))
        );
      } catch (error) {
        console.error('Failed to load property details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Property not found</p>
      </div>
    );
  }

  return (
    <>
      <Header title="Property Details" subtitle={`${property.city}, ${property.state}`} />

      <div className="p-8">
        {/* Property Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{property.address}</h2>
          <p className="text-gray-600 text-lg">{property.city}, {property.state}</p>

          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <p className="text-gray-600 text-sm">Price</p>
              <p className="text-2xl font-bold text-blue-600">${property.price?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Bedrooms</p>
              <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Bathrooms</p>
              <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Square Feet</p>
              <p className="text-2xl font-bold text-gray-900">{property.square_feet?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Year Built</p>
              <p className="text-2xl font-bold text-gray-900">{property.year_built}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Condition</p>
              <p className="text-2xl font-bold text-gray-900">{property.condition}</p>
            </div>
          </div>
        </div>

        {/* Property Details & Owner Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Property Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Property Type</p>
                <p className="font-medium text-gray-900">{property.property_type}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Tax Assessed Value</p>
                <p className="font-medium text-gray-900">${property.tax_value?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Price per Sq Ft</p>
                <p className="font-medium text-gray-900">
                  ${property.square_feet ? Math.round(property.price / property.square_feet) : 0}/sqft
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Owner Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Owner Name</p>
                <p className="font-medium text-gray-900">{property.owner_name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Phone</p>
                <p className="font-medium text-gray-900">{property.owner_phone || 'Not on public record'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Email</p>
                <p className="font-medium text-gray-900">{property.owner_email || 'Not on public record'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Mailing Address</p>
                <p className="font-medium text-gray-900">{property.owner_mailing_address || '—'}</p>
              </div>
              {property.contact_source && (
                <p className="text-xs text-gray-400">Source: {property.contact_source}</p>
              )}
              <button
                onClick={() => navigate('/calculator')}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Analyze Deal
              </button>
            </div>
          </div>
        </div>

        {(property.appraiser_district || property.land_value) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">County Appraiser Record</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-gray-600 text-sm">Appraisal District</p>
                <p className="font-medium text-gray-900">{property.appraiser_district}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Parcel #</p>
                <p className="font-medium text-gray-900">{property.parcel_number}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Land Value</p>
                <p className="font-medium text-gray-900">${property.land_value?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Improvement Value</p>
                <p className="font-medium text-gray-900">${property.improvement_value?.toLocaleString()}</p>
              </div>
            </div>
            {property.legal_description && (
              <p className="mt-4 text-sm text-gray-600">
                <span className="font-medium text-gray-900">Legal: </span>
                {property.legal_description}
              </p>
            )}
          </div>
        )}

        {/* Comparable Properties */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Comparable Properties</h3>

          {comps.length === 0 ? (
            <p className="text-gray-600">No comparable properties found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Address</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Price</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Distance</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-900">Similarity</th>
                  </tr>
                </thead>
                <tbody>
                  {comps.map((comp) => (
                    <tr key={comp.id} className="border-b border-gray-200">
                      <td className="py-3 px-4">{comp.address}</td>
                      <td className="py-3 px-4 font-medium">${comp.price?.toLocaleString()}</td>
                      <td className="py-3 px-4">{comp.distance_miles.toFixed(1)} mi</td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${comp.similarity_score * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{(comp.similarity_score * 100).toFixed(0)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
