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
		app.collection.get(playlist_id).add_track_and_save(this.get('track_id'));
		this.set('track_id', 'false')
			.set('is_hidden', 'true');
	},
	add_to_favorites: function () {
		this.get_model('track_id').favorite_toggle();
		this.set('track_id', 'false')
			.set('is_hidden', 'true');
	},
	new_playlist: function () {
		app.manager.playlist_create({ track_id: this.get('track_id') });
		this.set('track_id', 'false')
			.set('is_hidden', 'true');
	},
	delete_playlist: function () {
		app.collection.get(this.get('playlist_id')).delete();
		this.set('playlist_id', 'false')
			.set('is_hidden', 'true');
	},
    close: function () {
        this.set('is_hidden', 'true');
    },
};
