var config = {
    version : '1.8.23', //Sourced in fonts properly, added private and public to track list, Added Show Password to Sign in. Changed meta tag in dev.index to try and correnct iPhone XC Max swipe bar issue. READ MORE in CHANGELOG Community changes
    debug   : true,
    env     : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
