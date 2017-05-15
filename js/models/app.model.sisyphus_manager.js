app.model.sisyphus_manager = {
	defaults: function (data) {
		var obj = {
			id			    		: data.id,
			type		    		: 'sisyphus_manager',

            user_id         		: 'false',
			user_registration		: 'false',		// false|sign_up|sign_in
			registration: {
				username				: '',
				password				: '',
			},

			sisbot_id       		: 'false',

			sisbot_hostname			: '',
			sisbot_connecting		: 'false',
			networked_sisbots		: [],
			scanning_for_sisbots	: 'false',


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
		app.config.env = 'sisbot';

		if (app.config.env == 'sisbot')
			this.setup_as_sisbot();

		//this.setup_demo();
		//this.setup_sisbot_select();

		this.listenTo(app, 'sisuser:download_playlist', this.download_playlist);
		this.listenTo(app, 'sisuser:download_track', 	this.download_track);
    },
	/**************************** USER REGISTRATION ***************************/
	setup_registration: function () {
		if (this.get('user_id') == 'false')
			this.setup_sign_up();
	},
	setup_sign_up: function () {
		this.set('user_registration', 'sign_up');
	},
	setup_sign_in: function () {
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

			self._process_registration(user_data, obj.resp);
		};

		user_data.type		= 'user';
		user_data.endpoint	= 'sign_up';
		app.plugins.fetch(user_data, cb);
	},
	sign_in: function () {
		if (this.get('signing_in') == 'true') return false;
		else this.set('signing_in', 'true');

		var self		= this;
		var user_data   = this.get('registration');
		var errors		= this.get_errors(user_data);

		if (errors.length > 0)
			return this.set('signing_in', 'false').set('errors', errors);

		function cb(obj) {
			if (obj.err)
				return self.set('signing_in', 'false').set('errors', [ '- ' + obj.err ]);

			self._process_registration(user_data, obj.resp);
		};

		user_data.endpoint = 'sign_in';
		app.plugins.fetch(user_data, cb);
	},
	get_errors: function (user_data) {
		var errors = [];
		if (user_data.username == '')	errors.push('- Username cannot be blank');
		if (user_data.password == '')	errors.push('- Password cannot be blank');
		return errors;
	},
	_process_registration: function (user, data_arr) {
		var session_data = {
			user_id			: 'false',
			username		: user.username,
			password		: user.password
		};

		var server_user = false;

		_.each(data_arr, function (m) {
			if (m.type == 'user' && m.username == user.username) {
				server_user = m;
				session_data.user_id = m.id;
			}
		});

		app.collection.add(data_arr);
		app.trigger('session:user_sign_in', session_data);

		// setup user info here
		this.set('user_id', session_data.user_id);

		if (this.get('sisbot_id') == 'false') {
			// check sisbots
			if (server_user.sisbot_ids && server_user.sisbot_ids.length == 0)
				this.set('user_registration', 'sisbot');
			else
				this.set('user_registration', 'false');
		}
	},
    /**************************** WIFI ****************************************/
	find_sisbots: function () {
		// this will find the sisbots on the local network
		var self			= this;
		var wifi_networks	= [];

		this.set('networked_sisbots', []);
		this.set('scanning_for_sisbots', 'true');

		var exists = {
			_url	: 'http://sisyphus.local/',
			_type	: 'POST',
			endpoint: 'sisbot/exists',
			data	: {}
		};

		function exists_cb(obj) {
			if (obj.err) return self.scan_sisbots();

			wifi_networks.push('sisyphus');

			var wifi_ns = {
				_url	: 'http://sisyphus.local/',
				_type	: 'POST',
				endpoint: 'sisbot/get_wifi',
				data	: { iface: 'wlan0', show_hidden: true }
			};

			app.post.fetch(wifi_ns, get_wifi_cb, 0);
		}

		function get_wifi_cb(obj) {
			if (obj.err) return self.scan_sisbots();

			_.each(obj.resp, function(network_obj) {
				if (network_obj.ssid.indexOf('sisyphus') > -1)
					wifi_networks.push(network_obj.ssid);
			})
			self.set('networked_sisbots', wifi_networks.sort());
			self.set('scanning_for_sisbots', 'false');
		}

		app.post.fetch(exists, exists_cb, 0);

		return this;
	},
	scan_sisbots: function () {
		// assume 192.168.0.1
		// 2-255

		var self				= this;
		var networked_sisbots	= this.get('networked_sisbots');
		var count				= 254;

		function scan(last_num) {
			var exists = {
				_url	: 'http://192.168.0.' + last_num + '/',
				_type	: 'POST',
				_timeout: 5000,
				endpoint: 'sisbot/exists',
				data	: {}
			};

			app.post.fetch(exists, function(obj) {
				if (!obj.err)
					networked_sisbots.push('192.168.0.' + last_num);
				is_finished();
			}, 0);
		}

		function is_finished() {
			if (--count == 0) {
				self.set('networked_sisbots', networked_sisbots);
				self.set('scanning_for_sisbots', 'false');
			}
		}

		for (var i = 2; i < 256; i++) {
			scan(i);
		}
	},
	connect_to_sisbot: function () {
		if (this.get('sisbot_connecting') == 'true') return false;
		else this.set('sisbot_connecting', 'true');

		var self		= this;
		var sisbot_hostname = this.get('sisbot_hostname');

		// ping sisbot for connection
		var obj = {
			_url	: 'http://' + sisbot_hostname + '/',
			_type	: 'POST',
			endpoint: 'sisbot/connect',
			data	: {}
		};

		app.post.fetch(obj, function(obj) {
			var sisbot_data = self.get_default_sisbot();		// DEFAULT SISBOT

			console.log('Connect to Sisbot:', obj);

			/*
			if (obj.err)
				return self.set('sisbot_connecting', 'false').set('errors', [ '- That sisbot does not appear to be on the network' ]);
			sisbot_data = obj.resp;
			*/

			app.collection.add(sisbot_data);

			_.each(sisbot_data, function(obj) {
				if (obj.type == 'sisbot')
					self.set('sisbot_id', obj.id);
			});

			self.get_model('sisbot_id').set('hostname', sisbot_hostname).set('is_connected','true');

			// hotspot access allows not requiring user
			if (self.get_model('user_id')) {
				self.get_model('user_id').add_nx('data.sisbot_ids', sisbot.id);
				self.get_model('user_id').save();
			}
		}, 0);
    },
    disconnect: function () {
		this.set('sisbot_id','false');
    },
	sign_out: function () {
		this.set('sisbot_id', 'false');
		this.set('user_id', 'false');
		app.current_session().sign_out();
	},
	/**************************** SISBOT ENV **********************************/
	setup_as_sisbot: function () {
		// we don't need to create account or connect... We're getting served by it
		app.current_session().set('signed_in','true');
		var hostname = 'sisyphus.local';
		//var hostname = window.location.host;
		this.set('sisbot_hostname', hostname);
		this.connect_to_sisbot();
	},
    /**************************** PLAYLISTS ***********************************/
    playlist_create: function () {
		var playlist = app.collection.add({ type: 'playlist', 'name': 'New Playlist' });
		app.trigger('session:active', { playlist_id: playlist.id, secondary: 'playlist' });
		playlist.edit();
    },
    /**************************** STORE ***************************************/
    fetch_store_updates: function () {
		// should return playlists and tracks

		// loop through and filter out the ones the user already has downloaded

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
		this.get_model('user_id').add_nx('data.track_ids', track_id);
		this.get_model('sisbot_id').add_nx('data.track_ids', track_id);
		this.remove('community_track_ids', track_id);
	},
    /**************************** DEMO ****************************************/
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
				id          : '57DB5833-72EF-4D16-BCD8-7B832B423554',
				pi_id		: '',
				name		: 'Default Sisbot',
				type        : 'sisbot',
				playlist_ids: [ 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492' ],
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
				id          : 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
				type        : 'playlist',
				name        : 'Default Playlist',
				description : 'Description of Default Playlist',
				is_published: 'false',
				track_ids   : [ '2CBDAE96-EC22-48B4-A369-BFC624463C5F',
								'C3D8BC17-E2E1-4D6D-A91F-80FBB65620B8',
								'93A90B6B-EAEE-48A3-9742-C688235D837D' ],
			}, {
				id          : '2CBDAE96-EC22-48B4-A369-BFC624463C5F',
				type        : 'track',
				name        : 'Erase',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : 'C3D8BC17-E2E1-4D6D-A91F-80FBB65620B8',
				type        : 'track',
				name        : 'Tensig 1',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '2B34822B-0A27-4398-AE19-23A3C83F1220',
				type        : 'track',
				name        : 'Sine',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '93A90B6B-EAEE-48A3-9742-C688235D837D',
				type        : 'track',
				name        : 'Circam 2S',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : 'B7407A2F-04C3-4C92-B907-4C3869DA86D6',
				type        : 'track',
				name        : 'C Warp 3B',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '7C046710-9F19-4423-B291-7394996F0913',
				type        : 'track',
				name        : 'D Ces 4P',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : 'D14E0B41-E572-4B69-9827-4A07C503D031',
				type        : 'track',
				name        : 'Hep',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '26FBFB10-4BC7-46BF-8D55-85AA52C19ADF',
				type        : 'track',
				name        : 'India 1P',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}, {
				id          : '75518177-0D28-4B2A-9B73-29E4974FB702',
				type        : 'track',
				name        : 'Para 2B',
				created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
			}
		];

		return data;
	},
    setup_demo: function () {
		var data = this.default_data();

		app.collection.add(data);

        this.set('sisbot_id', '57DB5833-72EF-4D16-BCD8-7B832B423554');

		//this.set('user_id', '2B037165-209B-4C82-88C6-0FA4DEB08A08');
		//this.set('community_playlist_ids', [ data.playlist_3.id, data.playlist_4.id ]);
		//this.set('community_track_ids', [ data.track_5.id, data.track_6.id ]);

		app.current_session().set('signed_in', 'true');

		this._data = data;

        return this;
    }
};
