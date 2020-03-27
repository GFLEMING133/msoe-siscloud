var config = {     // REMEMBER TO CHANGE is_production and is_simulator!!!!!
    version				:  '1.9.12', // keyboard dismissal fix with cordova-plugin-wkkeyboardfix
    debug         : false,
    env           : process.env.NODE_ENV,
    matt: {
      base_dir	  : '/Users/mattfox12/Documents/Sodo/Ease/Sisyphus/cloud',
      port			  : 3001,
      base_url    : 'http://app.dev.withease.io:3000/'
    }
};

module.exports = config;
