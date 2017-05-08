app.model.playlist = {
	defaults: function (data) {
		var obj = {
			id				: data.id,
			type			: 'playlist',

			eligible_tracks	: [],
			active_tracks	: [],
			edit		: {
				name		: '',
				description	: '',
			},
			data		: {
				id					: data.id,
				type    			: 'playlist',
				version				: this.current_version,

                name                : '',
                description         : '',
				duration			: '',				// mins
				duration_formatted	: '',				// HH:mm
                track_ids           : [],
				is_published		: 'false',
				created_by_id		: 'false',
				created_by_name		: 'User Name',
			}
		};

		/*
		var b = {
			name: 'default',
			repeat: true,
			track_ids: ['sine', 'circam2s', 'cwarp3b', 'dces4p', 'hep', 'india1p', 'para2b', 'tensig1$']
		}
		*/

		return obj;
	},
	current_version: 1,
	after_export: function () {
		app.current_session().set_active({ playlist_id: 'false' });
	},
	play: function (track_id) {
		if (app.plugins.falsy(track_id)) track_id = this.get('data.track_ids')[0];
		app.trigger('sisbot:update_playback', { playlist_id: this.id, track_id: track_id });
	},
	update_duration: function () {
		var duration = 0;

		_.each(this.get_model('data.track_ids'), function(track) {
			duration += +track.get('data.duration');
		});

		var hours	= Math.floor(duration / 60);
		var mins	= duration % 60;

		this.set('data.duration', '' + duration)
			.set('data.duration_formatted', hours + ':' + mins);
		return this;
	},
	/**************************** TRACKS **************************************/
	move_array: function (field, old_index, new_index) {
		var val		= this.get(field);
		var length	= val.length;
		var opt		= val.splice(old_index, 1);

		val.splice(new_index, 0, opt[0]);
		this.set(field, val);

		this.trigger('change:' + field);
	},
	edit: function () {
		this.set('active_tracks', this.get('data.track_ids').slice())
			.set('edit.name', this.get('data.name'))
			.set('edit.description', this.get('data.description'))
			.set('is_editing', 'true');
	},
	cancel_edit: function () {
		this.set('is_editing', 'false');
	},
	save_edit: function () {
		this.set('is_editing', 'false')
			.set('data.name', this.get('edit.name'))
			.set('data.description', this.get('edit.description'))
			.set('data.track_ids', this.get('active_tracks').slice())
			.update_duration();
	},
	/**************************** TRACKS **************************************/
	add_track: function (track_id) {
		this.add_nx('active_tracks', track_id);
		this.remove('eligible_tracks', track_id);
		// this.save();
	},
	remove_track: function (track_id) {
		this.remove('active_tracks', track_id);
		this.add_nx('eligible_tracks', track_id);
	},
	reorder_track: function (track_id, new_index) {

	},
	generate_eligible_tracks: function () {
		var curr_tracks = this.get('data.track_ids');
		var elig_tracks = [];

		app.collection.get_cluster({ type: 'track' }).each(function(track) {
			if (curr_tracks.indexOf(track.id) == -1)
				elig_tracks.push(track.id);
		});

		this.set('eligible_tracks', elig_tracks);
	},
	/**************************** STORE ***************************************/
	download: function () {
		app.trigger('sisuser:download_playlist', this.id);
	},
	publish: function () {

	},
	unpublish: function () {

	},
};
