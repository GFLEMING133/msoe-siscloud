app.config = {
	env					: 'beta',
	version				: '1.7.1',
	envs	: {
		alpha: {	// loads local data only
			base_url	: 'http://app.dev.withease.io:3001/',
			api_url		: 'http://api.dev.withease.io:3000/',
			port		: 3001,
		},
		beta: {		// tests local network
					// user_data._url		= 'http://192.168.1.38:3000/'; //work
					// user_data._url		= 'http://3.16.18.164/'; //AWS
					// user_data._url		= 'http://192.168.29.135:3000/'; //home
					// user_data._url		= 'http://10.0.1.146:3000/'; //NE-Makers
			base_url	: 'http://app.dev.withease.io:3001/',
			api_url		: 'http://10.0.1.146:3000/', //change this for the global url variable
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
		//removed[this.env] & replaced with beta as it was calling the envs.sisbot and changing the url
		return this.envs.beta.api_url;
	},
	get_thumb_url: function () {
		if (this.env == 'alpha') {
			return '';
		} else {
			//change this to get the RIGHT thumbnail /webcenter.sisyphus-industries.com/uploads/track/svg/3(track.id)/dribble.svg
			return 'http://' + app.manager.get_model('sisbot_id').get('data.local_ip') + ':3001/';
		}
	},
	get_thumb_size: function () {
		var firmware = app.manager.get_model('sisbot_id').get('data.software_version').split('.');
		if (+(firmware[1]) >= 1) {
			return '100';
		} else {
			return '50';
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
