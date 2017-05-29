app.model.sisbot = {
	defaults: function (data) {
		var obj = {
			id				: data.id,
			type			: 'sisbot',


			wifi_networks   : [],
			wifi			: {
				name			: '',
				password		: ''
			},

			is_connected	: false,
			is_jogging		: false,
			jog_type		: '',

			data		: {
				id					: data.id,
				type    			: 'sisbot',
				version				: this.current_version,

				hostname			: 'false',				// sisyphus.local
				local_ip			: '',					// 192.168.0.1:3001

				pi_id				: '',
				firmware_version	: '1.0',
				software_version	: '1.0',

				is_hotspot			: 'true',
				is_network_connected: 'false',

				is_internet_connected: 'false',
                wifi_network        : '',
                wifi_password       : '',

				playlist_ids		: [],
				track_ids			: [],

				active_playlist_id	: 'false',
				active_track_id		: 'false',

				current_time		: 0,					// seconds

				state				: 'waiting',			// playing|homing|paused|waiting

				is_homed			: 'false',				// Not used
				is_serial_open		: 'true',				// Not used

				is_shuffle			: 'true',
				is_loop				: 'false',
				brightness			: .5,
				speed				: .3,
			}
		};

		return obj;
	},
	current_version: 1,
	on_init: function () {
		//this.set('wifi.name', 'Sodo4');
		//this.set('wifi.password', '60034715CF25')
		//this.set('wifi.name', 'Nimbus');
		//this.set('wifi.password', 'so202donimbus')
		//this.connect_to_wifi();
		//this.reset_to_hotspot();
	},
	sisbot_listeners: function () {
		this.listenTo(app, 'sisbot:update_playlist', this.update_playlist);
		this.listenTo(app, 'sisbot:set_track', this.set_track);
		this.listenTo(app, 'sisbot:save', this.save_to_sisbot);
		this.listenTo(app, 'sisbot:playlist_add', this.playlist_add);
		this.listenTo(app, 'sisbot:playlist_remove', this.playlist_remove);
		this.listenTo(app, 'sisbot:track_add', this.track_add);
		this.listenTo(app, 'sisbot:track_remove', this.track_remove);
		this.get_state();
	},
	after_export: function () {
		app.current_session().set_active({ sisbot_id: 'false' });
	},
	_update_sisbot_msg: function(obj) {
		this._update_sisbot(obj.endpoint, obj.data, obj.cb);
	},
	_update_sisbot: function (endpoint, data, cb) {
		if (this.get('is_connected') == false)
			return this;

		var obj = {
			_url	: 'http://' + this.get('data.hostname') + '/',
			_type	: 'POST',
			endpoint: 'sisbot/' + endpoint,
			data	: data
		};

		app.post.fetch(obj, function(resp) {
			if (cb) cb(resp);
		});
	},
	/**************************** SISBOT ADMIN ********************************/
	get_state: function () {
		var self = this;

		if (this.get('is_connected')) {
			this._update_sisbot('state', {}, function(obj) {
				if (obj.resp)
					self.set('data', obj.resp);
			});
		}

		setTimeout(function () {
			self.get_state();
		}, 1000);

		return this;
	},
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
			self.set('data.is_internet_connected', 'true');
			self.set('data.wifi_network', credentials.name);
			self.set('data.wifi_password', credentials.password);
			app.current_session().set_active({ secondary: 'false' });

			setTimeout(function() {
				self.is_internet_connected();
			}, 5000);
		});
    },
	disconnect_wifi: function () {
		var self = this;

		this._update_sisbot('reset_to_hotspot', {}, function(obj) {
			if (obj.resp)
				self.set('data', obj.resp);
		});

		this.set('data.is_internet_connected', 'not connected')
			.set('data.wifi_network', 'false')
			.set('data.wifi_password', 'false');
	},
	is_internet_connected: function () {
		var self = this;

		this._update_sisbot('is_internet_connected', {}, function(obj) {
			console.log('is_internet_connected', obj);
			if (obj.resp == true) {
				self.set('data.is_internet_connected', 'true');
			} else {
				self.set('data.is_internet_connected', 'false')
					.set('data.wifi_network', 'false')
					.set('data.wifi_password', 'false');
			}
		});
	},
	install_updates: function () {
		this._update_sisbot('install_updates', {}, function(obj) {
			console.log('Fetch Siscloud');
		});
		return this;
	},
	restart: function () {
		this._update_sisbot('restart', {}, function(obj) {
			console.log('RESTART');
		});
	},
	factory_reset: function () {
		this._update_sisbot('factory_reset', {}, function(obj) {
			console.log('RESET');
		});
	},
	save_to_sisbot: function (data) {
		this._update_sisbot('save', data, function(obj) {
			console.log('WE SAVE');
		});
	},
	/**************************** PLAYBACK ************************************/
	update_playlist: function (playlist_data) {
		this._update_sisbot('set_playlist', playlist_data, function(obj) {
			// get back playlist obj
			console.log('SET PLAYLIST', obj);

			if (obj.resp.id !== 'false') {
				app.collection.get(obj.resp.id)
					.set('data', obj.resp)
					.trigger('change:data.sorted_tracks');
			}
		});

		this.set('data.is_loop', playlist_data.is_loop);
		this.set('data.is_shuffle', playlist_data.is_shuffle);
		this.set('data.active_playlist_id',	playlist_data.id);
		this.set('data.active_track_id',	playlist_data.active_track_id);
		this.set('data.state', 'playing');
	},
	set_track: function (data) {
		this._update_sisbot('set_track', data, function(resp) {
			// get back track obj
		});

		this.set('data.active_playlist_id',	'false');
		this.set('data.active_track_id',	data.id);
		this.set('data.state', 'playing');
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
	brightness_max: function () {
		this.brightness(1);
	},
	brightness_min: function () {
		this.brightness(0);
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
	speed_max: function () {
		this.speed(1);
	},
	speed_min: function () {
		this.speed(0);
	},
	set_shuffle: function () {
		this.set('data.is_shuffle', app.plugins.bool_opp[this.get('data.is_shuffle')]);

		this._update_sisbot('set_shuffle', { value: this.get('data.is_shuffle') }, function(obj) {
			if (obj.resp)
				app.collection.get(obj.resp.id).set('data', obj.resp);
		});
	},
	set_loop: function () {
		this.set('data.is_loop', app.plugins.bool_opp[this.get('data.is_loop')]);
		this._update_sisbot('set_loop', { value: this.get('data.is_loop') });
	},
	/******************** PLAYLIST / TRACK STATE ******************************/
	playlist_add: function (playlist_model) {
		var self		= this;
		var playlist	= playlist_model.get('data');

		this._update_sisbot('add_playlist', playlist, function (obj) {
			if (obj.resp)
				self.set('data', obj.resp);
		});

		this.add_nx('data.playlist_ids', playlist.id);
	},
	playlist_remove: function (playlist_model) {
		var self		= this;
		var playlist	= this.get('data');

		this._update_sisbot('remove_playlist', playlist, function (obj) {
			if (obj.resp)
				self.set('data', obj.resp);
		});

		this.remove('data.playlist_ids', playlist_model.id);
	},
	track_add: function (track_model) {
		var self	= this;
		var track	= track_model.get('data');

		this._update_sisbot('add_track', track, function (obj) {
			if (obj.resp)
				self.set('data', obj.resp);
		});

		this.add_nx('data.track_ids', track.id);
	},
	track_remove: function (track_model) {
		var self	= this;
		var track	= this.get('data');

		this._update_sisbot('remove_track', track, function (obj) {
			if (obj.resp)
				self.set('data', obj.resp);
		});

		this.remove('data.track_ids', track.id);
	},
	/******************** PLAYBACK ********************************************/
	play: function () {
		var self = this;
		this.set('data.state', 'playing');
		this._update_sisbot('play', {}, function (obj) {
			if (obj.resp)
				self.set('data', obj.resp);
		});
	},
	pause: function () {
		var self = this;
		this.set('data.state', 'paused');
		this._update_sisbot('pause', {}, function (obj) {
			if (obj.resp)
				self.set('data', obj.resp);
		});
	},
	home: function () {
		var self = this;
		this.set('data.state', 'homing');
		this._update_sisbot('home', {}, function (obj) {
			if (obj.resp)
				self.set('data', obj.resp);
		});
		return this;
	},
	jog_theta_left: function () {
		this.setup_jog('jogThetaLeft');
		return this;
	},
	jog_theta_right: function () {
		this.setup_jog('jogThetaRight');
		return this;
	},
	jog_rho_outward: function () {
		this.setup_jog('jogRhoOutward');
		return this;
	},
	jog_rho_inward: function () {
		this.setup_jog('jogRhoInward');
		return this;
	},
	setup_jog: function (jog_type) {
		var curr_jog_type = this.get('jog_type');

		if (jog_type == curr_jog_type) {
			// stop jogging
			this.set('is_jogging', false)
				.set('jog_type', '');
		} else if (curr_jog_type == ''){
			// set jog type and start jogging
			this.set('is_jogging', true)
				.set('jog_type', jog_type)
				._jog();
		} else {
			// we changed jog type
			this.set('jog_type', jog_type);
		}
		return this;
	},
	_jog: function () {
		var self = this;

		if (this.get('is_jogging') == true) {
			var jog_type = this.get('jog_type');

			self._update_sisbot(jog_type, {}, function() {
				setTimeout(function() {
					self._jog();
				}, 100);
			});
		}

		return this;
	}
};
