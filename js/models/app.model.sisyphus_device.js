app.model.sisyphus_device = {
	defaults: function (data) {
		var obj = {
			id			: data.id,
			type		: 'sisyphus_device',
			data		: {
				id					: data.id,
				type    			: 'sisyphus_device',
				version				: this.current_version,

                name                : '',
                useragent           : '', // iphone, android, etc
			}
		};

		return obj;
	},
	current_version: 1,
	after_export: function () {
		app.current_session().set_active({ sisyphus_device_id: 'false' });
	},
	
};
