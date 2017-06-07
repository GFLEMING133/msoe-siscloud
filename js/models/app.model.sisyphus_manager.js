app.model.sisyphus_manager = {
	defaults: function (data) {
		var obj = {
			id			    		: data.id,
			type		    		: 'sisyphus_manager',

            user_id         		: 'false',
			user_registration		: 'false',		// false|sign_up|sign_in

			signing_up				: 'false',
			signing_in				: 'false',

			registration: {
				username				: '',
				password				: '',
			},

			sisbot_id       		: 'false',
			sisbot_registration		: 'select',		// select|find

			sisbots_user			: [],
			sisbots_networked		: [],

			sisbots_scanning		: 'false',
			sisbot_hostname			: '',
			sisbot_connecting		: 'false',

			merge_playlists			: [],

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
		this.listenTo(app, 'session:sign_in',			this.sign_in_via_session)
		app.manager = this;

		if (app.config.env == 'sisbot') {
			return this.setup_as_sisbot();
		} else {
			app.current_session().check_session_sign_in();
			//this.setup_demo();
		}
		//app.config.env = 'sisbot';
		//return this.setup_as_sisbot();
		//this.save_new_tracks();

		return this;
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

			self.set('errors', []);
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

			self.set('errors', []);
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
	sisbot_select: function () {
		this.set('errors', [])
			.set('sisbot_registration', 'select');
		return this;
	},
	sisbot_find: function () {
		this.set('errors', [])
			.set('sisbot_registration', 'find');
		return this;
	},
	setup_sisbots_page: function () {
		var _sisbots_user	= this.get('sisbots_user');;
		var sisbots_user	= [];

		_.each(_sisbots_user, function(s_id) {
			if (app.collection.exists(s_id))
				sisbots_user.push(s_id);
		});

		if (sisbots_user.length > 0)	this.set('sisbot_registration', 'select');
		else							this.set('sisbot_registration', 'find');

		this.set('sisbots_user', sisbots_user)
			.set('errors', []);

		return this;
	},
	find_sisbots: function () {
		// this will find the sisbots on the local network
		var self			= this;
		var wifi_networks	= [];

		this.set('sisbots_networked', []);
		this.set('sisbots_scanning', 'true');

		this.find_localnet();

		var exists = {
			_url	: 'http://sisyphus.local/',
			_type	: 'POST',
			_timeout: 1250,
			endpoint: 'sisbot/exists',
			data	: {}
		};

		function exists_cb(obj) {
			if (obj.err) return self.scan_sisbots();

			wifi_networks.push('sisyphus.local');

			var wifi_ns = {
				_url	: 'http://sisyphus.local/',
				_type	: 'POST',
				endpoint: 'sisbot/local_sisbots',
				data	: { iface: 'wlan0', show_hidden: true }
			};

			console.log("Wifi Networks", wifi_networks);
			app.post.fetch(wifi_ns, get_wifi_cb, 0);
		}

		function get_wifi_cb(obj) {
			if (obj.err) {
				console.log("Err, Scan Wifi Networks", wifi_networks);
				self.set('sisbots_networked', wifi_networks.sort());
				return self.scan_sisbots();
			}

			_.each(obj.resp, function(sisbot_addr) {
				wifi_networks.push(sisbot_addr);
			});

			console.log("Wifi Networks", wifi_networks);
			self.set('sisbots_networked', wifi_networks.sort());
			self.set('sisbots_scanning', 'false');
		}

		app.post.fetch(exists, exists_cb, 0);

		return this;
	},
	find_localnet: function () {
		var self	= this;
		var RTCPeerConnection = /*window.RTCPeerConnection ||*/ window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

		if (RTCPeerConnection) {
			var rtc = new RTCPeerConnection({iceServers:[]});
			if (1 || window.mozRTCPeerConnection) {      // FF [and now Chrome!] needs a channel/stream to proceed
				rtc.createDataChannel('', {reliable:false});
			};

			rtc.onicecandidate = function (evt) {
				// convert the candidate to SDP so we can run it through our general parser
				// see https://twitter.com/lancestout/status/525796175425720320 for details
				if (evt.candidate) grepSDP("a="+evt.candidate.candidate);
			};
			rtc.createOffer(function (offerDesc) {
				grepSDP(offerDesc.sdp);
				rtc.setLocalDescription(offerDesc);
			}, function (e) { console.warn("offer failed", e); });


			function updateDisplay(new_addr) {
				if (newAddr !== "0.0.0.0")
					self.scan_subnet(new_addr);
			}

			function grepSDP(sdp) {
				var hosts = [];
				sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
					if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
						var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
							addr = parts[4],
							type = parts[7];
						if (type === 'host') updateDisplay(addr);
					} else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
						var parts = line.split(' '),
							addr = parts[2];
						updateDisplay(addr);
					}
				});
			}
		}

		return this;
	},
	scan_sisbots: function () {
		var self = this;
		//var subnets = ['192.168.0.1', '192.168.1.1', '192.168.2.1', '192.168.3.1', '192.168.254.254', '169.254.24.119', '192.168.86.26'];
		var subnets = [ '192.168.0.1' ];
		_.each(subnets, function(ip) {
			self.scan_subnet(ip);
		});
		return this;
	},
	scan_subnet: function (base_ip) {
		// assume 192.168.0.1 for example
		// 2-255
		var ip = base_ip.split('.');
		ip.pop();
		base_ip = ip.join('.');
		console.log('BASE IP', base_ip);

		var self				= this;
		var sisbots_networked	= this.get('sisbots_networked');
		var count				= 254;

		function scan(last_num) {
			var exists = {
				_url	: 'http://' + base_ip + '.' + last_num + '/',
				_type	: 'POST',
				_timeout: 2500,
				endpoint: 'sisbot/exists',
				data	: {}
			};

			app.post.fetch(exists, function(obj) {
				if (!obj.err)
					sisbots_networked.push(base_ip + '.' + last_num);
				is_finished();
			}, 0);
		}

		function is_finished() {
			if (--count == 0) {
				self.set('sisbots_networked', sisbots_networked);
				self.set('sisbots_scanning', 'false');
			}
		}

		for (var i = 2; i < 256; i++) {
			scan(i);
		}

		return this;
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
			_timeout: 500,
			endpoint: 'sisbot/connect',
			data	: {},
		};

		app.post.fetch(obj, function(obj) {
			self.set('sisbot_connecting', 'false')
				.set('errors', [])

			if (app.config.env == 'alpha') {
				var sisbot_data = self.get_default_sisbot();		// DEFAULT SISBOT
				//console.log('Connect to Sisbot:', obj);
			} else {
				//console.log('WE HAVE OUR DATA', obj);
				if (obj.err)
					return self.set('errors', [ '- That sisbot does not appear to be on the network' ]);

				var sisbot_data = obj.resp;
			}

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

			self.get_model('sisbot_id')
				.set('data.hostname', sisbot_hostname)
				.set('is_connected','true');

			// hotspot access allows not requiring user
			if (self.get_model('user_id')) {
				self.get_model('user_id').add_nx('data.sisbot_ids', self.get('sisbot_id'));
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

		console.log('MERGED', user, user_playlist_ids);

		this.set('merged_playlists', merged_playlists);
	},
    /**************************** COMMUNITY ***********************************/
    fetch_community_playlists: function () {
		if (this.get('fetched_community_playlists') == 'true')
			return this;

		var self = this;

		this.set('fetching_community_playlists', 'true');

		// should return playlists and tracks
		var playlists = {
			//_url	: 'https://api.sisyphus.withease.io/',
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
			//_url	: 'https://api.sisyphus.withease.io/',
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
		// we don't need to create account or connect... We're getting served by it
		app.current_session().set('signed_in','true');

		var hostname = window.location.hostname;			// easesisyphus.local;
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
				state				: 'waiting',
				is_network_connected: 'false',
				is_internet_connected: 'false',
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
			},
			/******************************************************************/
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
