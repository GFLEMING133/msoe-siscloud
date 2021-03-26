app.model.modal = {
  defaults: function(data) {
    var obj = {
      id: data.id,
      type: 'modal',
      is_hidden: 'true',
			allow_close: 'true',
      template: 'modal-playlist-add-tmp',

      data: {
        id: data.id,
        type: 'modal'
      }
    };

    return obj;
  },
  on_init: function() {
    this.listenTo(app, 'modal:open', this.open);
    this.listenTo(app, 'modal:close', this.close);
  },
  open: function(data) {
    app.log('data',data);
    var template = this.get('template');

    if (template != data.template) {
      this.set('template', data.template);
    }

    if (data.track_id) {
      this.set('track_id', data.track_id);
    } else {
      this.set('track_id', 'false');
    }

    if (data.track_index) {
      this.set('track_index', data.track_index);
    } else {
      this.set('track_index', 'false');
    }

    if (data.playlist_id) {
      this.set('playlist_id', data.playlist_id);
    } else {
      this.set('playlist_id', 'false');
    }

		if (data.no_dismiss) { // show close (X) button?
			this.set('allow_close', 'false');
		} else {
			this.set('allow_close', 'true');
		}

    this.set('is_hidden', 'false');
  },
  close: function() {
    this.set('is_hidden', 'true');
  },
  more_from_artist: function( route_msg ) {
    if (!app.plugins.is_uuid(route_msg.artist_id)) {
      var artists = app.collection.get_cluster({'type':'artist', 'user_id': route_msg.artist_id});
      if (artists.size() > 0 ) route_msg.artist_id = artists.first().id; // gets id from first in collection
    }

    app.trigger('session:active', route_msg );
    this.set('is_hidden', 'true');
  },
	/******************* PLAYLIST FUNCTIONS *************************/
  add_to_playlist: function(playlist_id) {
    app.log( 'add_to_playlist function in modal.js');
    var trackList = app.collection.get(playlist_id);
    var trackID = this.get('track_id');
    var track = app.collection.get(trackID)
    var arrayOfTrackModels = trackList.get('data.tracks').filter(track => (track.id == trackID));
    var nameLink = trackList.get('data.name');
    var text = track.get('data.name') + ' is already in ' + nameLink + ' Are you sure you want to add?';
    //if statement is to verify that there are other tracks with the same id in the array. if{resp_num = 1} Always return self and else{function shit}
    if (arrayOfTrackModels.length > 0) {
      app.plugins.n.notification.confirm(text,
        function(resp_num) {
          if (resp_num == 1) {
            return;
          }
          app.collection.get(playlist_id).add_track_and_save({ 'id':trackID, 'show_playlist':'true' } );

        }, 'Add Track?', ['Cancel', 'OK']);
    } else {
      app.collection.get(playlist_id).add_track_and_save({ 'id':trackID, 'show_playlist':'true' });
    }
    this.set('track_id', 'false')
      .set('is_hidden', 'true');
  },
  add_to_favorites: function() {
    app.plugins.n.notification.confirm('Are you sure you want to add', this.get('track_id'));
    this.get_model('track_id').favorite_toggle();
    this.set('track_id', 'false')
      .set('is_hidden', 'true');
  },
  new_playlist: function() {
    app.manager.playlist_create({
      track_id: this.get('track_id')
    });
    this.set('track_id', 'false')
      .set('is_hidden', 'true');
  },
  delete_playlist: function() {
    var self = this;
    var text = 'Are you sure you want to Delete';
    app.plugins.n.notification.confirm(text,
      function(resp_num) {
        if (resp_num == 1) {
          self.set('playlist_id', 'false').set('is_hidden', 'true'); // hide self
          return;
        }
        self.get('playlist_id');
        self.get_model('playlist_id').delete();
        self.set('playlist_id', 'false')
          .set('is_hidden', 'true');
      }, 'Delete Playlist?', ['Cancel', 'Ok']);
  },
};
