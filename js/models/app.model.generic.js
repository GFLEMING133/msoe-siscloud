app.model.generic = {
    defaults: function (data) {
		var obj = {
			id			: data.id,
			type		: 'generic',
			data		: {
				id					: data.id,
				type    			: 'generic',
				version				: this.current_version,
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
    }
};
