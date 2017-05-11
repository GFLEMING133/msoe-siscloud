app.config = {
	env		: 'alpha',
	envs	: {
		alpha: {
			base_url	: 'http://app.dev.withease.io:3000/',
			api_url		: 'http://api.dev.withease.io:3000/',
			port		: 3101,
		},
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
	}
};

if (window.location.href.indexOf('sisyphus.withease') > -1)	app.config.env = 'prod';
if (window.location.href.indexOf('siscloud.withease') > -1)	app.config.env = 'prod';
if (window.cordova)											app.config.env = 'prod';
if (window.location.hostname == '')							app.config.env = 'prod';
