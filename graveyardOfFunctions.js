
//********************FROM THE app.model.sisyphus_manager.js***************** */  
        /****** COMMUNITY ******/
// check_publish: function () {
// 	if (this.get('data.is_published') == 'true')	this.publish()
// 	else 											this.unpublish();
// },
// publish: function () {
// 	this._save();
// 	this._publish_tracks();
// },
// unpublish: function () {
// 	this._save();
// },
// _save: function () {
// 	var playlist_data = this.get('data');

// 	playlist_data._url		= app.config.get_webcenter_url();
// 	playlist_data._type		= 'POST';
// 	playlist_data.endpoint	= 'set';

// 	app.post.fetch(playlist_data, function cb(obj) {
// 		if (obj.err) app.plugins.n.notification.alert('Error saving playlist to cloud');
// 	}, 0);
// },
// _publish_tracks: function () {
// 	_.each(this.get('data.tracks'), function(track_obj) {
// 		app.collection.get(track_obj.id).publish_upload();
// 	});
// },
// download: function () {
// 	var self				= this;
// 	var curr_track_ids		= app.manager.get_model('sisbot_id').get('data.track_ids');
// 	var track_ids			= _.pluck(this.get('data.tracks'), 'id');
// 	var tracks_to_download	= _.difference(track_ids, curr_track_ids);

// 	app.trigger('sisbot:playlist_add', this);
// 	app.trigger('manager:download_playlist', this.id);

// 	_.each(tracks_to_download, function (track_id) {
// 		var track_model = app.collection.add({ id: track_id, type: 'track' });
// 		track_model.fetch_then_download();
// 	});
// }
// fetch_community_playlists: function() {
//     if (this.get('fetched_community_playlists') == 'true')
//         return this;

//     var self = this;

//     this.set('fetching_community_playlists', 'true');


//     var playlists = {
//         _url: app.config.get_webcenter_url(),
//         _type: 'GET',
//         endpoint: 'tracks',
//         data: {}
//     };

//     function cb(obj) {
//         setTimeout(function() {
//             self.set('fetching_community_playlists', 'false');
//         }, 1000)

//         if (obj.err) return self;

//         app.collection.add(obj.resp);

//         var resp_playlist_ids = _.pluck(obj.resp, 'id');
//         var sisbot_playlist_ids = self.get_model('sisbot_id').get('data.playlist_ids');
//         var new_playlist_ids = _.difference(resp_playlist_ids, sisbot_playlist_ids);

//         self.set('community_playlist_ids', new_playlist_ids);
//         self.set('fetched_community_playlists', 'true');
//     }

//     app.post.fetch2(playlists, cb, 0);

//     return this;
// },
    // merge_playlists: function() { // unused at this point
//     var merged_playlists = [];

//     var sisbot = this.get_model('sisbot_id');
//     var sisbot_playlist_ids = (sisbot) ? sisbot.get('data.playlist_ids') : [];

//     var user = this.get_model('user_id');
//     var user_playlist_ids = (user) ? user.get('data.playlist_ids') : [];

//     var only_sisbot = _.difference(sisbot_playlist_ids, user_playlist_ids);
//     var only_user = _.difference(user_playlist_ids, sisbot_playlist_ids);
//     var in_common = _.intersection(sisbot_playlist_ids, user_playlist_ids);

//     _.each(only_sisbot, function(p_id) {
//         merged_playlists.push({ id: p_id, status: 'sisbot' });
//     });
//     _.each(only_user, function(p_id) {
//         merged_playlists.push({ id: p_id, status: 'user' });
//     });
//     _.each(in_common, function(p_id) {
//         merged_playlists.push({ id: p_id, status: 'both' });
//     });

//     this.set('merged_playlists', merged_playlists);
// },

// playlist_add: function () {
// 	this.get_not_playlists();
// 	this.set('is_adding', 'true');
// },
// playlist_add_finish: function (playlist_id) {
// 	var playlist = app.collection.get(playlist_id);
// 	playlist.add_nx('data.tracks', this.playlist_obj());
// 	playlist.add_nx('data.sorted_tracks', playlist.get('data.tracks').length-1); // add last index of tracks
// 	this.remove('playlist_not_ids', playlist_id);
// 	this.add('playlist_ids', playlist_id);

// 	playlist.save();

// 	this.playlist_cancel();
// },



// save_new_tracks: function() {
//     var data = [{
//         id: '_Test_1_01',
//         type: 'track',
//         name: 'Test 1 01',
//         is_published: 'true',
//         created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
//     }, {
//         id: '_Test_2_00',
//         type: 'track',
//         name: 'Test 2 00',
//         is_published: 'true',
//         created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
//     }, {
//         id: '_Test_3_11',
//         type: 'track',
//         name: 'Test 3 11',
//         is_published: 'true',
//         created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
//     }, {
//         id: '_Test_4_10',
//         type: 'track',
//         name: 'Test 4 10',
//         is_published: 'true',
//         created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
//     }, {
//         id: '_Test_5_11',
//         type: 'track',
//         name: 'Test 5 11',
//         is_published: 'true',
//         created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
//     }, {
//         id: '_Test_6_10',
//         type: 'track',
//         name: 'Test 6 10',
//         is_published: 'true',
//         created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
//     }, {
//         id: '_Test_7_10',
//         type: 'track',
//         name: 'Test 7 10',
//         is_published: 'true',
//         created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
//     }, {
//         id: '_Test_8_00',
//         type: 'track',
//         name: 'Test 8 00',
//         is_published: 'true',
//         created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
//     }, {
//         id: '_Test_9_00',
//         type: 'track',
//         name: 'Test 9 00',
//         is_published: 'true',
//         created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
//     }, {
//         id: '_Test_10_01',
//         type: 'track',
//         name: 'Test 10 01',
//         is_published: 'true',
//         created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
//     }];

