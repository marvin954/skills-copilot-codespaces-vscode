/**
 * Deal Calculator Service
 * Calculate ROI, cash flow, MAO, and other investment metrics
 */

class DealCalculator {
  /**
   * Calculate ROI for fix & flip
   * @param {Object} params - Flip parameters
   * @returns {Object} - ROI calculation result
   */
  static calculateFlipROI(params) {
    const {
      purchasePrice,
      repairCosts = 0,
      sellingCosts = 0,
      afterRepairValue = 0,
      holdingCosts = 0
    } = params;

    // Validate inputs
    if (!purchasePrice || purchasePrice <= 0) {
      throw {
        status: 400,
        message: 'purchasePrice must be greater than 0'
      };
    }

    const totalInvestment = purchasePrice + repairCosts + holdingCosts;
    const profit = afterRepairValue - totalInvestment - sellingCosts;
    const roi = (profit / totalInvestment) * 100;
    const profitPerMonth = profit / 6; // Assume 6 month average hold

    return {
      strategy: 'Fix & Flip',
      input: {
        purchasePrice,
        repairCosts,
        afterRepairValue,
        sellingCosts,
        holdingCosts
      },
      calculations: {
        totalInvestment,
        grossProfit: afterRepairValue - totalInvestment,
        netProfit: profit,
        roi: Math.round(roi * 100) / 100,
        roiPercentage: `${Math.round(roi * 100) / 100}%`,
        profitPerMonth: Math.round(profitPerMonth),
        profitMargin: Math.round(((profit / afterRepairValue) * 100) * 100) / 100
      },
      recommendation: this.getFlipRecommendation(roi)
    };
  }

  /**
   * Calculate monthly cash flow for rental property
   */
  static calculateCashFlow(params) {
    const {
      monthlyRent,
      propertyTax = 0,
      insurance = 0,
      maintenance = 0,
      utilities = 0,
      vacancy = 5, // percentage
      mortgagePayment = 0,
      hoa = 0
    } = params;

    if (!monthlyRent || monthlyRent <= 0) {
      throw {
        status: 400,
        message: 'monthlyRent must be greater than 0'
      };
    }

    // Account for vacancy rate
    const effectiveRent = monthlyRent * (1 - vacancy / 100);
    
    // Total monthly expenses
    const totalExpenses = propertyTax + insurance + maintenance + utilities + mortgagePayment + hoa;
    
    // Calculate cash flow
    const monthlyNetCashFlow = effectiveRent - totalExpenses;
    const annualCashFlow = monthlyNetCashFlow * 12;
    
    // Calculate cap rate (simplified - needs property price)
    const cashOnCashReturn = 0; // Would need down payment

    return {
      strategy: 'Rental',
      input: {
        monthlyRent,
        propertyTax,
        insurance,
        maintenance,
        utilities,
        vacancy,
        mortgagePayment,
        hoa
      },
      calculations: {
        effectiveMonthlyRent: Math.round(effectiveRent),
        totalMonthlyExpenses: Math.round(totalExpenses),
        monthlyNetCashFlow: Math.round(monthlyNetCashFlow),
        annualNetCashFlow: Math.round(annualCashFlow),
        expenseRatio: Math.round(((totalExpenses / monthlyRent) * 100) * 100) / 100,
        capRate: 'N/A - provide property price for calculation'
      },
      recommendation: this.getRentalRecommendation(monthlyNetCashFlow)
    };
  }

  /**
   * Calculate Maximum Allowable Offer (MAO)
   * MAO = ARV - (Repairs) - (Holding Costs) - (Exit Costs) - (Desired Profit)
   */
  static calculateMAO(params) {
    const {
      afterRepairValue,
      estimatedRepairs = 0,
      holdingCosts = 0,
      exitCosts = 0,
      desiredProfit = 0,
      profitMargin = 0.2 // 20% default
    } = params;

    if (!afterRepairValue || afterRepairValue <= 0) {
      throw {
        status: 400,
        message: 'afterRepairValue must be greater than 0'
      };
    }

    // Calculate desired profit if not provided
    const actualProfit = desiredProfit || (afterRepairValue * profitMargin);
    
    // MAO formula
    const mao = afterRepairValue - estimatedRepairs - holdingCosts - exitCosts - actualProfit;

    return {
      strategy: 'Maximum Allowable Offer',
      input: {
        afterRepairValue,
        estimatedRepairs,
        holdingCosts,
        exitCosts,
        desiredProfit,
        profitMargin: `${profitMargin * 100}%`
      },
      calculations: {
        desiredProfit: Math.round(actualProfit),
        totalDeductions: Math.round(estimatedRepairs + holdingCosts + exitCosts + actualProfit),
        maximumOfferPrice: Math.round(mao),
        pricePercentOfARV: Math.round(((mao / afterRepairValue) * 100) * 100) / 100
      },
      breakdown: {
        afterRepairValue,
        less: {
          repairs: estimatedRepairs,
          holding: holdingCosts,
          exit: exitCosts,
          profit: Math.round(actualProfit)
        },
        equals: {
          mao: Math.round(mao)
        }
      }
    };
  }

