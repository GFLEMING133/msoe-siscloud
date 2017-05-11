app.post = {
	initialize: function () {

	},
	fetch: function (data, cb, had_error) {
		var _data	= JSON.parse(JSON.stringify(data));
		var url		= data._url || app.config.get_api_url();

		if (data.endpoint) {
			url += data.endpoint;
			delete data.endpoint;
		}

		var type = data._type || 'POST';
		delete data._type;
		delete data._url;

		var req_data = {
			data	: JSON.stringify(data)
		};

		if (app.current_user())
			req_data.user = app.current_user().get('data');

		var obj = {
			url			: url,
			type		: type,
			data		: req_data,
			xhrFields: {
				withCredentials: false
			},
			success		: function (data) {
				try {
					data = JSON.parse(data);
				} catch(err) {}

				if (_.isFunction(cb))
					cb(data)
				else if (_.isString(cb))
					app.trigger(cb, data);
			},
			error		: function (resp) {
				setTimeout(function () {
					app.post.fetch(_data, cb, true);
				}, 5000);
			}
		};

		if (obj.type == 'GET')
			delete obj.data;

		$.ajax(obj);
	}
};
