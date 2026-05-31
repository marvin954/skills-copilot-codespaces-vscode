import React, { useState } from 'react';
import Header from '../components/layout/Header';
import { api } from '../services/api';

type CalculatorType = 'flip' | 'rental' | 'mao' | 'brrrr' | 'wholesale' | null;

export const CalculatorPage: React.FC = () => {
  const [calculatorType, setCalculatorType] = useState<CalculatorType>(null);
  const [formData, setFormData] = useState({
    property_price: '',
    repair_cost: '',
    after_repair_value: '',
    purchase_closing_cost: '',
    sale_closing_cost: '',
    monthly_rent: '',
    monthly_expenses: '',
    down_payment_percent: '20',
    interest_rate: '6.5',
    loan_years: '30',
    holding_period: ''
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const endpointMap: Record<string, string> = {
      flip: '/calculator/roi',
      rental: '/calculator/cashflow',
      mao: '/calculator/mao',
      brrrr: '/calculator/brrrr',
      wholesale: '/calculator/wholesale'
    };

    const purchasePrice = Number(formData.property_price) || 0;
    const repairCosts = Number(formData.repair_cost) || 0;
    const afterRepairValue = Number(formData.after_repair_value) || 0;
    const sellingCosts = Number(formData.sale_closing_cost) || 0;
    const holdingCosts = Number(formData.purchase_closing_cost) || 0;
    const monthlyRent = Number(formData.monthly_rent) || 0;
    const monthlyExpenses = Number(formData.monthly_expenses) || 0;

    const payloadMap: Record<string, Record<string, number>> = {
      flip: { purchasePrice, repairCosts, afterRepairValue, sellingCosts, holdingCosts },
      rental: { monthlyRent, maintenance: monthlyExpenses, propertyTax: 0, insurance: 0 },
      mao: {
        afterRepairValue,
        estimatedRepairs: repairCosts,
        holdingCosts,
        exitCosts: sellingCosts,
        desiredProfit: purchasePrice * 0.2
      },
      brrrr: {
        purchasePrice,
        repairCosts,
        closingCosts: holdingCosts,
        afterRepairValue,
        monthlyRent,
        monthlyExpenses
      },
      wholesale: {
        marketValue: afterRepairValue || purchasePrice * 1.2,
        purchasePrice,
        repairCosts,
        buyerMargin: 0.2,
        wholesaleFee: 0.05
      }
    };

    try {
      const endpoint = endpointMap[calculatorType || ''];
      const payload = payloadMap[calculatorType || ''];
      const response = await api.post(endpoint, payload);
      const data = response.data.data;
      setResult(data?.calculations || data);
    } catch (error) {
      console.error('Calculation failed:', error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (!calculatorType) {
    return (
      <>
        <Header title="Deal Calculator" subtitle="Analyze investment opportunities" />

        <div className="p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              { type: 'flip', title: 'Fix & Flip ROI', desc: 'Calculate returns from property flips' },
              { type: 'rental', title: 'Rental Cash Flow', desc: 'Analyze long-term rental income' },
              { type: 'mao', title: 'Maximum Allowable Offer', desc: 'Find max purchase price for profit' },
              { type: 'brrrr', title: 'BRRRR Strategy', desc: 'Buy, Rehab, Rent, Refinance, Repeat' },
              { type: 'wholesale', title: 'Wholesale', desc: 'Calculate wholesale deal margins' }
            ].map((calc) => (
              <div
                key={calc.type}
                onClick={() => setCalculatorType(calc.type as CalculatorType)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{calc.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{calc.desc}</p>
                <button
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Deal Calculator" subtitle="Run the numbers on your next deal" />

      <div className="p-8">
        <button
          onClick={() => setCalculatorType(null)}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Calculators
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {calculatorType === 'flip' && 'Fix & Flip ROI'}
              {calculatorType === 'rental' && 'Rental Cash Flow'}
              {calculatorType === 'mao' && 'Maximum Allowable Offer'}
              {calculatorType === 'brrrr' && 'BRRRR Strategy'}
              {calculatorType === 'wholesale' && 'Wholesale'}
            </h2>

            <form onSubmit={handleCalculate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Price</label>
                <input
                  type="number"
                  name="property_price"
                  placeholder="250000"
                  value={formData.property_price}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {(calculatorType === 'flip' || calculatorType === 'mao' || calculatorType === 'wholesale') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Repair Cost</label>
                  <input
                    type="number"
                    name="repair_cost"
                    placeholder="50000"
                    value={formData.repair_cost}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {(calculatorType === 'flip' || calculatorType === 'mao') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">After Repair Value</label>
                  <input
                    type="number"
                    name="after_repair_value"
                    placeholder="350000"
                    value={formData.after_repair_value}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {calculatorType === 'rental' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                    <input
                      type="number"
                      name="monthly_rent"
                      placeholder="2000"
                      value={formData.monthly_rent}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Expenses</label>
                    <input
                      type="number"
                      name="monthly_expenses"
                      placeholder="600"
                      value={formData.monthly_expenses}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Calculating...' : 'Calculate'}
              </button>
            </form>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Results</h3>
              <div className="space-y-4">
                {Object.entries(result).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-gray-600 text-sm capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {typeof value === 'number' ? (
                        key.includes('percent') || key.includes('rate')
                          ? `${value.toFixed(2)}%`
                          : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      ) : (
                        String(value)
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
