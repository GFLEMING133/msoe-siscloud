app.model.sisyphus_manager = {
	defaults: function (data) {
		var obj = {
			id			    		: data.id,
			type		    		: 'sisyphus_manager',

            user_id         		: 'false',
			user_registration		: 'false',		// false|sign_up|sign_in|hostname

			signing_up				: 'false',
			signing_in				: 'false',

			registration: {
				username				: '',
				password				: '',
			},

			sisbot_id       		: 'false',
			sisbot_registration		: 'find',		// find|none|hotspot|multiple
			show_setup_page			: 'false',
			show_wifi_page			: 'false',
			show_hostname_page		: 'false',
			current_ssid			: 'false',

			sisbots_user			: [],
			sisbots_networked		: [],

			sisbots_scanning		: 'false',
			sisbot_hostname			: '',
			sisbot_connecting		: 'false',

			merge_playlists			: [],

			tracks_to_upload		: [],
			publish_track			: 'false',

			fetching_community_playlists: 'false',
			fetching_community_tracks	: 'false',
			fetched_community_playlists	: 'false',
			fetched_community_tracks	: 'false',

			community_page			: 'playlists',
			community_playlist_ids	: [],
			community_track_ids		: [],

			data		: {
				id					: data.id,
				type    			: 'sisyphus_manager',
				version				: this.current_version,
			}
		};

		return obj;
	},
	current_version: 1,
    on_init: function () {
		this.listenTo(app, 'manager:download_playlist', this.download_playlist);
		this.listenTo(app, 'manager:download_track', 	this.download_track);
		this.listenTo(app, 'session:sign_in',			this.sign_in_via_session);
		app.manager = this;

		this.get_current_ssid();

		// Skip account creation at the beginning
		app.current_session().set('signed_in','true');

		if (app.config.env == 'sisbot') {
			return this.setup_as_sisbot();
		} else if (app.config.env == 'alpha') {
			//this.setup_demo();
		} else if (app.config.env == 'beta'){
			//this.setup_demo();
		} else {
			app.current_session().check_session_sign_in();
		}

		return this;
	},
	intake_data: function(given_data) {
		var self = this;
		if (!_.isArray(given_data)) given_data = [given_data];

		console.log("Intake Data:", given_data);

		_.each(given_data, function(data) {
			if (app.collection.exists(data.id)) {
				app.collection.get(data.id).set('data', data);
			} else {
				app.collection.add(data);
			}

			// if (self.get('sisbot_id') == 'false' && data.type == 'sisbot') {
			// 	self.set('sisbot_id', data.id);
			// 	app.collection.get(data.id).sisbot_listeners();
			// }
		});
	},
	has_user: function () {
		return (this.get('user_id') !== 'false') ? 'true' :'false';
	},
	/**************************** BLUETOOTH ***********************************/
	start_ble_scan: function (cb) {
		var self = this;

		this._ble_cb = cb;

		evothings.ble.startScan(
			function(device) {
				if (device && device.advertisementData.kCBAdvDataLocalName == 'sisyphus') {
					self.ble_connect(device);
				}
			},
			function(error) {
				alert('Start Scan Error: ' + error);
				self.ble_cb();
			}
		);

		setTimeout(function() {
			self.ble_cb();
			self.ble_stop_scan();
		}, 5000);
	},
	_ble_ip	: 'false',
	_char	: false,
	_ble_cb	: false,
	ble_cb: function (value) {
		if (this._ble_cb) {
			this._ble_cb(value);
			this._ble_cb = false;
		}
		return this;
	},
	ble_stop_scan: function () {
		evothings.ble.stopScan();
	},
	ble_connect: function (device) {
		this.ble_stop_scan();

		var self	= this;

		evothings.ble.connectToDevice(device, function on_connect(device) {
			self.get_service_data(device);
		}, function on_disconnect(device) {
			//alert('Disconnected from Device');
			self.ble_cb();
		}, function on_error(error) {
			//alert('Bluetooth Connect Error: ' + error);
			self.ble_cb();
		});
	},
	get_service_data: function(device) {
        var self = this;

        evothings.ble.readAllServiceData(device,
            function on_read(services) {
                var dataService	= evothings.ble.getService(device, "ec00");
                self._char		= evothings.ble.getCharacteristic(dataService, "ec0e")
                self.setup_read_chars(device);
            },
            function on_error(error) {
                //alert('Bluetooth Service Data Error: ' + error);
				self.ble_cb();
				evothings.ble.close(device);
            }
		);
	},
	setup_read_chars: function (device) {
		var self		= this;

        evothings.ble.readCharacteristic(device, this._char, function on_success(d) {
			var ip_address_arr = new Uint8Array(d);
			self._ble_ip = ip_address_arr.join('.');
			self.ble_cb(self._ble_ip);
			evothings.ble.close(device);
        }, function on_fail(error) {
            //alert('Reach Characteristic Error: ' + error);
			self.ble_cb();
			evothings.ble.close(device);
        });
	},
	/**************************** USER REGISTRATION ***************************/
	setup_registration: function () {
		if (this.get('user_id') == 'false')
			this.setup_sign_up();
	},
	setup_sign_up: function () {
		this.set('errors', []);
		this.set('user_registration', 'sign_up');
	},
	setup_sign_in: function () {
		this.set('errors', []);
		this.set('user_registration', 'sign_in');
	},
	sign_up: function () {
		if (this.get('signing_up') == 'true') return false;
		else this.set('signing_up', 'true');

		var self		= this;
		var user_data   = this.get('registration');
		var errors		= this.get_errors(user_data);

		if (errors.length > 0)
			return this.set('signing_up', 'false').set('errors', errors);

		function cb(obj) {
			if (obj.err)
				return self.set('signing_up', 'false').set('errors', [ '- ' + obj.err ]);

			self.set('errors', []);
			self._process_registration(user_data, obj.resp);
		};

		user_data.type		= 'user';
		user_data.endpoint	= 'sign_up';
		user_data._url		= 'https://api.sisyphus.withease.io/';
		user_data._timeout	= '5000';

		app.plugins.fetch(user_data, cb);
	},
	sign_in: function () {
		if (this.get('signing_in') == 'true') return false;
		else this.set('signing_in', 'true');

		var self		= this;
		var user_data   = this.get('registration');
		var errors		= this.get_errors(user_data);

		user_data._timeout = 5000;

		if (errors.length > 0)
			return this.set('signing_in', 'false').set('errors', errors);

		function cb(obj) {
			if (obj.err)
				return self.set('signing_in', 'false').set('errors', [ '- ' + obj.err ]);

			self.set('errors', []);
			self._process_registration(user_data, obj.resp);
		};

		user_data.endpoint	= 'sign_in';
		user_data._url		= 'https://api.sisyphus.withease.io/';
		user_data._timeout	= '5000';

		app.plugins.fetch(user_data, cb, 0);
	},
	get_errors: function (user_data) {
		var errors = [];
		if (!user_data.username || user_data.username == '')	errors.push('- Username cannot be blank');
		if (!user_data.password || user_data.password == '')	errors.push('- Password cannot be blank');
		return errors;
	},
	_process_registration: function (user, data_arr) {
		var session_data = {
			user_id			: 'false',
			username		: user.username,
			password		: user.password
		};

		var self		= this;
		var server_user = false;

		_.each(data_arr, function (m) {
			if (m.type == 'user' && m.username == user.username) {
				server_user = m;
				session_data.user_id = m.id;
				self.set('sisbots_user', m.sisbot_ids);
			}
		});

		app.collection.add(data_arr);
		app.trigger('session:user_sign_in', session_data);


		// setup user info here
		this.set('user_id', session_data.user_id);

		if (this.get('sisbot_id') == 'false')
			this.setup_sisbots_page();
	},
	sign_up_via_settings: function () {
		this.on('change:user_id', this.after_settings);
		this.sign_up();
	},
	sign_in_via_settings: function () {
		this.on('change:user_id', this.after_settings);
		this.sign_in();
	},
	after_settings: function () {
		this.off('change:user_id');
		app.trigger('session:active', { secondary: 'false' });
	},
	sign_in_via_session: function (data) {
		this.set('registration', data);
		this.sign_in();
		return this;
	},
	sign_out: function () {
		this.set('sisbot_id', 'false');
		this.set('user_id', 'false');
		app.current_session().sign_out();
	},
	/*********************** SISBOT ONBOARDING ********************************/
	should_show_onboarding: function () {
		var sisbot				= this.get_model('sisbot_id');
		var hotspot_status		= sisbot.get('data.is_hotspot');
		var reminder_status 	= sisbot.get('data.do_not_remind');

		if (reminder_status == 'false') {
			if (hotspot_status == 'true') {
				this.set('show_wifi_page', 'true');
			} else {
				this.set('show_setup_page', 'true');
			}
		}

		return this;
	},
	should_skip_wifi: function () {
		console.log('we are here');
		this.set('show_wifi_page', 'false');
		this.set('show_setup_page', 'true')
	},
	save_hostname: function () {
		var sisbot				= this.get_model('sisbot_id');
		sisbot.set('updating_hostname', 'true');
		this.listenTo(sisbot, 'change:updating_hostname', this.after_hostname);
		sisbot.update_hostname();
	},
	after_hostname: function () {
		var sisbot	= this.get_model('sisbot_id');
		this.stopListening(sisbot, 'change:updating_hostname');
		this.set('show_hostname_page', 'false');
	},
	/*********************** SISBOT FIND **************************************/
	setup_sisbots_page: function () {
		var _sisbots_user	= this.get('sisbots_user');
		var sisbots_user	= [];

		_.each(_sisbots_user, function(s_id) {
			if (app.collection.exists(s_id))
				sisbots_user.push(s_id);
		});

		this.set('sisbots_user', sisbots_user)
			.set('errors', []);

		return this;
	},
	open_network_settings: function () {
		var self = this;

		window.cordova.plugins.settings.open('wifi', function success(resp) {
			setTimeout(function () {
				self.set('sisbot_registration', 'find');
			}, 2500);
		}, function error(err) {
			alert('Error opening wifi settings. Please manually go to your wifi settings');
		});

		return this;
	},
	/**************************** FIND SISBOTS ********************************/
	find_sisbots: function () {
		// this will find the sisbots on the local network
		var self			= this;

		this.set('sisbots_networked', []);
		this.set('sisbots_scanning', 'true');

		var num_checks = 5;

		function on_cb() {
			console.log("Find CB");
			--num_checks;
			if (num_checks == 0) {

				// DEBUGGING CODE: COMMENT BEFORE COMMIT
				// self.set('sisbot_registration', 'none');
				// return this;

				var sisbots = _.uniq(self.get('sisbots_networked'));
				self.set('sisbots_networked', sisbots);
				self.set('sisbots_scanning', 'false');
				var curr_reg = self.get('sisbot_registration');

				if (sisbots.length == 1) {
					// autoconnect
					self.connect_to_sisbot(sisbots[0]);
				} else if (curr_reg == 'hotspot') {
					// do nothing, we're already notifying user
				} else if (sisbots.length == 0) {
					// show screen that we found none
					self.set('sisbot_registration', 'none');
				} else if (sisbots.length > 1) {
					// show screen to select sisbot
					self.set('sisbot_registration', 'multiple');
				}
			}
		}

		console.log("Find Hotspot");
		this.find_hotspot(on_cb);
		console.log("Find Session");
		this.find_session_sisbots(on_cb);
		console.log("Find User Sisbots");
		this.find_user_sisbots(on_cb);
		console.log("Find Bluetooth Sisbots");
		this.find_bluetooth_sisbots(on_cb);
		console.log("Find Network Sisbots");
		this.find_network_sisbots(on_cb);
	},
	find_hotspot: function (cb) {
		var hotspot_hostname	= '192.168.42.1';

		this.ping_sisbot(hotspot_hostname, cb);

		return this;
	},
	find_session_sisbots: function (cb) {
		var self			= this;
		var session_sisbots = app.current_session().get_sisbots();
		var num_cbs			= session_sisbots.length + 1;

		function on_cb() {
			if (--num_cbs == 0) cb();
		}

		_.each(session_sisbots, function (hostname) {
			self.ping_sisbot(hostname, on_cb);
		});

		on_cb();

		return this;
	},
	find_user_sisbots: function (cb) {
		if (this.get('user_id') == 'false')
			return cb();

		var self			= this;
		var user_sisbots	= this.get_model('user_id').get('data.sisbot_hostnames');
		var num_cbs			= user_sisbots.length + 1;

		function on_cb() {
			if (--num_cbs == 0) cb();
		}

		_.each(user_sisbots, function (hostname) {
			self.ping_sisbot(hostname, on_cb);
		});

		on_cb();

		return this;
	},
	find_bluetooth_sisbots: function (cb) {
		if (!app.is_app)
			return cb();

		var self		= this;
		var ip_address	= false;


		this.start_ble_scan(function (ip_address) {
			if (ip_address)
				self.ping_sisbot(ip_address, cb);
			else
				cb();
		});

		return this;
	},
	find_network_sisbots: function (cb) {
		if (!app.is_app)
			return cb();

		var self = this;

		this.get_network_ip_address(function(ip_address) {
			if (!ip_address)	return cb();

			var ip_add	= ip_address.split('.');
			ip_add.pop();

			var ip_base = ip_add.join('.');
			var count = 256;

			// scan network
			for (var i = 0; i < 256; i++) {
				self.ping_sisbot(ip_base + '.' + i, function() {
					if (--count == 0) cb();
				});
			}
		});

		return this;
	},
	ping_sisbot: function(hostname, cb) {
		var self = this;

		app.post.fetch(exists = {
			_url	: 'http://' + hostname + '/',
			_type	: 'POST',
			_timeout: 1250,
			endpoint: 'sisbot/exists',
			data	: {}
		}, function exists_cb(obj) {
			if (obj.err) {
				if (hostname == self._ble_ip) {
					self.set('sisbot_registration', 'hotspot')
				}
				return cb();
			}

			if (!obj.resp || !obj.resp.hostname)
				return cb();

			// Default select the one we are already on
			self.set('sisbot_hostname', hostname);
			self.add('sisbots_networked', obj.resp.hostname);

			cb();
		}, 0);

		return this;
	},
	connect_to_sisbot: function () {
		if (this.get('sisbot_connecting') == 'true') return false;
		else this.set('sisbot_connecting', 'true');

		this.set('errors', []);

		var self			= this;
		var sisbot_hostname = this.get('sisbot_hostname');

		if (sisbot_hostname == 'apple.auth') {
			app.config.env = 'alpha';
		}

		// ping sisbot for connection
		var obj = {
			_url	: 'http://' + sisbot_hostname + '/',
			_type	: 'POST',
			_timeout: 500,
			endpoint: 'sisbot/connect',
			data	: {},
		};

		app.post.fetch(obj, function(obj) {
			self.set('sisbot_connecting', 'false')
				.set('errors', [])

			if (app.config.env == 'alpha') {
				var sisbot_data = self.get_default_sisbot();		// DEFAULT SISBOT
				console.log('Connect to Sisbot:', sisbot_data);
			} else {
				if (obj.err)
					return self.set('errors', [ '- That sisbot does not appear to be on the network' ]);

				var sisbot_data = obj.resp;
			}

			// add sisbot data to our local collection
			_.each(sisbot_data, function(data) {
				if (app.collection.exists(data.id)) {
					app.collection.get(data.id).set('data', data);
				} else {
					app.collection.add(data);
				}

				if (data.type == 'sisbot') {
					self.set('sisbot_id', data.id);
					app.collection.get(data.id).sisbot_listeners();
					app.socket.initialize();
				}
			});

			self.get_model('sisbot_id').set('is_connected','true');

			app.current_session().add_nx('sisbot_hostnames', sisbot_hostname);
			app.current_session().save_session();

			// hotspot access allows not requiring user
			if (self.get_model('user_id')) {
				self.get_model('user_id').add_nx('data.sisbot_ids', self.get('sisbot_id'));
				self.get_model('user_id').add_nx('data.sisbot_hostnames', sisbot_hostname);
				self.get_model('user_id').save(true);
			}
		}, 0);
	},
    disconnect: function () {
		this.set('sisbot_id','false');
	},
	/**************************** NETWORK INFO **********************************/
	get_network_ip_address: function (cb) {
		networkinterface.getWiFiIPAddress(function on_success(ip_address) {
			//alert('we got ip address');
			cb(ip_address);
		}, function on_error(err) {
			cb();
			//alert('error getting ip address');
			//alert(err);
		});
	},
	get_current_ssid: function () {
		if (!app.is_app)
			return this;

		var self = this;

		WifiWizard.getCurrentSSID(function on_success(ssid) {
			self.set('current_ssid', ssid);
		}, function on_error(err) {
			// alert(err);
		});
	},
	/**************************** PLAYLISTS ***********************************/
	playlist_create: function () {
		var playlist = app.collection.add({ type: 'playlist', 'name': 'New Playlist' });
		app.trigger('session:active', { playlist_id: playlist.id, secondary: 'playlist' });
		playlist.edit();
	},
	merge_playlists: function () {	// unused at this point
		var merged_playlists = [];

		var sisbot	= this.get_model('sisbot_id');
		var sisbot_playlist_ids = (sisbot) ? sisbot.get('data.playlist_ids') : [];

		var user	= this.get_model('user_id');
		var user_playlist_ids = (user) ? user.get('data.playlist_ids') : [];

		var only_sisbot = _.difference(sisbot_playlist_ids, user_playlist_ids);
		var only_user	= _.difference(user_playlist_ids, sisbot_playlist_ids);
		var in_common	= _.intersection(sisbot_playlist_ids, user_playlist_ids);

		_.each(only_sisbot, function(p_id) {
			merged_playlists.push({ id: p_id, status: 'sisbot' });
		});
		_.each(only_user, function(p_id) {
			merged_playlists.push({ id: p_id, status: 'user' });
		});
		_.each(in_common, function(p_id) {
			merged_playlists.push({ id: p_id, status: 'both' });
		});

		this.set('merged_playlists', merged_playlists);
	},
	/******************** TRACK UPLOAD ****************************************/
	on_file_upload: function (track_file) {
		console.log("On File Upload", track_file.name);
		var track_obj = {
			type		: 'track',
			name		: track_file.name.replace('.thr', ''),
			verts		: track_file.data
		};

		this.add('tracks_to_upload', track_obj);

		return this;
	},
	process_upload_svg: function() {
		var self			= this;
		var svg_objs		= this.get('tracks_to_upload');
		var publish_track 	= this.get('publish_track');
		var num_svgs		= svg_objs.length;

		_.each(svg_objs, function(svg_obj) {
			svg_obj.is_published = publish_track;
			var track_model = app.collection.add(svg_obj);

			// verts stores the file data
			var svg_xml = track_model.get('data.verts');

			var oParser = new DOMParser();
			var oDOM = oParser.parseFromString(svg_xml, "text/xml");
			var pathElements = oDOM.getElementsByTagName("path");

			var verts = [];
			var steps = 20;

			_.each(pathElements, function(pathEl) {
				var path = pathEl.attributes.getNamedItem("d").value;
				var commands = path.split(/(?=[LMClmc])/);
				console.log("Commands:", commands);

				_.each(commands, function(entry) {
					var command = entry.substring(0,1);
					var points_string = entry.substring(1);
					var data = points_string.split(/(?=[,-])/);

					// trim extras, convert to numbers
					for (var i=0; i<data.length; i++) {
						data[i] = +data[i].replace(/^[\s,]+|\s+$/gm,'');
					}

					switch (command) {
						case 'M':
							// console.log("Start pos", data);
							if (data.length == 2) verts.push(data);
							else console.log("Error, too many start points");
							break;
						case 'm':
							// console.log("start pos", data);
							if (data.length == 2) {
								if (verts.length > 0) {
									var p0 = verts[verts.length-1];
									verts.push([p0[0]+data[0],p0[1]+data[1]]);
								} else verts.push(data);
							}
							else console.log("Error, too many start points");
							break;
						case 'L':
							// console.log("Line", data);
							verts.push([data[0],data[1]]);
							break;
						case 'l':
							// console.log("line", data);
							var p0 = verts[verts.length-1];
							verts.push([p0[0]+data[0],p0[1]+data[1]]);
							break;
						case 'C':
							// console.log("Curve", data);
							if (data.length == 6) {
								var p0 = verts[verts.length-1];
								var p1 = [data[0],p0[1]+data[1]];
								var p2 = [data[2],p0[1]+data[3]];
								var p3 = [data[4],p0[1]+data[5]];
								// console.log("curve", p0, p1, p2, p3);
								for (var i=1; i<=steps; i++) {
									var point = self._calculate_bezier_point(i/steps, p0, p1, p2, p3);
									verts.push(point);
								}
							}	else console.log("Error, too many Curve points");
							break;
						case 'c':
							// console.log("curve", data);
							if (data.length == 6) {
								var p0 = verts[verts.length-1];
								var p1 = [p0[0]+data[0],p0[1]+data[1]];
								var p2 = [p0[0]+data[2],p0[1]+data[3]];
								var p3 = [p0[0]+data[4],p0[1]+data[5]];
								console.log("curve", p0, p1, p2, p3);
								for (var i=1; i<=steps; i++) {
									var point = self._calculate_bezier_point(i/steps, p0, p1, p2, p3);
									verts.push(point);
								}
							}	else console.log("Error, too many curve points");
							break;
					}
				});
			});

			// center resulting verts
			var min_max = self._min_max(verts);
			var half_x = (min_max[2]-min_max[0]) / 2;
			var half_y = (min_max[3]-min_max[1]) / 2;
			_.each(verts, function(point) {
				point[0] = point[0] - min_max[0] - half_x;
				point[1] = point[1] - min_max[1] - half_y;
			});
			console.log("Centered Verts", JSON.parse(JSON.stringify(verts)));

			// convert to polar
			var th_offset = 0;
			var last_th = 0;
			var pi = Math.PI;
			var loop_th = pi*2;
			_.each(verts, function(point) {
				var rho = Math.sqrt(point[0]*point[0]+point[1]*point[1]);
				var new_th =  Math.atan2(point[1],point[0])+pi/2;
				if (Math.abs(new_th) == pi) new_th = 0;
				// if (new_th > 0 && last_th < 0) {
				if (new_th - last_th > pi) {
					th_offset -= loop_th;
					console.log("- Point Th", point[0], "=", new_th, "+", th_offset);
				// } else if (new_th < 0 && last_th > 0) {
				} else if (new_th - last_th < -pi) {
					th_offset += loop_th;
					console.log("+ Point Th", point[0], "=", new_th, "+", th_offset);
				}
				point[0] = new_th + th_offset; // th
				point[1] = rho; // rho

				last_th = new_th;
			});

			// normalize
			var polar_min_max = self._min_max(verts);
			_.each(verts, function(point) {
				point[1] = point[1]/polar_min_max[3];
			});
			console.log("Normalized Polar Verts", verts.join(' '));

			// make sure start/end are 0 or 1
			var start_rho = verts[0][1];
			if (start_rho != 1 && start_rho != 0) {
				if (start_rho <= 0.5) verts.unshift([verts[0][0], 0]);
				else verts.unshift([verts[0][0], 1]);
			}
			var end_rho = verts[verts.length-1][1];
			if (end_rho != 1 && end_rho != 0) {
				if (end_rho <= 0.5) verts.push([verts[verts.length-1][0], 0]);
				else verts.push([verts[verts.length-1][0], 1]);
			}

			// convert to space separates, line separated string
			var verts_string = "";
			_.each(verts, function(point) {
				verts_string += point[0]+" "+point[1]+"\n";
			});

			// send to page for confirming the appearance/upload
			track_model.set("data.verts", verts_string);
			track_model.upload_track_to_sisbot();

			if (publish_track == 'true') track_model.upload_track_to_cloud();

			// track_model.set("d3", true); // for debugging
			// app.trigger('session:active', { track_id: track_model.id, secondary: 'track', primary: 'tracks' });
		});

		this.set('tracks_to_upload', []);

		if (num_svgs > 1) app.trigger('session:active', { track_id: 'false', secondary: 'false', primary: 'tracks' });

		return this;
	},
	_calculate_bezier_point: function(t, p0, p1, p2, p3) { // time 0-1, start point, control 1, control 2, end point
	  var u = 1.0 - t;
	  var tt = t*t;
	  var uu = u*u;
	  var uuu = uu * u;
	  var ttt = tt * t;
		//
		var p = [];
	  p[0] = uuu * p0[0]; //first term
	  p[1] = uuu * p0[1]; //first term
	  p[0] += 3 * uu * t * p1[0]; //second term
	  p[1] += 3 * uu * t * p1[1]; //second term
	  p[0] += 3 * u * tt * p2[0]; //third term
	  p[1] += 3 * u * tt * p2[1]; //third term
	  p[0] += ttt * p3[0]; //fourth term
	  p[1] += ttt * p3[1]; //fourth term

	  return p;
	},
	_min_max: function(given_array) {
		var min_x, max_x, min_y, max_y;
		_.each(given_array, function(point) {
			if (min_x == undefined || point[0] < min_x) min_x = point[0];
			if (max_x == undefined || point[0] > max_x) max_x = point[0];
			if (min_y == undefined || point[1] < min_y) min_y = point[1];
			if (max_y == undefined || point[1] > max_y) max_y = point[1];
		});

		return [min_x, min_y, max_x, max_y];
	},
	process_upload_track: function () {
		var self			= this;
		var track_objs		= this.get('tracks_to_upload');
		var publish_track 	= this.get('publish_track');
		var num_tracks		= track_objs.length;

		_.each(track_objs, function(track_obj) {
			track_obj.is_published = publish_track;
			var track_model = app.collection.add(track_obj);
			track_model.upload_track_to_sisbot();

			if (publish_track == 'true') track_model.upload_track_to_cloud();
		});

		this.set('tracks_to_upload', []);

		if (num_tracks > 1)
			app.trigger('session:active', { track_id: 'false', secondary: 'false', primary: 'tracks' });

		return this;
	},
    /**************************** COMMUNITY ***********************************/
	fetch_community_playlists: function () {
		if (this.get('fetched_community_playlists') == 'true')
			return this;

		var self = this;

		this.set('fetching_community_playlists', 'true');

		// should return playlists and tracks
		var playlists = {
			_url	: 'https://api.sisyphus.withease.io/',
			_type	: 'POST',
			endpoint: 'community_playlists',
			data	: {}
		};

		function cb(obj) {
			setTimeout(function () {
				self.set('fetching_community_playlists', 'false');
			}, 1000)

			if (obj.err) return self;

			app.collection.add(obj.resp);

			var resp_playlist_ids	= _.pluck(obj.resp, 'id');
			var sisbot_playlist_ids = self.get_model('sisbot_id').get('data.playlist_ids');
			var new_playlist_ids	= _.difference(resp_playlist_ids, sisbot_playlist_ids);

			self.set('community_playlist_ids', new_playlist_ids);
			self.set('fetched_community_playlists', 'true');
		}

		app.post.fetch(playlists, cb, 0);

		return this;
	},
	fetch_community_tracks: function () {
		if (this.get('fetched_community_tracks') == 'true')
			return this;

		var self = this;

		this.set('fetching_community_tracks', 'true');

		// should return playlists and tracks
		var tracks = {
			_url	: 'https://api.sisyphus.withease.io/',
			_type	: 'POST',
			endpoint: 'community_tracks',
			data	: {}
		};

		function cb(obj) {
			setTimeout(function () {
				self.set('fetching_community_tracks', 'false');
			}, 1000);

			if (obj.err) return self;

			app.collection.add(obj.resp);

			var resp_track_ids		= _.pluck(obj.resp, 'id');
			var sisbot_track_ids	= self.get_model('sisbot_id').get('data.track_ids');
			var new_track_ids		= _.difference(resp_track_ids, sisbot_track_ids);

			self.set('community_track_ids', new_track_ids);
			self.set('fetched_community_tracks', 'true');
		}

		app.post.fetch(tracks, cb, 0);

		return this;
    },
	download_playlist: function(playlist_id) {
		this.remove('community_playlist_ids', playlist_id);
	},
	download_track: function (track_id) {
		this.remove('community_track_ids', track_id);
	},
    /**************************** DEMO ****************************************/
	setup_as_sisbot: function () {
		if (app.config.env == 'beta') {
			var hostname = 'sisbot-123.local';
		} else {
			var hostname = window.location.hostname;
		}

		this.set('sisbot_hostname', hostname);
		this.connect_to_sisbot();
	},
	setup_sisbot_select: function () {
		this.set('registration.username', 'sisyphus@withease.io');
		this.set('registration.password', 'sodo');
		this.sign_in();
	},
	get_default_sisbot: function () {
		return this.default_data();
	},
	default_data: function () {
		var data = [
			{
				id          		: '57DB5833-72EF-4D16-BCD8-7B832B423554',
				pi_id				: '',
				name				: 'Sisyphus Table',
				type        		: 'sisbot',
				active_playlist_id	: 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
				active_track		: {
					id: '1'
				},
				state				: 'paused',
				is_available		: 'true',
				is_network_connected: 'false',
				is_internet_connected: 'false',
				is_serial_open		: 'true',
				hostname			: 'sisyphus-dummy.local',
				is_hotspot			: 'true',
				hostname_prompt		: 'true',
				do_not_remind		: 'true',
				is_autodim			: 'true',
				brightness			: .5,
				speed				: .3,
				default_playlist_id	: 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
				local_ip			: '192.168.42.1',
				playlist_ids: [ 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492' ],
				track_ids   : [ '1', '2', '3', '4', '5', '6', '7', '8', '9' ]
			}, {
				id          		: 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
				type        		: 'playlist',
				name        		: 'Default Playlist',
				description 		: 'Description of Default Playlist',
				created_by_name		: 'Sisyphus Industries',
				is_saved			: 'true',
				is_published		: 'false',
				is_shuffle			: 'true',
				is_loop				: 'false',
				active_track_id		: 'false',
				active_track_index	: 'false',
				tracks   : [{
					id			: '1',
					reversible	: 'false'
				}, {
					id			: '2',
					reversible	: 'false'
				}, {
					id			: '3',
					reversible	: 'false'
				}],
				sorted_tracks: [ 0, 1, 2 ],
			}, {
				id          : '1',
				type        : 'track',
				name        : 'Erase',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '2',
				type        : 'track',
				name        : 'Tensig 1',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '3',
				type        : 'track',
				name        : 'Sine',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '4',
				type        : 'track',
				name        : 'Circam 2S',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '5',
				type        : 'track',
				name        : 'C Warp 3B',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '6',
				type        : 'track',
				name        : 'D Ces 4P',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '7',
				type        : 'track',
				name        : 'Hep',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '8',
				type        : 'track',
				name        : 'India 1P',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '9',
				type        : 'track',
				name        : 'Para 2B',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}
		];

		return data;
	},
    setup_demo: function () {
		var self = this;

		this.setup_sisbot_select();

		setTimeout(function() {
			self.setup_as_sisbot();
		}, 250);

        return this;
    },
	save_new_tracks: function () {
		var data = [
			{
				id          : '_Test_1_01',
				type        : 'track',
				name        : 'Test 1 01',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '_Test_2_00',
				type        : 'track',
				name        : 'Test 2 00',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '_Test_3_11',
				type        : 'track',
				name        : 'Test 3 11',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '_Test_4_10',
				type        : 'track',
				name        : 'Test 4 10',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '_Test_5_11',
				type        : 'track',
				name        : 'Test 5 11',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '_Test_6_10',
				type        : 'track',
				name        : 'Test 6 10',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '_Test_7_10',
				type        : 'track',
				name        : 'Test 7 10',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '_Test_8_00',
				type        : 'track',
				name        : 'Test 8 00',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '_Test_9_00',
				type        : 'track',
				name        : 'Test 9 00',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '_Test_10_01',
				type        : 'track',
				name        : 'Test 10 01',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}
		];

		function save_track() {
			if (data.length == 0)
				return this;

			var track = data.shift();

			track._url		= 'https://api.sisyphus.withease.io/';
			track._type		= 'POST';
			track.endpoint	= 'set';

			function cb(obj) {
				save_track();
			}

			app.post.fetch(track, cb, 0);
		}

		save_track();
	}
};
