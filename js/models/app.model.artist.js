app.model.artist = {
    defaults: function (data) {
		var obj = {
			id			: data.id, // this is a uuid the same as line 7
			type		: 'artist',
			data		: {
				id					: data.id, //this is the uuid
				type    			: 'artist',
				version				: this.current_version,

        user_id       : 0, // the database primary key
        username      : 'false'
			}
		};

		return obj;
	},
	current_version: 1,
  export_data: function () {
    // do nothing
    return this;
  },
  save: function () {
    // do nothing
    return this;
  },
	/************************ Webcenter ******************************/
	download_wc: function() {
		app.log("Download Webcenter Artist Tracks", this.id);
		var self = this;
		var community = app.session.get_model('community_id');

    var track_cluster = app.collection.get_cluster({type:'track',is_community:'true',is_downloaded:'false',user_id:this.id});

		// add tracks not already on table to 'selected_tracks'
		track_cluster.each(function(track) {
			community.add_nx('selected_tracks', track.id);
		});

		// TODO: call community.download_wc
		if (community.get('selected_tracks').length > 0) {
			// save playlist to table
			community.set('selected_playlist', this.id);

			app.log("Download tracks to table", community.get('selected_tracks'));
			community.download_wc();
		} else {
			app.log("All tracks downloaded, just save playlist");
		}
	}
};
