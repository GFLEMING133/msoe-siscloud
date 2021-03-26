var _         = require('underscore');

var config = {     // REMEMBER TO CHANGE is_production and is_simulator!!!!!
	base: {
	  version				:  '1.10.54', // Read CHANGELOG.md THIS IS NODE READS
	  debug         : false,
		folders: {
			index: '/home/pi/sisbot-server/siscloud/',
			prod: '/home/pi/sisbot-server/siscloud/prod',
			thumbnails: '/home/pi/sisbot-server/siscloud/img/tracks', // pngs
			logs: '/var/log/sisyphus',
		}
	},
	v2: {
		folders: {
			index: '/content/prod',
			prod: '/content/prod',
			thumbnails: '/content/img', // pngs
			logs: '/logs',
		}
	},
  matt: {
    base_dir	  : '/Users/mattfox12/Documents/Sisyphus/cloud',
    port			  : 3001,
    base_url    : 'http://app.dev.withease.io:3000/',
		folders: {
			index: '/Users/mattfox12/Documents/Sisyphus/cloud/',
			prod: '/Users/mattfox12/Documents/Sisyphus/cloud/prod',
			thumbnails: '/Users/mattfox12/Documents/Sisyphus/cloud/img/tracks', // pngs
			logs: '/Users/mattfox12/Documents/Sisyphus/logs',
		}
  },
  buster: {
    base_dir	  : '/home/pi/sisbot-server/siscloud',
    port			  : 3001,
    // base_url    : 'http://app.dev.withease.io:3000/',
		folders: {
			index: '/home/pi/sisbot-server/siscloud/',
			prod: '/home/pi/sisbot-server/siscloud/prod',
			thumbnails: '/home/pi/sisbot-server/siscloud/img/tracks', // pngs
			logs: '/var/log/sisyphus',
		}
  }
};

var config_obj = config.base;
if (process.env.NODE_ENV != undefined) {
	var envs = process.env.NODE_ENV.split('_');
	_.each(envs, function(env) {
		if (config[env] != undefined) _.extend(config_obj, config[env]);
	});
}

// run functions to eliminate them
var keys = Object.keys(config_obj);
_.each(keys, function(key) {
	if (_.isFunction(config_obj[key])) {
		config_obj[key] = config_obj[key]();
	}
});

module.exports = config_obj;
