var config = {
    version : '1.8.5', // CHANGELOG.md #2019-04-03
    debug   : true,
    env     : process.env.NODE_ENV,
    travis_dev: {
        base_dir		: '/Users/kiefertravis/Documents/ease/app',
    	port			: 3001,
        base_url        : 'http://app.dev.withease.io:3000/'
    },
    matt_dev: {
        base_dir		: '/Users/mattfox12/Documents/Sodo/Ease/app',
    	port			: 3001,
        base_url        : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
