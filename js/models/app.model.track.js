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

				vel					: 1,
				accel				: 0.5,
				thvmax				: 1,
				reversed			: false,
				firstR				: 0,
				lastR				: 1,
				type				: 'r01',
				reversible			: true
			}
		};

		return obj;
	},
	current_version: 1,
	after_export: function () {
		app.current_session().set_active({ track_id: 'false' });
	},
	play: function () {
		app.trigger('sisbot:set_track', this.get('data'));
		app.trigger('session:active', { 'primary': 'current', 'secondary': 'false' });
	},
	on_file_upload: function (file) {
		if (this.get('sisbot_upload') == 'true') {
			this.set('data.name', file.name.replace('.thr', ''));
			this.set('data.verts', file.data);

			console.log('WHAT IS OUR DATA', this.get('data'));
		} else {
			this.upload_verts_to_cloud(file.data);
		}
		return this;
	},
	upload_verts_to_cloud: function (verts_data) {
		var self = this;
		this.set('upload_status', 'uploading');

		app.post.fetch({
			_type	: 'POST',
			endpoint: 'upload_track',
			id		: this.id,
			verts	: verts_data
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
	},
	upload_track_to_sisbot: function () {
		var name	= this.get('data.name');
		var verts	= this.get('data.verts');
		var errors	= [];

		if (name == '') errors.push('- Track Name cannot be empty');
		if (verts == '') errors.push('- Track Verts File cannot be empty');

		this.set('errors', errors);

		if (errors.length > 0)	return this;

		// track is good. Change some settings and upload to sisbot!
		this.set('data.has_verts_file', 'true');

		if (app.manager.get('user_id') !== 'false') {
			this.set('data.created_by_id', app.manager.get('user_id'));
			this.set('data.created_by_name', app.manager.get_model('user_id').get('data.name'));
		}

		app.collection.add(this);
		app.trigger('sisbot:track_add', this);
		app.trigger('session:active', { track_id: this.id, secondary: 'track', primary: 'tracks' });

		return this;
	},
	/**************************** PLAYLISTS ***********************************/
	playlist_cancel: function () {
		this.set('is_adding', 'false');
		return this;
	},
	playlist_add: function () {
		this.get_not_playlists();
		this.set('is_adding', 'true');
	},
	playlist_add_finish: function (playlist_id) {
		app.collection.get(playlist_id).add_nx('data.track_ids', this.id);
		app.collection.get(playlist_id).add_nx('data.sorted_tracks', this.id);
		this.remove('playlist_not_ids', playlist_id);
		this.add('playlist_ids', playlist_id);
		this.playlist_cancel();
	},
	get_not_playlists: function() {
		var sisbot			= app.current_session().get_model('sisyphus_manager_id').get_model('sisbot_id');
		var playlist_ids	= [];
		var track_id		= this.id;

		_.each(sisbot.get_model('data.playlist_ids'), function(p) {
			if (p.get('data.track_ids').indexOf(track_id) == -1)
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
			if (p.get('data.track_ids').indexOf(track_id) > -1)
				playlist_ids.push(p.id);
		});

		this.set('playlist_ids', playlist_ids);
	},
	/**************************** COMMUNITY ***********************************/
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
			self.set('data.verts', obj.resp);
			app.trigger('manager:download_track', self.id);
			app.trigger('sisbot:track_add', self);
		}

		app.post.fetch(req_obj, cb, 0);
	},
	publish: function () {
		this.set('data.is_published', 'true').save();
	},
	unpublish: function () {
		this.set('data.is_published', 'false').save();
	}
};
