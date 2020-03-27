app.config = {
	env				: 'prod', //
	version			:  '1.9.12', // keyboard dismissal fix with cordova-plugin-wkkeyboardfix
	disconnect_timeout_to_stop_polling: 45000, // stop trying to find tables after 45 seconds
	extended_timeout_to_stop_polling: 90000, // stop trying to find tables when rebooting
	is_production	: true,
	is_debug		: 'false', // for html to show custom debugging html, use string value
	is_simulator 	: false, // are we in a simulator? Mainly for handling bluetooth
	simulator_ip 	: '192.168.1.6', // force a specific network address in simulator
	show_comments	: false,
	show_data		: false,
	show_lib		: false,
	show_tg			: false, // for testing
	envs	: {
		alpha: {	// loads local data only **5 tap on No Table Found Screen to launch shell app
			base_url		: 'http://app.dev.withease.io:3001/', // local
			api_url			: 'http://dev.webcenter.sisyphus-industries.com/',
			web_url			: 'http://dev.webcenter.sisyphus-industries.com/',
			sisbot_url  	: 'http://api.dev.withease.io:3000/', //talking to sisbot
			port			: 3001,
		},
		beta: {		// tests local network
			base_url		: 'http://app.dev.withease.io:3001/', //local url
			api_url			: 'https://webcenter.sisyphus-industries.com/', // PRODUCTION
			web_url			: 'https://webcenter.sisyphus-industries.com/', // PRODUCTION
			// api_url			: 'http://3.214.203.248/', //change these to dev.webcenter for next push to TF and GP
			// web_url			: 'http://3.214.203.248/',
			// api_url			: 'http://dev.webcenter.sisyphus-industries.com/', // DEV
			// web_url			: 'http://dev.webcenter.sisyphus-industries.com/', // DEV
			// api_url			: 'http://localhost:3333/',// add entry in your computers /etc/hosts mapped to your bot's IP address
			// web_url			: 'http://localhost:3333/', //web_center url	***Change to this for Rails web_center= http://localhost:3333/  (aka rails s) //  10.0.0.3	beta_bot.local
			sisbot_url  	: 'http://192.168.1.06:3002', //talking to sisbot    //  ... or just put your URL in here '192.168.XX.XXX:3002' << for local Dev Env --insert your ip address + 3000
			port			: 3001,
			show_tg			: true
		},
		training: {
			base_url		: 'http://app.dev.withease.io:3001/', //local url
			api_url			: 'https://webcenter.sisyphus-industries.com/', // production
			web_url			: 'https://webcenter.sisyphus-industries.com/', // production
			// api_url			: 'http://localhost:3333/', // webcenter 
			// web_url			: 'http://localhost:3333/', // webcenter
			// api_url			: 'http://dev.webcenter.sisyphus-industries.com/', // dev
			// web_url			: 'http://dev.webcenter.sisyphus-industries.com/', // dev
			sisbot_url  	: 'http://192.168.1.06:3002', //talking to sisbot    // ... or just put your URL in here '192.168.XX.XXX:3002' << for local Dev Env --insert your ip address + 3000
			port			: 3001,
			show_tg			: true
		},
		matt: {
			base_url		: 'http://app.dev.withease.io:3001/', //local url
			api_url			: 'https://webcenter.sisyphus-industries.com/',
			web_url			: 'https://webcenter.sisyphus-industries.com/',
			// api_url			: 'http://localhost:3333/', // add entry in your computers /etc/hosts mapped to your bot's IP address
			// web_url			: 'http://localhost:3333/', //web_center url	***Change to this for Rails web_center= http://localhost:3333/  (aka rails s) //  10.0.0.3	beta_bot.local
			sisbot_url  	: 'http://192.168.86.26:3002', // 33: wall, 26: mini
			port			: 3001,
		},
		sisbot: {
			base_url		: window.location.href,
			// api_url			: 'http://dev.webcenter.sisyphus-industries.com/', //change these to dev.webcenter for next push to TF and GP
			// web_url			: 'http://dev.webcenter.sisyphus-industries.com/',
			api_url			: 'https://webcenter.sisyphus-industries.com/',
			web_url			: 'https://webcenter.sisyphus-industries.com/',
			sisbot_url  	: window.location.href, //talking to sisbot
			port			: 3001,
		},
		prod: { // Android & iOS
			base_url		: 'false', // unused
			api_url			: 'https://webcenter.sisyphus-industries.com/', //change these to dev.webcenter for next push to TF and GP
			web_url			: 'https://webcenter.sisyphus-industries.com/',
			sisbot_url  	: 'false', // set when we find a bot
			base_port		: 443,
		}
	},
	get_base_url: function () {
		return this.envs[this.env].base_url;
	},
	get_api_url: function () {
		return this.envs[this.env].api_url;
	},
	get_sisbot_url: function () {
		return this.envs[this.env].sisbot_url;
	},
	set_sisbot_url: function (data) {
		console.warn("Sisbot URL: ", data);
		if(!data.match(/^https?:\/\//i)) data = 'http://' + data;

		if(!data.match(/:[0-9]+\/?$/i)) data += ":3002";
		this.envs[this.env].sisbot_url = data;
	},
	get_webcenter_url: function () {
		return this.envs[this.env].web_url;
	},
	get_thumb_url: function () {
		if (this.env == 'alpha') {
			return '';
		} else {
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
if (window.location.href.indexOf('localhost') > -1) {
	var fragment = window.location.hash;
	var env = 'beta';

	if (fragment.charAt(0) === '#') {
		fragment = fragment.slice(1);
		fragment = fragment.split('&');
		var count		= fragment.length;
		for (var i = 0; i < count; i++) {
			var obj = fragment[i].split('=');
			if (obj[0] == 'env') env = obj[1];
		}

		if (env != 'beta') {
			app.log("Env:", env);
			app.config.env = env;
			// app.config.envs.beta.base_url 		= app.config.envs[env].base_url;
			// app.config.envs.beta.api_url 		= app.config.envs[env].api_url;
			// app.config.envs.beta.web_url 		= app.config.envs[env].web_url;
			// app.config.envs.beta.sisbot_url 	= app.config.envs[env].sisbot_url;
		}
	}

	// app.log('Second 1/2' + !app.config.envs[env])
	if (env == 'beta' || !app.config.envs[env]) app.config.env = 'beta';
	app.log("Env:", env);
}
if (window.location.href.indexOf('.local') > -1)        app.config.env = 'sisbot';
if (window.location.href.indexOf('192.168') > -1) 			app.config.env = 'sisbot';

// for any url not including dev, assumes prod env
if (window.location.href.indexOf('sisyphus.withease') > -1) app.config.env = 'prod';
if (window.location.href.indexOf('siscloud.withease') > -1) app.config.env = 'prod';
if (window.cordova) app.config.env = 'prod';
if (window.location.hostname == '') app.config.env = 'prod';

// testing
if (app.config.envs[app.config.env].show_tg) app.config.show_tg = app.config.envs[app.config.env].show_tg;

// REMOVE this when done testing with webcenter DEV

