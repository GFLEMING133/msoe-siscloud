app.model.neuron = Backbone.NestedModel.extend({
	defaults: {},
	model_defaults: function () {
		var defs = {
			id				: false,
			is_fetched		: 'true',
			is_fetching		: 'false',
			is_subfetched	: 'false',
			is_fetching_neighbors: 'false',
			is_editing		: 'false',
			show_submit		: 'true',
			is_expanded		: 'false',
			context_menu	: 'false',
			is_unfetchable	: 'false',
			messages		: [],
			errors			: []
		};
		return defs;
	},
	data_defaults: function () {
		var defs = {
			id					: false,
			is_deleted			: 'false',
			is_saved				: 'false',

			created_at			: this.timestamp(),
			updated_at			: this.timestamp(),
			created_by_id		: 'false',
			history_id			: 'false',
			trigger_point_ids	: []
		};
		return defs;
	},
	parse: function (data) {
		if (!data.id) data.id = app.plugins.uuid();
		if (data.data) delete data.data;

		if (data.type) {
			var ref_model = (app.model[data.type]) ? app.model[data.type] : app.model.generic;

			if (ref_model.defaults) {
				var obj		= ref_model.defaults(data);
			}

			if (!app.plugins.is_uuid(data.history_id) && data.history_id !== 'false') {
				data.history_id = 'false';
			}

			delete data.responses;

			_.defaults(obj, this.model_defaults());
			_.defaults(data, this.data_defaults(), obj.data);

			if (_.isString(data.version)) data.version = 1;
			app.model.neuron.check_version(data, ref_model);

			app.plugins.move_from_to_obj(data, obj.data);
			app.plugins.move_from_to_obj(obj, data);
		}

		// this._last_save = (data.data) ? app.plugins.json.parse(app.plugins.json.stringify(data.data)) : data.data;
		this._last_save = (data.data) ? data.data : {};

		return data;
	},
	initialize: function (data) {
		if (data && data.type) _.extend(this, app.model[data.type]);

		this.setup_listeners();
		this.on_init();
	},
	on_init: function () {},
	select_all: function (obj) {
		this.set('responses[' + obj.index + '][' + obj.key + ']', obj.cluster.pluck('id'));
	},
	collapse: function () {
		this.set('is_expanded', 'false');
	},
	expand: function () {
		this.set('is_expanded', 'true');
	},
	/*************************** LISTENERS ************************************/
	listeners: [],
	setup_listeners: function() {
		var self = this;

		_.each(this.listeners, function(target, listener) {
			self.listenTo(app, listener, self[target]);
		});
	},
	/*************************** RANDOM ARRAY *********************************/
	move_array: function (field, old_index, new_index) {
		var val		= this.get(field);
		var length	= val.length;
		var opt		= val.splice(old_index, 1);

		val.splice(new_index, 0, opt[0]);
		this.set(field, val);

		this.trigger('change:' + field);
		this.save(true);
	},
	add_array: function(msg) {
		this.add(msg.field, msg.val).save(true);
	},
	remove_array: function (msg) {
		this.remove(msg).save(true);
	},
	/*************************** FETCH ASYNC **********************************/
	on_fetch: function (data) {
		if (this.get('is_fetched') == 'true')
			return false;

		_.extend(this, app.model[data.type]);
		this.set(this.parse(data));
		this.initialize();

		app.collection.trigger('fetch', this);
	},
	fetch_watch: function (cb) {
		if (this.get('is_fetched') == 'true')
			return cb(this);

		var self = this;

		function fetch_watch_cb(model) {
			self.off('change:is_fetched', fetch_watch_cb);
			cb(self);
		}

		this.on('change:is_fetched', fetch_watch_cb);
		if (this.get('is_fetching') == 'false')	this.fetch();
	},
	fetch: function () {
		var self = this;
		this.set('is_fetching', 'true');

		app.plugins.fetch({ endpoint: 'get', id: this.id, type: this.get('data.type') }, function(obj) {
			self.set('is_fetching', 'false');

			if (!obj.err && obj.resp.length > 0) {
				self.on_fetch(obj.resp[0]);
			} else {
				if (!_.isArray(obj.err)) obj.err = [ obj.err ];

				self.set('is_unfetchable', 'false');
				self.set('is_fetched', 'true');
			}
		});
	},
	fetch_neighbors: function (cb) {
		if (!this._fetch_neighbors_cbs) this._fetch_neighbors_cbs = [];
		if (_.isFunction(cb)) this._fetch_neighbors_cbs.push(cb);

		if (this.get('is_fetching_neighbors') == 'true') return this;
		this.set('is_fetching_neighbors', 'true');

		var self = this;

		app.plugins.fetch({ endpoint: 'get_neighbors', id: this.id, type: this.get('data.type') }, function(obj) {
			if (!obj.err && obj.resp.length > 0) {
				app.collection.add(obj.resp);
				self.set('is_subfetched', 'true');
				self.set('is_fetching_neighbors', 'false');

				_.each(self._fetch_neighbors_cbs, function(cbs) {
					cbs(self);
				});
			} else {
				self.set('errors', obj.err);
			}
		});
	},
	fetch_async: function(cb, ctx) {
		if (!this._fetch_cbs) this._fetch_cbs = [];

		this._fetch_cbs.push({ cb: cb, ctx: ctx });

		if (this.get('is_subfetched') == 'false') {
			this.on('change:is_subfetched', this.on_fetch_async);
			this.fetch_neighbors();
		} else {
			this.on_fetch_async();
		}
	},
	on_fetch_async: function () {
		if (this.get('is_subfetched') == 'false')
			return this;

		_.each(this._fetch_cbs, function(a) { a.cb.call(a.ctx); });

		this.off('change:is_subfetched', this.on_fetch_async);

		delete this._fetch_cbs;
	},
	/*************************** SAVE *****************************************/
	is_diff: function () {
		var data	= this.get('data');

		if (!data) {
			return false;
		} else if (data.is_saved == 'false') {
			//app.log('hasnt been saved')
			return true;
		} else if (_.isEqual(this._last_save, data)) {
			//app.log('we are the same');
			return false;
		} else {
			this._last_save = data;
			//app.log('we are different');
			return true;
		}
	},
	before_save	: function () {},
	after_save	: function () {},
	save: function (force_save) {
		if (app.config.env == 'sisbot') {
			this.before_save();
			this.after_save();
			return this;
		}

		this.before_save();

		var data	= this.get('data');

		if (this.is_diff() == false && force_save !== true) return this;

		if (data.history_id == 'false' ||data.history_id == null) {
			var m = app.collection.add({
				id			: app.plugins.uuid(),
				type		: 'history',
				node_id		: this.id
			});
			this.set('data.history_id', m.id);
		}

		this.set('data.updated_at', this.timestamp());
		this.set('data.is_saved', 'true');
		app.collection.trigger('export', this);

		app.collection.outgoing('set', this, function (cbb) {
			//app.log("Outgoing set", cbb);
		});

		this.after_save();
		this.generate_history_point();

		return this;
	},
	before_erase: function () {},
	after_erase	: function () {},
	erase: function () {
		var id		= this.id;
		var type	= this.get('data.type');

		this.before_erase();
		this.erase_trigger_points();
		this._erase();
		this.after_erase();

		app.trigger('erase:' + type, id);

		return this;
	},
	_erase: function () {
		app.collection.outgoing('erase', this);
		app.collection.remove(this);
		return this;
	},
	before_destroy	: function () {},
	after_destroy	: function () {},
	destroy: function () {
		this.before_destroy();
		app.collection.remove(this);
		this.set('data.deleted','true').save();
		this.after_destroy();
	},
	export: function () {
		return this.get('data');
	},
	timestamp: function () {
		return moment().format('YYYY-MM-DD HH:mm:ss');
	},
	generate_history_point: function () {
		this._last_save = this.get('data');
		return false;
		this.get_model('data.history_id').add_history_point(this._last_save);
	},
	/*************************** COMPARATOR ***********************************/
	comparator_change: function (field) {
		var comparator = this.get('comparator');
		var opps = {
			'asc'   : 'dsc',
			'dsc'   : 'asc'
		};
		if (comparator.key == field) {
			this.set('comparator.ord', opps[this.get('comparator.ord')]);
		} else {
			this.set('comparator', { key: field, ord: 'asc' });
		}

		this.trigger('change:comparator.key');
		this.trigger('change:comparator.ord');
	},
	/************************** ACCESS CONVENIENCES ***************************/
	is_owner: function () {
		return app.current_organization().is_owner();
	},
	is_admin: function () {
		return app.current_organization().is_admin();
	},
	is_staff: function () {
		return app.current_organization().is_staff();
	},
	get_model: function (field) {
		var field_val = this.get(field);
		if (field_val == 'false') return undefined;

		if (_.isArray(field_val)) {
			function get_model(m_id) { return app.collection.get(m_id); }
			return _.map(field_val, get_model);
		} else {
			return app.collection.get(field_val);
		}
	},
	/************************** NOTIFICATIONS *********************************/
	_private_keys: ['type','version','is_deleted','is_saved','responses'],
	get_keys: function () {
		var _type		= this.get('data.instance_type');
		var _keys		= _.keys(app.model[_type].defaults({ id: false}).data);
		var results		= _.difference(_keys, this._private_keys).sort();
		this.set('keys', results);
		return results;
	},
	/******************** EXTENSION FUNCS ************************************/
	add_nx: function(attrStr, value, opts) {
		// TRAVIS: we're going to assume an array is already here
		var current = this.get(attrStr);
		if (current.indexOf(value) == -1) {
			this.add(attrStr, value, opts);
		}
		return this;
	},
	toggle: function(field_name) {
		var field = this.get(field_name);
		this.set(field_name, app.plugins.bool_opp[field]);
		return app.plugins.bool_opp[field];
	},
}, {
	/******************** VERSIONING ******************************************/
	check_version: function (data, model) {
		if (!data.version)	data.version = 1;
		if (!model.current_version) model.current_version = 1;

		if (data.version !== model.current_version) {
			data = this.update_version(data, model);
		}

		return data;
	},
	update_version: function (data, model) {
		_.each(_.range(data.version + 1, model.current_version + 1), function (version) {
			model.versions[version].forward(data);
		});
		return data;
	}
}, {
	parse: true
});

app.neuron = function(data) {
	try {
		return new app.model.neuron(data, { parse: true });
	} catch (err) {
		app.log(data, err)
	}
}
