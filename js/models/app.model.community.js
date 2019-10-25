app.model.community = {
  defaults: function(data) {
    var obj = {
      id: data.id,
      type: 'community',

      fetching_community_playlists: 'false',
      fetching_community_tracks: 'false',
      fetched_community_playlists: 'false',
      fetched_community_tracks: 'false',

      community_page: 'tracks',
      community_playlist_ids: [],
      community_track_ids: [],

      track_sort: 'newest designs',
      sorting: 'false',
      download_cloud: 'false',
      selected_tracks: [],
      downloaded_tracks: [],

      offset: 0,
      limit: 30,
      limit_step: 30,
      fetching_more: 'false',

      data: {
        id: data.id,
        type: 'community',
        version: this.current_version,

        created_by_id: 'false',
        email: 'false', //community
        created_by_name: 'false', //community
        is_public: 'false', //community
      }
    };

    return obj;
  },
  scroll_timeout: 200, // so we aren't constantly checking while scrolling
  scrolling: false, // in conjunction with scroll_timout, are we waiting for a timeout to finish?
  current_version: 1,
  on_init: function() {
    console.log("on_init() in app.model.community", this.id);

    //   this.listenTo(app, 'manager:download_playlist', this.download_playlist);
    this.listenTo(app, 'community:downloaded_track', this.downloaded_track);
    this.listenTo(app, 'community:select_track', this.selectTrack);
    this.listenTo(app, 'community:deselect_track', this.deselectTrack);

    this.on('change:offset', this.scrollTop);

    return this;
  },
  save: function() {
    // do nothing
    return this;
  },
  reset_params: function() {
    console.log("Community: Reset limit", this.defaults({id: this.id}).limit);
    this.set('limit', this.defaults({id: this.id}).limit);
  },
  scroll_top: function() {
    $('.body-header').scrollTop(0);
  },
  scroll_check: function(data) {
    if (!this.scrolling) {
      var self = this;
      setTimeout(function() {
        if ($('.'+data).scrollTop() >= $('.'+data).prop('scrollHeight') - $('.'+data).outerHeight(true) - 60) {
          var limit = +self.get('limit');
          var limit_step = +self.get('limit_step');
          if (_.size(self.get('community_track_ids')) > limit) {
            console.log("Load More...", data, limit+limit_step);
            self.set('limit', limit+limit_step);
          }
        }
        self.scrolling = false;
      }, self.scroll_timeout);

      self.scrolling = true;
    }
  },
  /**************************** COMMUNITY ***********************************/
  sign_out_community: function() {
		console.log('in the sign_out_community');
		app.session.set('auth_token', '')
			.set( 'remember_me', 'false')
      .set( 'signing_in', 'false')
      .set('signed_in', 'false');
		app.trigger('session:active', {  'primary': 'community', 'secondary': 'sign_in' });
	},
  fetch_community_tracks: function() {
    if (this.get('fetched_community_tracks') == 'true') return this;

    var self = this;
    this.set('fetching_community_tracks', 'true');

    var tracks = {
      _url: app.config.get_webcenter_url(),
      _type: 'GET',
      endpoint: 'tracks.json',
      data: {}
    };

    function cb(obj) {
      // console.log("Community Tracks:", obj.resp);
      if (obj.err) return self;
      app.manager.intake_data(obj.resp); // obj.resp.data

      var resp_track_ids = _.pluck(obj.resp, 'id'); // obj.resp.data
      var sisbot_track_ids = app.manager.get_model('sisbot_id').get('data.track_ids');
      var new_track_ids = _.difference(resp_track_ids, sisbot_track_ids);

      self.set('community_track_ids', new_track_ids);
      self.set('sorting', 'false');
      self.set('fetched_community_tracks', 'true');
      self.set('fetching_community_tracks', 'false');
    }

    app.post.fetch2(tracks, cb, 0);

    return this;
  },
  sort_function: function(sort_params) {
    var self = this;

    this.set('sorting', 'true')
      .set('track_sort', sort_params)
      .set('fetching_community_tracks', 'true');

    var tracks = {
      _url: app.config.get_webcenter_url(),
      _type: 'GET',
      endpoint: 'tracks.json?sort='+sort_params,
      data: {}
    };
    console.log("Sort community tracks", tracks);

    function cb(obj) {
      if (obj.err) return self;

      app.collection.add(obj.resp);

      var resp_track_ids = _.pluck(obj.resp, 'id');
      var sisbot_track_ids = app.manager.get_model('sisbot_id').get('data.track_ids');
      var new_track_ids = _.difference(resp_track_ids, sisbot_track_ids);

      self.openSort();
      self.set('community_track_ids', new_track_ids);
      self.set('offset', 0);
      self.set('fetched_community_tracks', 'true');
      // console.log('new_track_ids', obj.resp);
      self.set('fetching_community_tracks', 'false');
      self.set('sorting', 'false');
    }

    this.fetch_community_tracks();
    app.post.fetch2(tracks, cb, 0);

    return this;
  },
  //Actions drop down menu
  openSort: function() {
    var drop = document.getElementsByClassName("sortBy-container-contents");
    var dAction = document.getElementsByClassName("sortBy-drop-actions");
    if (!drop[0].style.visibility || drop[0].style.visibility === 'hidden') {
      drop[0].style.visibility = 'visible';
      drop[0].style.opacity = '1';

    } else {
      drop[0].style.transition = "visibility 1s ease, opacity 1s ease";
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

    if (this.get('selected_tracks') < 1) this.set('download_cloud', 'false');
  },
  download_wc: function() {
    app.trigger('modal:open', {
      'template': 'modal-overlay-downloading-tmp'
    });
    var track_list = _.unique(this.get('selected_tracks'));
    var numberOfTracks = track_list.length;

    if (numberOfTracks > 0) {
      this.set('download_cloud', 'false');
      var track_model = app.collection.get(track_list[numberOfTracks - 1]);
      if(track_model) track_model.download_wc(true);
    }
  },
  downloaded_track: function(track_id) {
    this.remove('selected_tracks', track_id, {silent:true}); //removes id from checked array
    this.remove('community_track_ids', track_id, {silent:true}); // this removes id from displayed track array (list)

    var track_list = _.unique(this.get('selected_tracks'));
    var numberOfTracks = track_list.length;
    this.add('downloaded_tracks', track_id);
    if (numberOfTracks > 0) {
      this.download_wc();
    } else {
      this.trigger('remove:community_track_ids'); // trigger once at end

      app.trigger('modal:open', {
        'template': 'modal-list-playlist-add-tmp'
      });
    }
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
      app.trigger('modal:close');
    }
  },
};
