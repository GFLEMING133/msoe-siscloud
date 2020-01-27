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
  }
};
