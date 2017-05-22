app.model.track = {
	defaults: function (data) {
		var obj = {
			id					: data.id,
			type				: 'track',

			is_adding			: 'false',
			playlist_ids		: [],
			playlist_not_ids	: [],

			data		: {
				id					: data.id,
				type    			: 'track',
				version				: this.current_version,

                name                : '',
                is_published		: 'false',
				created_by_id		: 'false',
				duration			: '90',		// minutes
				created_by_id		: 'false',
				created_by_name		: 'Author Name',

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

		console.log('we get you', this.get('data.verts'));

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
			console.log('TRACK DOWNLOAD', obj);
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
