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

			is_connected		: false,
			is_jogging			: false,
			jog_type			: '',

			default_playlist_id	: 'false',
			data		: {
				id					: data.id,
				type    			: 'sisbot',
				version				: this.current_version,

				name				: 'Default Name',
				timezone_offset		: '0',					// 0 greenwich
				hostname			: 'false',				// sisyphus.local
				local_ip			: '',					// 192.168.0.1:3001

				do_not_remind		: 'false',				// wifi

				is_available		: true,
				reason_unavailable	: 'false',
				installing_updates	: 'false',
				factory_resetting	: 'false',

				pi_id				: '',
				firmware_version	: '1.0',
				software_version	: '1.0',

				is_hotspot			: 'true',
				is_network_connected: 'false',

				is_internet_connected: 'false',
                wifi_network        : '',
                wifi_password       : '',

				playlist_ids		: [],
				default_playlist_id	: 'false',
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

	},
	sisbot_listeners: function () {
		this.listenTo(app, 'sisbot:update_playlist', this.update_playlist);
		this.listenTo(app, 'sisbot:set_track', this.set_track);
		this.listenTo(app, 'sisbot:save', this.save_to_sisbot);
		this.listenTo(app, 'sisbot:playlist_add', this.playlist_add);
		this.listenTo(app, 'sisbot:playlist_remove', this.playlist_remove);
		this.listenTo(app, 'sisbot:track_add', this.track_add);
		this.listenTo(app, 'sisbot:track_remove', this.track_remove);

		this.on('change:data.is_available', this._available);
		this.on('change:data.is_serial_open', this._check_serial);
		this.on('change:is_connected', this.check_connection);

		this.get_state();
	},
	after_export: function () {
		app.current_session().set_active({ sisbot_id: 'false' });
	},
	_update_sisbot_msg: function(obj) {
		this._update_sisbot(obj.endpoint, obj.data, obj.cb);
	},
	_update_sisbot: function (endpoint, data, cb, _timeout) {
		if (!_timeout) _timeout = 60000;

		if (this.get('is_connected') == false)
			return this;

		var self = this;

		var obj = {
			_url	: 'http://' + this.get('data.hostname') + '/',
			_type	: 'POST',
			_timeout: 60000,
			endpoint: 'sisbot/' + endpoint,
			data	: data
		};

		app.post.fetch(obj, function(resp) {
			if (resp.err == 'Could not make request' && app.config.env !== 'alpha') {
				return self.set('data.is_available', false);
			} else {
				self.set('data.is_available', true);
				if (cb) cb(resp);
				self._update_cloud();
			}
		}, 0);
	},
	_update_cloud: function (data) {
		if (this.get('data.is_internet_connected') == 'true') {
			var data = this.get('data');
			var obj = {
				_url	: 'https://api.sisyphus.withease.io/',
				_type	: 'POST',
				_timeout: 60000,
				endpoint: 'set',
				data	: data
			};

			app.post.fetch(obj, function(resp) {
				// handle cloud differently
			}, 0);
		}
	},
	_check_serial: function () {
		if (this.get('data.is_serial_open') == 'false') {
			if (!this._active) {
				this._active = app.current_session().get('active');
				app.current_session().set('active.primary', 'serial');
			}
		} else {
			if (this._active) {
				app.current_session().set('active', this._active);
				this._active = false;
			}
		}
	},
	_available: function () {
		if (this.get('data.is_available') == false || this.get('data.is_available') == "false" ) {
			if (!this._available_data) {
				this._available_data = app.current_session().get('active');
				app.current_session().set('active.primary', 'unavailable');
			}
		} else {
			if (this._available_data) {
				app.current_session().set('active', this._available_data);
				this._available_data = false;
			}

			if (this.get('data.installing_updates') == 'true') {
				this.set('data.installing_updates', 'false');
				location.reload();
			}

			this.set('data.reason_unavailable', '');
		}
	},
	/**************************** SISBOT ADMIN ********************************/
	get_state: function () {
		var self = this;

		if (this.get('is_connected')) {
			this._update_sisbot('state', {}, function(obj) {
				// TODO: Error checking
				if (obj.resp)
					self.set('data', obj.resp);
			});
		}

		setTimeout(function () {
			self.get_state();
		}, 1000);

		return this;
	},
	do_not_remind: function () {
		var self = this;

		this._update_sisbot('stop_wifi_reminder', data, function(obj) {
			if (obj.err) {
				self.set('errors', resp.err);
			} else if (obj.resp) {
				self.set('data', obj.resp);
			}
		});

		return this;
	},
	get_networks: function () {
		var self			= this;
		var wifi_networks	= [];

		this._update_sisbot('get_wifi', { iface: 'wlan0', show_hidden: true }, function(obj) {
			// TODO: Test with Matt
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
			setTimeout(function () {
				self.set('data.is_available', false);
				self.set('data.reason_unavailable', 'connect_to_wifi');
			}, 5500);

			if (obj.resp)
				self.set('data', obj.resp);

			app.current_session().set_active({ secondary: 'false' });
		});
    },
	disconnect_wifi: function () {
		var self = this;

		this._update_sisbot('reset_to_hotspot', {}, function(obj) {
			setTimeout(function () {
				self.set('data.is_available', false);
				self.set('data.reason_unavailable', 'reset_to_hotspot');
			}, 5500);

			if (obj.resp)
				self.set('data', obj.resp);
		});

		this.set('data.is_internet_connected', 'false')
			.set('data.wifi_network', 'false')
			.set('data.wifi_password', 'false');
	},
	is_internet_connected: function () {
		var self = this;

		this._update_sisbot('is_internet_connected', {}, function(obj) {
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
		if (this.get('data.installing_updates') == 'true') return this;
		var self = this;

		this.set('data.installing_updates', 'true');

		this._update_sisbot('install_updates', {}, function(obj) {
			if (obj.err) {
				self.set('data.installing_updates_error', 'There was an error updating your Sisbot');
			} else if (obj.resp) {
				self.set('data', obj.resp);
			}
		});

		return this;
	},
	factory_reset: function () {
		if (this.get('data.factory_resetting') == 'true') return this;
		var self = this;

		this.set('data.factory_resetting', 'true')

		this._update_sisbot('factory_reset', {}, function(obj) {
			if (obj.err) {
				self.set('data.factory_resetting_error', 'There was an error resetting your Sisbot');
			} else if (obj.resp) {
				self.set('data', obj.resp);
			}
		});
	},
	setup_update_hostname: function () {
		this.set('hostname', this.get('data.hostname').replace('.local', ''))
			.set('errors', []);

		return this;
	},
	update_hostname: function () {
		var self		= this;
		var hostname	= this.get('hostname');
		var errors 		= [];

		this.set('errors', []);

		var valid_hostname = new RegExp("^[a-zA-Z][a-zA-Z0-9\-]*$");

		if (hostname == '')
			errors.push('Hostname cannot be empty');

		if (hostname.search(valid_hostname) == -1)
			errors.push('Hostname cannot contain invalid characters. Must start with a letter and consist of letters, numbers, and "-".');

		if (errors.length > 0)
			return this.set('errors', errors);

		this._update_sisbot('set_hostname', { hostname: hostname }, function(obj) {
			if (obj.err) {
				self.set('errors', [ obj.err ]);
			} else if (obj.resp) {
				self.set('data', obj.resp);
			}
		});
	},
	restart: function () {		// CURRENTLY UNUSED
		this._update_sisbot('restart', {}, function(obj) {
			console.log('RESTART');
		});
	},
	save_to_sisbot: function (data) {		// CURRENTLY UNUSED
		this._update_sisbot('save', data, function(obj) {
			console.log('WE SAVE');
		});
	},
	/**************************** PLAYBACK ************************************/
	update_playlist: function (playlist_data) {
		this._update_sisbot('set_playlist', playlist_data, function(obj) {
			//get back playlist obj
			//TODO: Error checking
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
			// TODO: Do something?
			// TODO: Error checking
		});

		this.set('data.active_playlist_id',	'false');
		this.set('data.active_track_id',	data.id);
		this.set('data.state', 'playing');
	},
	setup_default_playlist: function () {
		this.set('default_playlist_id', this.get('data.default_playlist_id'))
			.set('errors', []);
		return this;
	},
	set_default_playlist: function () {
		var self = this;

		var data = {
			default_playlist_id		: this.get('default_playlist_id')
		};

		// TODO: Matt needs to implement endpoint
		this._update_sisbot('set_default_playlist', data, function(obj) {
			if (obj.err) {
				self.set('errors', resp.err);
			} else if (obj.resp) {
				self.set('data', obj.resp);
				app.trigger('session:active', { secondary: 'false' });
			}
		});

		return this;
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
			//TODO: what is the response object on this?
			//TODO: Error checking
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
			//TODO: Error checking?
			//TODO: Error checking
			if (obj.resp)
				self.set('data', obj.resp);
		});

		this.add_nx('data.playlist_ids', playlist.id);
	},
	playlist_remove: function (playlist_model) {
		var self		= this;
		var playlist	= this.get('data');

		this._update_sisbot('remove_playlist', playlist, function (obj) {
			//TODO: Error checking
			if (obj.resp)
				self.set('data', obj.resp);
		});

		this.remove('data.playlist_ids', playlist_model.id);
	},
	track_add: function (track_model) {
		var self	= this;
		var track	= track_model.get('data');

		this._update_sisbot('add_track', track, function (obj) {
			//TODO: Error checking
			if (obj.resp)
				self.set('data', obj.resp);
		});

		this.add_nx('data.track_ids', track.id);
	},
	track_remove: function (track_model) {
		var self	= this;
		var track	= this.get('data');

		this._update_sisbot('remove_track', track, function (obj) {
			//TODO: Error checking
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
			//TODO: Error checking
			if (obj.resp)
				self.set('data', obj.resp);
		});
	},
	pause: function () {
		var self = this;
		this.set('data.state', 'paused');
		this._update_sisbot('pause', {}, function (obj) {
			//TODO: Error checking
			if (obj.resp)
				self.set('data', obj.resp);
		});
	},
	home: function () {
		var self = this;
		this.set('data.state', 'homing');
		this._update_sisbot('home', {}, function (obj) {
			//TODO: Error checking
			if (obj.resp)
				self.set('data', obj.resp);
		});
		return this;
	},
	jog_start: function(jog_type) {
		this.set('jog_type', jog_type).set('is_jogging', true)._jog();
		return this;
	},
	jog_end: function (jog_type) {
		this.set('is_jogging', false).set('jog_type', '');
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
