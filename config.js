var config = {
	version			: '1.8.48', //Reworked scrollDown media queries using max-height: calc(), removed max-height from .web .app {} in css per Matt, removed white from the app.data.js, primary & secondary-color-tmp have new on-click to publish instead of canceling data. Added data-rangetype='true' in the <input> sliding bar in the settings for brightness.
    debug     : true,
    env       : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
