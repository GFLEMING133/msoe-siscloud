app.model.sisbot = {
	polling_timeout: null,
	_retry_find: false,
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
			wifi_connecting	: 'false',
			fetching_cloud	: 'false',
			show_wifi_list  : 'false',

			is_master_branch: 'false',
			is_legacy_branch: 'false',

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

			csons	: 'false', // available cson files

			has_software_update				: 'false',
			is_connected					:  false,
			is_socket_connected				: 'false',
			is_polling						:  'true',
			is_jogging						:   false,
			jog_type						:      '',
			updating_hostname				: 'false',
			updating_tablename				: 'false',

			timestamp						: 'false',

			is_firmware_update_available	: 'false',
			force_onboarding				: 'false',

			default_playlist_id				: 'false',

			default_settings				: {},
			default_settings_error			: 'false',

			// log_date						: moment().format('MM/DD/YYYY'),
			// log_type						: 'sisbot',		// sisbot|plotter|proxy
			log_file						: 'false', // currently selected for download
			log_files						: [],
			uploading_track			: 'false',

			wait_for_send				: 'false', // don't send request before hearing response

			rem_pattern					: 'false',
			rem_primary_color		: '0xFFFFFFFF',
			rem_secondary_color	: '0x00FFFFFF',
			show_picker					: 'true',

			edit		: {},
			data		: {
				id					: data.id,
				type    			: 'sisbot',
				version				: this.current_version,

				name				: 'Default Name',
				timezone_offset		: '0',					// 0 greenwich
				hostname			: 'false',				// sisyphus.local
				local_ip			: '',					// 192.168.0.1:3001
				mac_address			: 'false',              // set to false if no data comes from sisbot
				do_not_remind		: 'false',				// wifi
				hostname_prompt		: 'false',				// hostname change

				reason_unavailable	: 'false',				// connect_to_wifi|reset_to_hotspot|resetting|restarting|rebooting
				installing_updates	: 'false',
				update_status			: 'false', 			// knowing where in the software update process we are
				factory_resetting		: 'false',
				fault_status			: 'false', // allows for navigation after Servo fault

				pi_id							: '',
				firmware_version	: '0.5.1',

				is_hotspot			: 'true',

				is_network_separate: 'false',
				is_internet_connected: 'false',
				is_network_connected: 'false',
				is_network_separate : 'false',
				wifi_network        : '',
				wifi_password       : '',
				failed_to_connect_to_wifi: 'false',
				wifi_forget			: 'false',

				playlist_ids					: [],
				default_playlist_id		: 'false',
				favorite_playlist_id	: 'false',
				track_ids							: [],

				active_playlist_id	: 'false',
				active_track_id			: 'false',
				active_track				: 'false',

				current_time		: 0,					// seconds

				state				: 'waiting',			// playing|homing|paused|waiting

				is_homed			: 'false',				// Not used
				is_serial_open		: 'true',				// Not used
				is_servo			: 'false', 				//setting for alert()'s

				is_shuffle			: 'true',
				is_loop				: 'false',
				brightness			: .5,
				speed				: .3,
				is_autodim_allowed	: 'true',
				is_autodim			: 'true',
				is_nightlight		: 'false',
				is_sleeping			: 'false',
				timezone_offset		: moment().format('Z'),
				nightlight_brightness: 0.2,
				sleep_time			: '10:00 PM',					// 10:00 PM sleep_time
				wake_time			: '8:00 AM',					// 8:00 AM  wake_time

				is_paused_between_tracks: 'false',
				is_waiting_between_tracks: 'false',
				share_log_files		: 'false',

				table_settings: {}, // Advanced table settings, overrides CSON on reboot

				led_enabled: 'false',
				led_pattern_ids: ['white','solid','fade','spread','comet','rainbow','paint','demo'],
				led_pattern: 'white',
				led_offset : 0,
				led_primary_color: '0xFFFFFFFF', // Hex
				led_secondary_color: '0x00FFFFFF', // Hex
			}
		};

		return obj;
	},
	current_version: 1,
	sisbot_listeners: function () {
		this.listenTo(app, 'sisbot:update_playlist', 		this.update_playlist);
		this.listenTo(app, 'sisbot:set_track', 				this.set_track);
		this.listenTo(app, 'sisbot:save', 					this.save_to_sisbot);
		this.listenTo(app, 'sisbot:playlist_add', 			this.playlist_add);
		this.listenTo(app, 'sisbot:playlist_remove', 		this.playlist_remove);
		this.listenTo(app, 'sisbot:track_add', 				this.track_add);
		this.listenTo(app, 'sisbot:track_remove', 			this.track_remove);

		this.listenTo(app, 'socket:connect', 				this._socket_connect);
		this.listenTo(app, 'socket:reconnect', 				this._socket_connect);
		this.listenTo(app, 'socket:disconnect', 			this._socket_disconnect);
		this.listenTo(app, 'socket:error', 					this._socket_error);

		this.on('change:data.is_serial_open', 				this._check_serial);
		this.on('change:data.failed_to_connect_to_wifi', 	this.wifi_failed_to_connect);
		this.on('change:data.is_network_connected', 		this.wifi_connected);
		this.on('change:data.wifi_forget', 					this.wifi_connected);
		this.on('change:data.installing_updates',			this.check_force_onboarding);
		this.on('change:data.installing_updates',			this.install_updates_change);
		this.on('change:data.is_sleeping',					this.nightmode_sleep_change);
		this.on('change:data.software_version',				this.check_for_version_update);
		this.on('change:data.reason_unavailable',			this.check_for_unavailable);
		this.on('change:data',								this.nightmode_sleep_change);

		this.on('change:edit.led_pattern', 				this._change_led_pattern);

		if (this.get('data.is_network_separate') == 'false') {
			this.update_network();
			this.on('change:data.is_network_connected',     this.update_network);
			this.on('change:data.is_internet_connected',    this.update_network);
			this.on('change:is_network_separate',           this.update_network);
		}

		if (this.get('data.favorite_playlist_id') == 'false')
			this.setup_favorite_playlist();

		if (this.get('data.failed_to_connect_to_wifi') == 'true')
			this.wifi_failed_to_connect();

		if (this.get('data.installing_updates') == 'true')
			this.install_updates_change();

		if (this.get('data.is_sleeping') == 'true')
			this.nightmode_sleep_change();

		if (this.get('data.sleep_time') == 'false') // fix is_sleep_enabled toggle
			this.set('data.is_sleep_enabled', 'false');

		if (this.get('data.led_pattern') != 'false') {
			this.setup_edit();
			this._update_pattern_colors();
		}

		this._poll_state();
	},
	update_network: function() {
		if (this.get('data.is_network_separate') == 'false') {
			this.set('data.is_network_connected', this.get('data.is_internet_connected'));
		} else {
			this.off('change:data.is_internet_connected', this.update_network);
			this.off('change:data.is_network_separate', this.update_network);
		}
	},
	after_export: function () {
		app.current_session().set_active({ sisbot_id: 'false' });
	},
	_update_sisbot_msg: function(obj) {
		this._update_sisbot(obj.endpoint, obj.data, obj.cb);
	},
	_fetch_log: function (data) {
		console.log("_fetch_log()");
		var data = this.get('data');
		var obj = {
			// _url	:  app.config.get_sisbot_url(),
			_type	: 'POST',
			_timeout: 60000,
			endpoint: 'get_log',
			data	: data
		};

		console.log("Fetch log", obj);
		// app.post.fetch(obj, function(resp) {
		// 	// handle cloud differently
		// }, 0);
	},
	update_network: function () {
		if(this.get('data.is_network_separate') == 'false'){
			this.set('data.is_network_connected', this.get('data.is_internet_connected'));
		}else {
			this.off('change:data.is_internet_connected', this.update_network);
			this.off('change:data.is_network_separate', this.update_network);
		}
		console.log('in the update_network', this.get('data.is_network_separate'), this.get('data.is_internet_connected'),
		this.get('data.is_network_connected'));

	},
	present_siri: function(data) {
		var self = this;

		// TESTING: Siri shortcut
		if (data && app.is_app && app.platform == 'iOS') {

			if (!cordova) return; // exit for testing
			if (!data.action) return console.log("Siri: Missing Action");
			if (!data.phrase) return console.log("Siri: Missing Phrase");

			var info_obj = {
				model: self.id,
				action: data.action
			};
			if (data.msg) info_obj.msg = data.msg;
			var identifier = self.id+'_'+data.action;
			if (data.identifier) identifier = self.id+'_'+data.identifier;

			var present_data = {
				persistentIdentifier: identifier,
				title: data.phrase,
				suggestedInvocationPhrase: self.get('data.name')+' '+data.phrase,
				userInfo: info_obj
			};

			console.log("Siri: Present", JSON.stringify(present_data));
			cordova.plugins.SiriShortcuts.present(present_data, function(resp) {
				console.log("Siri: Successful Presented Shortcut", resp);
			}, function(err) {
				console.log("Siri: Presented Shortcut Error", err);
			});
		}
	},
	_donate_siri: function(data) {
		var self = this;

		// TESTING: Siri shortcut
		if (data && app.is_app && app.platform == 'iOS') {

			if (!data.action) return console.log("Siri: Missing Action");
			if (!data.phrase) return console.log("Siri: Missing Phrase");

			var info_obj = {
				model: self.id,
				action: data.action
			};
			if (data.msg) info_obj.msg = data.msg;
			var identifier = self.id+'_'+data.action;
			if (data.identifier) identifier = self.id+'_'+data.identifier;

			var donate_data = {
				persistentIdentifier: identifier,
				title: data.phrase,
				suggestedInvocationPhrase: self.get('data.name')+' '+data.phrase,
				userInfo: info_obj
			};

			console.log("Siri: Donate", JSON.stringify(donate_data));
			cordova.plugins.SiriShortcuts.donate(donate_data, function(resp) {
				console.log("Siri: Successful Donated Shortcut", resp);
			}, function(err) {
				console.log("Siri: Donated Shortcut Error", err);
			});
		}
	},
	_update_sisbot: function (endpoint, data, cb, _timeout) {
		console.log("_update_sisbot()", endpoint, data);
		if (!_timeout) _timeout = 5000;

		if (app.config.env == 'alpha') {
			console.log('ALPHA is_internet_connected ==', this.get('data.is_internet_connected'));
			this.set('data.is_internet_connected', 'true'); //setting to true for Apple to test Community
			return cb({err:null, resp:this.get('data')});
		}

		var self	= this;
		var address	= this.get('data.local_ip');

		// if (app.platform == 'iOS')	address = this.get('data.hostname');
		// 192.168.42.1 | iOS | state

		var obj = {
			_url	: 'http://' + address + '/',
			_type	: 'POST',
			_timeout: _timeout,
			endpoint: 'sisbot/' + endpoint,
			data	: data
		};
		app.post.fetch(obj, function(resp) {
			if (resp.err == 'Could not make request' && app.config.env !== 'alpha') {
				self._poll_failure();
				if (cb) cb(resp);
			} else {
				if (resp.err == null) self.check_for_unavailable();

				if (resp.err) {
					app.plugins.n.notification.alert(resp.err);
					console.log(address, endpoint, resp);
					return;
				}

				self.trigger('change:data.active_track._index');	// fix bug
				if (cb) cb(resp);

				// self._update_cloud(); debugging maybe
			}
		}, 0);
	},


	_check_serial: function () {
		console.log("_check_serial()");

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
		// console.log("_update_timestamp()");
		this.set('timestamp', ''+Date.now());
		// console.log("Update Timestamp", ''+Date.now(), this.get('timestamp'));
	},
	/**************************** sockets ********************************/
	_socket_connect: function() {
		var self = this;

		console.log("Sisbot: Socket Connect");

		this.set('is_socket_connected', 'true');
		this.set('is_polling', "false");

		clearTimeout(this.polling_timeout);

		self.check_for_unavailable();

		this.wifi_connected();

		// setTimeout(function() {
		// 	self._update_sisbot('state', {}, function (obj) {
		// 		if (obj.resp) app.manager.intake_data(obj.resp);
		// 	});
		// }, 10000);
	},
	_socket_disconnect: function() {
		// console.log("_socket_disconnect()");
		this.set('is_socket_connected', 'false');

		var self = this;
		// console.log("Sisbot: Socket Disconnect");

		if (this.get('is_polling') == "false") {
			setTimeout(function() {
				self.set('is_polling', "true");
				self._poll_state();
			}, 500);
		}
	},
	_socket_error: function(data) {
		// console.log("Sisbot: Socket Error", data);
		if (this.get('is_polling') == "false") {
			this.set('is_polling', "true");
			this._poll_state();
		}
	},
	/**************************** POLLING *************************************/
	_poll_timer: false,
	_poll_failure: function () {
		// console.log("_poll_failure()");
		if (this._poll_timer == false) {
			this._poll_timer = moment();
			this._retry_find = true;
		}

		var disconnect_length = moment().diff(this._poll_timer);

		this.set('disconnect_length', disconnect_length);

		if (this._retry_find && disconnect_length > 20000) { // extended to catch the fallback to hotspot
			// Try to find any tables again !!TODO: the manager should handle this
			app.manager.find_sisbots();
			// this._fetch_bluetooth();
			// this._fetch_network();
			// this._fetch_cloud();

			this._retry_find = false; // don't bother more than once
		}


		if ((this.get('data.installing_updates') == 'true' || this.get('data.wifi_forget') == 'true' || this.get('data.factory_resetting') == 'true') && disconnect_length > 60000) {
			this._poll_failure_stop();
		} else if (this.get('data.installing_updates') == 'true' || this.get('data.wifi_forget') == 'true' || this.get('data.factory_resetting') == 'true') {
			// do nothing.. We haven't timed out
		} else if (this.is_legacy() == true && disconnect_length > 10000) {
			this._poll_failure_stop();
		} else if (this.is_legacy() == false && disconnect_length > app.config.disconnect_timeout_to_stop_polling) {
			if (this.get('is_socket_connected') == 'true') {
				// we have polling from old requests that have timed out after socket reconnected. Ignore
			} else {
				this._poll_failure_stop();
			}
		}

		return this;
	},
	_poll_failure_stop: function () {
		// console.log("_poll_failure_stop()");
		if (this._poll_then_reset_bool == true) {
			window.location.reload();
		}
		this.set('is_polling', 'false');
		app.manager.set('is_sisbot_available', 'false')
				   .set('sisbot_reconnecting', 'false');
	},
	_poll_restart: function () {
		// console.log("_poll_restart()");
		this._poll_timer = false;
		this.set('is_polling', 'true');
		this._poll_state();
	},
	_poll_then_reset_bool: false,
	_poll_then_reset: function() {
		// console.log("_poll_then_reset()");
		this._poll_then_reset_bool = true;
		this._poll_restart();
	},
	_poll_state: function () {
		// console.log("_poll_state()");
		var self = this;

		if (app.config.env == 'alpha') {
			// FOR APPLE TESTING...
			app.manager.set('is_sisbot_available', 'true');
			this.set('data.is_internet_connected', 'true');
			return this;
		}

		if (this.get('is_master_branch') == 'false') console.log("Get State: ", app.manager.get('is_sisbot_available'), this.get('is_polling'));

		this._update_sisbot('state', {}, function(obj) {
			if (obj.resp) {
				self._poll_timer = false;
				self.check_for_unavailable();

				app.manager.intake_data(obj.resp);
				if (self.get('is_polling') == "true") {
					console.log("Reconnected:", self.get('data.local_ip'));
					app.config.set_sisbot_url(self.get('data.local_ip'));
					app.socket.initialize();		// try to connect to socket
				}
			} else if (obj.err) {
				self._poll_failure();
			}
		}, 500);

		if (this.get('is_polling') == "true") {
			this.polling_timeout = setTimeout(function () {
				self._poll_state();
			}, 1000);
		}

		return this;
	},
	/**************************** AMDIN ***************************************/
	check_for_unavailable: function () {
		if (this.get('data.reason_unavailable') !== 'false') {
			// make sure we say the sisbot is unavailable
			app.manager.set('is_sisbot_available', 'false');
		} else {
			app.manager.set('is_sisbot_available', 'true');
		}
	},
	defaults_setup: function () {
		var data = this.get('data');

		var defaults = {
			do_not_remind			: 'true',
			timezone_offset		: moment().format('Z'),
			name							: data.name,
			brightness				: data.brightness,
			is_autodim				: data.is_autodim,
			share_log_files		: 'false',
			is_sleep_enabled	: 'true',
			sleep_time				: '10:00 PM',
			wake_time					: '8:00 AM',
			is_nightlight			: data.is_nightlight,
			nightlight_brightness	: data.nightlight_brightness
		}

		this.set('default_settings', defaults);
	},
	defaults_brightness: function (level) {
		this.set('default_settings.brightness', level);
	},
	defaults_nightlight_brightness: function (level) {
		this.set('default_settings.nightlight_brightness', +level);
	},
	defaults_save: function () {
		var self		= this;
		var data		= this.get('data');
		var reg_data	= this.get('default_settings');
		var endpoint	= (this.is_legacy()) ? 'stop_wifi_reminder' : 'onboard_complete';

		_.extend(data, reg_data)

		app.manager.set('show_nightlight_page', 'false');

		setTimeout(function() { // add delay in case we are planning to restart.. Makes it appear snappier
			app.trigger('session:active', { secondary: 'false', primary: 'current' });
		}, 2500);

		this._update_sisbot(endpoint, data, function(obj) {
			if (obj.err && obj.err == 'Could not make request') {
				// do nothing
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
				self.setup_favorite_playlist();
			}
		});
	},
	get_networks: function () {
		console.log("get_networks()");
		var self			= this;
		var wifi_networks	= [];
		this.set('show_wifi_list', 'false');

		if (app.config.env == 'alpha') {
			this.set('wifi_networks', ['test', 'test 2', 'test 3']);
			return this;
		}

		this._update_sisbot('get_wifi', { iface: 'wlan0', show_hidden: true }, function(obj) {
			if (obj.err) {
				self.get_networks();
			}
			_.each(obj.resp, function(network_obj) {
					wifi_networks.push(network_obj.ssid);
			})
			var uniq_wifi = _.uniq(wifi_networks.sort());

			var current_ssid = app.manager.get('current_ssid');
			var current_name = self.get('wifi.name');

			if (uniq_wifi.indexOf(current_ssid) > -1) {
				self.set('wifi.name', current_ssid);
			} else if (uniq_wifi.length > 0 && uniq_wifi.indexOf(current_name) < 0) {
				self.set('wifi.name', uniq_wifi[0]);
			}

			self.set('wifi_networks', uniq_wifi);
			self.set('show_wifi_list', 'true');
		}, 10000); // wait ten seconds before retrying
  },
	wifi_failed_to_connect: function () {
		console.log("wifi_failed_to_connect()");
		if (this.get('data.failed_to_connect_to_wifi') == 'true') {
			this.set('wifi_error', 'incorrect')
				.set('wifi_connecting', 'false');

			if (this.is_legacy()) {
				this.set('data.reason_unavailable', 'connect_to_wifi');
			}
		} else {
			this.set('wifi_error', 'false');
		}
	},
	wifi_connected: function () {
		console.log("wifi_connected()");
		var active = app.session.get('active');

		if (this.get('data.is_network_connected') == 'true' && this.get('data.wifi_forget') == 'false' && active.primary == 'settings' && active.secondary == 'wifi') {
			app.trigger('sisbot:wifi_connected');
			app.session.set('active.secondary', 'advanced_settings');
		} else if (this.get('data.is_network_connected') == 'true' && app.manager.get('show_wifi_page') == 'true') {
			app.trigger('sisbot:wifi_connected');
		}

		// correct values
		this.set({
			wifi_error		: 'false',
			wifi_connecting	: 'false',
		});
		this.set('data.wifi_password', 'false');

		if (this.get('data.is_internet_connected') == 'true' && this.is_legacy()) {
			app.trigger('session:active', { secondary: 'software-update', primary: 'settings' });
		}
	},
	clear_wifi_errors: function(){
		this.set('wifi_error','false');
		this.set('wifi_connecting','false');
		this.set('data.wifi_password', 'false');
  },
	connect_to_wifi: function () {
		console.log("connect_to_wifi()");
		this.set('wifi_error', 'false')
			.set('wifi_connecting', 'false');

		var self		= this;
		var credentials = this.get('wifi');
		if (credentials.password == '') {
			app.plugins.n.notification.confirm("You did not enter a password, are you sure you want to submit",
			function(resp_num) {
				if(resp_num !== 1){
					return self;
				}else{
					self._connect_to_wifi();
				}
			}, 'No Password?', ['Yes','No']);
		}else if (credentials.password.length > 0 && credentials.password.length < 8 ) {
			this.set('wifi_error', 'true');
			app.plugins.n.notification.alert('Your Wi-Fi password mut be 8 characters or more.');
			return this;
		}else {
			this._connect_to_wifi();
		}
  },
	_connect_to_wifi: function () {

		var self= this;
		var credentials = this.get('wifi');
		var endpoint	= (this.is_legacy()) ? 'change_to_wifi' : 'connect_to_wifi';

		this.set('data.failed_to_connect_to_wifi', 'false')
				.set('data.is_hotspot', 'false')
				.set('data.wifi_forget', 'true')
				.set('wifi_connecting', 'true');

			this._update_sisbot(endpoint, { ssid: credentials.name, psk: credentials.password }, function(obj) {
				if (obj.err && obj.err !== 'Could not make request') {
					console.log('wifi err', obj.err);
					self.set('wifi_error', 'true')
						.set('wifi_connecting', 'false');
				} else if (obj.resp) {
					app.manager.intake_data(obj.resp);
				}

				if (self.is_legacy()) {
					setTimeout(function() {
						self.set('data.failed_to_connect_to_wifi', 'false')
							.set('data.reason_unavailable', 'connect_to_wifi')
							.set('data.is_hotspot', 'false')
							.set('data.wifi_forget', 'true');

						setTimeout(function() {
							self.set('data.failed_to_connect_to_wifi', 'false')
								.set('data.reason_unavailable', 'connect_to_wifi')
								.set('data.is_hotspot', 'false')
								.set('data.wifi_forget', 'true');
						}, 200);
					}, 200);
				}
			});

	},
	disconnect_wifi: function () {
		console.log("disconnect_wifi()");
		var self = this;

		app.plugins.n.notification.confirm('Are you sure you want to disconnect your Sisyphus from WiFi', on_disconnect, 'WiFi Disconnect', ['Cancel', 'Disconnect']);

		function on_disconnect(status) {
			if (status == 1)
				return self;

			self._update_sisbot('disconnect_wifi', {}, function(obj) {
				// do nothing
				self.set('is_polling', 'false')
					.set('data.is_internet_connected', 'false')
					.set('data.is_network_connected', 'false')
					.set('data.is_hotspot',	'true')
					.set('data.wifi_forget', 'false')
					.set('data.wifi_network', 'false')
					.set('data.wifi_password', 'false')
					.set('data.reason_unavailable', 'disconnect_from_wifi')
					.set('data.local_ip', '192.168.42.1'); // change right away

				app.manager.set('sisbot_reconnecting', 'false');
				app.config.set_sisbot_url('192.168.42.1'); // change right away
				self.check_for_unavailable();
			});
		}
	},
	is_internet_connected: function () {
		console.log("is_internet_connected()");
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
	install_update_alert: function () {
		let self = this;
		let is_servo = self.get('data.is_servo');
		let true_text = "Your ball will home to the middle and the table will restart. This may take sometime. Are you sure you want to continue?";
		let false_text = "Your table will restart this may take sometime. Are you sure you want to continue?";
		if(is_servo == 'true') {
			if(app.plugins.n.notification.confirm(true_text,
				function(resp_num){
					if(resp_num == 1) {
						return self;
					}
					self.install_updates();
				}, 'Update Table?', ['Cancel', 'OK'])
			 );

			} else if(is_servo == 'false'){
				if(app.plugins.n.notification.confirm(false_text,
					function(resp_num){
						if(resp_num == 1) {
							return self;
						}
						self.install_updates();
					}, 'Update Table?', ['Cancel', 'OK'])
				);

			}
	},
	install_updates: function () {
		console.log("install_updates()");
		if (this.get('data.installing_updates') == 'true')
			return this;

		var self = this;

		this.set('force_onboarding', 'true');

		this._update_sisbot('install_updates', {}, function(obj) {
			if (obj.err) {
				self.set('data.installing_updates_error', 'There was an error updating your Sisbot');
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
			}
		});

		return this;
	},
	install_updates_change: function () {
		console.log("install_updates_change()");
		var status = this.get('data.installing_updates');

		if (status == 'false') {
			app.manager.set('show_software_update_page', 'false');
		} else {
			app.manager.set('show_software_update_page', 'true');
		}
	},
	check_force_onboarding: function () {
		console.log("check_force_onboarding()");
		if (this.get('data.installing_updates') == 'false' && this.get('force_onboarding') == 'true') {
			app.manager.should_show_onboarding();
			this.set('force_onboarding', 'false');
		}
	},
	factory_reset: function () {
		console.log("factory_reset()");
		if (this.get('data.factory_resetting') == 'true')
			return this;

		var self = this;
		app.plugins.n.notification.confirm('Are you sure you want to RESET your Sisyphus table to factory settings? This cannot be undone and will take some time.',
		function(resp_num) {
			if (resp_num == 1)
				return self;

			self.set('data.factory_resetting', 'true')

			self._update_sisbot('factory_reset', {}, function(obj) {
				if (obj.err) {
					self.set('data.factory_resetting_error', 'There was an error resetting your Sisbot');
				} else if (obj.resp) {
					app.manager.intake_data(obj.resp);
				}
			});
		}, 'Factory Reset?', ['Cancel', 'OK']);
	},
	setup_update_hostname: function () {
		console.log("setup_update_hostname()");
		this.set('hostname', this.get('data.hostname').replace('.local', ''))
			.set('errors', []);

		return this;
	},
	update_hostname: function () {
		console.log("update_hostname()");
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
				app.manager.intake_data(obj.resp);
			}
		});
	},
	setup_edit: function () {
		this.set('edit', this.get('data')).set('errors', []);
		console.log("Sisbot edit", this.get('edit'));

		return this;
	},
	nightmode_disable_toggle_setup: function () {
		var status = this.get('default_settings.sleep_time');

		if (status == 'false') {
			this.set('default_settings.sleep_time', '10:00 PM')
				.set('default_settings.wake_time', '8:00 AM')
				.set('default_settings.is_nightlight', 'false')
				.set('default_settings.is_sleep_enabled', 'true');
		} else {
			this.set('default_settings.sleep_time', 'false')
				.set('default_settings.wake_time', 'false')
				.set('default_settings.is_sleep_enabled', 'false');
		}

		return this;
	},
	nightmode_disable_toggle: function () {
		var status = this.get('edit.is_sleep_enabled');

		if (status == 'false') {
			this.set('edit.sleep_time', '10:00 PM')
				.set('edit.wake_time', '8:00 AM')
				.set('edit.is_nightlight', 'false')
				.set('edit.is_sleep_enabled', 'true');
		} else {
			this.set('edit.sleep_time', 'false')
				.set('edit.wake_time', 'false')
				.set('edit.is_sleep_enabled', 'false');
		}

		return this;
	},
	update_nightmode: function () {
		if (app.config.env == 'alpha') return app.trigger('session:active', { secondary: 'false' });

		var self		= this;
		var edit		= _.pick(this.get('edit'), 'is_sleep_enabled', 'is_nightlight', 'sleep_time', 'wake_time', 'nightlight_brightness');
		var errors 		= [];

		this.set('errors', []);
		var data = this.get('data');
		_.extend(data, edit);

		data.timezone_offset = moment().format('Z');
		this.set('data.is_sleep_enabled', edit.is_sleep_enabled);
		this._update_sisbot('set_sleep_time', data, function(obj) {
			if (obj.err) {
				self.set('errors', [ obj.err ]);
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
				if(obj.resp.sleep_time == 'false'){
				self.set('data.is_sleep_enabled', 'false');
				} else {
					self.set('data.is_sleet_enabled', 'true');
				}
				app.trigger('session:active', { secondary: 'false' });
			}
		});
	},
	nightmode_sleep_change: function () {
		if (this.is_legacy()) return this;

		var status = this.get('data.is_sleeping');

		if (this.get('_is_sleeping') !== status) {
			if (status == 'true') {
				app.manager.set('show_sleeping_page', 'true');
			} else {
				app.manager.set('show_sleeping_page', 'false')
					.trigger('change:show_sleeping_page');
			}
		}

		this.set('_is_sleeping', status);
	},
	wake_up: function () {
		var self	= this;

		this.set('data.is_sleeping', 'false')

		if (app.config.env == 'alpha') return this;

		this._update_sisbot('wake_sisbot', {}, function(obj) {
			if (obj.err) {
				self.set('errors', [ obj.err ]);
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
				// TESTING: Siri shortcut
				self._donate_siri({
					action:'wake_up',
					phrase:'Wake up'
				});
			}
		});
	},
	is_legacy: function () {
		var firmware = this.get('data.software_version').split('.');

		if (+firmware[1] < 1)	{
			this.set('is_legacy_branch', 'true');
			return true;
		} else {
			this.set('is_legacy_branch', 'false');
			return false;
		}
	},
	sleep: function () {
		var self	= this;

		if (this.is_legacy()) return app.plugins.n.notification.alert('This feature is unavailable because your Sisyphus firmware is not up to date. Please update your version in order to enable this feature');

		this.set('data.is_sleeping', 'true')

		if (app.config.env == 'alpha') return this;

		this._update_sisbot('sleep_sisbot', {}, function(obj) {
			if (obj.err) {
				self.set('errors', [ obj.err ]);
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
				self.nightmode_sleep_change();

				// TESTING: Siri shortcut
				self._donate_siri({
					action:'sleep',
					phrase:'Sleep'
				});
			}
		});
	},
	update_tableName_alert: function () {
		let self = this;
		let is_servo = self.get('data.is_servo');
		let servo_text = "Your ball will home to the middle and the table will restart. This may take a few moments. Are you sure you want to continue?";
		let not_servo_text = "Your table will restart this may take a few moments. Are you sure you want to continue?";

		if(is_servo == 'true') {
			if(app.plugins.n.notification.confirm( servo_text,
			function(resp_num) {
				if(resp_num == 1) {
					return self;
				}
				self.update_tablename();
			},'Change Table Name?', ['No','Yes'])
		);

		} else if (is_servo == 'false') {
			if(app.plugins.n.notification.confirm( not_servo_text,
				function(resp_num) {
					if(resp_num == 1) {
						return self;
					}
					self.update_tablename();
				},'Change Table Name?', ['No','Yes'])
			);
		}
	},
	update_tablename: function () {
		if (this.is_legacy()) {
			app.plugins.n.notification.alert('This feature is unavailable because your Sisyphus firmware is not up to date. Please update your version in order to enable this feature');
			return app.trigger('session:active', { secondary: 'advanced_settings' });
		}

		var self		= this;
		var name		= this.get('edit.name');
		var errors 		= [];

		this.set('errors', []);
		this.set('updating_tablename', 'true');

		if (errors.length > 0)
			return this.set('updating_tablename', 'false').set('errors', [ 'Table Name cannot be empty' ]);

		var data = this.get('data');
		data.name = name;

		if (app.config.env == 'alpha') {
			return app.trigger('session:active', { secondary: 'advanced_settings' });
			this.set('data.name', name);
		}

		this._update_sisbot('save', data, function(obj) {
			self.set('updating_tablename', 'false');

			if (obj.err) {
				self.set('errors', [ obj.err ]);
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
				app.trigger('session:active', { secondary: 'advanced_settings' });
			}
		});

	},
	restart: function () {
		this.set('data.reason_unavailable','restarting');

		this._update_sisbot('restart', {}, function(obj) {
			console.log('RESTART');
		});
	},
	save_to_sisbot: function (data, cb) {
		var self = this;
		if (!cb) cb = function(obj) {};
		console.log("Save to Sisbot");

		this._update_sisbot('save', data, cb);
	},
	save_log_sharing: function (data) {
		if (this.is_legacy()) {
			app.plugins.n.notification.alert('This feature is unavailable because your Sisyphus firmware is not up to date. Please update your version in order to enable this feature');
			return app.trigger('session:active', { secondary: 'advanced_settings' });
		}

		var self		= this;
		var logfiles	= this.get('edit.share_log_files');
		var errors 		= [];

		this.set('errors', []);

		var data = this.get('data');
		data.share_log_files = logfiles;

		if (app.config.env == 'alpha') {
			return app.trigger('session:active', { secondary: 'advanced_settings' });
			this.set('data.share_log_files', logfiles);
		}

		this._update_sisbot('save', data, function(obj) {
			if (obj.err) {
				self.set('errors', [ obj.err ]);
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
				app.trigger('session:active', { secondary: 'advanced_settings' });
			}
		});
	},
	load_log_files: function() {
		console.log("Load Log Files");
		var self = this;

		// load log files from sisbot
		this._update_sisbot('get_log_filenames', {}, function(obj) {
			if (obj.err) return console.log("Error loading log files", obj.err);

			if (obj.resp && _.isArray(obj.resp)) {
				self.set('log_files', obj.resp);
				if (obj.resp.indexOf('proxy.log') >= 0) self.set('log_file', 'proxy.log');
				else if (obj.resp.length > 0) self.set('log_file', obj.resp[0]);
			}
		});
	},
	get_log_file: function() {
		// { filename: 'YYYYMMDD_sisbot|plotter|proxy', }

		// var date 		= this.get('log_date').split('/');
		// var type 		= this.get('log_type');
		// var file 		= date[2] + date[0] + date[1] + '_' + type;
		var file 			= this.get('log_file');
		var file_url 	= 'http://' + this.get('data.local_ip') + '/sisbot/download_log_file/' + file;

		app.plugins.file_download(file_url);
	},
	pause_between_tracks: function() {
		if (this.is_legacy())
			return app.plugins.n.notification.alert('This feature is unavailable because your Sisyphus firmware is not up to date. Please update your version in order to enable this feature');

		var self		= this;
		var state		= app.plugins.bool_opp[this.get('edit.is_paused_between_tracks')];

		this.set('edit.is_paused_between_tracks', state)
			.set('errors', []);

		this._update_sisbot('set_pause_between_tracks', { is_paused_between_tracks: state }, function(obj) {
			if (obj.err) {
				self.set('errors', [ obj.err ]);
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
			}
		});
	},
	/**************************** PLAYBACK ************************************/
	play_playlist: function(data) {
		console.log("Siri: play playlist", JSON.stringify(data));

		var playlist = app.collection.get(data.id);
		if (playlist) {
			if (data.is_shuffle) playlist.play_shuffled();
			else playlist.play();
		}
	},
	update_playlist: function (playlist_data) {
		var self = this;

		// check for fault
		if (this.get('data.fault_status') != 'false') {
			return app.plugins.n.notification.alert('Please fix fault status',
					function(resp_num) {
						if (resp_num == 1){
							return;
						}
					},'Unable to Play Playlist', ['OK']);
		}

		this._update_sisbot('set_playlist', playlist_data, function(obj) {
			//get back playlist obj
			if (obj.resp.id !== 'false') {
				app.manager.intake_data(obj.resp);

				// TESTING: Siri shortcut
				var siri_obj = {
					action: 'play_playlist',
					phrase: 'Play '+playlist_data.name+' Playlist',
					identifier: 'play_'+playlist_data.id,
					msg:{
						id: playlist_data.id,
						is_shuffle: playlist_data.is_shuffle
					}
				};
				if (playlist_data.is_shuffle == 'true') {
					siri_obj.identifier = 'shuffle_'+playlist_data.id;
					siri_obj.phrase = 'Shuffle '+playlist_data.name+' Playlist';
				}
				self._donate_siri(siri_obj);
			}
		});

		this.set('data.is_loop', playlist_data.is_loop);
		this.set('data.is_shuffle', playlist_data.is_shuffle);
		this.set('data.active_playlist_id',	playlist_data.id);
		this.set('data.active_track_id',	playlist_data.active_track_id);
		this.set('data.state', 'playing');

		app.trigger('session:active', { 'primary': 'current', 'secondary': 'false' });
	},
	play_track: function(data) {
		console.log("Siri: play track", JSON.stringify(data));

		var track = app.collection.get(data.id);
		if (track) track.play(); // call on model, in case model needs to make adjustments
	},
	set_track: function (data) {
		var self = this;

		// check for fault
		if (this.get('data.fault_status') != 'false') {
			return app.plugins.n.notification.alert('Please fix fault status',
					function(resp_num) {
						if (resp_num == 1){
							return;
						}
					},'Unable to Play Track', ['OK']);
		}

		this._update_sisbot('set_track', data, function (obj) {
			if (obj.resp) app.manager.intake_data(obj.resp);

			// TESTING: Siri shortcut
			self._donate_siri({
				action: 'play_track',
				phrase: 'Play '+data.name+' Track',
				identifier:'play_'+data.id,
				msg:{ id: data.id }
			});

			app.trigger('session:active', { secondary: 'false', primary: 'current' });
		});

		this.set('data.active_playlist_id',	'false');
		this.set('data.active_track_id',	data.id);
		this.set('data.state', 'playing');
	},
	setup_default_playlist: function () {
		this.set('default_playlist_id', this.get('data.default_playlist_id')).set('errors', []);
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
				app.manager.intake_data(obj.resp);
				app.trigger('session:active', { secondary: 'false' });
			}
		});

		return this;
	},
	setup_favorite_playlist: function () {
		if (this.is_legacy())
			return this;

		if (this.get('data.favorite_playlist_id') !== 'false')
			return this;

		var self = this;

		var playlist = app.collection.add({
			id				: app.plugins.uuid(),
			type			: 'playlist',
			name			: 'Favorites',
			is_shuffle		: 'true'
		});

		this.set('data.favorite_playlist_id', playlist.id);

		this._update_sisbot('save', this.get('data'), function(obj) {
			if (obj.err) {

			} else {
				self.playlist_add(playlist);
			}
		});

		if (app.config.env == 'alpha') // so it works in alpha
			self.playlist_add(playlist);
	},
	nightlight_brightness: function (level) {
		this.set('edit.nightlight_brightness', +level);
	},
	default_brightness: function (level) {
		var self = this;
		this.set('default_settings.brightness', +level);
		this.brightness(level);
	},
	brightness: function (level) {
		var self = this;

		console.log("Brightness:", level, this.get('data.brightness'));
		this.set('data.brightness', +level).set('edit.brightness', +level);

		if (this.get('wait_for_send') == 'false') {
			// var start = +new Date();
			this.set('wait_for_send','true');
			var remember_level = +level;
			this._update_sisbot('set_brightness', { value: remember_level }, function (obj) {
				// do nothing
				// var end = +new Date();
				// console.log("Brightness Response (millis):", end-start);
				self.set('wait_for_send','false');

				// console.log("Tail Brightness", remember_level, self.get('edit.brightness'));

				if (self.get('edit.brightness') !== remember_level) {
					self.brightness(self.get('edit.brightness'));
				}
			});
		} else {
			// console.log("New Brightness", level);
		}
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
	set_autodim_default: function () {
		var opp = app.plugins.bool_opp[this.get('default_settings.is_autodim')];
		this.set('default_settings.is_autodim', opp);
		this.autodim_toggle();
	},
	autodim_toggle: function () {
		var data		= this.get('data');
		data.is_autodim = app.plugins.bool_opp[data.is_autodim];
		this.set('data', data);
		this.trigger('change:data.is_autodim');
		this._update_sisbot('set_autodim', { value: data.is_autodim }, function(obj) {
			if (obj.resp) app.manager.intake_data(obj.resp);
		});
	},
	speed: function (level) {
		var self = this;

		this.set('data.speed', +level).set('edit.speed', +level);

		if (this.get('wait_for_send') == 'false') {
			this.set('wait_for_send','true');
			var remember_level = +level;
			this._update_sisbot('set_speed', { value: remember_level }, function (obj) {
				self.set('wait_for_send','false');

				if (self.get('edit.speed') !== remember_level) {
					// console.log("Tail Speed", remember_level, self.get('edit.speed'));
					self.speed(self.get('edit.speed'));
				}
			});
		}
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
	showMouse: function() {
		var x = event.clientX;
		var y = event.clientY;
		var coords = "X coords: " + x + ", Y coords: " + y;
		console.log('Coordinates are =', coords)

	},
	set_shuffle: function () {
		this.set('data.is_shuffle', app.plugins.bool_opp[this.get('data.is_shuffle')]);

		this._update_sisbot('set_shuffle', { value: this.get('data.is_shuffle') }, function (obj) {
			if (obj.resp) app.manager.intake_data(obj.resp);
		});
	},
	set_loop: function () {
		var self = this;
		this.set('data.is_loop', app.plugins.bool_opp[this.get('data.is_loop')]);
		this._update_sisbot('set_loop', { value: this.get('data.is_loop') }, function (obj) {
			if (obj.resp) app.manager.intake_data(obj.resp);
		});
	},
	enable_led: function() {
		var self = this;
		// send to sisbot
		this._update_sisbot('set_led', { is_rgbw: 'true' }, function (obj) {
			// set as enables
			// console.log("LED resp", obj);
			self.set('data.led_enabled', obj.resp.is_rgbw);
		});
	},
	demo_pattern: function() {
		var self = this;
		if (this.get('edit.led_pattern') != 'demo') {
			this.set('edit.led_pattern', 'demo');
		}
	},
	calibrate_pattern: function() {
		var self = this;
		if (this.get('edit.led_pattern') != 'calibrate') {
			// console.log("Switch to Calibrate, remember", this.get('data.led_pattern'));
			this.set('rem_pattern', this.get('data.led_pattern'));

			this.set('edit.led_pattern', 'calibrate');

			this.listenToOnce(app.session, 'change:active.secondary', function() {
				// console.log("Reset pattern to", self.get('rem_pattern'));
				self.set('edit.led_pattern', self.get('rem_pattern'));
			});
		}
	},
	_change_led_pattern: function() {
		var self = this;

		var new_pattern = this.get('edit.led_pattern');

		if (new_pattern != 'false' && this.get('data.led_pattern') != new_pattern) {
			this.set('data.led_pattern', new_pattern);

			// send to sisbot
			var pattern = app.collection.get(new_pattern);
			if (pattern) {
				console.log("Update LED Pattern", pattern.get('data'));
				self._update_sisbot('set_led_pattern', pattern.get('data'), function (obj) {
					if (obj.err) return console.error(err);

					// fix possible incorrect return value
					if (_.isObject(obj.resp.led_primary_color)) {
						var colors = obj.resp.led_primary_color;
						var red = colors.red.toString(16);
						if (red.length < 2) red = '0'+red;
						var green = colors.green.toString(16);
						if (green.length < 2) green = '0'+green;
						var blue = colors.blue.toString(16);
						if (blue.length < 2) blue = '0'+blue;
						var white = colors.white.toString(16);
						if (white.length < 2) white = '0'+white;
						obj.resp.led_primary_color = '0x'+red+green+blue+white;
						console.log("Fix Primary", JSON.stringify(colors), obj.resp.led_primary_color);
					}
					if (_.isObject(obj.resp.led_secondary_color)) {
						var colors = obj.resp.led_secondary_color;
						var red = colors.red.toString(16);
						if (red.length < 2) red = '0'+red;
						var green = colors.green.toString(16);
						if (green.length < 2) green = '0'+green;
						var blue = colors.blue.toString(16);
						if (blue.length < 2) blue = '0'+blue;
						var white = colors.white.toString(16);
						if (white.length < 2) white = '0'+white;
						obj.resp.led_secondary_color = '0x'+red+green+blue+white;
						console.log("Fix Secondary", JSON.stringify(colors), obj.resp.led_secondary_color);
					}

					// intake data
					app.manager.intake_data(obj.resp);

					// TESTING: Siri shortcut
					self._donate_siri({
						action: 'set',
						identifier: 'pattern_'+new_pattern,
						phrase: pattern.get('data.name')+' Light Pattern',
						msg: { 'edit.led_pattern': new_pattern }
					});
					console.log("Set LED Pattern return", obj);
				});
			}
		}
	},
	_update_pattern_colors: function() {
		var do_save = false;

		// load last used color from this pattern
		var pattern = app.collection.get(this.get('data.led_pattern'));
		// console.log("Update Pattern Colors", pattern.get('data'), this.get('edit.led_primary_color'), this.get('edit.led_secondary_color'));
		if (pattern) {
			if (pattern.get('data.is_white') == 'true') {
				// console.log("Update white from led_pattern", pattern.get('data'));
				this.set('edit.led_primary_color', pattern.get_white_color());
				this.led_color();
			} else if (pattern.get('data.is_primary_color') == 'true' || pattern.get('data.is_secondary_color') == 'true') {
				// console.log("Update colors from led_pattern", pattern.get('data'));
				if (pattern.get('data.is_primary_color') == 'true' && pattern.get('data.led_primary_color') != 'false') this.set('edit.led_primary_color', pattern.get('data.led_primary_color'));
				if (pattern.get('data.is_secondary_color') == 'true' && pattern.get('data.led_secondary_color') != 'false') this.set('edit.led_secondary_color', pattern.get('data.led_secondary_color'));
				this.led_color();
			} else {
				console.log("No color update from led_pattern", pattern.get('data'));
				do_save = true;
			}
		} else do_save = true;

		return do_save;
	},
	remember_colors: function(data) {
		console.log("Remember LED_Colors", this.get('data.led_primary_color'), this.get('data.led_secondary_color'));

		this.set('rem_primary_color', this.get('data.led_primary_color'));
		this.set('rem_secondary_color', this.get('data.led_secondary_color'));
	},
	cancel_color: function(data) {
		this.set('edit.led_primary_color', this.get('rem_primary_color'));
		this.set('edit.led_secondary_color', this.get('rem_secondary_color'));

		this.led_color();

		app.trigger('session:active', { 'secondary': 'false' });
	},
	toggle_picker: function(data) {
		console.log("Toggle Picker", this.get('edit.led_primary_color'), this.get('edit.led_secondary_color'));

		this.set('show_picker', 'false');

		this.led_color(null);

		this.set('show_picker', 'true');
	},
	led_color: function(data) {
		console.log("Sisbot LED_Color", data, this.get('edit.led_primary_color'), this.get('edit.led_secondary_color'));
		var self = this;
		var color_data = {};

		var led_pattern = this.get_model('data.led_pattern');

		// check for primary change
		var edit_primary = this.get('edit.led_primary_color');

		// fix possible errors
		if (edit_primary) {
			if (edit_primary.match(/^0x/)) edit_primary = edit_primary.replace(/^0x/, '#');
			if (!edit_primary.match(/^#[0-9a-f]{8}$/i)) {
				edit_primary = this.get('data.led_primary_color');
				this.set('edit.led_primary_color', edit_primary);
			}
		}

		// console.log("Compare Primary Color", this.get('data.led_primary_color'), edit_primary);
		if (this.get('data.led_primary_color') != edit_primary) {
			this.set('data.led_primary_color', edit_primary);

			console.log("Update Primary Color", this.get('data.led_primary_color'));

			color_data.led_primary_color = edit_primary;

			// update the led_pattern
			if (led_pattern) led_pattern.set('data.led_primary_color', edit_primary);
		}

		// check for secondary change
		var edit_secondary = this.get('edit.led_secondary_color');

		// fix possible errors
		if (edit_secondary) {
			if (edit_secondary.match(/^0x/)) edit_secondary = edit_secondary.replace(/^0x/, '#');
			if (!edit_secondary.match(/^#[0-9a-f]{8}$/i)) {
				edit_secondary = this.get('data.led_secondary_color');
				this.set('edit.led_secondary_color', edit_secondary);
			}
		}

		// console.log("Compare Secondary Color", this.get('data.led_secondary_color'), edit_secondary);
		if (this.get('data.led_secondary_color') != edit_secondary) {
			this.set('data.led_secondary_color', edit_secondary);

			console.log("Update Secondary Color", this.get('data.led_secondary_color'));

			color_data.led_secondary_color = edit_secondary;

			// update the led_pattern
			if (led_pattern) led_pattern.set('data.led_secondary_color', edit_secondary);
		}

		// send to sisbot
		if (!_.isEmpty(color_data)) {
			console.log("Save color data", this.get('data.led_primary_color'), this.get('data.led_secondary_color'));
			var save_data = [this.get('data')];
			if (led_pattern) save_data.push(led_pattern.get('data'));
			console.log("Save data", save_data);
			this.save_to_sisbot(save_data);

			this._update_sisbot('set_led_color', color_data, function(obj) { console.log("Color Set", obj); });
		}
	},
	led_offset_up: function () {
		var level = +this.get('data.led_offset');
		level += 1;
		if (level > 180) level = 180;
		this.led_offset(level);
	},
	led_offset_down: function () {
		var level = +this.get('data.led_offset');
		level -= 1;
		if (level < -180) level = -180;
		this.led_offset(level);
	},
	led_offset: function (level) {
		var self = this;

		// console.log("OFFSET:", level, this.get('data.led_offset'));
		this.set('data.led_offset', +level).set('edit.led_offset', +level);

		if (this.get('wait_for_send') == 'false') {
			// var start = +new Date();
			// this.set('wait_for_send','true');
			var remember_level = +level;
			this._update_sisbot('set_led_offset', { offset: remember_level }, function (obj) {
				// save value
				self.save_to_sisbot(self.get('edit'), null);

				// var end = +new Date();
				// console.log("Brightness Response (millis):", end-start);

				// console.log("Tail Brightness", remember_level, self.get('edit.brightness'));
				// self.save_to_sisbot(self.get('data'), function(obj) {
				// 	self.set('wait_for_send','false');
				//
				// 	if (self.get('edit.led_offset') !== remember_level) {
				// 		self.led_offset(self.get('edit.led_offset'));
				// 	}
				// });
			});
		} else {
			// console.log("New Offset", level);
		}
	},
	homing_offset: function(level) {
		console.log("Homing Offset: ", level);
		this.set('edit.table_settings.homingOffset',+level);
	},
	homing_offset_up: function () {
		var level = +this.get('edit.table_settings.homingOffset');
		level += 0.01;
		if (level > 0.12) level = 0.12;
		this.set('edit.table_settings.homingOffset',level);
	},
	homing_offset_down: function () {
		var level = +this.get('edit.table_settings.homingOffset');
		level -= 0.01;
		if (level < -0.12) level = -0.12;
		this.set('edit.table_settings.homingOffset',level);
	},
	disconnect: function () {
		app.plugins.n.notification.confirm('Are you sure you want to disconnect from the Sisyphus?', function(resp_num) {
			if (resp_num == 1) return self;

	    app.current_session().clear_sisbots(); // clear known sisbots
			window.location.reload();
		}, 'Disconnect?', ['Cancel', 'OK']);
	},
	/******************** PLAYLIST / TRACK STATE ******************************/
	playlist_add: function (playlist_model) {
		var self		= this;
		var playlist	= playlist_model.get('data');

		this._update_sisbot('add_playlist', playlist, function (obj) {
			console.log('Sisbot: Add playlist', obj);
			if (obj.err) {
				console.log("Error in the _update_sisbot when adding to Playlist. ", obj.err);
				return app.plugins.n.notification.alert('There was an error adding the playlist to your Sisyphus. Please try again later.');
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
			}
		});

		this.add_nx('data.playlist_ids', playlist.id);
	},
	playlist_remove: function (playlist_model) {
		if (this.is_legacy())
			return app.plugins.n.notification.alert('This feature is unavailable because your Sisyphus firmware is not up to date. Please update your version in order to enable this feature');

		var self		= this;
		var playlist	= playlist_model.get('data');

		this._update_sisbot('remove_playlist', playlist, function (obj) {
			if (obj.err) {
				console.log("Error in the _update_sisbot  to Playlist. ", obj.err);
				return app.plugins.n.notification.alert('There was an error removing your Playlist. Please try again later.');
			} else if (obj.resp) {
				app.manager.intake_data(obj.resp);
				app.trigger('session:active', { 'secondary': 'playlists' });
			}
		});

		this.remove('data.playlist_ids', playlist_model.id);
	},
	track_add: function (track_model) {
		console.log('Calling track_add:', track_model);
		var self	= this;
		var track	= track_model.get('data');

		this.set('uploading_track', 'true');

		this._update_sisbot('add_track', track, function (obj) {
			self.set('uploading_track', 'false');

			if (obj.err) {
				app.plugins.n.notification.alert(obj.err);
			} else if (obj.resp) {
				// make sure verts are not retained
				if (track_model.get('data.verts')) track_model.unset('data.verts');

				// show track image
				track_model.set('generating_thumbnails', 'false');

				app.manager.intake_data(obj.resp);
				// manager will now change pages
				// app.trigger('session:active', { track_id: track.id, secondary: 'track', primary: 'media' });
			}
		}, 60000);

		this.add_nx('data.track_ids', track.id);
	},
	track_remove: function (track_model) {
		if (this.is_legacy())
			return app.plugins.n.notification.alert('This feature is unavailable because your Sisyphus firmware is not up to date. Please update your version in order to enable this feature');

		var self = this;

		app.plugins.n.notification.confirm('Are you sure you want to delete this track? This cannot be undone.', function(resp_num) {
			if (resp_num == 1)
				return self;

			if (app.config.env == 'alpha') {
				var active = app.session.get('active');
				if (active.primary == 'current') app.trigger('session:active', { track_id: 'false', secondary: 'false' });
				else 							 app.trigger('session:active', { track_id: 'false', secondary: 'tracks', primary: 'media' });
			}

			var track	= track_model.get('data');

			self._update_sisbot('remove_track', track, function (obj) {
				if (obj.err) {
					return app.plugins.n.notification.alert('There was an error removing the file from your Sisyphus. Please try again later.');
				} else if (obj.resp) {
					app.manager.intake_data(obj.resp);
					var active = app.session.get('active');
					if (active.primary == 'current') {
						app.trigger('session:active', { track_id: 'false', secondary: 'false' });
					} else {
						app.trigger('session:active', { track_id: 'false', secondary: 'tracks', primary: 'media' });
					}
				}
			});

			self.remove('data.track_ids', track.id);
		}, 'Remove Track?', ['Cancel', 'Delete']);
	},
	track_get_verts: function (track_model, cb) {
		console.log('we got verts', track_model.id);

		this._update_sisbot('get_track_verts', { id: track_model.id }, function (obj) {
			console.log('track get verts', obj);

			if (obj.err) {
				return app.plugins.n.notification.alert('There was an error getting the tracks verts.');
			} else if (obj.resp) {
				cb(obj.resp);
			}
		});
	},
	/******************** PLAYBACK ********************************************/
	play: function () {
		var self = this;
		this.set('data.state', 'playing');

		// check for fault
		if (this.get('data.fault_status') != 'false') {
			return app.plugins.n.notification.alert('Please fix fault status',
					function(resp_num) {
						if (resp_num == 1){
							return;
						}
					},'Unable to Play', ['OK']);
		}

		this._update_sisbot('play', {}, function (obj) {
			if (obj.resp) app.manager.intake_data(obj.resp);

			// TESTING: Siri shortcut
			self._donate_siri({
				action:'play',
				phrase:'Play'
			});
		});
	},
	pause: function () {
		var self = this;
		this.set('data.state', 'paused');
		this._update_sisbot('pause', {}, function (obj) {
			if (obj.resp) app.manager.intake_data(obj.resp);

			// TESTING: Siri shortcut
			self._donate_siri({
				action:'pause',
				phrase:'Pause'
			});
		});
	},
	home: function () {
		var self = this;

		// check for fault
		if (this.get('data.fault_status') != 'false') {
			return app.plugins.n.notification.alert('Please fix fault status',
					function(resp_num) {
						if (resp_num == 1){
							return;
						}
					},'Unable to Home', ['OK']);
		}

		this.set('data.state', 'homing');
		this._update_sisbot('home', { clear_tracks: true }, function (obj) {
			if (obj.resp) app.manager.intake_data(obj.resp);
		});
		return this;
	},
	jog_start: function(jog_type) {
		// check for fault
		if (this.get('data.fault_status') != 'false') {
			return app.plugins.n.notification.alert('Please fix fault status',
					function(resp_num) {
						if (resp_num == 1){
							return;
						}
					},'Unable to Jog', ['OK']);
		}

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
			if (obj.resp) app.manager.intake_data(obj.resp);
		});

		return this;
	},
	/******************** CSON OVERRIDE ******************************************/
	confirm_advanced_settings: function() {
		var self = this;

		// make sure a change occured
		console.log("Advanced Update", this.get('data.table_settings'), this.get('edit.table_settings'));
		var edit_value = this.get('edit.table_settings');
		var data_value = this.get('data.table_settings');
		if (JSON.stringify(edit_value) == JSON.stringify(data_value)) return app.trigger('session:active', { secondary: 'advanced_settings' });

		app.plugins.n.notification.confirm("Changing these settings may cause your table to not function as expected.",
			function(resp_num) {
				console.log("Confirm resp", resp_num);
				if (resp_num == 1) {
					return self;
				} else {
					self.save_to_sisbot(self.get('edit'), function(obj) {
						if (obj.err) return console.log("Save error", obj.err);

						if (obj.resp) app.manager.intake_data(obj.resp);

						// go back a page
						app.trigger('session:active', { secondary: 'advanced_settings' });

						app.plugins.n.notification.alert('A restart is required for the changes to take effect.');
						self.restart();
					});
				}
			}, 'Confirm', ['Cancel','Save']);
	},
	/******************** VERSIONING ******************************************/
	check_for_csons: function() {
		var self = this;

		// update table_settings value
		this.set('edit.table_settings.cson', this.get('data.cson'));
		this.set('data.table_settings.cson', this.get('data.cson'));

		// init homingOffset for slider
		if (this.get('edit.table_settings.homingOffset') == undefined) this.set('edit.table_settings.homingOffset', 0);
		if (this.get('edit.is_servo') == 'true') this.set('edit.table_settings.homingOffset', 0);

		if (this.get('csons') == 'false') { // only bother loading once
			this._update_sisbot('get_csons', {}, function(cbb) {
				console.log("CSONs", cbb.err, cbb.resp);

				self.set('csons', cbb.resp);
			});
		}
	},
	check_for_version_update: function () {
		var self	= this;
		var cbs		= 2;
		var version = this.get('data.software_version').split('.');

		this.is_legacy();

		if (this.get('is_connected'))
			this.check_local_versions(on_cb);

		if (this.get('data.is_hotspot') == 'true') {
			// hotspot.. Can't get status
			return this.set('has_software_update', 'false')
		}

		if (app.config.env !== 'sisbot' || this.get('data.is_internet_connected') !== 'false')
			this.check_remote_versions(on_cb);

		function on_cb(on_cb) {
			if (--cbs == 0) {
				var local		= self.get('local_versions');
				var remote		= self.get('remote_versions');
				var has_update	= false;

				if (!remote) {
					// in case remote server is down/not allowed
					if (version[0] == '1' && version[1] == '0') self.set('has_software_update', 'true');	// ALWAYS ALLOW UPGRADE FROM V1.0.X
					else if (+version[1] % 2 == 1) self.set('has_software_update', 'true'); // beta.. Always allow download

					return this;
				}

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

				if (version[0] == '1' && version[1] == '0') {
					// ALWAYS ALLOW UPGRADE FROM V1.0.X
					self.set('has_software_update', 'true');
					//return this; // NO LONGER NEEDED BECAUSE MASTER IS PAST 1.0.9
				} else if (+version[1] % 2 == 1) {
					// beta.. Always allow download
					self.set('has_software_update', 'true');
				}
			}
		}

		return this;
	},
	check_local_versions: function (cb) {
		var self = this;

		if (app.config.env == 'alpha') {
			this.set('local_versions', { api: '1.0.3', app: '1.0.9', proxy: '0.5.6', sisbot: '1.0.8' });
			if (cb) cb();
			return this;
		}

		this._update_sisbot('latest_software_version', {}, function(cbb) {
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

			/* set bool for knowing if on master
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
			*/
		});
	},
	check_remote_versions: function (cb) {
		var self = this;

		var obj = {
			_url	: app.config.get_api_url(),
			_type	: 'POST',
			endpoint: 'latest_software_version',
			data	: {}
		};

		app.post.fetch(obj, function(cbb) {
			self.set('remote_versions', cbb.resp);
			if (cb) cb(); //this invokes the callback if there is a respone passed into this function.
		}, 0);

		return this;
	}
};
