var config = {
  version				: '1.8.50', // removed unused functions to graveyardOfFunctions.js, uncommented console.logs from previous commit. 
    debug     : true,
    env       : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
