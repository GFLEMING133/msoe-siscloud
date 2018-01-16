app.plugins.push_notifications = {
	initialize: function () {
		this.config = app.config.pushwoosh;

		if (!window.plugins || !window.plugins.pushNotification) return false;

		var self = this;

		this.setup();

		document.addEventListener('push-notification', function(event) {
			var notification = event.notification;
			app.trigger('notification', notification.u);
			self.push.setApplicationIconBadgeNumber(0);
		});
	},
	setup: function () {
		this.push	= window.plugins.pushNotification;

		var platform = device.platform;

		if (platform == 'Android')
			this.push.onDeviceReady({ projectid	: this.config.android_project_id, appid : this.config.app_id });
		if (platform == 'iOS')
			this.push.onDeviceReady({ pw_appid	: this.config.app_id });

		//register for pushes
	    this.push.registerDevice(
	        function (status) {
	            var deviceToken = status['deviceToken'];
	            app.plugins.push_notifications.send({ message: { msg: 'Device ID: ' + deviceToken, type: 'msg' } });
				app.trigger('notification', { type: 'msg', msg: 'Device Registered: ' + deviceToken });
	        },
	        function (status) {
				app.trigger('notification', { type: 'msg', msg: 'Device Not Registered: ' + JSON.stringify(status) });
	        }
	    );

	},
	register: function (on_success, on_failure) {
		if (!window.plugins || !window.plugins.pushNotification) return false;
		this.setup();
		this.push.registerDevice(on_success, on_failure);
	},
	send: function (msg, device, cb) {
		var iphone		= 'd926e46e2c96208259b9f4a25ddc68be4841e4cebf53fe5c6a6fa48ff7436012';
		device			= iphone;

		var device_type = {
			'Android'		: 3,
			'BlackBerry'	: 2,
			'iOS'			: 1
		};

		var message = {
			text	: 'New notification - check it out',
			type	: 'msg',	// funny, whatever
			msg		: 'Whatever you want the new message to be'
		};

		_.extend(message, msg);

		var request_data = {
			request : {
				application		: this.config.app_id,
				auth			: this.config.auth_token,
				notifications	: [{
					send_date	: 'now',
					content		: message.text,
					devices		: [ device ],
					data		: message
				}]
			}
		};

		$.ajax({
			url				: 'https://cp.pushwoosh.com/json/1.3/createMessage',
			type			: 'POST',
			data			: JSON.stringify(request_data),
			contentType		: 'application/json',
			success			: function (data) {
				if (cb) cb();
				console.log(data);
			}
		});
	}
};
