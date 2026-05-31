import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import Header from '../components/layout/Header';
import LeadTemplateGrid from '../components/dashboard/LeadTemplateGrid';
import { api } from '../services/api';
import { DEFAULT_LOCATION, formatCurrency, MOCK_TEMPLATES } from '../data/mockData';
import { LeadTemplate, Property, SavedLeadList } from '../types';

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const activeTemplate = searchParams.get('template');
  const savedListId = searchParams.get('saved');

  const { data: templates = MOCK_TEMPLATES } = useQuery<LeadTemplate[]>('leadTemplates', async () => {
    const response = await api.get('/search/templates');
    return response.data.templates?.length ? response.data.templates : MOCK_TEMPLATES;
  });

  const { data: savedLists = [] } = useQuery<SavedLeadList[]>('savedLeadLists', async () => {
    const response = await api.get('/leads');
    return response.data.leads || [];
  });

  const activeMeta = templates.find((template) => template.id === activeTemplate);

  const { data: leads = [], isLoading } = useQuery<Property[]>(
    ['leadList', activeTemplate, DEFAULT_LOCATION.city, DEFAULT_LOCATION.state],
    async () => {
      if (!activeTemplate) return [];
      const response = await api.get(`/search/leads/${activeTemplate}`, {
        params: { city: DEFAULT_LOCATION.city, state: DEFAULT_LOCATION.state }
      });
      return (response.data.data || []).map((property: any) => ({
        ...property,
        tax_assessed_value: property.tax_assessed_value ?? property.price
      }));
    },
    { enabled: !!activeTemplate && !savedListId }
  );

  const { data: savedListProperties = [], isLoading: savedLoading } = useQuery<Property[]>(
    ['savedLeadList', savedListId],
    async () => {
      if (!savedListId) return [];
      const response = await api.get(`/leads/${savedListId}`);
      return response.data.lead?.properties || [];
    },
    { enabled: !!savedListId }
  );

  const clearView = () => setSearchParams({});

  const handleSaveList = async () => {
    if (!activeTemplate || !activeMeta) return;

    setSaving(true);
    setSaveMessage('');

    try {
      await api.post('/leads', {
        name: `${activeMeta.name} — ${DEFAULT_LOCATION.city}`,
        listType: activeTemplate,
        description: activeMeta.description,
        criteria: activeMeta.criteria,
        city: DEFAULT_LOCATION.city,
        state: DEFAULT_LOCATION.state
      });
      await queryClient.invalidateQueries('savedLeadLists');
      setSaveMessage('Lead list saved to your account');
    } catch (error: any) {
      setSaveMessage(error.response?.data?.error || 'Failed to save lead list');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    await api.delete(`/leads/${id}`);
    await queryClient.invalidateQueries('savedLeadLists');
    if (savedListId === id) clearView();
  };

  const handleExport = async (id: string, name: string) => {
    const response = await api.post(`/leads/${id}/export`, {}, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '-').toLowerCase()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const viewingSaved = !!savedListId;
  const displayProperties = viewingSaved ? savedListProperties : leads;
  const displayLoading = viewingSaved ? savedLoading : isLoading;
  const savedListMeta = savedLists.find((list) => list.id === savedListId);

  return (
    <>
      <Header
        title="Lead Lists"
        subtitle="Generate and save targeted property lists"
      />

      <div className="space-y-8 p-8">
        {!activeTemplate && !savedListId ? (
          <>
            {savedLists.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900">My saved lists</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {savedLists.map((list) => (
                    <div
                      key={list.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <h4 className="font-semibold text-gray-900">{list.name}</h4>
                      <p className="mt-1 text-sm text-gray-500">{list.propertyCount} properties</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setSearchParams({ saved: list.id })}
                          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleExport(list.id, list.name)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Export CSV
                        </button>
                        <button
                          onClick={() => handleDeleteList(list.id)}
                          className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900">Generate from template</h3>
              <p className="text-sm text-gray-500">
                Each template applies investment-focused filters to parcel data
              </p>
            </div>
            <LeadTemplateGrid templates={templates} />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <button
                  onClick={clearView}
                  className="mb-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  ← Back
                </button>
                <h3 className="text-xl font-semibold text-gray-900">
                  {viewingSaved ? savedListMeta?.name : activeMeta?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {viewingSaved ? 'Saved lead list' : activeMeta?.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-gray-600">
                  {displayLoading ? 'Loading...' : `${displayProperties.length} properties`}
                </p>
                {!viewingSaved && leads.length > 0 && (
                  <button
                    onClick={handleSaveList}
                    disabled={saving}
                    className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save list'}
                  </button>
                )}
                {viewingSaved && savedListId && (
                  <button
                    onClick={() => handleExport(savedListId, savedListMeta?.name || 'leads')}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Export CSV
                  </button>
                )}
              </div>
            </div>

            {saveMessage && (
              <p className={`text-sm ${saveMessage.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </p>
            )}

            {displayLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-40 animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            ) : displayProperties.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
                <p className="text-gray-600">No properties matched this list.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayProperties.map((property) => (
                  <button
                    key={property.id}
                    onClick={() => navigate(`/properties/${property.id}`)}
                    className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
                  >
                    <h4 className="font-semibold text-gray-900">{property.address}</h4>
                    <p className="text-sm text-gray-500">
                      {property.city}, {property.state}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-medium text-brand-600">
                        {formatCurrency(property.tax_assessed_value || property.last_sale_price || 0)}
                      </span>
                      <span className="text-gray-500">
                        {property.bedrooms} bd · {property.bathrooms} ba
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
