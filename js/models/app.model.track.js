app.model.track = {
	defaults: function (data) {
		var obj = {
			id					: data.id,
			type				: 'track',

			is_adding			: 'false',
			playlist_ids		: [],
			playlist_not_ids	: [],

			upload_status		: 'hidden',		// hidden|false|uploading|success
			sisbot_upload		: 'false',
			generating_thumbnails: 'false',

			is_favorite			: 'false',

			d3: 'false',
			d3_data : {
				background: 'transparent', // transparent, #fdfaf3, #d6d2ca, #c9bb96
				stroke: '#797977', // #797977, #948252
				stroke_width: 3,
				stroke_edge: '#fdfaf3', // #fdfaf3, #f6ebcd
				stroke_edge_width: 7,
				points:	[],
				steps: 0,
				r_max_dist: 0.1,
				retrace_steps: 5,
				loaded: "false",
				circle: "true",
				circle_stroke: '#d6d2ca',
				circle_stroke_width: 2,
				square: "false"
			},

			data		: {
				id					: data.id,
				type    			: 'track',
				version				: this.current_version,

                name                : '',
                is_published		: 'false',
				duration			: '90',		// minutes

				created_by_id		: 'false',
				created_by_name		: 'Sisyphus Industries',

				has_verts_file		: 'false',
				verts				: '',		// temporary

				default_vel:				1,
				default_accel:			0.5,
				default_thvmax:			1,
				reversed			: false,
				firstR				: -1,
				lastR				: -1,
				type				: 'r',
				reversible			: false
			}
		};

		return obj;
	},
	current_version: 1,
	after_export: function () {
		app.current_session().set_active({ track_id: 'false' });
	},
	/**************************** D3 RENDERING ***********************************/
	load_d3_data: function() {
		console.log("Load D3 Data", this.id);
		var self = this;
		self.set("d3_data.loaded", "false");
		app.manager.get_model('sisbot_id').track_get_verts(this, function(verts) {
			var points = self._convert_verts_to_d3(verts);

			// console.log("Points:", points);
			self.set("d3_data.points", points);
			self.set("d3_data.loaded", "true");
		});
	},
	_convert_verts_to_d3: function(data) {
		var return_value = [];
		// Step the file, line by line
		var lines = data.toString().trim().split('\n');
		var regex = /^\s*$/; // eliminate empty lines

		_.map(lines, function(line) {
			line.trim();

			if (line.length > 0 && line.substring(0,1) != '#' && !line.match(regex)) {
				var values = line.split(/\s+/);
				var entry = {y:parseFloat(values[0]), x:parseFloat(values[1])}; // [theta, rho]
				return_value.push(entry);
			}
		});

		return return_value;
	},
	generate_thumbnails: function () {
		if (this.get('generating_thumbnails') == 'true')
			return this;

		this.set('generating_thumbnails', 'true');
		var self = this;

		app.post.fetch({
			_type	: 'POST',
			endpoint: 'thumbnail_generate',
			host_url: app.config.get_base_url(),
			id		: this.id,
		}, function exists_cb(obj) {
			self.set('generating_thumbnails', 'false');
			console.log(obj);
			if (obj.err) {
				alert(obj.err)
			} else {
				alert('Thumbnails generated');
			}
		}, 0);

		return this;
	},
	/**************************** GENERAL ***********************************/
	play_logic: function (track_index) {
		var active			= app.session.get('active');
		var current_track	= app.manager.get_model('sisbot_id').get('data.active_track.id');
		if (active.primary == 'current' && this.id == current_track) {
			// do nothing, we're currently playing
		} else if (active.primary == 'current') {
			// we have another track on the playlist
			app.manager.get_model('sisbot_id').get_model('data.active_playlist_id').play_from_current(track_index);
		} else if (active.primary == 'media' && active.secondary == 'tracks') {
			// tracks overview page
			this.play();
		} else if (active.primary == 'media' && active.secondary == 'playlist') {
			app.collection.get(active.playlist_id).play(track_index);
		}
	},
	play: function () {
		app.trigger('sisbot:set_track', this.get('data'));
		app.trigger('session:active', { secondary: 'false', primary: 'current' });
	},
	delete: function () {
		app.manager.get_model('sisbot_id').track_remove(this);
	},
	on_file_upload: function (file) {
		this.upload_verts_to_cloud(file.data);
		return this;
	},
	upload_track_to_cloud: function () {
		this.set('data.is_saved', 'true');

		var post_data		= this.get('data');

		post_data._url		= 'https://api.sisyphus.withease.io/';
		post_data._type		= 'POST';
		post_data.endpoint	= 'set';

		var verts_data		= post_data.verts;
		post_data.verts		= '';

		app.post.fetch(post_data, function cb(obj) {}, 0);

		this.upload_verts_to_cloud(verts_data);

		return this;
	},
	upload_verts_to_cloud: function (verts_data) {
		var self = this;
		this.set('upload_status', 'uploading');

		app.post.fetch({
			_url	: 'https://api.sisyphus.withease.io/',
			_type	: 'POST',
			endpoint: 'upload_track',
			id		: this.id,
			verts	: verts_data,
			host_url: 'https://app.sisyphus.withease.io/',
		}, function cb(obj) {
			if (obj.err) {
				self.set('upload_status', 'failure');
			} else {
				self.set('upload_status', 'success');
				self.set('data.has_verts_file', 'true');

				setTimeout(function () {
					self.set('upload_status', 'hidden');
				}, 2500);
			}
		}, 0);

		return this;
	},
	upload_track_to_sisbot: function () {
		var name	= this.get('data.name');
		var verts	= this.get('data.verts');
		var errors	= [];

		if (name == '') errors.push('- Track Name cannot be empty');
		if (verts == '') errors.push('- Track Verts File cannot be empty');

		this.set('errors', errors);

		if (errors.length > 0)
			return this;

		// track is good. Change some settings and upload to sisbot!
		this.set('data.has_verts_file', 'true');

		if (app.manager.get('user_id') !== 'false') {
			this.set('data.created_by_id', app.manager.get('user_id'));
			this.set('data.created_by_name', app.manager.get_model('user_id').get('data.name'));
		}

		app.collection.add(this);
		app.trigger('sisbot:track_add', this);

		return this;
	},
	/**************************** PLAYLISTS ***********************************/
	playlist_obj: function() { // returns object to save in playlist (to retain speeds/reversed/etc per instance)
		var return_obj = {
			id: this.get('id'),
			vel: this.get('data.default_vel'),
			accel: this.get('data.default_accel'),
			thvmax: this.get('data.default_thvmax'),
			reversed: this.get('data.revered'),
			firstR: this.get('data.firstR'),
			lastR: this.get('data.lastR'),
			reversible: this.get('data.reversible')
		};
		return return_obj;
	},
	playlist_cancel: function () {
		this.set('is_adding', 'false');
		return this;
	},
	playlist_add: function () {
		this.get_not_playlists();
		this.set('is_adding', 'true');
	},
	playlist_add_finish: function (playlist_id) {
		var playlist = app.collection.get(playlist_id);
		playlist.add_nx('data.tracks', this.playlist_obj());
		playlist.add_nx('data.sorted_tracks', playlist.get('data.tracks').length-1); // add last index of tracks
		this.remove('playlist_not_ids', playlist_id);
		this.add('playlist_ids', playlist_id);

		playlist.save();

		this.playlist_cancel();
	},
	get_not_playlists: function() {
		var sisbot			= app.current_session().get_model('sisyphus_manager_id').get_model('sisbot_id');
		var playlist_ids	= [];
		var track_id		= this.id;

		_.each(sisbot.get_model('data.playlist_ids'), function(p) {
			if (_.findIndex(p.get('data.tracks'), {id:track_id}) == -1)
				playlist_ids.push(p.id);
		});

		this.set('playlist_not_ids', playlist_ids);
		this.trigger('change:playlist_not_ids');
	},
	get_playlists: function () {
		var sisbot			= app.current_session().get_model('sisyphus_manager_id').get_model('sisbot_id');
		var playlist_ids	= [];
		var track_id		= this.id;

		_.each(sisbot.get_model('data.playlist_ids'), function(p) {
			if (_.findIndex(p.get('data.tracks'), {id: track_id}) > -1)
				playlist_ids.push(p.id);
		});

		this.set('playlist_ids', playlist_ids);
	},
	is_playlist_favorite: function () {
		var playlist_model = app.manager.get_model('sisbot_id').get_model('data.favorite_playlist_id');

		if (playlist_model && playlist_model.has_track) {
			var has_track = playlist_model.has_track(this.id);
			this.set('is_favorite', '' + has_track);
		}
	},
	favorite_toggle: function () {
		if (app.manager.get_model('sisbot_id').is_legacy())
			return app.plugins.n.notification.alert('This feature is unavailable because your sisbot is not up to date. Please update your version in order to enable this feature');

		var status = this.get('is_favorite');
		var fav_model = app.manager.get_model('sisbot_id').get_model('data.favorite_playlist_id');
		if (status == 'true' && fav_model) {
			fav_model.remove_track_and_save(this.id);
		} else if (fav_model) {
			fav_model.add_track_and_save(this.id);
		}
		this.set('is_favorite', app.plugins.bool_opp[status]);
	},
	/**************************** COMMUNITY ***********************************/
	fetch_then_download: function () {
		var self = this;

		var req_obj = {
			_url	: 'https://api.sisyphus.withease.io/',
			_type	: 'POST',
			endpoint: 'get',
			id		: this.id
		};

		function cb(obj) {
			if (obj.err || obj.resp.length == 0) {
				alert('There was an error downloading this track. Please try again later')
			} else {
				self.set('data', obj.resp[0]);
				self.download();
			}
		}

		app.post.fetch(req_obj, cb, 0);
	},
	download: function () {
		var self = this;

		if (this.get('data.verts') !== '') {
			app.trigger('manager:download_track', this.id);
			app.trigger('sisbot:track_add', this);
			return this;
		}

		var req_obj = {
			_url	: 'https://api.sisyphus.withease.io/',
			_type	: 'POST',
			endpoint: 'download_track',
			id		: this.id
		};

		function cb(obj) {
			if (obj.err) {
				alert('There was an error downloading this track. Please try again later')
			} else {
				self.set('data.verts', obj.resp);
				app.trigger('manager:download_track', self.id);
				app.trigger('sisbot:track_add', self);
			}
		}

		app.post.fetch(req_obj, cb, 0);
	},
	publish_upload: function() {
		var self = this;

		app.manager.get_model('sisbot_id').track_get_verts(this, function(verts) {
			self.set('data.verts', verts);
			self.set('data.is_published', 'true');
			self.upload_track_to_cloud();
		});
		return this;
	},
	publish: function () {
		this.set('data.is_published', 'true').save();
	},
	unpublish: function () {
		this.set('data.is_published', 'false').save();
	},
	_save: function (track_data) {
		if (!track_data)	track_data = this.get('data');

		track_data._url			= 'https://api.sisyphus.withease.io/';
		track_data._type		= 'POST';
		track_data.endpoint		= 'set';

		app.post.fetch(track_data, function cb(obj) {
			if (obj.err)	alert('Error saving track to cloud');
		}, 0);
	},
};
