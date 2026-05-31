/**
 * Deal Calculator API Routes
 * POST /api/calculator/roi - Calculate ROI (flip)
 * POST /api/calculator/cashflow - Calculate cash flow (rental)
 * POST /api/calculator/mao - Maximum Allowable Offer
 * POST /api/calculator/brrrr - BRRRR analysis
 * POST /api/calculator/wholesale - Wholesale analysis
 */
const express = require('express');
const router = express.Router();
const DealCalculator = require('../services/DealCalculator');

/**
 * Calculate ROI for fix & flip
 * POST /api/calculator/roi
 * Body: {purchasePrice, repairCosts, afterRepairValue, sellingCosts, holdingCosts}
 */
router.post('/roi', (req, res, next) => {
  try {
    const result = DealCalculator.calculateFlipROI(req.body);
    res.json({
      success: true,
      message: 'ROI calculation completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Calculate monthly cash flow for rental
 * POST /api/calculator/cashflow
 * Body: {monthlyRent, propertyTax, insurance, maintenance, utilities, vacancy, mortgagePayment, hoa}
 */
router.post('/cashflow', (req, res, next) => {
  try {
    const result = DealCalculator.calculateCashFlow(req.body);
    res.json({
      success: true,
      message: 'Cash flow calculation completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Calculate Maximum Allowable Offer
 * POST /api/calculator/mao
 * Body: {afterRepairValue, estimatedRepairs, holdingCosts, exitCosts, desiredProfit}
 */
router.post('/mao', (req, res, next) => {
  try {
    const result = DealCalculator.calculateMAO(req.body);
    res.json({
      success: true,
      message: 'MAO calculation completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Calculate BRRRR analysis
 * POST /api/calculator/brrrr
 * Body: {purchasePrice, repairCosts, closingCosts, afterRepairValue, loanToValue, monthlyRent, monthlyExpenses}
 */
router.post('/brrrr', (req, res, next) => {
  try {
    const result = DealCalculator.calculateBRRRR(req.body);
    res.json({
      success: true,
      message: 'BRRRR analysis completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Calculate wholesale analysis
 * POST /api/calculator/wholesale
 * Body: {marketValue, purchasePrice, repairCosts, buyerMargin, wholesaleFee}
 */
router.post('/wholesale', (req, res, next) => {
  try {
    const result = DealCalculator.calculateWholesaleAnalysis(req.body);
    res.json({
      success: true,
      message: 'Wholesale analysis completed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
