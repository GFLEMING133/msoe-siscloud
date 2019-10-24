var config = {
	  version				: '1.8.66', // sign_out_community() added with icon and reworked Sort By for alignment. 5 Tap for apple now auto launches after 5th tap. Replaced pagination with infinite scrolling 
    debug         : true,
    env           : process.env.NODE_ENV,
    matt_dev: {
      base_dir	  : '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			  : 3001,
      base_url    : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
