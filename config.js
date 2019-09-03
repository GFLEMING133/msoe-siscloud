var config = {
	version				: '1.8.42', //Spread and Rho Fade Primary and Secondary pages styled and flex-justify-aligned added linear-gradient. Fixed community-hero from cloud overflowing outside of app on local-host
    debug     : true,
    env       : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
