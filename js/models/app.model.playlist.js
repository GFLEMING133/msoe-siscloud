app.model.playlist = {
	defaults: function (data) {
		var obj = {
			id				: data.id,
			type			: 'playlist',

			eligible_tracks	: [],
			active_tracks		: [],
			edit		: {
				name				: '',
				description	: '',
			},
			add_playlist_tracks: {},
			data		: {
				id						: data.id,
				type    			: 'playlist',
				version				: this.current_version,

        name                : '',
        description         : '',
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
			}
		};

		return obj;
	},
	current_version: 1,
	on_init: function () {
		this.on('change:data.is_published', this.check_publish);
		return this;
	},
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
		if (this.get('data.is_published') == 'true')
			this.publish();
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
		this.remove_track(track_index);
		}
		this.trigger('change:add_playlist_tracks[' + track_id + ']');
	},
	add_tracks_done: function () {
		var self = this;
		
		if (self.get('data.is_saved') == true) app.trigger('session:active', { 'secondary': 'playlist-edit' });
		else app.trigger('session:active', { 'secondary': 'playlist-new' });
	},
	/**************************** GENERAL *************************************/
	play_from_current: function (track_index) {
		track_index = (app.plugins.falsy(track_index)) ? 0 : +track_index;

		var data				= JSON.parse(JSON.stringify(this.get('data')));
		data.active_track_index = track_index;
		data.active_track_id	= this.get('data.tracks')[track_index].id;
		data.is_current			= true;

		app.trigger('sisbot:update_playlist', data);
	},
	play: function (track_index) {
		track_index = (app.plugins.falsy(track_index)) ? 0 : +track_index;

		var data= JSON.parse(JSON.stringify(this.get('data')));
		data.active_track_index = track_index;
		data.active_track_id	= this.get('data.tracks')[track_index].id;

		// FORCE PLAYLIST TO BE NON-SHUFFLED WHILE ON NON-SHUFFLED PLAYLIST PAGE
		data.is_shuffle			= 'false';
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
		this.set('data.name', this.get('edit.name'));
		let self = this;
		let playlist_name = this.get('data.name');
		console.log(playlist_name);
			if(playlist_name == ""){
			 app.plugins.n.notification.confirm("You did not enter a Playlist Name, are you sure you want to save?",
			 function(resp_num) {
				 if(resp_num == 1){
					 return self;
				 }else{
					self.save_edit();
				 }
			}, 'No Name?', ['Cancel','OK']);
		} else {
			this.save_edit();
		}
	},
	save_edit: function () {
		let self = this;
		
		this.set('data.name', this.get('edit.name'))
			.set('data.description', this.get('edit.description'))
			.set('data.tracks', this.get('active_tracks').slice());
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
	},
	remove_track: function (track_index) {
		this.remove('active_tracks['+track_index+']');
	},
	move_array: function (field, old_index, new_index) {
		field = field.replace(/^(model|parents?\[[0-9]+\]?|parent|grandparent|g_grandparent|g_g_grandparent)\.?/i, '');
		// console.log('Move Array', this.id, field, old_index, new_index);
		var val		= this.get(field);
		var length	= val.length;
		var opt		= val.splice(old_index, 1);

		val.splice(new_index, 0, opt[0]);
		this.set(field, val, {silent:true});

		// this.trigger('change:' + field);
	},
	add_track_and_save: function(track_id) {
		console.log(track_id);
		var track = app.collection.get(track_id);
		console.log(track);
		var track_obj = {
			id		: track_id,
			vel		: track.get('data.default_vel'),
			accel	: track.get('data.default_accel'),
			thvmax	: track.get('data.default_thvmax'),
			firstR	: track.get('data.firstR'),
			lastR	: track.get('data.lastR')
		};
		this.add('data.tracks', track_obj);

		var sorted_tracks = [];
		_.each(this.get('data.tracks'), function(obj,index) {
		sorted_tracks.push(index);
		});
		this.set("data.sorted_tracks", sorted_tracks);

		this.save();
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
			.set("data.sorted_tracks", sorted_tracks)
			.save();
	},

};
