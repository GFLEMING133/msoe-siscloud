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
			sisbot_registration		: 'find',		// find|hotspot|wifi|hostname
			show_wifi_page			: 'false',
			show_hostname_page		: 'false',

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

		// Skip account creation at the beginning
		app.current_session().set('signed_in','true');

		if (app.config.env == 'sisbot') {
			return this.setup_as_sisbot();
		} else if (app.config.env == 'alpha') {
			this.setup_demo();
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

		// console.log("Intake Data:", given_data);

		_.each(given_data, function(data) {
			if (app.collection.exists(data.id)) {
				app.collection.get(data.id).set('data', data);
			} else {
				app.collection.add(data);
			}

			if (self.get('sisbot_id') == 'false' && data.type == 'sisbot') {
				self.set('sisbot_id', data.id);
				app.collection.get(data.id).sisbot_listeners();
			}
		});
	},
	has_user: function () {
		return (this.get('user_id') !== 'false') ? 'true' :'false';
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
    /**************************** SISBOTS *************************************/
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
	should_show_hostname_wifi: function () {
		var sisbot				= this.get_model('sisbot_id');
		var hotspot_status		= sisbot.get('data.is_hotspot');
		var reminder_status 	= sisbot.get('data.do_not_remind');
		var hostname_prompt		= sisbot.get('data.hostname_prompt');

		if (hostname_prompt == 'false')
			this.set('show_hostname_page', 'true');

		if (hotspot_status == 'true' && reminder_status == 'false')
			this.set('show_wifi_page', 'true');

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
	check_number_sisbots: function () {
		var sisbots_available = _.uniq(this.get('sisbots_networked'));
		this.set('sisbots_networked', sisbots_available);
		this.trigger('change:sisbots_networked');

		if (sisbots_available.length == 0)
			this.set('sisbot_registration', 'hotspot');

		return this;
	},
	find_sisbots: function () {
		// this will find the sisbots on the local network
		var self			= this;

		this.set('sisbots_networked', []);
		this.set('sisbots_scanning', 'true');

		var num_checks = 3;

		function on_cb() {
			--num_checks;
			if (num_checks == 0) {
				var sisbots = _.uniq(self.get('sisbots_networked'));
				if (sisbots.length > 0)
					self.set('sisbot_hostname', sisbots[0]);

				self.set('sisbots_scanning', 'false');
				self.check_number_sisbots();
			}
		}

		this.find_hotspot(on_cb);
		this.find_session_sisbots(on_cb);
		this.find_user_sisbots(on_cb);
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
				return cb();
			}

			if (app.platform == 'Android') {
				self.add('sisbots_networked', obj.resp.local_ip);
			} else {
				self.add('sisbots_networked', obj.resp.hostname);
			}

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
		var track_obj = {
			type		: 'track',
			name		: track_file.name.replace('.thr', ''),
			verts		: track_file.data
		};

		this.add('tracks_to_upload', track_obj);

		return this;
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

			if (publish_track == 'true')
				track_model.upload_track_to_cloud();
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
		var self = this;

		this.remove('community_playlist_ids', playlist_id);

		var user	= this.get_model('user_id');
		var sisbot	= this.get_model('sisbot_id');

		user.add_nx('data.playlist_ids', playlist_id);
		sisbot.add_nx('data.playlist_ids', playlist_id);

		_.each(app.collection.get(playlist_id).get('data.track_ids'), function (track_id) {
			user.add_nx('data.track_ids',	track_id);
			sisbot.add_nx('data.track_ids', track_id);
			self.remove('community_track_ids', track_id);
		});
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
				name				: 'Default Sisbot',
				type        		: 'sisbot',
				active_playlist_id	: 'false',
				active_track_id		: 'false',
				state				: 'paused',
				is_available		: 'true',
				is_network_connected: 'false',
				is_internet_connected: 'false',
				is_serial_open		: 'true',
				hostname			: 'sisyphus-dummy.local',
				is_hotspot			: 'true',
				hostname_prompt		: 'true',
				do_not_remind		: 'true',
				default_playlist_id	: 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
				playlist_ids: [ 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
			 					'276A238C-21F0-4998-B0F8-305BFC0D25E9' ],
				track_ids   : [ '2CBDAE96-EC22-48B4-A369-BFC624463C5F',
								'C3D8BC17-E2E1-4D6D-A91F-80FBB65620B8',
							 	'2B34822B-0A27-4398-AE19-23A3C83F1220',
								'93A90B6B-EAEE-48A3-9742-C688235D837D',
								'B7407A2F-04C3-4C92-B907-4C3869DA86D6',
								'7C046710-9F19-4423-B291-7394996F0913',
								'D14E0B41-E572-4B69-9827-4A07C503D031',
								'26FBFB10-4BC7-46BF-8D55-85AA52C19ADF',
								'75518177-0D28-4B2A-9B73-29E4974FB702' ]
			}, {
				id          		: 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
				type        		: 'playlist',
				name        		: 'Default Playlist',
				description 		: 'Description of Default Playlist',
				is_saved			: 'true',
				is_published		: 'false',
				is_shuffle			: 'false',
				is_loop				: 'false',
				active_track_id		: 'false',
				active_track_index	: 'false',
				track_ids   : [ '2CBDAE96-EC22-48B4-A369-BFC624463C5F',
								'C3D8BC17-E2E1-4D6D-A91F-80FBB65620B8',
								'93A90B6B-EAEE-48A3-9742-C688235D837D' ],
				sorted_tracks: [ '2CBDAE96-EC22-48B4-A369-BFC624463C5F',
								'C3D8BC17-E2E1-4D6D-A91F-80FBB65620B8',
								'93A90B6B-EAEE-48A3-9742-C688235D837D' ],
			}, {
				id          		: '276A238C-21F0-4998-B0F8-305BFC0D25E9',
				type        		: 'playlist',
				name        		: 'Awesome Playlist',
				description 		: 'Description of Awesome Playlist',
				is_saved			: 'true',
				is_published		: 'false',
				is_shuffle			: 'true',
				is_loop				: 'true',
				active_track_id		: 'false',
				active_track_index	: 'false',
				track_ids   : [ '_Test_2_00',
								'_Test_1_01',
								'_Test_3_11' ],
				sorted_tracks: [ '_Test_2_00',
								'_Test_1_01',
								'_Test_3_11' ],
			}, {
				id          : '2CBDAE96-EC22-48B4-A369-BFC624463C5F',
				type        : 'track',
				name        : 'Erase',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : 'C3D8BC17-E2E1-4D6D-A91F-80FBB65620B8',
				type        : 'track',
				name        : 'Tensig 1',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '2B34822B-0A27-4398-AE19-23A3C83F1220',
				type        : 'track',
				name        : 'Sine',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '93A90B6B-EAEE-48A3-9742-C688235D837D',
				type        : 'track',
				name        : 'Circam 2S',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : 'B7407A2F-04C3-4C92-B907-4C3869DA86D6',
				type        : 'track',
				name        : 'C Warp 3B',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '7C046710-9F19-4423-B291-7394996F0913',
				type        : 'track',
				name        : 'D Ces 4P',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : 'D14E0B41-E572-4B69-9827-4A07C503D031',
				type        : 'track',
				name        : 'Hep',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '26FBFB10-4BC7-46BF-8D55-85AA52C19ADF',
				type        : 'track',
				name        : 'India 1P',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '75518177-0D28-4B2A-9B73-29E4974FB702',
				type        : 'track',
				name        : 'Para 2B',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			},
			/******************************************************************/
			{
				id          : '_Test_1_01',
				type        : 'track',
				name        : 'Test 1 01',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '_Test_2_00',
				type        : 'track',
				name        : 'Test 2 00',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '_Test_3_11',
				type        : 'track',
				name        : 'Test 3 11',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '_Test_4_10',
				type        : 'track',
				name        : 'Test 4 10',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '_Test_5_11',
				type        : 'track',
				name        : 'Test 5 11',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '_Test_6_10',
				type        : 'track',
				name        : 'Test 6 10',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '_Test_7_10',
				type        : 'track',
				name        : 'Test 7 10',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '_Test_8_00',
				type        : 'track',
				name        : 'Test 8 00',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '_Test_9_00',
				type        : 'track',
				name        : 'Test 9 00',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			}, {
				id          : '_Test_10_01',
				type        : 'track',
				name        : 'Test 10 01',
				is_published: 'true',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				created_by_name: 'Sisyphus Industries',
			},
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
				console.log('SAVE TRACK', obj);
				save_track();
			}

			app.post.fetch(track, cb, 0);
		}

		save_track();
	}
};
