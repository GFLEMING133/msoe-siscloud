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

				vel					: 1,
				accel				: 0.5,
				thvmax				: 1,
				reversed			: false,
				verts				: [],
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
		app.trigger('sisbot:update_playback', { playlist_id: 'false', track_id: this.id });
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
	/**************************** STORE ***************************************/
	download: function () {
		app.trigger('sisuser:download_track', this.id);
	},
	publish: function () {

	},
	unpublish: function () {

	},
};
