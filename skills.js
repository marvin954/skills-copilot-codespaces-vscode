function calculateNumbers(var1, var2) {
  const sum = var1 + var2;
  const difference = var1 - var2;
  const product = var1 * var2;
  const quotient = var2 !== 0 ? var1 / var2 : null;

  return {
    sum,
    difference,
    product,
    quotient
  };
}

module.exports = { calculateNumbers };
