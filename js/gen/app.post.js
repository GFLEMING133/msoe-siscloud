app.post = {
	initialize: function () {

	},
	fetch: function (data, cb, retry_count) {
		if (retry_count !== 0) retry_count = 5;
		var _data	= JSON.parse(JSON.stringify(data));
		var url		= data._url || app.config.get_api_url();
		var timeout = 30000;

		if (data.endpoint)		url		+= data.endpoint;
		if (data._timeout)		timeout = data._timeout;

		var type = data._type || 'POST';
		delete data._type;
		delete data._url;
		delete data._timeout;
		delete data.endpoint;
	
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
				if (retry_count <= 0) {
					if (cb) cb({ err: 'Could not make request', resp: null });
					return this;
				}

				setTimeout(function () {
					app.post.fetch(_data, cb, --retry_count);
				}, 5000);
			},
			timeout: timeout
		};
		if (obj.type == 'GET')
			delete obj.data;

		$.ajax(obj);
	},
	fetch2: function (data, cb, retry_count) {
		
		if (retry_count !== 0) retry_count = 5;
		var _data	= JSON.parse(JSON.stringify(data));
		var url		= data._url || app.config.get_api_url();
		var timeout = 30000;

		if (data.endpoint)		url		+= data.endpoint;
		if (data._timeout)		timeout = data._timeout;

	
	debugger;
		var req_data = {
			data	: JSON.stringify(data)
		};

		if (app.current_user())
			req_data.user = app.current_user().get('data');
			console.log('IN APP POST req_data',req_data)
		
		var auth_token = ((req_data || {}).user || {}).auth_token; 		
				//  console.log('Auth_TOKEN in the APP.POST.JS', auth_token);
				 var obj = {
					url				: url,
					type			: 'GET',
				
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
						if (retry_count <= 0) {
							if (cb) cb({ err: 'Could not make request', resp: null });
							return this;
						}
		
						setTimeout(function () {
							app.post.fetch(_data, cb, --retry_count);
						}, 5000);
					},
					
					beforeSend: function (xhr) {
						debugger;
						xhr.setRequestHeader ("Authorization", auth_token);
					},
					timeout: timeout
				}

				$.ajax(obj);
	}
};
