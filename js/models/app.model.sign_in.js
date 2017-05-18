app.model.sign_in = {
	defaults: function (data) {
		var obj = {
			id			: data.id,
			type		: 'sign_in',
			reset_pw	: 'false',
			is_sign_up	: 'false',

			signing_in	: 'false',
			signing_up	: 'false',

			username	: '',
			password	: '',
			new_password: '',

			data		: {
				id			: data.id,
				type    	: 'sign_in',
				version     : this.current_version,

				username	: '',
				password	: ''
			}
		};

		return obj;
	},
	current_version: 1,
	save: function () { return this; },
	on_init: function () {
		this.listenTo(app, 'session:sign_in',		this.sign_in);
		this.listenTo(app, 'kiosk:sign_in',			this.kiosk_sign_in);
		this.listenTo(app, 'url:reset_password',	this.password_reset_check);
	},
	export_data: function () {
		this.transfer_form_to_data();
		this.sign_in();
		return this;
    },
	/************************** SIGN IN ***************************************/
	sign_in: function (user_data) {
		if (this.get('signing_in') == 'true') return false;
		else this.set('signing_in', 'true');

		var self		= this;
		var errors		= [];
		var user_data   = user_data || this.get('data');

		if (user_data.username == '')	errors.push('- Username cannot be blank');
		if (user_data.password == '')	errors.push('- Password cannot be blank');

		if (errors.length > 0) {
			this.set('signing_in', 'false')
			return this.set('errors', errors);
		}

		function cb(obj) {
			if (obj.err)
				return self.set('signing_in', 'false').set('errors', [ '- ' + obj.err ]);

			self._process_sign_in(user_data, obj.resp);
		};

		user_data.endpoint = 'sign_in';
		app.plugins.fetch(user_data, cb);
	},
	kiosk_sign_in: function (kiosk_id) {
		var self		= this;
		var kiosk_data	= {
			kiosk_id	: kiosk_id,
			endpoint	: 'kiosk_sign_in'
		};

		function cb(obj) {
			if (obj.err)
				return self.set('signing_in', 'false').set('errors', [ '- ' + obj.err ]);

			var data = _.flatten([ obj.resp.organization, obj.resp.user, obj.resp.staff, obj.resp.attendance, obj.resp.shifts, obj.resp.questions ]);
			self._process_sign_in(obj.resp.user, data);
		};

		app.plugins.fetch(kiosk_data, cb);
	},
	_process_sign_in: function (user, data_arr) {
		var session_data = {
			user_id			: 'false',
			username		: user.username,
			password		: user.password
		};

		_.each(data_arr, function (m) {
			if (m.type == 'user' && m.username == user.username)
				session_data.user_id = m.id;
		});

		app.collection.add(data_arr);
		app.trigger('session:user_sign_in', session_data);
	},
	/************************** FORGOT PASSWORD *******************************/
	forgot_password: function () {
		var self		= this;
		var data		= this.get_form_data();

		if (data.username == '')
			return this.add('errors', ['- Username cannot be blank when trying to reset password']);

		var api_req		= {
			endpoint    : 'username_check',
			username	: data.username
		};

		app.plugins.fetch(api_req, function (resp) {
			if (resp.err)
				return self.set('errors', [ resp.err ]);

			api_req		= {
				endpoint    : 'username_reset_password',
				username	: data.username,
				user_id		: resp.resp
			};

			app.plugins.fetch(api_req, function (resp) {
				if (resp.err)
					return self.set('errors', [ resp.err ]);

				self.set('messages', [ 'We have sent you an email to reset your password.' ]);
			});
		});
	},
	password_reset_check: function(username, pw) {
		// check to initiate password reset
		this.set('username', username)
			.set('password', pw)
			.set('reset_pw', 'true');

		var self = this;
		var api_req		= {
			endpoint    : 'password_reset_check',
			username	: username,
			password	: pw
		};

		app.plugins.fetch(api_req, function (resp) {
			if (resp.err)
				return self.set('errors', [ resp.err ]);

			if (resp.resp == false)		// we have a spoof
				self.set('username', '').set('reset_pw', 'false');
		});
	},
	reset_password: function () {
		var self			= this;
		var new_password	= this.get('new_password');

		if (new_password == '')
			return this.add('errors', ['- New password cannot be blank']);

		var api_req		= {
			endpoint    : 'password_reset',
			username	: this.get('username'),
			password	: this.get('password'),
			new_password: new_password
		};

		app.plugins.fetch(api_req, function (resp) {
			if (resp.err)
				return self.set('errors', [ resp.err ]);

			self.sign_in({ username: self.get('username'), password: new_password });
			self.set('username', '')
				.set('password', '')
				.set('reset_pw', 'false');
		});
	}
};