//     function save_track() {
//         if (data.length == 0)
//             return this;

//         var track = data.shift();

//         track._url = app.config.get_webcenter_url();
//         track._type = 'POST';
//         track.endpoint = 'set';

//         function cb(obj) {
//             save_track();
//         }

//         app.post.fetch(track, cb, 0);
//     }

//     save_track();
// }
// publish_upload: function() {
// 	var self = this;

// 	app.manager.get_model('sisbot_id').track_get_verts(this, function(verts) {
// 		self.set('data.verts', verts);
// 		self.set('data.is_published', 'true');
// 		self.upload_track_to_cloud();
// 	});
// 	return this;
// },
// publish: function () {
// 	this.set('data.is_published', 'true').save();
// },
// unpublish: function () {
// 	this.set('data.is_published', 'false').save();
//


//******From ping_sisbot() in the app.post.fetch({}) */
         // do nothing
            //   } else if (retries > 10) {
            //     if (hostname == self._ble_ip) {
            //       self.set('sisbot_registration', 'hotspot');
            //     }
            //     // do nothing
            //   } else {
            //     setTimeout(function() {
            //       self.ping_sisbot(hostname, cb, ++retries)
            //     }, 100);
            //     return this;
            //   }
            
/****************From app.model.sisbots **********************/
        // _fetching_cloud: false,
// _fetch_cloud: function () {
// 	console.log("_fetch_cloud()");
// 	if (this._fetching_cloud) 	return this;
//
// 	var self = this;
// 	this._fetching_cloud = true;
//
// 	var current_ip	= this.get('data.local_ip');
//
// 	app.post.fetch(exists = {
// 		_url	: app.config.get_api_url(),
// 		_type	: 'GET',
// 		_timeout: 1250,
// 		endpoint: 'sisbot_state/' + this.id,
// 	}, function exists_cb(obj) {
// 		self._fetching_cloud = false;
// 		// debugger;
// 		// console.log("_fetch_cloud() returned " + JSON.stringify(obj));
// 		if (obj.resp && obj.resp.local_ip) {
// 			// we are internet connected!
// 			var ip_address = obj.resp.local_ip;
// 			self.set('data.local_ip', ip_address);
// 		}
// 	}, 0);
// },
// _fetching_bluetooth: false,
// _fetch_bluetooth: function () {
// 	console.log("_fetch_bluetooth()");
// 	if (!app.is_app)				return this;
// 	if (this._fetching_bluetooth) 	return this;
//
// 	var self = this;
// 	this._fetching_bluetooth = true;
//
// 	var current_ip	= this.get('data.local_ip');
// 	var sub_id		= this.id.substr(this.id.length - 7);
//
// 	if (this.is_legacy()) sub_id = 'sisyphus';
//
// 	app.manager.start_ble_scan(sub_id, function (ip_address) {
// 		self._fetching_bluetooth = false;
//
// 		if (!ip_address) {
// 			// no ip address. must be doing network stuff
// 		} else if (current_ip == ip_address && ip_address == '192.168.42.1') {
// 			// sisyphus is in hotspot mode and we failed to connect to it
// 			self.set('data.reason_unavailable', 'connect_to_wifi');
// 		} else if (current_ip !== ip_address) {
// 			// we successfully connected to wifi!
// 			self.set('data.local_ip', ip_address);
// 		}
// 	});
// },
// _fetch_network: function () {
// 	console.log("_fetch_network()");
// 	if (!app.is_app) return this;
//
// 	var self = this;
//
// 	app.manager.get_network_ip_address(function(ip_address) {
// 		if (!ip_address)	return self;
//
// 		var ip_add	= ip_address.split('.');
// 		ip_add.pop();
//
// 		var ip_base = ip_add.join('.');
// 		var count = 0;
//
// 		_.each(_.range(0, 256), function(num) {
// 			self._ping_sisbot(ip_base + '.' + num);
// 		});
// 	});
//
// 	return this;
// },
// _ping_sisbot: function(hostname) {   // trying to find what sisbots are available.
// 	console.log("_ping_sisbot()", hostname);
// 	var self = this;
//
// 	app.post.fetch(exists = {
// 		_url	: 'http://' + hostname + '/',
// 		_type	: 'POST',
// 		_timeout: 1250,
// 		endpoint: 'sisbot/exists',
// 		data	: {}
// 	}, function exists_cb(obj) {
// 		if (!obj.resp || !obj.resp.hostname)
// 			return self;
//
// 		if (obj.resp.id == self.id) {
// 			app.manager.intake_data(obj.resp);
// 		}
// 	}, 0);
//
// 	return this;
// },

//**********FROM app.model.sessions********************************** */
// sign_up_via_settings: function() {
//    
//     this.on(this.after_settings);
//     this.sign_up();
// },
// sign_in_via_settings: function() {
//    
//     this.on('change:user_id', this.after_settings);
//     this.sign_in();
// },
// after_settings: function() {
//    
//     this.off('change:user_id');
//     app.trigger('session:active', { primary: 'community' });
// },
// sign_in_via_session: function(data) {
//    
//     this.set('registration', data);
//     this.sign_in();
//     return this;
// },
// sign_out: function() {
//     this.set('sisbot_id', 'false')
//         .set('is_sisbot_available', 'false')
//         .set('user_id', 'false');
//     app.current_session().sign_out();
// },