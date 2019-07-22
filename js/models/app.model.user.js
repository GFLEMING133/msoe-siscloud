// app.model.user = {
// 	defaults: function (data) {
// 		var obj = {
// 			id			: data.id,
// 			type		: 'user',
// 			avatar		: (app.plugins.first_char_to_num(data.id[0]) % 8) + 1,

// 			update		: {},
// 			update_errs	: [],
// 			update_msg	: [],

// 			password	: {},
// 			password_errs: [],
// 			password_msg: [],

// 			data		: {
// 				id					: data.id,
// 				type    			: 'user',
// 				version				: this.current_version,

// 				username			: '',
// 				password			: '',
// 				name				: '',

// 				sisbot_ids			: [],
// 				sisbot_hostnames	: [],
// 				playlist_ids		: [],
// 			}
// 		};

// 		return obj;
// 	},
// 	// current_version: 1,
// 	// versions: {},
// 	// on_init: function () {
	
// 	// },
// 	// after_export: function () {
// 	// 	app.trigger('session:active', { user_id: 'false', tertiary: 'overview' });
// 	// },
// 	/**************************** PLAYLISTS ***********************************/
// 	// playlist_add: function (playlist_model) {
// 	// 	debugger;
// 	// 	this.add_nx('data.playlist_ids', playlist_model.id);
// 	// 	this.save(true);
// 	// },
// 	// playlist_remove: function (playlist_model) {
// 	// 	debugger;
// 	// 	this.remove('data.playlist_ids', playlist_model.id);
// 	// 	this.save(true);
// 	// },
// 	/**************************** USER UPDATE *********************************/
// 	// update_setup: function () {
// 	// 	var fields = _.pick(this.get('data'), 'username', 'email', 'phone');
// 	// 	this.set('update', fields)
// 	// 		.set('password', { old: '', new: '', confirm: '' });
// 	// },
// 	// update_account: function () {
// 	// 	var self	= this;
// 	// 	this.set('update_errs', []);

// 	// 	var updates		= this.get('update');
// 	// 	updates.phone	= updates.phone.replace(/\D/g, '');
// 	// 	var errs		= [];

// 	// 	// validation
// 	// 	if (updates.email == '' || !app.plugins.valid_email(updates.email))
// 	// 		errs.push('Invalid email address');

// 	// 	if (updates.phone == '' || updates.phone.length !== 10)
// 	// 		errs.push('Phone Number should be 10 digits long');

// 	// 	if (updates.username == '')
// 	// 		errs.push('Username cannot be blank');

// 	// 	if (errs.length > 0) {
// 	// 		this.set('update_errs', errs);
// 	// 		this.trigger('change:update_errs');
// 	// 		return this;
// 	// 	}

// 	// 	// check server to update user
// 	// 	var api_req = {
// 	// 		endpoint: 'user_valid_update',
// 	// 		id		: this.id,
// 	// 		old		: _.pick(this.get('data'), 'username', 'email', 'phone'),
// 	// 		new		: updates
// 	// 	};

// 	// 	app.plugins.fetch(api_req, function (cbb) {
// 	// 		if (cbb.err) return self.set('update_errs', cbb.err);

// 	// 		_.each(updates, function (val, key) {
// 	// 			self.set('data.' + key, val);
// 	// 		});
// 	// 		self.save();
// 	// 		self.set('update_msg', [ 'Successfully updated your Account Info' ]);
// 	// 		setTimeout(function() { self.set('update_msg', []); }, 5000);
// 	// 	});
// 	// }
// };
