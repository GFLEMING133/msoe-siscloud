var config = {
    version : '1.8.32', //iPhone media queries now fixed for notch, multiple ui changes for iPhone , testing app before merging with Staging
    debug   : true,
    env     : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
