app.model.sisbot = {
	defaults: function (data) {
		//	IF WE ARE ON THE SISBOT WE SHOULD HAVE A DIFFERENT MODEL THAT ISSUES COMMANDS

		var obj = {
			id				: data.id,
			type			: 'sisbot',

			wifi_networks   : [],
			wifi			: {
				name			: '',
				password		: ''
			},

			data		: {
				id					: data.id,
				type    			: 'sisbot',
				version				: this.current_version,

				pi_id				: '',
				current_version		: '1.0',

				network_connected	: 'not connected',		// not connected|connected
                wifi_network        : '',
                wifi_password       : '',

				playlist_ids		: [],
				track_ids			: [],

				active_playlist		: 'false',
				active_track		: 'false',
				current_time		: 0,			// seconds

				is_playing			: 'false',
				is_homing			: 'false',
				is_shuffle			: 'false',
				is_loop				: 'false',
				brightness			: .5,
				speed				: .3,
			}
		};

		return obj;
	},
	current_version: 1,
	on_init: function () {
		this.listenTo(app, 'sisbot:update', this._update_sisbot_msg);

		//this.set('wifi.name', 'Sodo4');
		//this.set('wifi.password', '60034715CF25')
		//this.set('wifi.name', 'Nimbus');
		//this.set('wifi.password', 'so202donimbus')
		//this.connect_to_wifi();
		//this.reset_to_hotspot();
	},
	after_export: function () {
		app.current_session().set_active({ sisbot_id: 'false' });
	},
	_update_sisbot_msg: function(obj) {
		console.log('we want to play', obj);
		this._update_sisbot(obj.endpoint, obj.data, obj.cb);
	},
	_update_sisbot: function (endpoint, data, cb) {

		var obj = {
			_url	: 'http://sisyphus.local/',
			_type	: 'POST',
			endpoint: 'sisbot/' + endpoint,
			data	: data
		};

		app.post.fetch(obj, function(resp) {
			if (cb) cb(resp);
		});
	},
	/**************************** SISBOT ADMIN ********************************/
	get_networks: function () {
		var self			= this;
		var wifi_networks	= [];

		this._update_sisbot('get_wifi', { iface: 'wlan0', show_hidden: true }, function(obj) {
			_.each(obj.resp, function(network_obj) {
				if (network_obj.ssid.indexOf('sisyphus') < 0) {
					wifi_networks.push(network_obj.ssid);
				}
			})
			self.set('wifi_networks', wifi_networks.sort());
		});
    },
    connect_to_wifi: function () {
		var self		= this;
		var credentials = this.get('wifi');

		this._update_sisbot('change_to_wifi', { ssid: credentials.name, psk: credentials.password }, function(obj) {
			self.set('data.network_connected', 'connected');
			self.set('data.wifi_network', credentials.name);
			self.set('data.wifi_password', credentials.password);
			app.current_session().set_active({ secondary: 'false' });

			setTimeout(function() {
				self.is_network_connected();
			}, 5000);
		});
    },
	disconnect_wifi: function () {
		this.set('data.network_connected', 'not connected')
			.set('data.wifi_network', 'false')
			.set('data.wifi_password', 'false');
	},
	is_network_connected: function () {
		var self = this;

		this._update_sisbot('is_network_connected', {}, function(obj) {
			console.log('is network connected', obj);
			if (obj.resp == true) {
				self.set('data.network_connected', 'connected');
			} else {
				self.set('data.network_connected', 'not connected')
					.set('data.wifi_network', 'false')
					.set('data.wifi_password', 'false');
			}
		});
	},
	install_updates: function () {

	},
	restart: function () {

	},
	factory_reset: function () {

	},
	reset_to_hotspot: function () {
		this._update_sisbot('reset_to_hotspot', {}, function(obj) {
			console.log('RESET', obj);
		});
	},
	/**************************** PLAYBACK ************************************/
	update_playback: function (obj) {
		// playlist_id, track_id
		var active_playlist = 'false';
		var active_track	= 'false';

		if (obj.playlist_id) active_playlist = obj.playlist_id;;
		if (obj.track_id) active_track = obj.track_id;

		if (obj.playlist_id && !obj.track_id) {
			var p = app.collection.get(obj.playlist_id).get('data.track_ids');
			active_track = p[0];
		}

		this.set('data.active_playlist', active_playlist);
		this.set('data.active_track', active_track);

	},
	home: function () {
		this.set('data.is_homing', 'true');
		this._update_sisbot('home', {});
	},
	prev: function () {
		this._update_sisbot('prev', {});
	},
	next: function () {
		this._update_sisbot('playNextTrack', {});
	},
	play: function () {
		this.set('data.is_playing', 'true');
		this._update_sisbot('play', {});
	},
	pause: function () {
		this.set('data.is_playing', 'false');
		this._update_sisbot('pause', {});
	},
	brightness: function (level) {
		this.set('data.brightness', +level);
		this._update_sisbot('set_brightness', { value: +level });
	},
	brightness_up: function () {
		var level = +this.get('data.brightness');
		if (level <= .95) level = level + .05;
		this.brightness(level);
	},
	brightness_down: function () {
		var level = +this.get('data.brightness');
		if (level >= .05) level = level - .05;
		this.brightness(level);
	},
	speed: function (level) {
		this.set('data.speed', +level);
		this._update_sisbot('set_speed', { value: +level });
	},
	speed_up: function () {
		var level = +this.get('data.speed');
		if (level <= .95) level = level + .05;
		this.speed(level);
	},
	speed_down: function () {
		var level = +this.get('data.speed');
		if (level >= .05) level = level - .05;
		this.speed(level);
	},
	/**************************** COMMUNITY ***********************************/
	download_playlist: function (playlist_id) {

	},
	download_track: function (track_id) {

	}
};
