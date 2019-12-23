var app = {
	base 		: {},
	plugins		: {},
	model		: {},
	collection	: {},
	view		: {},
	tour		: {},
	is_visible: true,
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
		if (window.cordova)						{
			app.is_app = true;
			StatusBar.show();
			$('.body').removeClass('touch-hover'); // FOR TOUCH EVENTS
		}
		// if (app.plugins.is_mobile() !== false)	app.is_app = true;

		_.extend(app, Backbone.Events);

		if (app.config.env !== 'server')		app.setup_error_listener();
		if (app.config.env !== 'server')		app.templates.initialize();

		app.collection							= new app.base.collection(null, { model: app.model.neuron });
		app.collection.on_init();

		app.bind = new Binding({ el: $('.body') });
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
		return app.session.get_model('user_id');
	},
	log: function () {
		// TODO: don't output any logs if production
		if (app.is_app) {
			// TODO: stringify object values, so app can output them
			console.log([...arguments].join(', '));
		} else console.log(moment().format('H:mm:ss.SSS'), ...arguments);
	},
	setup_error_listener: function () {
		if (!app.is_app) return this;

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