  /**
   * Calculate BRRRR analysis (Buy, Rehab, Rent, Refinance, Repeat)
   */
  static calculateBRRRR(params) {
    const {
      purchasePrice,
      repairCosts,
      closingCosts = 0,
      afterRepairValue,
      loanToValue = 0.75, // Refinance LTV
      monthlyRent,
      monthlyExpenses,
      propertyPrice = afterRepairValue // For refinance valuation
    } = params;

    if (!purchasePrice || !repairCosts || !afterRepairValue || !monthlyRent) {
      throw {
        status: 400,
        message: 'purchasePrice, repairCosts, afterRepairValue, and monthlyRent are required'
      };
    }

    const totalInvestment = purchasePrice + repairCosts + closingCosts;
    const refinanceAmount = propertyPrice * loanToValue;
    const capitalReturned = refinanceAmount - totalInvestment;
    const monthlyProfit = monthlyRent - monthlyExpenses;
    const annualProfit = monthlyProfit * 12;
    const cashOnCashReturn = capitalReturned > 0 ? ((annualProfit / capitalReturned) * 100) : 0;

    return {
      strategy: 'BRRRR (Buy, Rehab, Rent, Refinance, Repeat)',
      input: params,
      calculations: {
        'Step 1: Buy': {
          purchasePrice,
          closingCosts,
          totalAcquisitionCost: purchasePrice + closingCosts
        },
        'Step 2: Rehab': {
          repairCosts
        },
        'Step 3: Rent': {
          monthlyRent,
          monthlyExpenses,
          monthlyNetProfit: monthlyProfit,
          annualNetProfit: annualProfit
        },
        'Step 4: Refinance': {
          propertyValue: propertyPrice,
          loanToValuePercent: `${loanToValue * 100}%`,
          refinanceAmount: Math.round(refinanceAmount),
          initialInvestment: Math.round(totalInvestment),
          capitalReturned: Math.round(capitalReturned),
          capitalReturnedPercent: capitalReturned > 0 ? Math.round(((capitalReturned / totalInvestment) * 100) * 100) / 100 + '%' : '0%'
        },
        'Step 5: Repeat': {
          cashAvailableToRepeat: Math.round(Math.max(0, capitalReturned)),
          cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100 + '%'
        }
      }
    };
  }

  /**
   * Wholesaler quick analysis
   */
  static calculateWholesaleAnalysis(params) {
    const {
      marketValue,
      purchasePrice,
      repairCosts,
      buyerMargin = 0.2, // 20% profit for buyer
      wholesaleFee = 0.05 // 5% for wholesaler
    } = params;

    if (!marketValue || !purchasePrice) {
      throw {
        status: 400,
        message: 'marketValue and purchasePrice are required'
      };
    }

    const buyerAllowance = (repairCosts + (marketValue * buyerMargin));
    const maxPurchasePrice = marketValue - buyerAllowance;
    const wholesaleFeeAmount = maxPurchasePrice * wholesaleFee;
    const wholesaleProfit = maxPurchasePrice - purchasePrice;

    return {
      strategy: 'Wholesale',
      input: params,
      calculations: {
        marketValue,
        purchasePrice,
        repairCosts,
        buyerMargin: `${buyerMargin * 100}%`,
        buyerAllowance: Math.round(buyerAllowance),
        maxBuyerOffer: Math.round(maxPurchasePrice),
        wholesaleMargin: Math.round(wholesaleProfit),
        wholesaleFee: Math.round(wholesaleFeeAmount),
        profitPotential: Math.round(wholesaleProfit)
      },
      recommendation: wholesaleProfit > 0 ? 'Good wholesale deal' : 'Not a good deal for wholesaling'
    };
  }

  /**
   * Get recommendation for flip
   */
  static getFlipRecommendation(roi) {
    if (roi >= 30) return 'EXCELLENT - Strong flip opportunity';
    if (roi >= 20) return 'GOOD - Solid flip opportunity';
    if (roi >= 10) return 'FAIR - Marginal flip opportunity';
    if (roi > 0) return 'WEAK - Not recommended';
    return 'POOR - Avoid, likely to lose money';
  }

  /**
   * Get recommendation for rental
   */
  static getRentalRecommendation(monthlyCashFlow) {
    if (monthlyCashFlow >= 500) return 'EXCELLENT - Strong cash flowing property';
    if (monthlyCashFlow >= 200) return 'GOOD - Decent rental cash flow';
    if (monthlyCashFlow >= 0) return 'FAIR - Break-even property';
    if (monthlyCashFlow > -200) return 'WEAK - Negative cash flow';
    return 'POOR - Avoid, significant negative cash flow';
  }
}

module.exports = DealCalculator;
