app.model.siscloud_manager = {
	defaults: function (data) {
		var obj = {
			id			    		: data.id,
			type		    		: 'siscloud_manager',

            playlists       : '0',
            tracks          : '0',
            users           : '0',
            sisbots         : '0',

			loaded: {
				playlists	: 'false',
				tracks		: 'false',
				users		: 'false',
				sisbots		: 'false'
			},

			fetched_forms	: 'false',

			data		: {
				id					: data.id,
				type    			: 'siscloud_manager',
				version				: this.current_version,
			}
		};

		return obj;
	},
	current_version: 1,
    on_init: function () {
        this.get_counts();
		this.get_forms();
    },
	/**************************** GET OBJECT COUNTS ***************************/
    get_counts: function () {
        var self = this;

		app.post.fetch({
			_type	: 'POST',
			endpoint: 'count',
			type: 'user'
        }, function(obj) {
            self.set('users', obj.resp);
		});
        app.post.fetch({
			_type	: 'POST',
			endpoint: 'count',
			type: 'playlist'
        }, function(obj) {
            self.set('playlists', obj.resp);
		});
        app.post.fetch({
			_type	: 'POST',
			endpoint: 'count',
			type: 'track'
        }, function(obj) {
            self.set('tracks', obj.resp);
		});
        app.post.fetch({
			_type	: 'POST',
			endpoint: 'count',
			type: 'sisbot'
        }, function(obj) {
            self.set('sisbots', obj.resp);
		});

        return this;
    },
    /**************************** GET OBJECTS *********************************/
    get_playlists: function () {
		var self = this;

        app.post.fetch({
			_type	: 'POST',
			endpoint: 'cluster',
			type: 'playlist'
        }, function(obj) {
            app.collection.add(obj.resp);
			self.set('loaded.playlists', 'true');
		});
    },
    get_tracks: function () {
		var self = this;
        app.post.fetch({
			_type	: 'POST',
			endpoint: 'cluster',
			type: 'track'
        }, function(obj) {
            app.collection.add(obj.resp);
			self.set('loaded.tracks', 'true');
		});
    },
    get_users: function () {
		var self = this;
        app.post.fetch({
			_type	: 'POST',
			endpoint: 'cluster',
			type: 'user'
        }, function(obj) {
            app.collection.add(obj.resp);
			self.set('loaded.users', 'true');
		});
    },
    get_sisbots: function () {
		var self = this;
        app.post.fetch({
			_type	: 'POST',
			endpoint: 'cluster',
			type: 'sisbot'
        }, function(obj) {
            app.collection.add(obj.resp);
			self.set('loaded.sisbots', 'true');
		});
    },
	get_forms: function () {
		if (this.get('fetched_forms') == 'true')
			return this;

		var self = this;
		var cbs = 3;
		function end_cbs() {
			if (--cbs == 0)
				self.set('fetched_forms', 'true');
		}

        app.post.fetch({
			_type	: 'POST',
			endpoint: 'cluster',
			type: 'form'
        }, function(obj) {
            app.collection.add(obj.resp);
			end_cbs();
		});
		app.post.fetch({
			_type	: 'POST',
			endpoint: 'cluster',
			type: 'section'
        }, function(obj) {
            app.collection.add(obj.resp);
			end_cbs();
		});
		app.post.fetch({
			_type	: 'POST',
			endpoint: 'cluster',
			type: 'question'
        }, function(obj) {
            app.collection.add(obj.resp);
			end_cbs();
		});
    }
};
