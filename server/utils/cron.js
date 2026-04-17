const Property = require('../models/Property');

/**
 * Initializes a background garbage collection loop that runs periodically
 * to delete properties that have been marked as "sold" for over 24 hours.
 */
function initGarbageCollection() {
  const ONE_HOUR = 60 * 60 * 1000;
  
  // Checking every 1 hour
  setInterval(async () => {
    try {
      console.log('[Garbage Collection] Starting periodic sweep for expired sold properties...');

      const twentyFourHoursAgo = new Date(Date.now() - 24 * ONE_HOUR);

      const result = await Property.deleteMany({
        status: 'sold',
        soldAt: { $lt: twentyFourHoursAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`[Garbage Collection] Reclaimed space: deleted ${result.deletedCount} expired sold properties.`);
      } else {
        console.log('[Garbage Collection] No expired properties found.');
      }
    } catch (error) {
      console.error('[Garbage Collection] Error cleaning up expired properties:', error);
    }
  }, ONE_HOUR);
}

module.exports = { initGarbageCollection };
