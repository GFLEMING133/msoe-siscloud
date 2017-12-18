app.model.sisbot = {
	polling_timeout: null,
	defaults: function (data) {
		var obj = {
			id				: data.id,
			type			: 'sisbot',

			wifi_networks   : [],
			wifi			: {
				name			: '',
				password		: ''
			},
			wifi_error		: 'false',
			fetching_cloud	: 'false',

			is_master_branch: 'true',
			branch_label: 'false',
			local_branches: {
				proxy	: 'master',
				app		: 'master',
				api		: 'master',
				sisbot	: 'master',
			},
			local_versions: {
				proxy	: '-',
				app		: '-',
				api		: '-',
				sisbot	: '-',
			},
			remote_versions: {
				proxy	: '-',
				app		: '-',
				api		: '-',
				sisbot	: '-',
			},

			has_software_update				: 'false',
			is_connected					: false,
			is_polling						: 'true',
			is_jogging						: false,
			jog_type						: '',
			updating_hostname				: 'false',
			updating_tablename				: 'false',

			timestamp						: 'false',

			is_connecting_to_wifi			: 'false',
			is_firmware_update_available	: 'false',
			is_software_update_available	: 'false',

			default_playlist_id				: 'false',

			default_settings				: {},
			default_settings_error			: 'false',

			edit		: {},
			data		: {
				id					: data.id,
				type    			: 'sisbot',
				version				: this.current_version,

				name				: 'Default Name',
				timezone_offset		: '0',					// 0 greenwich
				hostname			: 'false',				// sisyphus.local
				local_ip			: '',					// 192.168.0.1:3001

				do_not_remind		: 'false',				// wifi
				hostname_prompt		: 'false',				// hostname change

				reason_unavailable	: 'false',				// connect_to_wifi|reset_to_hotspot|resetting|restarting|rebooting
				installing_updates	: 'false',
				factory_resetting	: 'false',

				pi_id				: '',
				firmware_version	: '0.5.1',

				is_hotspot			: 'true',
				is_network_connected: 'false',

				is_internet_connected: 'false',
                wifi_network        : '',
                wifi_password       : '',
				failed_to_connect_to_wifi: 'false',

				playlist_ids		: [],
				default_playlist_id	: 'false',
				track_ids			: [],

				active_playlist_id	: 'false',
				active_track_id		: 'false',
				active_track		: 'false',

				current_time		: 0,					// seconds

				state				: 'waiting',			// playing|homing|paused|waiting

				is_homed			: 'false',				// Not used
				is_serial_open		: 'true',				// Not used

				is_shuffle			: 'true',
				is_loop				: 'false',
				brightness			: .5,
				speed				: .3,
				is_autodim			: 'true',
				is_nightlight		: 'false',
				nightlight_brightness: 0.2,
				autodim_start_time	: '',					// 10:00 PM
				autodim_end_time	: ''					// 8:00 AM
			}
		};

		return obj;
	},
	current_version: 1,
	sisbot_listeners: function () {
		this.listenTo(app, 'sisbot:update_playlist', this.update_playlist);
		this.listenTo(app, 'sisbot:set_track', this.set_track);
		this.listenTo(app, 'sisbot:save', this.save_to_sisbot);
		this.listenTo(app, 'sisbot:playlist_add', this.playlist_add);
		this.listenTo(app, 'sisbot:playlist_remove', this.playlist_remove);
		this.listenTo(app, 'sisbot:track_add', this.track_add);
		this.listenTo(app, 'sisbot:track_remove', this.track_remove);

		this.listenTo(app, 'socket:connect', this._socket_connect);
		this.listenTo(app, 'socket:reconnect', this._socket_connect);
		this.listenTo(app, 'socket:disconnect', this._socket_disconnect);
		this.listenTo(app, 'socket:error', this._socket_error);

		this.on('change:data.is_serial_open', this._check_serial);
		this.on('change:data.failed_to_connect_to_wifi', this.wifi_failed_to_connect);
		this.on('change:data.is_internet_connected', this.wifi_connected);

		var is_failed = this.get('data.failed_to_connect_to_wifi');
		if (is_failed == 'true')
			this.wifi_failed_to_connect();

		// this.on('change:data', this._update_timestamp);

		this._poll_state();
	},
	after_export: function () {
		app.current_session().set_active({ sisbot_id: 'false' });
	},
	_update_sisbot_msg: function(obj) {
		this._update_sisbot(obj.endpoint, obj.data, obj.cb);
	},
	_update_sisbot: function (endpoint, data, cb, _timeout) {
		if (!_timeout) _timeout = 60000;

		if (app.config.env == 'alpha')
			return this;

		var self	= this;
		var address	= this.get('data.local_ip')

		// if (app.platform == 'iOS')	address = this.get('data.hostname');
		// 192.168.42.1 | iOS | state

		var obj = {
			_url	: 'http://' + address + '/',
			_type	: 'POST',
			_timeout: 5000,
			endpoint: 'sisbot/' + endpoint,
			data	: data
		};

		app.post.fetch(obj, function(resp) {
			if (resp.err == 'Could not make request' && app.config.env !== 'alpha') {
				self._poll_failure();
				if (cb) cb(resp);
			} else {
				if (resp.err == null)
					app.manager.set('is_sisbot_available', 'true');

				if (resp.err)
					console.log(address, endpoint, resp);

				self.trigger('change:data.active_track._index');	// fix bug
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

			app.post.fetch(obj, function(resp) {}, 0);
		}
	},
	_fetching_cloud: false,
	_fetch_cloud: function () {
		if (this._fetching_cloud) 	return this;

		console.log('fetch cloud');

		var self = this;
		this._fetching_cloud = true;

		var current_ip	= this.get('data.local_ip');

		app.post.fetch(exists = {
			_url	: 'https://api.sisyphus.withease.io/',
			_type	: 'GET',
			_timeout: 1250,
			endpoint: 'sisbot_state/' + this.id,
		}, function exists_cb(obj) {
			self._fetching_cloud = false;

			if (obj.resp && obj.resp.local_ip) {
				// we are internet connected!
				var ip_address = obj.resp.local_ip;
				self.set('data.local_ip', ip_address);
			}
		}, 0);
	},
	_fetching_bluetooth: false,
	_fetch_bluetooth: function () {
		if (!app.is_app)				return this;
		if (this._fetching_bluetooth) 	return this;

		var self = this;
		this._fetching_bluetooth = true;

		var current_ip	= this.get('data.local_ip');
		var sub_id		= this.id.substr(this.id.length - 7);

		app.manager.start_ble_scan(sub_id, function (ip_address) {
			self._fetching_bluetooth = false;

			if (!ip_address) {
				// no ip address. must be doing network stuff
			} else if (current_ip == ip_address && ip_address == '192.168.42.1') {
				// sisyphus is in hotspot mode and we failed to connect to it
				this.set('data.reason_unavailable', 'connect_to_wifi');
			} else if (current_ip !== ip_address) {
				// we successfully connected to wifi!
				self.set('data.local_ip', ip_address);
			}
		});
	},
	_check_serial: function () {
		/* TODO: Fix
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
		*/
	},
	_update_timestamp: function() {
		this.set('timestamp', ''+Date.now());
		console.log("Update Timestamp", ''+Date.now(), this.get('timestamp'));
	},
	/**************************** sockets ********************************/
	_socket_connect: function() {
		console.log("Sisbot: Socket Connect");
		this.set('is_polling', "false");
		clearTimeout(this.polling_timeout);
	},
	_socket_disconnect: function() {
		console.log("Sisbot: Socket Disconnect");
		if (this.get('is_polling') == "false") {
			this.set('is_polling', "true");
			this._poll_state();
		}
	},
	_socket_error: function(data) {
		console.log("Sisbot: Socket Error", data);
		if (this.get('is_polling') == "false") {
			this.set('is_polling', "true");
			this._poll_state();
		}
	},
	/**************************** SISBOT ADMIN ********************************/
	_poll_timer: false,
	_poll_failure: function () {
		if (this._poll_timer == false)
			this._poll_timer = moment();

		if (moment().diff(this._poll_timer) > 15000) {
			this._fetch_bluetooth();
			this._fetch_cloud();
		}

		if (moment().diff(this._poll_timer) > 75000) {
			this.set('is_polling', 'false');
			app.manager.set('is_sisbot_available', 'false');
		}
	},
	_poll_restart: function () {
		this._poll_timer = false;
		this.set('is_polling', 'true');
		this._poll_state();
	},
	_poll_state: function () {
		var self = this;

		if (this.get('is_master_branch') == 'false')
			console.log("Get State: ", app.manager.get('is_sisbot_available'), this.get('is_polling'));

		this._update_sisbot('state', {}, function(obj) {
			if (obj.resp) {
				self._poll_timer = false;
				app.manager.set('is_sisbot_available', 'true');

				self.set('data', obj.resp);
				if (self.get('is_polling') == "true") {
					app.socket._setup();		// try to connect to socket
				}
			} else if (obj.err) {
				self._poll_failure();
			}
		});

		if (this.get('is_polling') == "true") {
			this.polling_timeout = setTimeout(function () {
				self._poll_state();
			}, 6000);
		}

		return this;
	},
	defaults_setup: function () {
		var data = this.get('data');

		var defaults = {
			name					: data.name,
			brightness				: data.brightness,
			is_autodim				: data.is_autodim,
			autodim_start_time		: data.autodim_start_time,
			autodim_end_time		: data.autodim_end_time,
		}

		this.set('default_settings', defaults);
	},
	defaults_brightness: function (level) {
		this.set('default_settings.brightness', level);
	},
	defaults_save: function () {
		this.set('default_settings_error', 'false');

		var self		= this;
		var data		= this.get('data');
		var reg_data	= this.get('default_settings');

		if (reg_data.name == '') {
			this.set('default_settings_error', 'true');
			return this;
		}

		_.extend(data, reg_data)

		data.do_not_remind = 'true';

		app.manager.set('show_nightlight_page', 'false');

		this._update_sisbot('save', data, function(obj) {
			console.log('WE SAVE THE UPDATE');
		});
	},
	get_networks: function () {
		var self			= this;
		var wifi_networks	= [];

		if (app.config.env == 'alpha') {
			this.set('wifi_networks', ['test', 'test 2', 'test 3']);
			return this;
		}

		this._update_sisbot('get_wifi', { iface: 'wlan0', show_hidden: true }, function(obj) {
			if (obj.err) {
				self.get_networks();
			}
			_.each(obj.resp, function(network_obj) {
				if (network_obj && network_obj.ssid && network_obj.ssid.indexOf('sisyphus') < 0)
					wifi_networks.push(network_obj.ssid);
			})
			var uniq_wifi = _.uniq(wifi_networks.sort());

			var current_ssid = app.manager.get('current_ssid');

			if (uniq_wifi.indexOf(current_ssid) > -1) {
				self.set('wifi.name', current_ssid);
			} else if (uniq_wifi.length > 0) {
				self.set('wifi.name', uniq_wifi[0]);
			}

			self.set('wifi_networks', uniq_wifi);
		});
    },
	wifi_failed_to_connect: function () {
		if (this.get('data.failed_to_connect_to_wifi') == 'true') {
			this.set('wifi_error', 'incorrect');
		} else {
			this.set('wifi_error', 'false');
		}
	},
	wifi_connected: function () {
		if (this.get('data.is_internet_connected') == 'true')
			app.trigger('sisbot:wifi_connected');
	},
  	connect_to_wifi: function () {
		this.set('wifi_error', 'false');

		var self		= this;
		var credentials = this.get('wifi');

		if (credentials.password == '') {
			this.set('wifi_error', 'true');
			return this;
		}

		this.set('is_connecting_to_wifi', 'true');

		this._update_sisbot('connect_to_wifi', { ssid: credentials.name, psk: credentials.password }, function(obj) {
			if (obj.err && obj.err == 'Could not make request') {
				wifi_fallback();
			} else if (obj.err) {
				console.log('wifi err', obj.err);

				self.set('is_connecting_to_wifi', 'false')
					.set('wifi_error', 'true');
			} else if (obj.resp) {
				self.set('data', obj.resp);
			}
		});

		function wifi_fallback() {
			self._update_sisbot('change_to_wifi', { ssid: credentials.name, psk: credentials.password }, function(obj) {
				if (obj.err) {
					self.set('is_connecting_to_wifi', 'false')
						.set('wifi_error', 'true');
				} else if (obj.resp) {
					self.set('data', obj.resp);
				}
			});
		}
  	},
	disconnect_wifi: function () {
		var self = this;

		var confirm_disconnect = confirm('Are you sure you want to disconnect your Sisyphus from WiFi?');

		if (!confirm_disconnect)
			return this;

		this._update_sisbot('disconnect_wifi', {}, function(obj) {
			// do nothing
			self.set('is_polling', 'false')
				.set('data.is_internet_connected', 'false')
				.set('data.wifi_network', 'false')
				.set('data.wifi_password', 'false')
				.set('data.reason_unavailable', 'disconnect_from_wifi');
			app.manager.set('is_sisbot_available', 'false');
		});
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
		if (this.get('data.installing_updates') == 'true')
			return this;

		var confirmation = confirm('Are you sure you want to install updates?');

		if (!confirmation)
			return this;

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
		if (this.get('data.factory_resetting') == 'true')
			return this;

		var confirmation = confirm('Are you sure you want to factory reset?');

		if (!confirmation)
			return this;

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
		this.set('updating_hostname', 'true');

		var valid_hostname = new RegExp("^[a-zA-Z][a-zA-Z0-9\-]*$");

		if (hostname == '')
			errors.push('Hostname cannot be empty');

		if (hostname.search(valid_hostname) == -1)
			errors.push('Hostname cannot contain invalid characters. Must start with a letter and consist of letters, numbers, and "-".');

		if (errors.length > 0)
			return this.set('updating_hostname', 'false').set('errors', errors);

		// Remember hostname for refresh
		var to_remember = hostname + '.local';
		app.current_session().add_nx('sisbot_hostnames', to_remember);
		app.current_session().save_session();

		this._update_sisbot('set_hostname', { hostname: hostname }, function(obj) {
			self.set('updating_hostname', 'false');

			if (obj.err) {
				self.set('errors', [ obj.err ]);
			} else if (obj.resp) {
				app.trigger('session:active', { secondary: 'false' });
				self.set('data', obj.resp);
			}
		});
	},
	setup_edit: function () {
		this.set('edit', this.get('data'))
			.set('errors', []);

		return this;
	},
	update_nightmode: function () {
		var self		= this;
		var edit		= _.pick(this.get('edit'), 'is_nightlight', 'autodim_start_time', 'autodim_end_time', 'nightlight_brightness');
		var errors 		= [];

		this.set('errors', []);
		var data = this.get('data');
		_.extend(data, edit);

		this._update_sisbot('save', data, function(obj) {
			if (obj.err) {
				self.set('errors', [ obj.err ]);
			} else if (obj.resp) {
				app.trigger('session:active', { secondary: 'advanced_settings' });
				self.set('data', obj.resp);
			}
		});
	},
	update_tablename: function () {
		var self		= this;
		var name		= this.get('edit.name');
		var errors 		= [];

		this.set('errors', []);
		this.set('updating_tablename', 'true');

		if (name == '')
			errors.push('Table Name cannot be empty');

		if (errors.length > 0)
			return this.set('updating_tablename', 'false').set('errors', errors);

		var data = this.get('data');
		data.name = name;

		this._update_sisbot('save', data, function(obj) {
			self.set('updating_tablename', 'false');

			if (obj.err) {
				self.set('errors', [ obj.err ]);
			} else if (obj.resp) {
				app.trigger('session:active', { secondary: 'advanced_settings' });
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
		this._update_sisbot('set_track', data, function (obj) {
			if (obj.resp)
				app.collection.get(app.current_session().get('sisyphus_manager_id')).intake_data(obj.resp);
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
		var self = this;
		this.set('data.brightness', +level);
		this._update_sisbot('set_brightness', { value: +level }, function (obj) {
			if (obj.resp)
				self.set('data', obj.resp);
		});
	},
	nightlight_brightness: function (level) {
		this.set('data.nightlight_brightness', +level);
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
		var self = this;

		console.log('we are here');

		this.set('data.speed', +level);
		this._update_sisbot('set_speed', { value: +level }, function (obj) {
			console.log('we are here');
			if (obj.resp) self.set('data', obj.resp);
		});
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

		this._update_sisbot('set_shuffle', { value: this.get('data.is_shuffle') }, function (obj) {
			if (obj.resp)
				app.collection.get(app.current_session().get('sisyphus_manager_id')).intake_data(obj.resp);
		});
	},
	set_loop: function () {
		var self = this;
		this.set('data.is_loop', app.plugins.bool_opp[this.get('data.is_loop')]);
		this._update_sisbot('set_loop', { value: this.get('data.is_loop') }, function (obj) {
			if (obj.resp)
				app.collection.get(app.current_session().get('sisyphus_manager_id')).intake_data(obj.resp);
		});
	},
	/******************** SLEEP ***********************************************/
	set_sleep_time: function () {
		var self = this;
		var data = {
			sleep_time: this.get('data.sleep_time'),
			wake_time: this.get('data.wake_time')
		};

		this._update_sisbot('set_sleep_time', data, function (obj) {
			if (obj.resp) self.set('data', obj.resp);
		});
	},
	/******************** PLAYLIST / TRACK STATE ******************************/
	playlist_add: function (playlist_model) {
		var self		= this;
		var playlist	= playlist_model.get('data');

		console.log('Before add: Sisbot add playlist', playlist_model);

		this._update_sisbot('add_playlist', playlist, function (obj) {
			console.log('Sisbot: Add playlist', obj);
			if (obj.err) {
				alert('There was an error adding the playlist to your Sisyphus. Please try again later.')
			} else if (obj.resp) {
				app.collection.get(app.current_session().get('sisyphus_manager_id')).intake_data(obj.resp);
			}
		});

		this.add_nx('data.playlist_ids', playlist.id);
	},
	playlist_remove: function (playlist_model) {
		var self		= this;
		var playlist	= this.get('data');

		this._update_sisbot('remove_playlist', playlist, function (obj) {
			if (obj.err) {
				alert('There was an error removing your Playlist. Please try again later.')
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
				app.trigger('session:active', { playlist_id: 'false', secondary: 'playlists' });
			}
		});

		this.remove('data.playlist_ids', playlist_model.id);
	},
	track_add: function (track_model) {
		var self	= this;
		var track	= track_model.get('data');

		console.log("Add Track", track);

		this._update_sisbot('add_track', track, function (obj) {
			if (obj.err) {
				alert('There was an error uploading the file to your Sisyphus. Please try again later.')
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
				app.trigger('session:active', { track_id: track.id, secondary: 'track', primary: 'tracks' });
			}
		});

		this.add_nx('data.track_ids', track.id);
	},
	track_remove: function (track_model) {
		var self	= this;
		var track	= this.get('data');

		this._update_sisbot('remove_track', track, function (obj) {
			if (obj.err) {
				alert('There was an error removing the file to your Sisyphus. Please try again later.')
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
				app.trigger('session:active', { track_id: 'false', secondary: 'tracks' });
			}
		});

		this.remove('data.track_ids', track.id);
	},
	track_get_verts: function (track_model, cb) {
		console.log('we got verts', track_model.id);

		this._update_sisbot('get_track_verts', { id: track_model.id }, function (obj) {
			console.log('track get verts', obj);

			if (obj.err) {
				alert('There was an error getting the track verts.');
			} else if (obj.resp) {
				cb(obj.resp);
			}
		});
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
		this._update_sisbot('home', { clear_tracks: true }, function (obj) {
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
	},
	/******************** AUTODIM ******************************************/
	set_autodim: function () {
		var new_value = app.plugins.bool_opp[this.get('data.is_autodim')];

		this.set('data.is_autodim', new_value);

		this._update_sisbot('set_autodim', { value: new_value }, function(obj) {
			console.log('autodim', obj);
			if (obj.resp)
				app.collection.get(obj.resp.id).set('data', obj.resp);
		});

		return this;
	},
	/******************** VERSIONING ******************************************/
	check_for_version_update: function () {
		var self	= this;
		var cbs		= 2;

		if (this.get('is_connected'))
			this.check_local_versions(on_cb);

		if (app.config.env !== 'sisbot' || this.get('data.is_internet_connected') !== 'false')
			this.check_remote_versions(on_cb);

		function on_cb(on_cb) {
			if (--cbs == 0) {
				var local		= self.get('local_versions');
				var remote		= self.get('remote_versions');
				var has_update	= false;

				if (!remote) return this;

				_.each(local, function(local_version, repo) {
					var remote_version		= remote[repo];
					var remote_revisions	= remote_version.split('.');
					var local_revisions		= local_version.split('.');
					var local_is_newer		= false;

					for (var i = 0; i < local_revisions.length; i++) {
						if (+local_revisions[i] > +remote_revisions[i]) {
							local_is_newer = true;
						} else if (+local_revisions[i] < +remote_revisions[i]) {
							has_update = true;
						}
						if (has_update == true || local_is_newer == true) {
							break;
						}
					}
				});

				self.set('has_software_update', '' + has_update);
			}

		}

		return this;
	},
	check_local_versions: function (cb) {
		var self = this;
		console.log('check local versions');

		if (app.config.env == 'alpha') {
			this.set('local_versions', { api: '1.0.3', app: '1.0.9', proxy: '0.5.6', sisbot: '1.0.8' });
			if (cb) cb();
			return this;
		}

		this._update_sisbot('latest_software_version', {}, function(cbb) {
			console.log('local versions', cbb.resp);
			self.set('local_versions', cbb.resp);
			if (cb) cb();
		});

		return this;
	},
	check_local_branches: function() {
		var self = this;
		this._update_sisbot('software_branch', {}, function(cbb) {
			self.set('local_branches', cbb.resp);
			var branch_labels = [];

			// set bool for knowing if on master
			var is_master_branch = 'true';
			_.each(self.get('local_branches'), function(branch) {
				if (branch != 'master') {
					is_master_branch = 'false';
					if (branch_labels.indexOf(branch) < 0) branch_labels.push(branch);
				}
			});
			self.set('is_master_branch', is_master_branch); // reset

			// make clear string for displaying
			if (branch_labels.length > 0) self.set('branch_label', branch_labels.join());
			else self.set('branch_label', 'false');
		});
	},
	check_remote_versions: function (cb) {
		var self = this;

		console.log('check remote versions');

		var obj = {
			_url	: 'https://api.sisyphus.withease.io/',
			_type	: 'POST',
			endpoint: 'latest_software_version',
			data	: {}
		};

		app.post.fetch(obj, function(cbb) {
			console.log('remote versions', cbb.resp);
			self.set('remote_versions', cbb.resp);
			if (cb) cb();
		}, 0);

		return this;
	}
};
