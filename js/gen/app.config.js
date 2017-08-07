app.config = {
	env					: 'beta',
	version				: '1.0.3',
	envs	: {
		alpha: {	// loads local data only
			base_url	: 'http://app.dev.withease.io:3001/',
			api_url		: 'http://api.dev.withease.io:3000/',
			port		: 3001,
		},
		beta: {		// tests local network
			base_url	: 'http://app.dev.withease.io:3001/',
			api_url		: 'http://api.dev.withease.io:3000/',
			port		: 3001,
		},
		sisbot: (function() {
			return {
				base_url	: window.location.href,
				api_url		: window.location.href,
				port		: 3001,
			}
		})(),
		prod: {
			base_url	: 'https://app.sisyphus.withease.io/',
			api_url		: 'https://api.sisyphus.withease.io/',
			base_port	: 443,
		}
	},
	get_base_url: function () {
		return this.envs[this.env].base_url;
	},
	get_api_url: function () {
		return this.envs[this.env].api_url;
	},
	get_thumb_url: function () {
		if (this.env == 'alpha') {
			return '';
		} else if (app.platform == 'Android') {
			return 'http://' + app.manager.get_model('sisbot_id').get('data.local_ip') + ':3001/';
		} else if (app.is_app == true || this.env == 'sisbot') {
			return 'http://' + app.manager.get_model('sisbot_id').get('data.hostname') + ':3001/';
		} else {
			return 'https://app.sisyphus.withease.io/';
		}
	}
};

// if its an ip address or sisyphus.local, it'll set itself to sisbot
if (window.location.href.indexOf('withease') < 0)			app.config.env = 'sisbot';
if (window.location.href.indexOf('.local') > -1)			app.config.env = 'sisbot';
if (window.location.href.indexOf('192.168') > -1)			app.config.env = 'sisbot';

// for any url not including dev, assumes prod env
if (window.location.href.indexOf('sisyphus.withease') > -1)	app.config.env = 'prod';
if (window.location.href.indexOf('siscloud.withease') > -1)	app.config.env = 'prod';
if (window.cordova)											app.config.env = 'prod';
if (window.location.hostname == '')							app.config.env = 'prod';
