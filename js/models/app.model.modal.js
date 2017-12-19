app.model.modal = {
	defaults: function (data) {
        var obj = {
            id		    : data.id,
            type        : 'modal',
            is_hidden   : 'true',
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
    open: function (track_id) {
		this.set('track_id', track_id)
			.set('is_hidden', 'false')
			.trigger('change:is_hidden');
    },
	add_to_playlist: function (playlist_id) {
		console.log('palylist', playlist_id);
		app.collection.get(playlist_id).add_track_and_save(this.get('track_id'));
		this.set('track_id', 'false')
			.set('is_hidden', 'true');
	},
	new_playlist: function () {
		app.manager.playlist_create({ track_id: this.get('track_id') });
		this.set('track_id', 'false')
			.set('is_hidden', 'true');
	},
    close: function () {
        this.set('is_hidden', 'true');
    },
};
