var config = {
    debug   : true,
    env     : process.env.NODE_ENV,
    travis_dev: {
        base_dir		: '/Users/kiefertravis/Documents/ease/app',
    	port			: 3001,
        base_url        : 'https://app.dev.withease.io:3101/'
    },
    eric_dev: {
        base_dir		: '/Users/jackmeri/Documents/projects/ease/app',
    	port			: 3001,
        base_url        : 'https://app.dev.withease.io:3101/'
    },
    matt_dev: {
        base_dir		: '/Users/mattfox12/Documents/Sodo/Ease/app',
    	port			: 3001,
        base_url        : 'https://app.dev.withease.io:3101/'
    },
    jon_dev: {
        base_dir		: '/Users/Jon/Documents/ease/app',
    	port			: 3001,
        base_url        : 'https://app.dev.withease.io:3101/'
    },
    staging: {
        base_dir		: '/domains/app',
    	port			: 3001,
        base_url        : 'https://app.withease.io/'
    },
    plato: {
        base_dir		: '/domains/app',
    	port			: 3001,
        base_url        : 'https://app.withease.io/'
    },
    socrates: {
        base_dir		: '/domains/app',
    	port			: 3001,
        base_url        : 'https://app.socrates.withease.io/'
    }
};

module.exports = config;
