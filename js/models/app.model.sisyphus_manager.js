app.model.sisyphus_manager = {
	defaults: function (data) {
		var obj = {
			id			    		: data.id,
			type		    		: 'sisyphus_manager',

            wifi_networks   		: [],
            wifi_pw         		: 'false',

            sisbot_id       		: 'false',

            user_id         		: 'false',
			user_registration		: 'false',		// false|signup|signin
			username				: '',
			password				: '',

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
		this.setup_demo();
		//this.listenTo(app, 'session:user_sign_in', this.on_signin);

		this.listenTo(app, 'sisbot:update_playback', 	this.update_playback);
		this.listenTo(app, 'sisuser:download_playlist', this.download_playlist);
		this.listenTo(app, 'sisuser:download_track', 	this.download_track);
    },
	/**************************** USER ****************************************/
	setup_registration: function () {
		if (this.get('user_id') == 'false')
			this.setup_sign_up();
	},
	setup_sign_up: function () {
		this.set('is_sign_up', 'true');
	},
	setup_sign_in: function () {
		this.set('is_sign_up', 'false');
	},
	sign_up: function () {
		if (this.get('signing_up') == 'true') return false;
		else this.set('signing_up', 'true');

		var self		= this;
		var user_data   = user_data || this.get('data');
		var errors		= this.get_errors(user_data);

		if (errors.length > 0)
			return this.set('errors', errors);

		function cb(obj) {
			if (obj.err)
				return self.set('signing_up', 'false').set('errors', [ '- ' + obj.err ]);

			self._process_registration(user_data, obj.resp);
		};

		user_data.endpoint = 'sign_up_user';
		app.plugins.fetch(user_data, cb);
	},
	sign_in: function (user_data) {
		if (this.get('signing_in') == 'true') return false;
		else this.set('signing_in', 'true');

		var self		= this;
		var user_data   = user_data || this.get('data');
		var errors		= this.get_errors(user_data);

		if (errors.length > 0)
			return this.set('errors', errors);

		function cb(obj) {
			if (obj.err)
				return self.set('signing_in', 'false').set('errors', [ '- ' + obj.err ]);

			self._process_registration(user_data, obj.resp);
		};

		user_data.endpoint = 'sign_in';
		app.plugins.fetch(user_data, cb);
	},
	get_errors: function (data) {
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

		_.each(data_arr, function (m) {
			if (m.type == 'user' && m.username == user.username)
				session_data.user_id = m.id;
		});

		app.collection.add(data_arr);
		app.trigger('session:user_sign_in', session_data);
	},
    /**************************** WIFI ****************************************/
    get_networks: function () {

    },
    save_credentials: function () {

    },
    connect: function () {

    },
    disconnect: function () {

    },
    /**************************** SISBOT **************************************/
    update_playback: function (obj) {
        this.get_model('sisbot_id').update_playback(obj);
		app.trigger('session:active', { 'primary': 'current' });
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
    setup_demo: function () {
        var data = {
            sisbot_1: {
                id          : '57DB5833-72EF-4D16-BCD8-7B832B423554',
                type        : 'sisbot',
                playlist_ids: [ '2745A1AA-0068-48F4-95E2-8341185096F1',
			 					'D691FB14-8223-43ED-9FAC-9B989B095B70' ],
                track_ids   : [ 'A88D38AA-747A-4B52-8A78-64FAA043E6A9',
                                '0F86891A-6B19-461B-BFE5-AC87E7E1398D',
                                '6D3CA320-B99E-458F-B562-1B7E6F6F10A2',
                                'F152CB8C-7D32-4E4C-9AF4-408365747631' ]
            },
            user_1: {
                id          : '2B037165-209B-4C82-88C6-0FA4DEB08A08',
                type        : 'user',
                name        : 'User #1',
                email       : 'user@email.com',
				sisbot_id	: '57DB5833-72EF-4D16-BCD8-7B832B423554',
                playlist_ids: [ '2745A1AA-0068-48F4-95E2-8341185096F1',
			 					'D691FB14-8223-43ED-9FAC-9B989B095B70' ],
                track_ids   : [ 'A88D38AA-747A-4B52-8A78-64FAA043E6A9',
                                '0F86891A-6B19-461B-BFE5-AC87E7E1398D',
                                '6D3CA320-B99E-458F-B562-1B7E6F6F10A2',
                                'F152CB8C-7D32-4E4C-9AF4-408365747631' ],
            },
            playlist_1: {
                id          : '2745A1AA-0068-48F4-95E2-8341185096F1',
                type        : 'playlist',
                name        : 'Playlist #1',
                duration    : '120',
				duration_formatted: '2:15',
                description : 'Description of Playlist #1',
                is_published: 'false',
                track_ids   : [ 'A88D38AA-747A-4B52-8A78-64FAA043E6A9',
                                '0F86891A-6B19-461B-BFE5-AC87E7E1398D',
                                '6D3CA320-B99E-458F-B562-1B7E6F6F10A2' ],
            },
			playlist_2: {
                id          : 'D691FB14-8223-43ED-9FAC-9B989B095B70',
                type        : 'playlist',
                name        : 'Playlist #2',
				duration    : '180',
				duration_formatted: '3:00',
                description : 'Description of Playlist #2',
                is_published: 'false',
                track_ids   : [ 'A88D38AA-747A-4B52-8A78-64FAA043E6A9',
                                '0F86891A-6B19-461B-BFE5-AC87E7E1398D' ],
            },
			playlist_3: {
				id          : '86060458-7C17-436C-9A09-2273096851FB',
                type        : 'playlist',
                name        : 'Playlist #3',
				duration    : '60',
				duration_formatted: '1:00',
                description : 'Description of Playlist #3',
                is_published: 'false',
                track_ids   : [ '6D3CA320-B99E-458F-B562-1B7E6F6F10A2',
                                '0F86891A-6B19-461B-BFE5-AC87E7E1398D' ],
			},
			playlist_4: {
				id          : '005E75C8-DD5C-4B37-B1CD-2964417462D1',
                type        : 'playlist',
                name        : 'Playlist #4',
				duration    : '60',
				duration_formatted: '5:00',
                description : 'Description of Playlist #4',
                is_published: 'false',
                track_ids   : [ 'DECD417B-B848-461E-B1C4-1C58898622DF',
                                'D669E1FC-8572-484F-B45F-73E019469DEF' ],
			},
            track_1: {
                id          : 'A88D38AA-747A-4B52-8A78-64FAA043E6A9',
                type        : 'track',
                name        : 'Track #1',
                created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				duration	: '90',
            },
            track_2: {
                id          : '0F86891A-6B19-461B-BFE5-AC87E7E1398D',
                type        : 'track',
                name        : 'Track #2',
                created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				duration	: '60',
            },
            track_3: {
                id          : '6D3CA320-B99E-458F-B562-1B7E6F6F10A2',
                type        : 'track',
                name        : 'Track #3',
                created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				duration	: '15',
            },
            track_4: {
                id          : 'F152CB8C-7D32-4E4C-9AF4-408365747631',
                type        : 'track',
                name        : 'Track #4',
                created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				duration	: '120'
            },
            track_5: {
                id          : 'DECD417B-B848-461E-B1C4-1C58898622DF',
                type        : 'track',
                name        : 'Track #5',
                created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				duration	: '90'
            },
            track_6: {
                id          : 'D669E1FC-8572-484F-B45F-73E019469DEF',
                type        : 'track',
                name        : 'Track #6',
                created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
				duration	: '180'
            }
        };

        _.each(data, function(val, key) {
            app.collection.add(val);
        });

        this.set('sisbot_id', '57DB5833-72EF-4D16-BCD8-7B832B423554')
            .set('user_id', '2B037165-209B-4C82-88C6-0FA4DEB08A08');

		this.set('community_playlist_ids', [ data.playlist_3.id, data.playlist_4.id ]);
		this.set('community_track_ids', [ data.track_5.id, data.track_6.id ]);


		app.current_session().set('signed_in', 'true');

		this._data = data;

        return this;
    }
};
