app.model.user = {
    defaults: function (data) {
		var obj = {
			id			: data.id,
			type		: 'user',
			data		: {
				id					: data.id,
				type    			: 'user',
				version				: this.current_version,

        user_id       : 0,
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
  }
};
