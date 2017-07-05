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
        tracks           : [], // list of objects { id, vel, accel, thvmax, reversed, firstR, lastR, reversible }
				sorted_tracks		: [],				// display to users

				is_published		: 'false',
				is_shuffle			: 'false',			// same from sisbot
				is_loop				: 'false',			// same from sisbot
				active_track_id		: 'false',
				active_track_index	: 'false',

				created_by_id		: 'false',
				created_by_name		: 'User Name',
			}
		};

		return obj;
	},
	current_version: 1,
	after_export: function () {
		app.current_session().set_active({ playlist_id: 'false' });
	},
	before_save: function () {
		if (app.current_session().get_model('sisyphus_manager_id')) {
			var user_id = app.current_session().get_model('sisyphus_manager_id').get('user_id');
			if (user_id !== 'false')
				this.set('data.created_by_id', user_id);
		}
	},
	after_save: function () {
		app.trigger('sisbot:playlist_add', this);
	},
	save_sisbot_to_cloud: function () {
		// we have a sisbot playlist we want saved to user account
		app.trigger('sisbot:save', this.toJSON());
	},
	/**************************** GENERAL *************************************/
	play_from_current: function (track_index) {
		track_index = (app.plugins.falsy(track_index)) ? 0 : +track_index;

		var data = this.get('data');
		data.active_track_index = track_index;
		data.active_track_id	= this.get('data.tracks')[track_index].id;
		data.is_current			= true;

		app.trigger('sisbot:update_playlist', data);
		app.trigger('session:active', { 'primary': 'current', 'secondary': 'false' });

	},
	play: function (track_index) {
		track_index = (app.plugins.falsy(track_index)) ? 0 : +track_index;

		var data = this.get('data');
		data.active_track_index = track_index;
		data.active_track_id	= this.get('data.tracks')[track_index].id;

		app.trigger('sisbot:update_playlist', data);
		app.trigger('session:active', { 'primary': 'current', 'secondary': 'false' });
	},
	update_duration: function () {
		var duration = 0;

		_.each(this.get_model('data.tracks'), function(track_obj) {
			var track = app.collection.get(track_obj.id);
			duration += +track.get('data.duration');
		});

		var hours	= Math.floor(duration / 60);
		var mins	= duration % 60;

		this.set('data.duration', '' + duration)
			.set('data.duration_formatted', hours + ':' + mins);

		return this;
	},
	/**************************** EDIT ****************************************/
	edit: function () {
		this.set('active_tracks', this.get('data.tracks').slice())
			.set('edit.name', this.get('data.name'))
			.set('edit.description', this.get('data.description'))
			.set('is_editing', 'true');
	},
	cancel_edit: function () {
		this.set('is_editing', 'false');

		if (this.get('data.is_saved') == 'false')
			app.trigger('session:active', { secondary: 'false' });
	},
	save_edit: function () {
		this.set('is_editing', 'false')
			.set('data.name', this.get('edit.name'))
			.set('data.description', this.get('edit.description'))
			.set('data.tracks', this.get('active_tracks').slice());
			//.update_duration()

		var sorted_tracks = [];
		_.each(this.get('data.tracks'), function(obj,index) {
			sorted_tracks.push(index);
		});
		this.set("data.sorted_tracks", sorted_tracks);

		this.save();
	},
	/**************************** TRACKS **************************************/
	add_track: function (track_id) {
		var track = app.collection.get(track_id);
		var track_obj = {
			id: track_id,
			vel: track.get('data.default_vel'),
			accel: track.get('data.default_accel'),
			thvmax: track.get('data.default_thvmax'),
			firstR: track.get('data.firstR'),
			lastR: track.get('data.lastR')
		};
		this.add('active_tracks', track_obj);
		this.trigger('change:active_tracks');
	},
	remove_track: function (track_index) {
		console.log("Remove", track_index,this.get('active_tracks')[+track_index].id);
		var track = app.collection.get(this.get('active_tracks')[+track_index].id);
		this.remove('active_tracks['+track_index+']');
		this.add_nx('eligible_tracks', track.id);
	},
	move_array: function (field, old_index, new_index) {
		var val		= this.get(field);
		var length	= val.length;
		var opt		= val.splice(old_index, 1);

		val.splice(new_index, 0, opt[0]);
		this.set(field, val);

		this.trigger('change:' + field);
	},
	generate_eligible_tracks: function () {
		// var curr_tracks = app.manager.get_model('sisbot_id').get('data.track_ids');
		var elig_tracks = app.manager.get_model('sisbot_id').get('data.track_ids').splice();

		// app.collection.get_cluster({ type: 'track' }).each(function(track) {
		// 	if (curr_tracks.indexOf(track.id) != -1) elig_tracks.push(track.id);
		// 	// elig_tracks.push(track.id);
		// });

		this.set('eligible_tracks', elig_tracks);
	},
	/**************************** COMMUNITY ***********************************/
	download: function () {
		app.trigger('sisuser:download_playlist', this.id);
	}
};
