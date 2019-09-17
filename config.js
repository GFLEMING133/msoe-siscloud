var config = {
    version		: '1.8.53', // merged beta in and then merged into master after regression testing. Added a call to _update_pattern_colors() so edit{} was not empty on start
    debug     : true,
    env       : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
