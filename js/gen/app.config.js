app.config = {
	env		: 'alpha',
	envs	: {
		alpha: {
			base_url	: 'https://app.dev.withease.io:3101/',
			api_url		: 'https://api.dev.withease.io:3101/',
			uploads_url	: 'https://uploads.dev.withease.io:3101/',
			port		: 3101,
		},
		staging: {
			base_url	: 'https://app.withease.io/',
			api_url		: 'https://staging.withease.io/',
			uploads_url	: 'https://uploads.withease.io/',
			base_port	: 443,
		},
		sisyphus: {
			base_url	: 'https://app.sisyphus.withease.io/',
			api_url		: 'https://api.sisyphus.withease.io/',
			uploads_url	: 'https://uploads.sisyphus.withease.io/',
			base_port	: 443,
		},
		socrates: {
			base_url	: 'https://app.socrates.withease.io/',
			api_url		: 'https://api.socrates.withease.io/',
			uploads_url	: 'https://uploads.socrates.withease.io/',
			base_port	: 443,
		},
		prod: {
			base_url	: 'https://app.withease.io/',
			api_url		: 'https://api.withease.io/',
			uploads_url	: 'https://uploads.withease.io/',
			base_port	: 443,
		},
		server: {
			base_url	: '',
			api_url		: '',
			uploads_url	: '',
			base_port	: 443
		}
	},
	get_base_url: function () {
		return this.envs[this.env].base_url;
	},
	get_api_url: function () {
		return this.envs[this.env].api_url;
	},
	get_uploads_url: function () {
		return this.envs[this.env].uploads_url;
	},
	pushwoosh: {
		app_id				: '',
		android_project_id	: '',
		auth_token			: ''
	},
	stripe_key: {
		alpha		: '',
		testing		: '',
		beta		: '',
		prod		: ''
	},
};

if (window.location.href.indexOf('server') > -1)			app.config.env = 'server';
if (window.location.href.indexOf('plato') > -1)				app.config.env = 'staging';
if (window.location.href.indexOf('socrates') > -1)			app.config.env = 'socrates';
if (window.location.href.indexOf('sisyphus.withease') > -1)	app.config.env = 'sisyphus';
if (window.location.href.indexOf('siscloud.withease') > -1)	app.config.env = 'sisyphus';
if (window.location.href.indexOf('app.withease') > -1)		app.config.env = 'staging';
if (window.location.href.indexOf('tinyknightapp') > -1)		app.config.env = 'socrates';
if (window.cordova)											app.config.env = 'staging';
if (window.location.hostname == '')							app.config.env = 'staging';
