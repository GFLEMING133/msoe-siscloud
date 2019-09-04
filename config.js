var config = {
	version				: '1.8.45', // Changing deployment target and fixing Device Orientation defaults. Added Traingle back to No Table Found for Apples internal testing of the app
    debug     : true,
    env       : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
