var app = {
	base 		: {},
	plugins		: {},
	model		: {},
	collection	: {},
	view		: {},
	tour		: {},
	mouse_is_down: false,
	count		: 0,
	timers		: function (id1, id2, id3) {
		if (!this._timers)		this._timers = {};

		if (id1 && id2 && id3) {
			if (!this._timers[id1])	this._timers[id1] = 0;
			this._timers[id1] += (this._timers[id2] - this._timers[id3]);
		} else if (id1 && id2) {
			if (!this._timers[id1])	this._timers[id1] = 0;
			var t = performance.now();
			this._timers[id1] += t - this._timers[id2];
		} else {
			this._timers[id1] = performance.now();
		}
	},
	setup: function () {
		if (window.cordova)						app.is_app = true;
		if (app.plugins.is_mobile() !== false)	app.is_app = true;
		if (window.cordova)						StatusBar.show();

		// FOR TOUCH EVENTS
		if (app.is_app)
			$('.body').removeClass('touch-hover');

		_.extend(app, Backbone.Events);

		if (app.config.env !== 'server')		app.setup_error_listener();
		if (app.config.env !== 'server')		app.templates.initialize();

		app.collection							= new app.base.collection(null, { model: app.model.neuron });
		app.collection.on_init();

		app._base = new Binding({ el: $('.body') });
		Backbone.history.start();
		this.setup_fastclick();

    if (app.config.env == 'alpha')			app.current_session().set('debug_mode', 'true');
	},
	setup_fastclick: function () {
		FastClick.attach(document.body);
	},
	active_staff: function () {
		return app.collection.get('current_session').get_model('active.staff_id');
	},
	current_session: function() {
		return app.collection.get('current_session');
	},
	current_data: function () {
		var active = {
			user_id			: app.current_user().id
		};
		return active;
	},
	current_user: function() {
		if (app.config.env == 'server') {
			return app.collection.get('current_session').get_model('server_model_id').get_model('data.created_by_id');
		} else {
			return app.collection.get('current_session').get_model('user_id');
		}
	},
	log: function (msg) {
		if (this && this.postMessage) {
			console.log(msg);
			//self.postMessage(msg);
		} else {
			console.log(msg);
		}
	},
	setup_error_listener: function () {
		if (!app.is_app)
			return this;

		window.onerror = function(message, url, lineNumber) {
			alert(message + ' - ' + url + ' - ' + lineNumber);
			return true;
		};
	},
	on_load: function () {
		if (!window.cordova) {
			$(function(){ app.setup(); });
		}
	},
	is_app: false
};



window.onload = app.on_load;
