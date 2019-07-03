app.config = {
	env					: 'prod',
	version				: '1.8.15', //Pushing to Test Flight / Google Play for Community Test launch, 
	envs	: {
		alpha: {	// loads local data only
			base_url	: 'http://app.dev.withease.io:3001/', // local
			api_url		: 'https://api.sisyphus.withease.io/',
			web_url		: 'http://dev.webcenter.sisyphus-industries.com/',
			sisbot_url  : 'http://api.dev.withease.io:3000/', //talking to sisbot
			port		: 3001,
		},
		beta: {		// tests local network
			base_url	: 'http://app.dev.withease.io:3001/', //local url 
			api_url		: 'http://dev.webcenter.sisyphus-industries.com/', // add entry in your computers /etc/hosts mapped to your bot's IP address
			web_url		: 'http://dev.webcenter.sisyphus-industries.com/', //web_center url	***Change to this for Rails web_center= http://localhost:3000/  (aka rails s) //  10.0.0.3	beta_bot.local
			sisbot_url  : '192.168.1.54:3002', //talking to sisbot    //  ... or just put your URL in here '192.168.XX.XXX:3002' << for local Dev Env --insert your ip address + 3000
			port		: 3001, //work=192.168.1.168:3002 home=192.168.1.5:3002
		}, 		
  		sisbot: (function() {
			return {
				base_url	: window.location.href, 
				api_url		: 'http://dev.webcenter.sisyphus-industries.com/',
				web_url		: 'http://dev.webcenter.sisyphus-industries.com/',
				sisbot_url  : window.location.href, //talking to sisbot
				port		: 3001,
			}
		})(),
		prod: {
			base_url	: 'http://dev.webcenter.sisyphus-industries.com/',
			api_url		: 'http://dev.webcenter.sisyphus-industries.com/',
			web_url		: 'http://dev.webcenter.sisyphus-industries.com/',
			sisbot_url  : 'http://dev.webcenter.sisyphus-industries.com/',
			base_port	: 443,
		},
  		wc_test: (function() {
			return {
				base_url	: window.location.href, 
				api_url		: 'http://dev.webcenter.sisyphus-industries.com/',
				web_url		: 'http://dev.webcenter.sisyphus-industries.com/',
				sisbot_url  : window.location.href, //talking to sisbot
				port		: 3001,
			}
		})()
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
if (window.location.href.indexOf('withease') < 0)		app.config.env = 'sisbot'; 
if (window.location.href.indexOf('localhost') > -1)		app.config.env = 'beta';   
if (window.location.href.indexOf('.local') > -1) app.config.env = 'sisbot';
if (window.location.href.indexOf('192.168') > -1) app.config.env = 'sisbot';

// for any url not including dev, assumes prod env
if (window.location.href.indexOf('sisyphus.withease') > -1) app.config.env = 'prod';
if (window.location.href.indexOf('siscloud.withease') > -1) app.config.env = 'prod';
if (window.cordova) app.config.env = 'prod';
if (window.location.hostname == '') app.config.env = 'prod';

// REMOVE this when done testing with webcenter DEV
//app.config.env = 'wc_test';



