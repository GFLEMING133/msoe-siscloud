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

			is_connected	: false,

			data		: {
				id					: data.id,
				type    			: 'sisbot',
				version				: this.current_version,

				hostname			: 'false',				// sisyphus.local:3001
				local_ip			: '',					// 192.168.0.1:3001

				pi_id				: '',
				firmware_version	: '',
				software_version	: '1.0',

				is_hotspot			: 'true',
				is_internet_connected: 'false',

				network_connected	: 'not connected',		// not connected|connected
                wifi_network        : '',
                wifi_password       : '',

				playlist_ids		: [],
				track_ids			: [],

				active_playlist_id	: 'false',
				active_track_id		: 'false',

				current_time		: 0,					// seconds

				state				: 'playing',			// playing|homing|paused|waiting

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
		//this.set('wifi.name', 'Sodo4');
		//this.set('wifi.password', '60034715CF25')
		//this.set('wifi.name', 'Nimbus');
		//this.set('wifi.password', 'so202donimbus')
		//this.connect_to_wifi();
		//this.reset_to_hotspot();
	},
	sisbot_listeners: function () {
		this.listenTo(app, 'sisbot:update_playlist', this.update_playlist);
		this.listenTo(app, 'sisbot:set_track', this.set_track);
		this.listenTo(app, 'sisbot:save', this.save_to_sisbot);
		this.listenTo(app, 'sisbot:playlist_add', this.playlist_add);
		this.listenTo(app, 'sisbot:playlist_remove', this.playlist_remove);
	},
	after_export: function () {
		app.current_session().set_active({ sisbot_id: 'false' });
	},
	_update_sisbot_msg: function(obj) {
		this._update_sisbot(obj.endpoint, obj.data, obj.cb);
	},
	_update_sisbot: function (endpoint, data, cb) {
		console.log('WE CONNECTED', this.get('is_connected'));


		if (this.get('is_connected') == false)
			return this;

		var obj = {
			_url	: 'http://' + this.get('data.hostname') + '/',
			_type	: 'POST',
			endpoint: 'sisbot/' + endpoint,
			data	: data
		};

		app.post.fetch(obj, function(resp) {
			if (cb) cb(resp);
		});
	},
	/**************************** SISBOT ADMIN ********************************/
	get_networks: function () {
		var self			= this;
		var wifi_networks	= [];

		this._update_sisbot('get_wifi', { iface: 'wlan0', show_hidden: true }, function(obj) {
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
			self.set('data.network_connected', 'connected');
			self.set('data.wifi_network', credentials.name);
			self.set('data.wifi_password', credentials.password);
			app.current_session().set_active({ secondary: 'false' });

			setTimeout(function() {
				self.is_network_connected();
			}, 5000);
		});
    },
	disconnect_wifi: function () {
		this.set('data.network_connected', 'not connected')
			.set('data.wifi_network', 'false')
			.set('data.wifi_password', 'false');
	},
	is_network_connected: function () {
		var self = this;

		this._update_sisbot('is_network_connected', {}, function(obj) {
			console.log('is network connected', obj);
			if (obj.resp == true) {
				self.set('data.network_connected', 'connected');
			} else {
				self.set('data.network_connected', 'not connected')
					.set('data.wifi_network', 'false')
					.set('data.wifi_password', 'false');
			}
		});
	},
	install_updates: function () {
		this._update_sisbot('git_pull', { repo: 'siscloud' }, function(obj) {
			console.log('Fetch Siscloud');
		});
		this._update_sisbot('git_pull', { repo: 'sisproxy' }, function(obj) {
			console.log('Fetch Sisproxy');
		});
		this._update_sisbot('git_pull', { repo: 'sisbot' }, function(obj) {
			console.log('Fetch Sisbot');
		});
	},
	restart: function () {
		this._update_sisbot('restart', {}, function(obj) {
			console.log('RESTART');
		});
	},
	factory_reset: function () {
		this._update_sisbot('factory_reset', {}, function(obj) {
			console.log('RESET');
		});
	},
	reset_to_hotspot: function () {
		this._update_sisbot('reset_to_hotspot', {}, function(obj) {
			console.log('RESET', obj);
		});
	},
	save_to_sisbot: function (data) {
		this._update_sisbot('save', data, function(obj) {
			console.log('WE SAVE');
		});
	},
	/**************************** PLAYBACK ************************************/
	update_playlist: function (data) {
		this.set('data.is_loop', data.is_loop);
		this.set('data.is_shuffle', data.is_shuffle);

		this._update_sisbot('set_playlist', data, function(obj) {
			// get back playlist obj
			console.log('SET PLAYLIST', obj);

			if (obj.resp.id !== 'false')
				app.collection.get(obj.resp.id).set('data', obj.resp);
		});

		this.set('data.active_playlist_id',	data.id);
		this.set('data.active_track_id',	data.active_track_id);
		this.set('data.state', 'playing');
	},
	set_track: function (data) {
		this._update_sisbot('set_track', data, function(resp) {
			// get back track obj
		});

		this.set('data.active_playlist_id',	'false');
		this.set('data.active_track_id',	data.id);
		this.set('data.state', 'playing');
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
	set_shuffle: function () {
		this.set('data.is_shuffle', app.plugins.bool_opp[this.get('data.is_shuffle')]);

		this._update_sisbot('set_shuffle', { value: this.get('data.is_shuffle') }, function(obj) {
			// TODO: Returns current playlist.. Update frontend
			console.log('SET SHUFFLE', obj);
			app.collection.get(obj.resp.id).set('data', obj.resp);
		});
	},
	set_loop: function () {
		console.log('SET LOOP');
		this.set('data.is_loop', app.plugins.bool_opp[this.get('data.is_loop')]);
		this._update_sisbot('set_loop', { value: this.get('data.is_loop') });
	},
	playlist_add: function (playlist_model) {
		var self		= this;
		var playlist	= playlist_model.get('data');

		this._update_sisbot('add_playlist', playlist, function (obj) {
			self.set('data', obj.resp);
			console.log('PLAYLIST ADD', obj.resp);
		});

		this.add_nx('data.playlist_ids', playlist.id);
	},
	playlist_remove: function (playlist_model) {

		this._update_sisbot('remove_playlist', playlist, function (obj) {
			console.log('PLAYLIST ADD');
		});

	},
	/******************** PLAYBACK ********************************************/
	play: function () {
		this.set('data.state', 'playing');
		this._update_sisbot('play', {});
	},
	pause: function () {
		this.set('data.state', 'paused');
		this._update_sisbot('pause', {});
	},
	home: function () {
		this.set('data.state', 'homing');
		this._update_sisbot('home', {});
	},
	jog_theta_left: function () {
		var self = this;
		this._update_sisbot('pause', {}, function() {
			self._update_sisbot('jogThetaLeft', {});
		});
	},
	jog_theta_right: function () {
		var self = this;
		this._update_sisbot('pause', {}, function() {
			self._update_sisbot('jogThetaRight', {});
		});
	},
	jog_rho_outward: function () {
		var self = this;
		this._update_sisbot('pause', {}, function() {
			self._update_sisbot('jogRhoOutward', {});
		});
	},
	jog_rho_inward: function () {
		var self = this;
		this._update_sisbot('pause', {}, function() {
			self._update_sisbot('jogRhoInward', {});
		});
	},
	/**************************** COMMUNITY ***********************************/
	download_playlist: function (playlist_id) {

	},
	download_track: function (track_id) {

	}
};
