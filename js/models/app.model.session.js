app.model.session = {
	defaults: function (data) {
		var obj = {
			id				: data.id,
			type			: 'session',
			signed_in   	: 'false',
			mode			: 'app',
			auth_token		: '',
			active: {
				new_type			: 'false',
				new_form_instance	: 'false',
				curtis_sort			: '',
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
			toggle: {
				expanded			: 'false',
			},
			debug_mode				: 'false',
			sisbot_hostnames		: [],

			platform				: 'app',			// app|web
			user_id					: 'false',
			sign_in_id				: '',
			sisyphus_manager_id		: 'false',
			modal_id				: 'false',


			user_registration: 'false', // false|sign_up|sign_in|hostname

      signing_up: 'false',
      signing_in: 'false',
      registration: {
          username: '',
          email: '',
          password: '',
          password_confirmation: '',
      },
      forgot_email: {
          email: '',
      },
			remember_me: 'false', //community log
			show_password: 'false', //community log
			sisbot_id			: 'false',

			data		: {
				id			: data.id,
				type    	: 'session',
				version     : this.current_version,
			}
		};

		return obj;
	},
	current_version: 1,
	on_init: function () {
		app.session = this;

		var saved_session = this.get_session();
		if (_.isObject(saved_session)) {
			if (saved_session.active) this.set('active', saved_session.active);
			if (saved_session.remember_me) {
				this.set('remember_me', saved_session.remember_me);
				if (saved_session.registration) this.set('registration', saved_session.registration);
			}
		}

  	this.listenTo(app,	'session:sign_out',			this.sign_out);
		this.listenTo(app,	'session:active',			this.set_active);
		this.listenTo(app,	'session:toggle',			this.set_toggle);
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
		var m = app.collection.add({ type: 'modal' });
		this.set('modal_id', m.id);

		var m = app.collection.add({ type: 'sisyphus_manager' });
		this.set('active.primary', 'current')
			.set('active.secondary', 'false');
		this.set('sisyphus_manager_id', m.id);

		var c = app.collection.add({ type: 'community' });
		this.set('community_id', c.id);

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
	set_toggle: function (msg) {
		var status = this.get('toggle.' + msg.key);

		if (status == msg.val) 	this.set('toggle.' + msg.key, 'false');
		else					this.set('toggle.' + msg.key, msg.val);
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
			.set('sisyphus_manager_id', 'false')
			.set('signed_in', 'false');
		window.location.reload();
	},
	   /**************************** USER REGISTRATION ***************************/
	setup_registration: function() {
	if (this.get('user_id') == 'false')
		this.setup_sign_up();
    },
    setup_sign_up: function() {
        this.set('errors', []);
        this.set('user_registration', 'sign_up');
    },
    setup_sign_in: function() {
        this.set('errors', []);
        this.set('user_registration', 'sign_in');
    },

    sign_up: function() {
        if (this.get('signing_up') == 'true') return true;
        else this.set('signing_up', 'true');
        var self = this;
        var user_data = this.get('registration');
        var element = $('.sign_up_errors')[0];
        var errors = this.get_errors(user_data);
        self.set('errors', errors);

        if (errors.length > 0){
             this.set('signing_up', 'false')
             element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
             return;
        }

        function cb(obj) {
			console.log('sign_up self._process_registration OBJ RESP', obj.data, obj.err );
            if (obj.err){
                self.set('signing_up', 'false').set('errors', [ obj.err ]);
                element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
                return;
            }
            self.set('errors', []);

            self._process_registration(user_data, obj.resp);

			self.set('signing_up', 'false');
			self.set('signed_in', 'false') // setting to false so we can access the community-sign-in-tmp.
			app.trigger('session:active', {  'primary': 'community', 'secondary': 'sign_in' });//directing to the sign-in page after registration
			// if we want to direct straight to tracks after sign in we can just call self.sign_in(); and delete the 2 lines above.

        };

        var post_obj = {
            _url: app.config.get_webcenter_url(),
            _type: 'POST',
            _timeout: 60000,
            endpoint: 'register_user.json',
            username                : user_data.username,
        	email					: user_data.email,
        	password				: user_data.password,
        	password_confirmation	: user_data.password_confirmation
        };

        app.post.fetch(post_obj, cb, 0);
    },

    sign_in: function(user_data) {
			console.log("Session Sign In()");

        if (this.get('signing_in') == 'true') return false;
        else this.set('signing_in', 'true');

        var self = this;
        var user_data = this.get('registration');

        var errors = this.get_errors(user_data);

        user_data._timeout = 5000;

        //______________Password Errors______________________________________

        if (errors.length > 0){
            return this.set('signing_in', 'false').set('errors', errors);
        }
        function cb(obj) {
            if (obj.err){
                if(obj.err == 'Unauthorized') {
                    return self.set('signing_in', 'false').set('remember_me','false').set('errors', ['Email or Password is incorrect.']);
                }else {
                    return self.set('signing_in', 'false').set('remember_me','false').set('errors', [ obj.err ]);
                }
            }
            self.set('errors', []);

            self._process_sign_in(user_data, obj.resp);

            app.trigger('session:active', {  'primary': 'community', 'secondary': 'community-tracks' });
        };

        user_data.endpoint  = 'auth_user';
        user_data._url      = app.config.get_webcenter_url();  // user_data._url		= http://dev.webcenter.sisyphus-industries.com  NEW

        app.post.fetch2(user_data, cb, 0);

    },
    _process_sign_in: function (user, data_arr) {

  		var session_data = {
  			email			: user.email,
        	password		: user.password,
  		};
      var self = this;
  		_.each(data_arr, function (m) {
  			if (m.type == 'user' && m.email == user.email)
                  session_data.user_id = m.id;
                  self.set('user_id', m.id );
  		});

  		app.manager.intake_data(data_arr);
  		app.trigger('session:user_sign_in', session_data);
    },
    clear_errors: function(){
          this.set('errors', []);
    },
    get_errors: function(user_data) {
		var errors = [];
		
        if (!user_data.email || user_data.email == '') errors.push('Email cannot be blank');
        if (!user_data.password || user_data.password == '') errors.push('Password cannot be blank');
         //__________________SignUp Errors________________________ //
         if (this.get('signing_up') == 'true'){
            if (user_data.username == ""){
                errors.push('Username cannot be blank');
			} 
			if (app.plugins.valid_email(user_data.username)){
                errors.push('Username cannot be an email');
            }
            if (!app.plugins.valid_email(user_data.email)){
                errors.push("The email you entered is invalid, please enter a valid email");
            }
            if (user_data.password.length < 6 || user_data.password_confirmation.length < 6){
                errors.push('Password must be 7 or more characters');
            }
            if (user_data.password != user_data.password_confirmation){
                errors.push('Password verification does not match');
            }
        }
        return errors;
    },
    _process_registration: function(user, data_arr) {
        var session_data = {
			username: user.username,
            email: user.email,
            password: user.password,
            password_confirmation: user.password_confirmation,
        };

        var self = this;
        var server_user = false;

        _.each(data_arr, function(m) {

            if (m.type == 'user' && m.email == user.email) {
                server_user = m;
                session_data.user_id = m.id;
            }
        });

        app.manager.intake_data(data_arr);
        app.trigger('session:user_sign_in', session_data);


        // setup user info here
        if(session_data.user_id && session_data.user_id !== 'false')this.set('user_id', session_data.user_id);

    },


    forgot_password: function(user_data) {
        var errors = [];
        if (!user_data || user_data == '') errors.push('Email cannot be blank');
        var self = this;

        user_email = this.get('forgot_email'); //this is the object

        function cb(obj) {
            if (errors.length > 0 || obj.err)
                return self.set('forgot_email', 'false').set('errors', [errors, 'That email is not in our system']);
            self.set('errors', []);

            self._process_email(user_email, obj.resp);


        };
        user_email._url = app.config.get_webcenter_url(); //this adds the url to be passed into t fetch()
        user_email.endpoint = `/users/password.json/`; //this adds the endpoint to be passed into fetch() the email is already in the object,

        console.log('user_email ==', user_email);
		app.post.fetch(user_email, cb, 0 );
		app.plugins.n.notification.alert('An email has been sent with instructions on how to reset your password.',
        function(resp_num) {
            if (resp_num == 1){
                return;
            }

		},'Email Sent', ['OK']);

		app.trigger('session:active', {'primary':'community','secondary':'false'});
        
    },
    _process_email: function(user, data_arr) {
        var session_data = {
            email: user.email
        };

        var self = this;
        var server_user = false;

        _.each(data_arr, function(m) {

            if (m.type == 'user' && m.email == user.email) {
                server_user = m;
                session_data.user_id = m.id;
                self.set('sisbots_user', m.sisbot_ids);
            }
        });

        app.collection.add(data_arr);
		app.trigger('session:active', {'primary':'community','secondary':'sign_in'});
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

			return _.uniq(sisbots);
		} catch(err) {
			return [];
		}
	},
	clear_sisbots: function() {
		try {
			if (!window.localStorage) return false;

			window.localStorage.removeItem('sisbots');
		} catch (err) {}
	},
	get_session: function () {
		console.log("Get Session");
		try {
			if (!window.localStorage) return false;

			var session = window.localStorage.getItem('session');

			if (session) session = JSON.parse(session);

			return session;
		} catch(err) {
			return false;
		}
	},
	save_session: function () {
		console.log("Save Session");
		try {
			if (!window.localStorage) return false;

			var saveJSON = this.toJSON();
			// remove values that shouldn't be saved
			delete saveJSON.auth_token;
			if (saveJSON.remember_me == 'false') delete saveJSON.registration;

			window.localStorage.setItem('session', JSON.stringify(saveJSON));
			// console.log("Session JSON", JSON.stringify(this.toJSON()));

			var curr_sisbots = this.get_sisbots();
			var sess_sisbots = this.get('sisbot_hostnames');
			var uniq_sisbots = _.uniq(_.union(sess_sisbots, curr_sisbots));

			window.localStorage.setItem('sisbots', JSON.stringify(uniq_sisbots));
		} catch (err) {}
	},
	remove_session: function () {
		console.log("Remove Session");
		try {
			if (!window.localStorage)
				return false;

			window.localStorage.removeItem('session');
			window.localStorage.removeItem('sisbots');
		} catch (err) {}
	},
};
