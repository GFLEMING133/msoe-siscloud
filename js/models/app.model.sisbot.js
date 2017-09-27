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

			is_connected					: false,
			is_jogging						: false,
			jog_type						: '',
			updating_hostname				: 'false',

			is_firmware_update_available	: 'false',
			is_software_update_available	: 'false',

			default_playlist_id				: 'false',

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

				is_available		: true,
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

				current_time		: 0,					// seconds

				state				: 'waiting',			// playing|homing|paused|waiting

				is_homed			: 'false',				// Not used
				is_serial_open		: 'true',				// Not used

				is_shuffle			: 'true',
				is_loop				: 'false',
				brightness			: .5,
				speed				: .3,
				is_autodim			: 'true'
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

		this.on('change:data.is_available', this._available);
		this.on('change:data.is_serial_open', this._check_serial);
		this.on('change:data.failed_to_connect_to_wifi', this.failed_to_connect_to_wifi);
		this.on('change:is_connected', this.check_connection);

		var is_failed = this.get('data.failed_to_connect_to_wifi');
		if (is_failed == 'true')
			this.failed_to_connect_to_wifi();

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

		var self	= this;
		var address	= this.get('data.hostname')

		if (app.platform == 'Android') {
			address = this.get('data.local_ip');
		}

		var obj = {
			_url	: 'http://' + address + '/',
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

			app.post.fetch(obj, function(resp) {
				// handle cloud differently
			}, 0);
		}
	},
	_fetch_cloud_tries: 10,
	_fetch_cloud: function () {
		if (app.platform !== 'Android') {
			// this is only for android
			return this;
		}

		var self = this;
		app.post.fetch(exists = {
			_url	: 'https://api.sisyphus.withease.io/',
			_type	: 'GET',
			_timeout: 1250,
			endpoint: 'sisbot_state/' + this.id,
		}, function exists_cb(obj) {
			//alert('FETCH ENDPOINT');

			if (obj.err) {
				if (--self._fetch_cloud_tries == 0) {
					self._fetch_cloud_tries = 10;
					return this;
				}
				//alert('WE GOT ERROR', obj);
				setTimeout(function () {
					//alert('try again');
					self._fetch_cloud();
				}, 5000);
			} else {
				// WE HAVE A REFERENCE FROM THE CLOUD..
				var ip = obj.resp.local_ip;
				//alert('WE GOT RESP', obj.resp);
				//alert('local ip: ' + ip);

				// Remember hostname for refresh
				app.current_session().add_nx('sisbot_hostnames', ip);
				app.current_session().save_session();

				self.set('data.local_ip', obj.resp.local_ip);
			}
		}, 0);

		return this;
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
			if (!this._available_data)
				this._available_data = app.current_session().get('active');
			app.current_session().set('active.primary', 'unavailable');
		} else {
			if (this._available_data) {
				app.current_session().set('active', this._available_data);
				this._available_data = false;
			}

			if (this.get('data.installed_updates') == 'true') {
				this.set('data.installed_updates', 'false');
				location.reload();
			}

			if (this.get('data.reason_unavailable') == "connect_to_wifi" && app.current_session().get('active.secondary') == "wifi") {
				app.current_session().set('active.secondary', "false");
			}

			this.set('data.reason_unavailable', '');
		}
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
	do_not_remind: function () {
		var self = this;

		this._update_sisbot('stop_wifi_reminder', {}, function(obj) {
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
			//alert('GET WIFI');
			//alert(JSON.stringify(obj));
			if (obj.err) {
				//alert('There was an error fetching wifi networks. Please try again later');
			}
			_.each(obj.resp, function(network_obj) {
				if (network_obj && network_obj.ssid && network_obj.ssid.indexOf('sisyphus') < 0)
					wifi_networks.push(network_obj.ssid);
			})
			self.set('wifi_networks', _.uniq(wifi_networks.sort()));
		});
    },
	failed_to_connect_to_wifi: function () {
		if (this.get('data.failed_to_connect_to_wifi') == 'true') {
			setTimeout(function () {
				app.trigger('session:active', { primary: 'settings', secondary: 'wifi' });
			}, 500);
		}
	},
  connect_to_wifi: function () {
		var self		= this;
		var credentials = this.get('wifi');

		this._update_sisbot('change_to_wifi', { ssid: credentials.name, psk: credentials.password }, function(obj) {
			setTimeout(function () {
				self.set('data.reason_unavailable', 'connect_to_wifi');
				self.set('data.is_available', false);
			}, 5500);
			setTimeout(function () {
				self.set('data.reason_unavailable', 'connect_to_wifi');
				self.set('data.is_available', false);
			}, 2500);
			setTimeout(function () {
				self.set('data.reason_unavailable', 'connect_to_wifi');
				self.set('data.is_available', false);
			}, 500);

			if (obj.resp)
				self.set('data', obj.resp);

			setTimeout(function () {
				// give the sisbot 10 seconds to connect and post update
				self._fetch_cloud();
			}, 10000);

			if (app.current_session().get('active.tertiary') !== 'false') {
				app.current_session().set_active({ tertiary: 'false', secondary: 'false', primary: 'current' });
			} else {
				app.current_session().set_active({ secondary: 'false' });
			}
		});
  },
	disconnect_wifi: function () {
		var self = this;

		this._update_sisbot('reset_to_hotspot', {}, function(obj) {
			setTimeout(function () {
				self.set('data.is_available', false);
				self.set('data.reason_unavailable', 'reset_to_hotspot');
			}, 500);
			setTimeout(function () {
				self.set('data.is_available', false);
				self.set('data.reason_unavailable', 'reset_to_hotspot');
			}, 2500);
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
		this._update_sisbot('set_track', data, function(resp) {

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
			if (obj.resp)
				self.set('data', obj.resp);
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
				app.collection.get(app.current_session().get('sisyphus_manager_id')).intake_data(obj.resp);

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
				alert('There was an error uploading the file to your Sisyphus. Please try again later.')
			} else if (obj.resp) {
				app.collection.get(app.current_session().get('sisyphus_manager_id')).intake_data(obj.resp);
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
	/******************** VERSIONING ******************************************/
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
		if (this.get('is_connected'))
			this.check_local_versions();

		if (this.get('data.is_internet_connected') !== 'false')
			this.check_remote_versions();

		return this;
	},
	check_local_versions: function () {
		var self = this;

		this._update_sisbot('latest_software_version', {}, function(cbb) {
			console.log('LOCAL VERSIONS', cbb);
			self.set('local_versions', cbb.resp);
		});

		return this;
	},
	check_local_branches: function() {
		var self = this;
		this._update_sisbot('software_branch', {}, function(cbb) {
			console.log('LOCAL BRANCHES', cbb);
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
	check_remote_versions: function () {
		var self = this;

		var obj = {
			_url	: 'https://api.sisyphus.withease.io/',
			_type	: 'POST',
			endpoint: 'latest_software_version',
			data	: {}
		};

		app.post.fetch(obj, function(cbb) {
			console.log('REMOTE VERSIONS', cbb);
			self.set('remote_versions', cbb.resp);
		}, 0);

		return this;
	}
};
