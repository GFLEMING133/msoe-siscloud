var config = {
    version : '1.8.12', //Test launching after updating Cordova and API Level , Gradel updated to 4.10 in the update as well. 
    debug   : true,
    env     : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
