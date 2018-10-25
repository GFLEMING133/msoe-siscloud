app.model.modal = {
	defaults: function (data) {
        var obj = {
            id		    : data.id,
            type        : 'modal',
            is_hidden   : 'true',
			template	: 'modal-playlist-add-tmp',
            data    : {
                id		    : data.id,
                type        : 'modal'
            }
        };

        return obj;
    },
    on_init: function () {
        this.listenTo(app, 'modal:open', this.open);
        this.listenTo(app, 'modal:close', this.close);
    },
    open: function (data) {
		this.set(data)
			.set('is_hidden', 'false')
			.trigger('change:is_hidden');
    },
	add_to_playlist: function (playlist_id) {
		var trackList = app.collection.get(playlist_id);
		var trackID = this.get('track_id');
		debugger;
		var arrayOfTrackModels = trackList.collection.models.filter(track => (track.attributes.id === trackID));
		//if statement is to varify that there are other tracks with the same id in the array.
		if(arrayOfTrackModels.length > 0 ){
			app.plugins.n.notification.confirm('Track already in playlist, Are you sure you want to add?', 
			function(resp_num) {
				if (resp_num == 1){
				app.collection.get(playlist_id).add_track_and_save(trackID);
				}
			});
		}else{
		app.collection.get(playlist_id).add_track_and_save(trackID);
		}
		this.set('track_id', 'false')
			.set('is_hidden', 'true');
	},
	add_to_favorites: function () {
		debugger;
		app.plugins.n.notification.confirm('Are you sure you want to add',this.get('track_id'));
		debugger;
		this.get_model('track_id').favorite_toggle();
		this.set('track_id', 'false')
			.set('is_hidden', 'true');
	},
	new_playlist: function () {
		app.manager.playlist_create({ track_id: this.get('track_id') });
		this.set('track_id', 'false')
			.set('is_hidden', 'true');
	},
	delete_playlist: function (playlist_id) {
		var playList = app.collection.get(playlist_id);
		app.plugins.n.notification.confirm('Are you sure you want to Delete?',
		function(resp_num) {
			if (resp_num == 2){
				debugger;
				var pid = this.get('playlist_id')
				
				var sis = app.manager.get_model('sisbot_id');	
				// var p = sis.collection.get(playlist_id).attributes.playlist_id;
				var pl = sis.collection.get(pid);
				pl.delete();
			}
			
		});
		this.set('playlist_id', 'false')
					.set('is_hidden', 'true');
	},
    close: function () {
        this.set('is_hidden', 'true');
    },
};