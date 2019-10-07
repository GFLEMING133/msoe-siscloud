var config = {
	version	      : '1.8.61', //set is_internet_connected to true in the _update_sisbot() in the env conditional for alpha to show Community for apple testing. Changed the api_url and web_url in the app.config in the alpha envs to point to https://webcenter.sisyphus-industries.com/, changing config #s
    debug         : true,
    env           : process.env.NODE_ENV,
    matt_dev: {
      base_dir	  : '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			  : 3001,
      base_url    : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
