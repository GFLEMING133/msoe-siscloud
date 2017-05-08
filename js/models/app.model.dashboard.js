app.model.dashboard = {
	defaults: function (data) {
		var obj = {
			id					: data.id,
			type				: 'dashboard',
      page    		: 'overview',

			is_ready		: 'false',

			data	: {
				id				: data.id,
				name			: '',
				type    	: 'dashboard',
				deleted		: 'false',
				version   : this.current_version,

				user_id		: '5fcba931-fdb0-4f75-ba33-a4d76f4aa4a2', // set with current_session.user_id later
			}
		};

		return obj;
	},
	current_version: 1,
	on_init: function () {
		this.listenTo(app, 'app:dashboard_home', this.reset_page);
		this.listenTo(app, 'session:user_sign_in', this.on_setup);

		console.log("Init Dashboard", this.get('data'));
		// load the scouts that pertain to me
		var cluster = app.collection.get_cluster({ type: 'scout', user_ids: this.get('data.user_id'), deleted: 'false' });
		console.log("Dashboard cluster", cluster);
	},
	export_data: function () {
		// do nothing
		return this;
	},
	save: function () {
		// do nothing
		return this;
	},
  setup: function () {
		if (!app.device_id)
			app.device_id = 'B9F08DB2-83F4-4821-BD80-2AA475858876';

		var device_ids = {
			'B9F08DB2-83F4-4821-BD80-2AA475858876'		: 'kellysretirementhomes@withease.io',
			'8595A3EB-497B-47BD-BC87-3F9551466FB9'		: 'kellysretirementhomes@withease.io',
		};

		var data = {
      username	: device_ids[app.device_id],
			password	: 'sodo',
    	endpoint    : 'sign_in'
    };

		app.trigger('session:sign_in', data);
  },
	on_setup: function () {
		var self	= this;
		var today	= moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0);

		/*
		app.collection.get_cluster({ type: 'schedule' }).each(function (m) {
			var start	= moment(m.get('data.start_date'));
			var end		= moment(m.get('data.end_date'));

			if (start <= today && end >= today) {
				m.fetch_neighbors(function() {
					self.after_setup();
					self.set('is_ready', 'true');
				});
			}
		});
		*/
	},
	after_setup: function () {
		/*var query_obj = {
            type        : 'attendance',
        };

        this.attendance  = app.collection.get_cluster(query_obj);

		console.log('attendance', this.attendance);

		var query_obj = {
            type        : 'shift',
        };

    	this.shifts = app.collection.get_cluster(query_obj);
        this.shifts.comparator = "data.start";
        this.shifts.sort();
		*/
	},
  reset_page: function () {
		var reset_values = {
			page : 'overview'
		};

		this.set(reset_values);

		this.stopListening();
		this.on_init();
  }
};
