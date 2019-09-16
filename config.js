var config = {
  version				: '1.8.51', // Remember me is now working, removed back arrow from Community tracks added padding-bottom to <form> sign-in tmp</form>
    debug     : true,
    env       : process.env.NODE_ENV,
    matt_dev: {
      base_dir	: '/Users/mattfox12/Documents/Sodo/Ease/app',
      port			: 3001,
      base_url  : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
