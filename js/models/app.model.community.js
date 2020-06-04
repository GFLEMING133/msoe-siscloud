app.model.community = {
  defaults: function(data) {
    var obj = {
      id: data.id,
      type: 'community',

      fetching_community_playlists  : 'false',
      fetching_community_tracks     : 'false',
      fetching_community_artists    : 'false',
      fetched_community_playlists   : 'false', // all community playlists
      fetched_featured_playlists    : 'false', // featured community playlists
      fetched_community_tracks      : 'false',
      fetched_community_artists     : 'false',
      fetching_playlist             : 'false',
			fetched_playlist              : 'false',

      community_page                : 'tracks',
      community_playlist_ids        : [],
      community_playlist_track_ids  : [],
      community_track_ids           : [],
      community_artist_ids          : [],

      track_sort        : 'most_popular', //newest designs , name, artist, (default) most popular
      track_sort_key    : 'data.download_count',
      track_sort_keys   : {
        most_popular      : 'data.download_count',
        newest_designs    : 'data.created_at',
        oldest_designs    : 'data.created_at',
        name              : 'data.name',
        artist            : 'data.created_by_name',
        hot               : 'data.popularity'
      },
      track_order_key    : 'dsc',
      track_order_keys  : {
        most_popular      : 'dsc',
        hot               : 'dsc',
        newest_designs    : 'dsc',
        oldest_designs    : 'asc',
        name              : 'asc',
        artist            : 'asc',
      },
      show_all          : 'false',
      sorting           : 'false',
      download_cloud    : 'false',
      selected_tracks   : [],
      downloaded_tracks : [],
      download_count    : 0,
      selected_playlist : 'false', // for saving whole playlist

      offset        : 0, // TODO: remove?
      limit         : 30, // TODO: remove?
      limit_step    : 30, // TODO: remove?
      fetching_more : 'false', // TODO: remove?

      hamburger     : 'false',

      data: {
        id      : data.id,
        type    : 'community',
        version : this.current_version,

        created_by_id   : 'false',
        email           : 'false', //community
        created_by_name : 'false', //community
        created_at      : 'false',
        is_public       : 'false', //community
      }
    };

    return obj;
  },
  scroll_timeout  : 200, // so we aren't constantly checking while scrolling
  scrolling       : false, // in conjunction with scroll_timout, are we waiting for a timeout to finish?
  current_version : 1,
  on_init: function() {
    app.log("on_init() in app.model.community", this.id);

    //   this.listenTo(app, 'manager:download_playlist', this.download_playlist);
    this.listenTo(app, 'community:downloaded_track', this.downloaded_track);
    this.listenTo(app, 'community:select_track', this.selectTrack);
    this.listenTo(app, 'community:deselect_track', this.deselectTrack);

    this.on('change:track_sort', this.update_sort_key);
    this.on('change:offset', this.scrollTop);

    return this;
  },
  save: function() {
    // do nothing
    return this;
  },
  reset_params: function() {
    app.log("Community: Reset limit", this.defaults({id: this.id}).limit);
    this.set('limit', this.defaults({id: this.id}).limit);
  },
  scroll_top: function() {
    $('.scroll').scrollTop(0);
  },
  scroll_check: function(data) {
    if (!this.scrolling) {
      var self = this;
      setTimeout(function() {
        if ($('.'+data).scrollTop() >= $('.'+data).prop('scrollHeight') - $('.'+data).outerHeight(true) - 60) {
          var limit = +self.get('limit');
          var limit_step = +self.get('limit_step');
          if (_.size(self.get('community_track_ids')) > limit) {
            app.log("Load More...", data, limit+limit_step);
            self.set('limit', limit+limit_step);
          }
        }
        self.scrolling = false;
      }, self.scroll_timeout);

      self.scrolling = true;
    }
  },
  update_sort_key: function(){
    this.set('track_sort_key',    this.get('track_sort_keys['+this.get('track_sort')+']'));
    this.set('track_order_key',    this.get('track_order_keys['+this.get('track_sort')+']'));
    app.log( 'TRACK SORT' ,       this.get('track_sort'));
    app.log( 'TRACK SORT KEYS' ,this.get('track_sort_keys'));
    app.log( 'TRACK SORT KEY' ,   this.get('track_sort_key'));
  },
  /**************************** COMMUNITY ***********************************/
  sign_out_community: function() {
    app.log('in the sign_out_community');
    // remove user model
    var user = app.session.get_model('user_id');

		app.session.set('auth_token', '')
      .set('remember_me', 'false')
      .set('signing_in', 'false')
      .set('signed_in', 'false')
      .set('user_id', 'false')
      .set('registration.username', '')
      .set('registration.email', '')
      .set('registration.password', '')
      .set('registration.password_confirmation', '');

    var artists = app.collection.get_cluster({type:'artist'});
    app.collection.remove(artists.pluck('id')); // removing artists
    var private_tracks = app.collection.get_cluster({type:'track',is_community:'true',is_downloaded:'false'});
    app.collection.remove(private_tracks.pluck('id')); // removing private tracks
    var private_playlists = app.collection.get_cluster({type:'playlist',is_community:'true',is_downloaded:'false'});
    app.collection.remove(private_playlists.pluck('id')); // removing private playlists

    // clear community values
    this.set('fetched_community_artists', 'false')
      .set('community_artist_ids', [])
      .set('fetched_community_playlists', 'false')
      .set('fetched_featured_playlists', 'false')
      .set('community_playlist_ids', [])
      .set('fetched_community_tracks', 'false')
      .set('community_track_ids', []);

		app.session.remove_session(); // clear the memory

    app.trigger('session:active', {  'primary': 'community', 'secondary': 'sign_in' });
    app.collection.remove(user.id);
  },
  fetch_community_playlists: function(given_data) {
    app.log('fetch_community_playlists function')
    if (this.get('fetching_community_playlists') == 'true') return this;

    var self = this;
    this.set('fetching_community_playlists', 'true');
    var playlists = {
      _url: app.config.get_webcenter_url(),
      _type: 'GET',
      endpoint: 'playlists.json',
      data: {}
    };

    if (given_data && given_data.is_featured == 'true') playlists.endpoint += '?is_featured=true';

    function cb(obj) {
      app.log("Community Playlists:", obj.resp);
      if (obj.err) return self;

      app.manager.intake_data(obj.resp); // obj.resp.data

      var new_playlist_ids = _.pluck(obj.resp, 'id'); // obj.resp.data
      var sisbot_playlist_ids = app.collection.get_cluster({type:'playlist', is_downloaded:'true'}).pluck('data.playlist_id');
      sisbot_playlist_ids = _.uniq(_.without(sisbot_playlist_ids, undefined));
      // var sisbot_playlist_ids = app.manager.get_model('sisbot_id').get('data.playlist_ids');

      _.each(new_playlist_ids, function(playlist_id) {
        var playlist = app.collection.get(playlist_id);
        playlist.set('is_community', 'true');
        app.log("Playlist_ids", sisbot_playlist_ids, playlist.get('data.playlist_id'));
        if (sisbot_playlist_ids.indexOf(playlist.get('data.playlist_id')) >= 0) playlist.set('is_downloaded', 'true');
        self.add_nx('community_playlist_ids', playlist_id); // add to array if not already there
      });

      if (given_data.is_featured == 'true') self.set('fetched_featured_playlists', 'true');
      else self.set('fetched_community_playlists', 'true');

      self.set('fetching_community_playlists', 'false');
    }

    app.log("Fetch playists:", playlists);
    app.post.fetch2(playlists, cb, 0);

    return this;
  },
  fetch_playlist: function(playlist_id) {
    app.log('fetch_playlists function', playlist_id);
    if (this.get('fetching_playlist') == 'true') return this;

    var self = this;
    this.set('fetching_playlist', 'true');

    var playlist = {
      _url: app.config.get_webcenter_url(),
      _type: 'GET',
      endpoint: 'playlists/'+playlist_id+'.json',
      data: {}
    };

    function cb(obj) {
      app.log("Playlist Resp:", obj);
      if (obj.err) return self;

      app.manager.intake_data(obj.resp); // obj.resp.data

      // loop through returned objects, and mark is_downloaded appropriately
      var resp_ids = _.pluck(obj.resp, 'id'); // obj.resp.data
      var sisbot_track_ids = app.manager.get_model('sisbot_id').get('data.track_ids');

      // get list of playlist_ids from playlists on table
      var sisbot_playlist_ids = app.collection.get_cluster({type:'playlist', is_downloaded:'true'}).pluck('data.playlist_id');
      sisbot_playlist_ids = _.uniq(_.without(sisbot_playlist_ids, undefined));

      _.each(resp_ids, function(obj_id) {
        var model = app.collection.get(obj_id);
        model.set('is_community', 'true');
        if (model.get('data.type') == 'track') {
          if (sisbot_track_ids.indexOf(model.id) >= 0) model.set('is_downloaded', 'true');
          self.add_nx('community_track_ids', model.id); // add to array if not already there
        } else if (model.get('data.type') == 'playlist') {
          app.log("Playlist_ids", sisbot_playlist_ids, model.get('data.playlist_id'));
          if (sisbot_playlist_ids.indexOf(model.get('data.playlist_id')) >= 0) model.set('is_downloaded', 'true');
          self.add_nx('community_playlist_ids', model.id); // add to array if not already there
        }
      });

      // self.set('community_playlist_track_ids', resp_playlist_ids);
      self.set('fetched_playlist', 'true');
      self.set('fetching_playlist', 'false');
    }

    app.post.fetch2(playlist, cb, 0);

    return this;
  },
  fetch_community_tracks: function() {
    if (this.get('fetched_community_tracks') == 'true' || this.get('fetching_community_tracks') == 'true') return this;

    var self = this;
    this.set('fetching_community_tracks', 'true');

    var tracks = {
      _url: app.config.get_webcenter_url(),
      _type: 'GET',
      endpoint: 'tracks.json?sort='+this.get('track_sort'), // specific user's tracks: user_id=1
      data: {}
    };

    function cb(obj) {
      app.log("Community Tracks:", _.size(obj.resp));

      if (obj.err) return self;
      app.manager.intake_data(obj.resp); // obj.resp.data

      var new_track_ids = _.pluck(obj.resp, 'id'); // obj.resp.data
      var sisbot_track_ids = app.manager.get_model('sisbot_id').get('data.track_ids');
      _.each(new_track_ids, function(track_id) {
        var track = app.collection.get(track_id);
        track.set('is_community', 'true');
        if (sisbot_track_ids.indexOf(track_id) >= 0) track.set('is_downloaded', 'true');
        self.add_nx('community_track_ids', track_id); // add to array if not already there
      });
      self.set('sorting', 'false');
      self.set('fetched_community_tracks', 'true');
      self.set('fetching_community_tracks', 'false');
    }

    app.post.fetch2(tracks, cb, 0);

    return this;
  },
  fetch_community_artists: function() {
    if (this.get('fetching_community_artists') == 'true') return this;

    var self = this;
    this.set('fetching_community_artists', 'true');

    var artists = {
      _url: app.config.get_webcenter_url(),
      _type: 'GET',
      endpoint: 'users.json',
      data: {}
    };

    function cb(obj) {
      app.log("Community Artists:", obj.resp);
      if (obj.err) return self;

      app.manager.intake_data(obj.resp); // obj.resp.data

      var resp_artist_ids = _.pluck(obj.resp, 'id'); // obj.resp.data

      self.set('community_artist_ids', resp_artist_ids);
      self.set('fetched_community_artists', 'true');
      self.set('fetching_community_artists', 'false');
    }

    app.post.fetch2(artists, cb, 0);

    return this;
  },
  fetch_artist_tracks: function(data) {
    if (!data.user_id) return this; // must pass in user_id
    if (this.get('fetching_community_tracks') == 'true') return this;
    var self = this;
    this.set('fetching_community_tracks', 'true');

    var tracks = {
      _url: app.config.get_webcenter_url(),
      _type: 'GET',
      endpoint: 'users/'+data.user_id+'/tracks.json?sort='+this.get('track_sort'), //fetch // specific user's tracks: user_id=1
      data: {}
    };

    function cb(obj) {
      app.log("Artist Tracks:", obj.resp);
      if (obj.err) return self;
      app.manager.intake_data(obj.resp); // obj.resp.data

      var resp_track_ids = _.pluck(obj.resp, 'id'); // obj.resp.data
      var sisbot_track_ids = app.manager.get_model('sisbot_id').get('data.track_ids');

      _.each(resp_track_ids, function(track_id) {
        var track = app.collection.get(track_id);
        track.set('is_community', 'true');
        if (sisbot_track_ids.indexOf(track_id) >= 0) track.set('is_downloaded', 'true');
        self.add_nx('community_track_ids', track_id); // add to array if not already there
      });
      self.set('sorting', 'false');
      // self.set('fetched_community_tracks', 'true');
      self.set('fetching_community_tracks', 'false');
      app.log('After Fetch', self.get('fetching_community_tracks'))
    }

    app.post.fetch2(tracks, cb, 0);

    return this;
  },
  sort_function: function(given_data) {
    var self = this;
    this.set('track_sort', given_data.track_sort);
    this.fetch_community_tracks();
    if(given_data.secondary) app.trigger('session:active',{secondary:given_data.secondary});

  },
  //Actions drop down menu
  openSort: function() {
    var drop = document.getElementsByClassName("sortBy-container-contents");
    var dAction = document.getElementsByClassName("sortBy-drop-actions");
    if (!drop[0].style.visibility || drop[0].style.visibility === 'hidden') {
      drop[0].style.visibility = 'visible';
      drop[0].style.opacity = '1';

    } else {
      drop[0].style.visibility = 'hidden';
      drop[0].style.opacity = '0';
    }
  },
  selectTrack: function(track) {
    this.set('download_cloud', 'true');
    this.add('selected_tracks', track.id);
  },
  deselectTrack: function(track) {
    this.remove('selected_tracks', track.id);

    if (this.get('selected_tracks').length < 1) this.set('download_cloud', 'false');
  },
  clear_selected: function() {
    var selected_tracks = this.get('selected_tracks');
    if (selected_tracks.length > 0) {
      _.each(selected_tracks, function(track_id) {
        var track = app.collection.get(track_id);
        track.set('track_checked', 'false');
      });
      this.set('selected_tracks', []);

      this.set('download_cloud', 'false');
    }

    this.set('downloaded_tracks', []); // clear downloaded
  },
  download_wc: function() {
    app.trigger('modal:open', {
      'template': 'modal-overlay-downloading-tmp'
    });
    var track_list = _.unique(this.get('selected_tracks'));
    var numberOfTracks = track_list.length;

    this.set('download_count', numberOfTracks);
    app.log("Number of Tracks left:", numberOfTracks);

    if (numberOfTracks > 0) {
      var track_model = app.collection.get(track_list[numberOfTracks - 1]);
      if (track_model) track_model.download_wc(true);
    }
  },
  downloaded_track: function(track_id) {
    this.remove('selected_tracks', track_id, {silent:true}); //removes id from checked array
    this.remove('community_track_ids', track_id, {silent:true}); // this removes id from displayed track array (list)
    var track_list = _.unique(this.get('selected_tracks'));
    var numberOfTracks = track_list.length;

    this.set('download_count', numberOfTracks);
    app.log("Number of Tracks left:", numberOfTracks);

    this.add('downloaded_tracks', track_id);
    if (numberOfTracks > 0) {
      this.download_wc();
    } else {
      this.trigger('remove:community_track_ids'); // trigger once at end

      this.set('download_cloud', 'false');

      var selected_playlist = this.get('selected_playlist');
      if (selected_playlist != 'false') {
        // save selected_playlist, don't show modal
        var sisbot = app.manager.get_model('sisbot_id');
        if (sisbot.get('data.playlist_ids').indexOf(selected_playlist) < 0) {
          // add_playlist
          app.log("Add Playlist", selected_playlist);
          var playlist = app.collection.get(selected_playlist);
          playlist.set('is_downloaded', 'true');

          // make copy with new UUID + reference to old UUID
          var new_obj = JSON.parse(JSON.stringify(playlist.get('data')));
          new_obj.id = app.plugins.uuid(); // force new UUID
          var new_playlist = app.collection.add(new_obj);
          app.log("New Playlist:", new_playlist.get('data'));

          this.set('downloaded_tracks', []); // clear downloaded

          app.trigger('sisbot:playlist_add', new_playlist);
        }

        this.set('selected_playlist', 'false'); // forget selected playlist
        app.trigger('modal:close');
      } else {
        app.trigger('modal:open', {
          'template': 'modal-list-playlist-add-tmp'
        });
      }
    }
  },
  openHamburger: function(x) {
    this.set('hamburger', 'true');
    app.log("X", x)
    x.classList.toggle("change");
  },
  new_playlist: function() {
    app.manager.playlist_create({
      track_ids: this.get('downloaded_tracks')
    });
    app.trigger('modal:close')
    this.set('downloaded_tracks', []);
  },
  add_to_playlist: function(playlist_id) {
    var playlist = app.collection.get(playlist_id);
    if (playlist) {
      playlist.setup_edit();
      var downloaded_tracks = this.get('downloaded_tracks');
      _.each(downloaded_tracks, function(track_id) {
        playlist.add_track(track_id);
      });

      playlist.save_edit();
      this.set('downloaded_tracks', []);
      this.set('data.is_downloaded', 'true');

      app.trigger('modal:close');
    }
  },
  remove_downloaded: function() {
    var self = this;
    var sisbot = app.manager.get_model('sisbot_id');
    var downloaded_tracks = this.get('downloaded_tracks');
    app.log("Remove Downloaded", downloaded_tracks.length);

    _.each(downloaded_tracks, function(i) {
      var track = app.collection.get(i);
      track.set('is_community', 'true');
      track.set('is_downloaded', 'false');

      // sisbot.remove('data.track_ids', i);
      sisbot._update_sisbot('remove_track', track, function (obj) {
				if (obj.err) {
          app.log("Error removing track", obj.err);
					// return app.plugins.n.notification.alert('There was an error removing the file from your Sisyphus. Please try again later.');
				} else if (obj.resp) {
					app.manager.intake_data(obj.resp);
				}
			});
      self.add('selected_tracks', i);
    });

    // sisbot.save_to_sisbot(sisbot.get('data'));

    this.set('fetched_community_tracks', 'false')
      .set('downloaded_tracks', [])
      .set('download_cloud', 'false');

    this.fetch_community_tracks();

    app.trigger('modal:close');
  }
};
