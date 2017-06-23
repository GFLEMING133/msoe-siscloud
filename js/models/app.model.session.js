app.model.session = {
	defaults: function (data) {
		var obj = {
			id				: data.id,
			type			: 'session',
			signed_in   	: 'false',
			mode			: 'app',
			active: {
				new_type			: 'false',
				new_form_instance	: 'false',
				primary				: 'false',
				secondary			: 'false',
				tertiary			: 'false',
				user_id				: 'false',
				form_id				: 'false',
				form_instance_id	: 'false',
				playlist_id			: 'false',
				track_id			: 'false',
				sisbot_id			: 'false'
			},
			debug_mode				: 'false',
			sisbot_hostnames		: [],

			platform				: 'app',			// app|web
			user_id					: 'false',
			sign_in_id				: '',
			sisyphus_manager_id		: 'false',

			data		: {
				id			: data.id,
				type    	: 'session',
				version     : this.current_version,
		        // for sign in
		        email       : '',
		        password    : '',
			}
		};

		return obj;
	},
	current_version: 1,
	on_init: function () {
  		this.listenTo(app,	'session:sign_out',			this.sign_out);
		this.listenTo(app,	'session:active',			this.set_active);
		this.listenTo(app,	'session:user_sign_in',		this.after_sign_in);

		this.on('change:active.new_type', this.create_new_active);
		this.on('change:active.new_form_instance', this.create_new_form_instance);

		this.on('change:active', this.save_session);
		this.on('change:preview_content', this.create_screenshot);
 	},
	on_reset: function () {
		if (app.config.env == 'server') return this;

		if (!app.is_app)
			this.set('platform', 'web');

		this.setup_mode();
	},
	export_data	: function () { return this; },
	save		: function () { return this; },
	/************************** SETUP MODES ***********************************/
	valid_modes: ['sisyphus','siscloud'],
	setup_mode: function () {
		if (app.is_app) {
			this._setup_mode('sisyphus');
		} else if (!window || !window.location || !window.location.href) {
			this._setup_mode('sisyphus');
		} else {
			var href		= window.location.href;
			var active_mode = 'sisyphus';
			_.each(this.valid_modes, function(m) {
				if (href.indexOf(m) > -1) {
					active_mode = m;
				}
			});
			this._setup_mode(active_mode);
		}
	},
	_setup_mode: function (active_mode) {
		if (this[active_mode + '_mode'])
			this[active_mode + '_mode']();

		this.set('mode', active_mode);
	},
	sisyphus_mode: function () {
		var m = app.collection.add({ type: 'sisyphus_manager' });
		this.set('active.primary', 'current')
			.set('active.secondary', 'false');
		this.set('sisyphus_manager_id', m.id);
	},
	siscloud_mode: function () {
		var m = app.collection.add({ type: 'siscloud_manager' });
		this.set('active.primary', 'current').set('active.secondary', 'false');
		this.set('siscloud_manager_id', m.id);
	},
	setup_sign_in_model: function () {
		var model	= (this.get('sign_in_id') == '') ? app.collection.add({ type: 'sign_in' }) : this.get_model('sign_in_id');
		model.set('is_editing', 'true');

		this.set('sign_in_id', model.id);

		this.check_session_sign_in();
		this.read_hash();
	},
	read_hash: function () {
		var hash	= app.plugins.get_hash()
		if (hash == '') return this;

		app.trigger.apply(app, hash.split('/'));
		window.location.hash = '';
	},
	/************************** SETUP ACTIVE **********************************/
	create_new_form_instance: function () {
		var form_id = this.get('active.new_form_instance');
		if (form_id == 'false') return false;

		var type	= app.collection.get(form_id).get('data.instance_type');
		var obj		= { type: type, id: app.plugins.uuid() };
		var model	= app.collection.add(obj);

		this.set('active.form_instance_id', model.id);
		this.set('active.new_form_instance','false');
	},
	create_new_active: function (obj) {
		if (obj.cid) obj = null;

		var type = obj || this.get('active.new_type');

		if (type == 'false') return false;

		var obj = (_.isObject(type)) ? type : { type: type };
		obj.id = app.plugins.uuid();

		var model = app.collection.add(obj);

		this.set('active.' + obj.type + '_id', model.id);
		this.set('active.new_type','false');
	},
	set_active: function (msg) {
		var self = this;
		_.each(msg, function(val, key) {
			self.set('active.' + key, val);
		});
	},
	/************************** SETUP SIGN IN **********************************/
	after_sign_in: function (obj) {
		// user_id, staff_id, username, password
		this.set(obj);

		var session = this.get_session();
		if (session && session.active) {
			_.each(session.active, function(val, key) {
				if (!app.collection.exists(val) && ['primary','secondary','tertiary'].indexOf(key) == -1)
					session.active[key] = 'false';
			});
		}
		if (session) this.set('active', session.active);

		this.set('signed_in', 'true');
		this.save_session();
		console.log('AFTER SIGN IN');
	},
	sign_out: function () {
		this.remove_session();
		this.set('sign_in_id', '')
			.set('user_id', 'false')
			.set('signed_in', 'false');
		app.collection.on_init();
	},
	/************************** CHECK SESSION STORED LOCALLY ******************/
	check_session_sign_in: function () {
		//if (app.is_app) return false;

		var session = this.get_session();

		if (session && session.username && session.password && session.username !== '' && session.password !== '')
			app.trigger('session:sign_in', { username: session.username, password: session.password });
	},
	get_sisbots: function () {
		try {
			var sisbots = window.localStorage.getItem('sisbots');

			if (sisbots)
				sisbots = JSON.parse(sisbots);
			else
				sisbots = [];

			return sisbots;
		} catch(err) {
			return [];
		}
	},
	get_session: function () {
		try {
			var session = window.localStorage.getItem('session');

			if (session)
				session = JSON.parse(session);

			return session;
		} catch(err) {
			return false;
		}
	},
	save_session: function () {
		try {
			if (!window.localStorage)
				return false;

			localStorage.setItem('session', JSON.stringify(this.toJSON()));

			var curr_sisbots = this.get_sisbots();
			var sess_sisbots = this.get('sisbot_hostnames');
			var uniq_sisbots = _.uniq(_.union(sess_sisbots, curr_sisbots));

			localStorage.setItem('sisbots', JSON.stringify(uniq_sisbots));
		} catch (err) {}
	},
	remove_session: function () {
		try {
			if (!window.localStorage)
				return false;

			localStorage.removeItem('session');
		} catch (err) {}
	},
};
