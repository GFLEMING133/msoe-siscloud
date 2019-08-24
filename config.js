var config = {
	version				: '1.8.37', //adjusted sisyphus-header-tmp and Settings and Advanced page with padding and margin. Regression tested everything using 1.10.30(sisbot)
    debug     : true,
    env       : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
