const PricingConstants = require('./PricingConstants');

class OffPeakPricingStrategy {
  isApplicable(startTime) {
    const date = new Date(startTime);
    const day = date.getDay();
    const hour = date.getHours();

    if (day === 0 || day === 6) {
      return false; // Weekends are not off-peak
    }
    return hour < PricingConstants.PEAK_HOUR_START;
  }

  calculatePrice(standardPrice, startTime) {
    return standardPrice; // Standard price for off-peak
  }
}

module.exports = OffPeakPricingStrategy;
