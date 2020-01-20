var app = {
	base 			: {},
	plugins		: {},
	model			: {},
	collection: {},
	tmps			: [],
	view			: {},
	tour			: {},
	is_production: false, // disallow all console logs
	is_simulator: false, // are we in a simulator? Mainly for handling bluetooth
	simulator_ip: '192.168.0.19', // force a specific network address in simulator
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
		if (app.is_production) return; // don't output any logs if production

		// output logs in setting friendly format (with timestamp)
		if (app.is_app) {
			var fixed_args = [...arguments];

			_.each(fixed_args, function(obj, index) {
				if (_.isObject(obj)) {
					if (obj.attributes != undefined && _.isObject(obj.attributes)) fixed_args[index] = JSON.stringify(obj.attributes);
					else {
						// make sure not cyclical
						var keys = _.keys(obj);
						var return_obj = {};
						_.each(keys, function(key) {
							if (_.isString(obj[key]) || _.isNumber(obj[key]) || _.isBoolean(obj[key] || _.isDate(obj[key]))) {
								return_obj[key] = obj[key];
							}
						});
						fixed_args[index] = JSON.stringify(return_obj);
					}
				}
			});

			// TODO: stringify object values, so app can output them
			console.log(moment().format('H:mm:ss.SSS'), fixed_args.join(', '));
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
