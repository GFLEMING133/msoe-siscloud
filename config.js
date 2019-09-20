var config = {
  version				: '1.8.55', // Save after White slider change, led offset change, disable Homing offset for servo, disable autobrightness in onboarding page
    debug     : true,
    env       : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
