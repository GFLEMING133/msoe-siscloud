app.model.playlist = {
	defaults: function (data) {
		var obj = {
			id				: data.id,
			type			: 'playlist',

			is_new				: 'true', // used for showing Playlist name/description edit once
			is_community	: 'false', // is webcenter playlist (true == not yet downloaded)
			is_downloaded	: 'false', // playlist has been loaded to the current table

			eligible_tracks	: [],
			active_tracks		: [],
			edit		: {
				name				: '',
				description	: '',
			},
			add_playlist_tracks: {},
			temp_tracks: [], // for previewing the flow of start/end rho

			data		: {
				id						: data.id,
				type    			: 'playlist',
				version				: this.current_version,

        name                : 'false',
        description         : 'false',
				duration						: '',				// mins
				duration_formatted	: '',				// HH:mm

				is_published		: 'false',
				is_shuffle			: 'false',			// same from sisbot
				is_loop					: 'true',			// same from sisbot

				active_track_index	: -1,
				active_track_id			: 'false',

				tracks          : [], 				// list of objects { id, vel, accel, thvmax, reversed, firstR, lastR, reversible }
				sorted_tracks		: [],				// display to users
				next_tracks			: [],				//

				created_by_id		: 'false',
				created_by_name	: 'User Name',
				featured_track  : 0
			}
		};

		return obj;
	},
	current_version: 1,
	on_init: function () {
		if (this.get('data.description') == '') this.set('data.description', 'false');
		// this.on('change:data.is_published', this.check_publish);
		return this;
	},
	after_export: function () {
		app.current_session().set_active({ playlist_id: 'false' });
	},
	before_save: function () {
		if (app.current_session().get_model('sisyphus_manager_id')) {
			var user_id = app.current_session().get_model('sisyphus_manager_id').get('user_id');

			if (user_id !== 'false') this.set('data.created_by_id', user_id);
		}
	},
	after_save: function () {
		app.log("Playlist: After save");
		app.trigger('sisbot:playlist_add', this);
		// if (this.get('data.is_published') == 'true') this.publish();
		// this.set('is_community', 'false');
	},
	save_sisbot_to_cloud: function () {
		// we have a sisbot playlist we want saved to user account
		app.trigger('sisbot:save', this.toJSON());
	},
	delete: function () {
		app.manager.get_model('sisbot_id').playlist_remove(this);
	},
	add_tracks_setup: function () {
		var add_playlist_tracks = {};
		var active_tracks		= this.get('active_tracks');
		var sisbot_tracks		= app.manager.get_model('sisbot_id').get('data.track_ids');

		_.each(sisbot_tracks, function(track_id) {
			add_playlist_tracks[track_id] = 0;
		});

		_.each(active_tracks, function(track_obj) {
			add_playlist_tracks[track_obj.id]++;
		});

		this.set('add_playlist_tracks', add_playlist_tracks);
	},
	add_tracks_add: function (track_id) {
		var counter = this.get('add_playlist_tracks[' + track_id + ']');
		this.set('add_playlist_tracks[' + track_id + ']', ++counter);
		this.add_track(track_id);
		// this.trigger('change:add_playlist_tracks[' + track_id + ']'); //!! try removing with Bind2
	},
	minus_tracks_minus: function (track_id) {
		var b = this.get('add_playlist_tracks[' + track_id + ']');
		var active_tracks		= _.pluck(this.get('active_tracks'), "id");
		var track_index 		= active_tracks.lastIndexOf(track_id);
		if(track_index >= 0) {
		this.set('add_playlist_tracks[' + track_id + ']', --b);
		this.remove_track({index: track_index});
		}
		this.trigger('change:add_playlist_tracks[' + track_id + ']');
	},
	add_tracks_done: function () {
		var self = this;

		app.log("Add Tracks Done", self.get('data.is_saved'));

		if (self.get('data.is_saved') == 'true') app.trigger('session:active', { 'secondary': 'playlist-edit' });
		else app.trigger('session:active', { 'secondary': 'playlist-new' });
	},
	/**************************** GENERAL *************************************/
	play_from_current: function (track_index) {
		app.log( "play_from_current", track_index);
		track_index = (app.plugins.falsy(track_index)) ? 0 : +track_index;

		var data				= JSON.parse(JSON.stringify(this.get('data')));
		data.active_track_index = track_index;
		data.active_track_id	= this.get('data.tracks')[track_index].id;
		data.is_current			= true;

		app.log("Play from current", data);
		app.trigger('sisbot:update_playlist', data);
	},
	play: function (track_index) {
		app.log("Play Playlist:", track_index);
		track_index = (app.plugins.falsy(track_index)) ? 0 : +track_index;

		var data= JSON.parse(JSON.stringify(this.get('data')));
		data.active_track_index = track_index;
		if (track_index >= 0) data.active_track_id	= this.get('data.tracks')[track_index].id;
		else data.active_track_id	= 'false';

		// FORCE PLAYLIST TO BE NON-SHUFFLED WHILE ON NON-SHUFFLED PLAYLIST PAGE
		data.is_shuffle			= 'false';
		data.start_rho			= 0;
		data.sorted_tracks		= _.range(0, data.tracks.length);
		data.next_tracks		= _.range(0, data.tracks.length);

		app.trigger('sisbot:update_playlist', data);
	},
	play_shuffled: function () {
		var data				= JSON.parse(JSON.stringify(this.get('data')));
		data.active_track_index = -1;
		data.active_track_id	= 'false';
		data.is_shuffle			= 'true';

		delete data.is_current;

		app.trigger('sisbot:update_playlist', data);
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
	setup_new: function() {
		if (this.get('is_new') == 'true') {
			if (this.get('edit.name') == '') app.trigger('modal:open', {playlist_id: this.id, 'template':'modal-playlist-edit-tmp'});
			this.set('is_new', 'false');
		}
	},
	setup_edit: function () {
		this.set('active_tracks', this.get('data.tracks').slice())
		.set('edit.name', this.get('data.name'))
		.set('edit.description', this.get('data.description'));

		app.trigger('session:active', {'secondary':'playlist-edit'} );
	},
	cancel_edit: function () {
		app.trigger('session:active', { secondary: 'playlist' });
	},
	save_alert: function () {
		var self = this;
		this.set('data.name', this.get('edit.name'));
		var playlist_name = this.get('data.name');

		if (playlist_name == "") {
			app.plugins.n.notification.confirm("You did not enter a Playlist Name, are you sure you want to save?",
			function(resp_num) {
				if (resp_num == 1) {
					app.trigger('modal:open', {playlist_id: this.id, 'template':'modal-playlist-edit-tmp'});

					return self;
				} else {
					self.save_edit();
				}
			}, 'No Name?', ['Cancel','OK']);
		} else {
			this.save_edit();
		}
	},
	save_edit: function () {
		let self = this;

		this.set('data.name', this.get('edit.name'));
		this.set('data.tracks', this.get('active_tracks').slice());
		if (this.get('edit.description') == '') this.set('data.description', 'false');
		else this.set('data.description', this.get('edit.description'));

		var sorted_tracks = [];
		_.each(self.get('data.tracks'), function(obj,index) {
			sorted_tracks.push(index);
		});

		self.set("data.sorted_tracks", sorted_tracks);
		self.save();
		app.trigger('session:active', { primary:'media' , secondary: 'playlist' , playlist_id: self.id});
	},
	/**************************** TRACKS **************************************/
	has_track: function (track_id) {
		var has_track = false;
		_.each(this.get('data.tracks'), function(obj, index) {
			if (obj.id == track_id) has_track = true;
		});

		return has_track;
	},
	add_track: function (track_id) {
		var track = app.collection.get(track_id);
		var track_obj = {
			id		: track_id,
			vel		: track.get('data.default_vel'),
			accel	: track.get('data.default_accel'),
			thvmax	: track.get('data.default_thvmax'),
			firstR	: track.get('data.firstR'),
			lastR	: track.get('data.lastR')
		};
		this.add('active_tracks', track_obj);

		this.trigger('change:active_tracks');

		app.log("Add Track", track_id, this.get('active_tracks').length);
	},
	remove_track: function (data) {
		this.remove('active_tracks['+data.index+']');

		if (data && data.pos) this.order_temp_tracks(data);
	},
	move_array: function (field, old_index, new_index) {
		field = field.replace(/^(model|parents?\[[0-9]+\]?|parent|grandparent|g_grandparent|g_g_grandparent)\.?/i, '');
		// app.log('Move Array', this.id, field, old_index, new_index);
		var val		= this.get(field);
		var length	= val.length;
		var opt		= val.splice(old_index, 1);

		val.splice(new_index, 0, opt[0]);
		this.set(field, val); //, {silent:true}

		this.trigger('change:' + field);
	},
	add_track_and_save: function(given_data) {
		var track = app.collection.get(given_data.id);

		var track_obj = {
			id			: track.id,
			vel			: track.get('data.default_vel'),
			accel		: track.get('data.default_accel'),
			thvmax	: track.get('data.default_thvmax'),
			firstR	: track.get('data.firstR'),
			lastR		: track.get('data.lastR')
		};
		this.add('data.tracks', track_obj);

		var sorted_tracks = [];
		_.each(this.get('data.tracks'), function(obj,index) {
			sorted_tracks.push(index);
		});
		this.set("data.sorted_tracks", sorted_tracks);
		this.save();
		app.log('add_track_and_save given_data', given_data)
    if(given_data.show_playlist) app.trigger('session:active', { primary:'media', secondary: 'playlist', playlist_id: this.id, goBack:'playlist' });
	},
	remove_track_and_save: function(track_id) {
		var track = app.collection.get(track_id);
		var tracks = this.get('data.tracks');
		var new_tracks		= [];
		var sorted_tracks	= [];
		_.each(tracks, function(track_obj, index) {
			if (track_obj.id !== track_id) new_tracks.push(track_obj);
		});

		_.each(new_tracks, function(obj, index) {
			sorted_tracks.push(index);
		});

		this.set('data.tracks', new_tracks)
			.set('data.sorted_tracks', sorted_tracks)
			.save();

		this.trigger('remove:data.tracks');
	},
	/************************ Track Preview **************************/
	order_temp_tracks: function(data) {
		app.log("Order Temp Tracks", data);

		// get from edit or data?
		var tracks = JSON.parse(JSON.stringify(this.get(data.pos)));
		if (tracks.length < 1) return false;

		var sorted_list = [];
		for (var i=0; i<tracks.length; i++) {
			sorted_list.push(i);
		}
		var start_rho	= 0; // homed

		// reset all tracks
		_.each(tracks, function(obj) {
			var track_model = app.collection.get(obj.id);
			obj.firstR = track_model.get('data.firstR');
			obj.lastR = track_model.get('data.lastR');
			obj.reversible = track_model.get('data.is_reversible');
			obj.reversed = "false";
			obj.firstBreak = "false";
			obj.lastBreak = "false";
		});

		// reverse first track?
		var track0 = tracks[sorted_list[0]];
		if (track0.firstR != start_rho) {
			if (track0.reversible == 'true') {
				var tempR = track0.lastR;
				track0.lastR = track0.firstR;
				track0.firstR = tempR;
				track0.reversed = "true";
			} else {
				app.log("Unable to start at zero");
				track0.firstBreak = "true";
			}
		}

		for(var i=0; i<sorted_list.length-1; i++) {
			var track0 = tracks[sorted_list[i]];
			var track1 = tracks[sorted_list[i+1]];

			if (track0.lastR != track1.firstR) {
				// app.log("Fix transition between", track0._index, track0.lastR, track1._index, track1.firstR, track1.lastR, track1.reversible);
				if (track1.reversible == 'true') { // reversible
					var tempR = track1.lastR;
					track1.lastR = track1.firstR;
					track1.firstR = tempR;
					track1.reversed = "true";
				} else {
					app.log("Unable to transition between", track0._index, track0.lastR, track1._index, track1.firstR);
					track0.lastBreak = "true";
					track1.firstBreak = "true";
				}
			}
			// app.log(track0._index, "Vs", track0.lastR, track1.firstR);
		}

		// check for break on loop
		var track0 = tracks[sorted_list[sorted_list.length-1]];
		var track1 = tracks[sorted_list[0]];
		if (track0.lastR != track1.firstR) {
			app.log("Unable to loop cleanly");
			track0.lastBreak = "true";
		}

		this.set('temp_tracks', tracks);
		app.log("Tracks:", sorted_list, tracks);
	},
	/************************ Webcenter ******************************/
	download_wc: function() {
		app.log("Download Webcenter Playlist", this.id);
		var self = this;
		var community = app.session.get_model('community_id');
    community.clear_selected(); // clear other selected tracks

		var sisbot = app.manager.get_model('sisbot_id');
		var sisbot_track_ids = sisbot.get('data.track_ids');

		// add tracks not already on table to 'selected_tracks'
		var track_ids =  _.uniq(_.pluck(this.get('data.tracks'), 'id'));
		_.each(track_ids, function(id) {
			if (sisbot_track_ids.indexOf(id) < 0) community.add_nx('selected_tracks', id);
		});

		// TODO: call community.download_wc
		if (community.get('selected_tracks').length > 0) {
			// save playlist to table
			community.set('selected_playlist', this.id);

			app.log("Download tracks to table", community.get('selected_tracks'));
			community.download_wc();
		} else if (sisbot.get('data.playlist_ids').indexOf(this.id) < 0) {
			this.set('is_downloaded', 'true');

      // make copy of this playlist to save
      var new_obj = JSON.parse(JSON.stringify(this.get('data')));
      new_obj.id = app.plugins.uuid(); // force new UUID
      var new_playlist = app.collection.add(new_obj);

			app.log("All tracks downloaded, just save playlist");
      app.trigger('sisbot:playlist_add', new_playlist);
		}
	}
};
