const PeakHourPricingStrategy = require('./PeakHourPricingStrategy');
const OffPeakPricingStrategy = require('./OffPeakPricingStrategy');

class PricingStrategyContext {
  constructor() {
    this.strategies = [
      new PeakHourPricingStrategy(), // Order 1
      new OffPeakPricingStrategy()   // Order 2
    ];
  }

  getPrice(standardPrice, startTime) {
    const applicableStrategy = this.strategies.find(strategy => strategy.isApplicable(startTime));
    
    if (!applicableStrategy) {
      throw new Error(`Không tìm thấy chiến lược giá phù hợp cho thời gian: ${startTime}`);
    }

    return applicableStrategy.calculatePrice(standardPrice, startTime);
  }
}

module.exports = new PricingStrategyContext();
