var config = {
    version : '1.8.21', ////staging branch push with Sis Firmware Version 1.10.29 for update changes to regression test.
    debug   : true,
    env     : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
