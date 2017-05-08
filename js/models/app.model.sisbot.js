app.model.sisbot = {
	defaults: function (data) {
		//	IF WE ARE ON THE SISBOT WE SHOULD HAVE A DIFFERENT MODEL THAT ISSUES COMMANDS

		var obj = {
			id			: data.id,
			type		: 'sisbot',
			data		: {
				id					: data.id,
				type    			: 'sisbot',
				version				: this.current_version,

                wifi_network        : '',
                wifi_password       : '',

				playlist_ids		: [],
				track_ids			: [],

				active_playlist		: 'false',
				active_track		: 'false',
				current_time		: 0,			// seconds

				is_playing			: 'true',
				is_homing			: 'false',
				is_shuffle			: 'false',
				is_loop				: 'false',
				brightness			: '50',
				speed				: '30',
			}
		};

		return obj;
	},
	current_version: 1,
	on_init: function () {
	},
	after_export: function () {
		app.current_session().set_active({ sisbot_id: 'false' });
	},
	_update_sisbot: function (endpoint, data, cb) {
		var obj = {
			_url	: 'http://raspberrypi.local/',
			_type	: 'POST',
			endpoint: 'sisbot/' + endpoint,
			data	: data
		};

		app.post.fetch(obj, function(resp) {
			console.log('did we get a resp?', resp);
			if (cb) cb(resp);
		});
	},
	/**************************** SISBOT ADMIN ********************************/
	connect_wifi: function () {

	},
	disconnect_wifi: function () {

	},
	install_updates: function () {

	},
	restart: function () {

	},
	/**************************** PLAYBACK ************************************/
	update_playback: function (obj) {
		// playlist_id, track_id
		var active_playlist = 'false';
		var active_track	= 'false';

		if (obj.playlist_id) active_playlist = obj.playlist_id;;
		if (obj.track_id) active_track = obj.track_id;

		if (obj.playlist_id && !obj.track_id) {
			var p = app.collection.get(obj.playlist_id).get('data.track_ids');
			active_track = p[0];
		}

		this.set('data.active_playlist', active_playlist);
		this.set('data.active_track', active_track);

	},
	home: function () {
		this.set('data.is_homing', 'true');
		this._update_sisbot('home', {});
	},
	prev: function () {
		this._update_sisbot('prev', {});
	},
	next: function () {
		this._update_sisbot('playNextTrack', {});
	},
	play: function () {
		this.set('data.is_playing', 'true');
		this._update_sisbot('play', {});
	},
	pause: function () {
		this.set('data.is_playing', 'false');
		this._update_sisbot('pause', {});
	},
	shuffle_mode: function (is_true) {
		this.set('data.is_shuffle', is_true);
	},
	brightness: function (level) {
		this.set('data.brightness', '' + level);
		this._update_sisbot('set_brightness', { value: (+level / 100) });
	},
	brightness_up: function () {
		var level = +this.get('data.brightness');
		if (level <= 95) level = level + 5;
		this.brightness(level);
	},
	brightness_down: function () {
		var level = +this.get('data.brightness');
		if (level >= 5) level = level - 5;
		this.brightness(level);
	},
	speed: function (level) {
		this.set('data.speed', '' + level);
		this._update_sisbot('set_speed', { value: level });
	},
	speed_up: function () {
		var level = +this.get('data.speed');
		if (level <= 95) level = level + 5;
		this.speed(level);
	},
	speed_down: function () {
		var level = +this.get('data.speed');
		if (level >= 5) level = level - 5;
		this.speed(level);
	},
	/**************************** STORE ***************************************/
	download_playlist: function (playlist_id) {

	},
	download_track: function (track_id) {

	}
};
