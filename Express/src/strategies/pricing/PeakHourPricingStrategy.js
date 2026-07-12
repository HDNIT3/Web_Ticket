const PricingConstants = require('./PricingConstants');

class PeakHourPricingStrategy {
  isApplicable(startTime) {
    const date = new Date(startTime);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    const hour = date.getHours();

    if (day === 0 || day === 6) {
      return true; // Weekends are peak
    }
    return hour >= PricingConstants.PEAK_HOUR_START;
  }

  calculatePrice(standardPrice, startTime) {
    return Math.round(standardPrice * PricingConstants.PEAK_PRICE_MULTIPLIER);
  }
}

module.exports = PeakHourPricingStrategy;
