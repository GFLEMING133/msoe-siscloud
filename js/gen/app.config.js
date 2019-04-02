app.config = {
	env					: 'beta',
	version				: '1.7.1',
	disconnect_timeout_to_stop_polling : 20000,
	envs	: {
		alpha: {	// loads local data only
			api_url		: 'http://api.dev.withease.io:3000/',
			webcenter_url : 'http://api.dev.withease.io:3000/',
			port		: 3001,
		},
		// user_data._url		= 'http://192.168.1.38:3000/'; //work
			// user_data._url		= 'http://3.16.18.164/'; //AWS
			// user_data._url		= 'http://192.168.29.135:3000/'; //home
			// user_data._url		= 'http://10.0.1.146:3000/'; //NE-Makers
			// api_url		: 'http://10.0.1.146:3000/', //NE-Makers
			// webcenter_url : 'http://10.0.1.146:3000/', //NE-Makers
		beta: {		// tests local network
			api_url		: 'http://192.168.1.38:3000/',
			webcenter_url : 'http://192.168.1.38:3000/',
			port		: 3001,
		},
		sisbot: (function() {
			return {
				api_url		: window.location.href,
				webcenter_url : 'http://192.168.1.38:3000/',
				port		: 3001,
			}
		})(),
		prod: {
			api_url		: 'https://api.sisyphus.withease.io/',
			// api_url		: 'http://webcenter.sisyphus-industries.com/',
			webcenter_url : 'http://webcenter.sisyphus-industries.com/',
			base_port	: 443,
		}
	},
	get_api_url: function () {
		//removed[this.env] & replaced with beta as it was calling the envs.sisbot and changing the url
		return this.envs.beta.api_url;
		return this.envs[this.env].api_url;
	},
	// get_thumb_url: function () {
	// 	if (this.env == 'alpha') {
	// 		return '';
	// 	} else {
	// 		//change this to get the RIGHT thumbnail /webcenter.sisyphus-industries.com/uploads/track/svg/3(track.id)/dribble.svg
	// 		return 'http://' + app.manager.get_model('sisbot_id').get('data.local_ip') + ':3001/';
	// 	}
	// },
	// get_thumb_size: function () {
	// 	var firmware = app.manager.get_model('sisbot_id').get('data.software_version').split('.');
	// 	if (+(firmware[1]) >= 1) {
	// 		return '100';
	// 	} else {
	// 		return '50';
	// 	}
	// },
	get_webcenter_url: function () {
		//removed[this.env] & replaced with beta as it was calling the envs.sisbot and changing the url
		return this.envs[this.env].webcenter_url;
	}
};

//
// Look at URL we pulled the app from and setup the correct environment
//

// if its an ip address or sisyphus.local, it'll set itself to sisbot
if (window.location.href.indexOf('withease') < 0)			{ console.log("SETTING ENV from withease to sisbot"); app.config.env = 'sisbot'; }
if (window.location.href.indexOf('.local') > -1)			{ console.log("SETTING ENV from .local to sisbot"); app.config.env = 'sisbot'; }
if (window.location.href.indexOf('192.168') > -1)			{ console.log("SETTING ENV from 192.168 to sisbot"); app.config.env = 'sisbot'; }

// for any url not including dev, assumes prod env
if (window.location.href.indexOf('sisyphus.withease') > -1)	{ console.log("SETTING ENV from sisyphus.withease to prod"); app.config.env = 'prod'; }
if (window.location.href.indexOf('siscloud.withease') > -1)	{ console.log("SETTING ENV from siscloud.withease to prod"); app.config.env = 'prod'; }
if (window.cordova)										{ console.log("SETTING ENV cordova to prod"); app.config.env = 'prod'; }
if (window.location.hostname == '')		{ console.log("SETTING ENV from empty string to prod"); app.config.env = 'prod'; }


