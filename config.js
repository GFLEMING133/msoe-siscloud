var config = {
	  version				: '1.8.68', // read CHANGELOG.md push for roll into production with sisbot 1.9.49 /rendering issues addressed and db filename errors fixed for Community, 
    debug         : true,
    env           : process.env.NODE_ENV,
    matt_dev: {
      base_dir	  : '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			  : 3001,
      base_url    : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
