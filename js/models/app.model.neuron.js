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
			is_expanded		: 'true',
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
			is_saved			: 'false',

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

			// TODO: Figure out when this would be good to remove
			if (!app.plugins.is_uuid(data.history_id) && data.history_id !== 'false') {
				data.history_id = 'false';
			}

			delete data.responses;

			_.defaults(obj, this.model_defaults());
			_.defaults(data, this.data_defaults(), obj.data);

			// TODO: Remove after data migration of all forms and other objects to a version
			if (_.isString(data.version)) data.version = 1;
			app.model.neuron.check_version(data, ref_model);

			app.plugins.move_from_to_obj(data, obj.data);
			app.plugins.move_from_to_obj(obj, data);
		}

		this._last_save = (data.data) ? app.plugins.json.parse(app.plugins.json.stringify(data.data)) : data.data;

		return data;
	},
	initialize: function (data) {
		if (data && data.type)
			_.extend(this, app.model[data.type]);

		this.setup_computed();
		this.setup_listeners();
		this.on_init();

		this.on('reset',					this.setup_computed);
		this.on('change:form_id',  			this.form_init);
		this.on('change:setup_form', 		this.form_init);
		this.on('change:responses',			this.check_logic);
	},
	on_init: function () {},
	select_all: function (obj) {
		// TODO: works in theory.. doesn't work with deep dependency stuff
		this.set('responses[' + obj.index + '][' + obj.key + ']', obj.cluster.pluck('id'));
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

				self.set('is_unfetchable', 'true');
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
			//console.log('hasnt been saved')
			return true;
		} else if (_.isEqual(this._last_save, data)) {
			//console.log('we are the same');
			return false;
		} else {
			this._last_save = data;
			//console.log('we are different');
			return true;
		}
	},
	before_save	: function () {},
	after_save	: function () {},
	save: function (force_save) {
		this.before_save();

		var data	= this.get('data');

		if (this.is_diff() == false && force_save !== true)
			return this;

		if (data.is_saved == 'false')
			this.setup_trigger_points();

		if (data.history_id == 'false' ||data.history_id == null) {
			var m = app.collection.add({
				id			: app.plugins.uuid(),
				type		: 'history',
				node_id		: this.id
			});
			this.set('data.history_id', m.id);
		}

		// TODO: REMOVE THIS CHECK WHEN ALL ORGANIZATIONS HAVE BEEN UPDATED
		if (data.created_by_id == 'false' && data.type !== 'organization') {
			this.set('data.created_by_id', app.current_user().id, { silent: true });
		}

		this.set('data.updated_at', this.timestamp());
		this.set('data.is_saved', 'true');

		app.collection.outgoing('set', this, function (cbb) {
			//console.log("Outgoing set", cbb);
		});

		this.after_save();
		this.generate_history_point();

		return this;
	},
	save_dev: function () {
	    var data = JSON.parse(JSON.stringify(this.get('data')));
		  data.endpoint = 'set';
			data._url = 'https://api.socrates.withease.io/';

			app.plugins.fetch(data, function (cbb) {
	      //console.log('saved to dev', cbb);
	    });
	},
	save_prod: function () {
	    var data = JSON.parse(JSON.stringify(this.get('data')));
		  data.endpoint = 'set';
			data._url = 'https://api.withease.io/';

			app.plugins.fetch(data, function (cbb) {
	      //console.log('saved to prod', cbb);
	    });
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
	/*************************** COMPUTED PROPS *******************************/
	computed: [],
	setup_computed: function () {
		var self	= this,
			props;

		_.each(this.computed, function (func) {
			props	= func(self);
			_.each(props.deps, function(dep) {
				self.listenTo(self, 'change:' + dep, func);
			});
		});
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

		if (_.isString(field_val)) {
			return app.collection.get(field_val);
		} else {
			function get_model(m_id) { return app.collection.get(m_id); }
			return _.map(field_val, get_model);
		}
	},
	/************************** DEPARTMENT CONVENIENCES ***********************/
	is_department_admin: function (department) {
		var dep_settings = app.current_organization().get('data.department_preferences');

		if (this.is_owner() == 'true') {
			return 'true';
		} else if (dep_settings[department] && dep_settings[department].admin_ids.indexOf(app.current_staff().id)) {
			return 'true';
		} else {
			return 'false';
		}
	},
	is_department_member: function (department) {
		if (this.is_owner() == 'true') {
			return 'true';
		} else {
			return '' + app.current_staff().get('data.departments').indexOf(department) > -1;
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
	trigger_events	: [],
	trigger_actions	: [],
	setup_trigger_points: function () {
		var self		= this;
		var triggers	= app.collection.get_cluster({ type: 'trigger', 'trigger_type': this.get('data.type') });

		var tp_ids = triggers.map(function (t) {
			// we want to create an trigger points
			var data 				= t.trigger_point_data();

			data.trigger_ref_id		= self.id;
			data.trigger_ref_date	= self.get(data.trigger_event.split(':')[1]);
			data.type				= 'trigger_point';

			var tp = app.collection.add(data)
						.calculate_timestamp()
						.save();

			return tp.id;
		});

		this.set('data.trigger_point_ids', tp_ids);
	},
	erase_trigger_points: function () {
		_.invoke(this.get_model('data.trigger_point_ids'), 'erase');
		return this;
	},
	notification_templates: {},
	create_notifications: function (notification_type) {
		var self	= this;
		var n_obj	= this.notifications[notification_type];

		if (!n_obj) return this;

		if (n_obj.recipients_func) {
			this.listenToOnce(this, n_obj.recipients, function() {
				self._create_notification(notification_type);
			});
		} else {
			this._create_notification(notification_type);
		}

		return this;
	},
	_create_notification: function (notification_type) {
		var self	= this;
		var n_obj	= this.notifications[notification_type];
		var r		= n_obj.recipients;
		if (!_.isArray(r)) r = [ r ];
		if (r.length == 0)
			return this;

		var recipients	= _.flatten(_.map(r, function(key) { return self.get(key); }));
		var tmp			= _.template(n_obj.text);
		var n_text		= tmp(this.toJSON());

		var obj = {
			type			: 'notification',
			alert_level		: n_obj.alert_level,
			text			: n_text,
			recipient_ids	: recipients,
			unseen			: recipients
		};

		return this.send_notification(obj);
	},
	send_notification: function (obj) {
		var notification = app.collection.add(obj)
			.send_to_recipients()
			.save();

		return notification;
	},
    /************************** SLUGS *****************************************/
	get_form_duplicates: function () {
		var responses	= this.get('responses');
		var singletons	= [];
		var duplicates	= [];

		_.each(responses, function (r, r_index) {
			_.each(r, function (val, q_id) {
				var slug = app.collection.get_slug(q_id);
				if (!slug) {
					// do nothing
				} else if (singletons.indexOf(slug) > -1) {
					duplicates.push(slug);
				} else {
					singletons.push(slug);
				}
			});
		});

		return duplicates;
	},
	get_form_data: function () {
		var self		= this;
		var responses	= this.get('responses');
		var new_data	= {};

		if (!responses)
			return new_data;

		var duplicates = this.get_form_duplicates();
		_.each(duplicates, function (slug) {
			new_data[slug] = [];
		});

		_.each(responses, function (r, r_index) {
			_.each(r, function (val, q_id) {
				var slug = app.collection.get_slug(q_id);
				if (slug) {
					var q			= app.collection.get(q_id);
					var q_data		= q.get('data');

					if (q_data.category == 'date')	val = app.plugins.cast_form_date(val);
					else 							val = val;

					if (q_data.category == 'questionmap' && q_data.subtype == 'checkbox') {
						_.each(val, function(val2, key) {
							val = val2;
						});
					}

					if (duplicates.indexOf(slug) > -1) {
						new_data[slug].push(val);
					} else {
						new_data[slug] = val;
					}
				}
			});
		});

		return new_data;
	},
	transfer_form_to_data: function () {
		var self		= this;
		var data		= this.get('data');
		var new_data	= this.get_form_data();

		_.each(new_data, function(val, slug) {
			data[slug] = val;
			self.trigger('change:data.' + slug);
		});

		return this;
	},
	transfer_data_to_form: function () {
		var self		= this;
		var responses	= this.get('responses');
		var data		= this.get('data');

    	if (!responses) return false;

		var duplicates = this.get_form_duplicates();
		var curr_index = {};

		_.each(responses, function (s, s_index) {
			_.each(s, function (val, q_id) {
				if (app.collection.get_slug(q_id)) {
					var slug = app.collection.get_slug(q_id);
					if (data[slug]) {
						var q		= app.collection.get(q_id);
						var q_data	= q.get('data');
						var val		= data[slug];

						if (duplicates.indexOf(slug) > -1) {
							if (!curr_index[slug]) curr_index[slug] = 0;
							val = val[curr_index[slug]];
							curr_index[slug]++;
						}

						if (q_data.category == 'date') {
							val = app.plugins.cast_date_to_form(val);
						}

						if (q_data.category == 'checkbox') {
							var opts	= q.get('data.options');
							val			= _.intersection(opts, val);
						}

						if (q_data.category == 'questionmap' && q_data.subtype == 'checkbox') {
							var v2	= {};
							v2[q.get('data.value')] = val;
							val		= v2;
						}

						responses[s_index][q_id] = val;
					}
				}
			});
		});

		this.trigger('change:responses');

		return this;
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
    /******************** EDITING FORM INSTANCE ******************************/
	validate		: function () { return true; },
	before_form		: function () {},
	before_export	: function () {},
	after_export	: function () {},
  	export_data: function () {
		// we are just saving for now..
		if (!this.validate())
			return this;

		this.before_form();
		this.transfer_form_to_data();

		this.before_export();
		this.set('is_editing', 'false');
		this.set('data.saved', 'true');

		this.save();
		// Because we are saving. Not sure if it's a good place for it
		app.collection.add(this);

		this.trigger('export', this);
		this.after_export();
	},
	forminstance_select_all: function (obj) {
		var _key		= 'responses.' + obj.index + '.' + obj.key;
		var ref			= this.get(_key);
		var self		= this;

		if (obj.is_checked == 'true') {
			this.set(_key, obj.cluster.pluck('id'));
		} else {
			this.set(_key, []);
		}

		obj.cluster.trigger('render');
	},
    form_init: function () {
      	var form_id = this.get('form_id');

        if (form_id && app.collection.exists(form_id)) {
			var form	= app.collection.get(form_id);
			//console.log("Form Init", this.id, form_id, form.toJSON());

			// get reference form, sections & instance
			this.set('form', form.attributes, { silent: true });

			var sections	= {};

			_.map(this.get('form.data.section_ids'), function(s) {
				sections[s] = app.collection.get(s).attributes;
			});

			this.set('sections', sections, { silent: true });

			var responses = this.get('responses');

			if (!responses) {
				responses = [];
				this.set('responses', responses, { silent: true });
			}

			if (responses && responses.length == 0) {
				this.add_section(this.get('form.data.section_ids[0]'));
			}

			this.transfer_data_to_form();
			this.check_logic();
        } else if (!form_id) {
			var form_id = app.collection.get_form_by_type(this.get('data.type'));

			if (form_id)
				this.set('form_id', form_id);
		}
    },
    add_section: function (section_id) {
		// SETUP THE SECTION & QUESTIONS WITH THE RIGHT responses
        var section = this.get('sections[' + section_id + ']');

        var data = {
            section_id      : section_id
        };

        _.each(section.data.question_ids, function(q_id) {
            var q               = app.collection.get(q_id);
			var _data			= q.get('data');
	        var cat             = _data.category;
	        var default_value   = '';

	        if (cat == 'checkbox')  	default_value = [];
	        if (cat == 'date')      	default_value = [];
			if (cat == 'grid')      	default_value = [];
			if (cat == 'timeperiod')    default_value = [];
			if (cat == 'hashmap')    	default_value = 'false';
			if (cat == 'boolean')		default_value = _data.default_value;
			if (cat == 'forminstance')	default_value = (_data.form_instance[1] == 'dropdown') ? '' : [];
			if (cat == 'questionmap')	{
				default_value = {};
				default_value[_data.value] = [];
			}

            data[q.id] = default_value;
        });

        this.add('responses', data);
    },
    check_logic: function () {
        var self = this;

		// we don't listen for logic change unless the form is initialized
		if (!this.attributes.form)
			return false;

        // go through each section, verify that the next section to display is the right one, update stubs as required
        var logics      	= this.get('form.data.logic');
        var responses   	= this.get('responses');
		var form_sections	= this.get('form.data.section_ids');

        // check if section follows correctly with logic
        function check_sections(current_index) {
            var response   			= responses[current_index];
			var logic       		= logics[response.section_id];
			var enable_form_logic	= self.get('form.data.enable_form_logic[' + response.section_id + ']') || 'false';

            //app.log('check sections', response, logic, current_index, enable_form_logic)

            function cb(section_id) {
                var next_response = responses[current_index + 1];

				//console.log('NEXT SECTION', section_id)

                if (next_response && next_response.section_id !== section_id) {
                    //console.log('we are showing the wrong section', responses.length, current_index);
                    for (var i = (responses.length - 1); i > current_index; i--) {
                        self.remove('responses[' + i + ']');
                    }
					self.add_section(section_id);
                } else if (next_response && next_response.section_id == section_id) {
                    //console.log('we have the correct section.. lets check that logic', next_response);
                    check_sections(++current_index);
                } else if (!next_response && section_id) {
                    //console.log('we dont have the next section and need to add it');
					self.add_section(section_id);
                } else {
                    //console.log('logic validates as is and we dont need to do anything');
                }
            }

			//console.log('we enable form logic', enable_form_logic)

			if (enable_form_logic == 'false') {
				var curr_form_section_index = form_sections.indexOf(response.section_id);
				var next_section			= form_sections[curr_form_section_index + 1];

				//app.log('we enable form logic', curr_form_section_index, next_section, self.get('form.id'), form_sections)
				cb(next_section);
				//
			} else {
				check_statements(logic, response, cb);
			}
        }

        function check_statements(logic, response, cb) {
            if (!logic || logic.length == 0) {
                return cb(null);
            }

            var index       = 0;

            function check_statement(index) {
                var statement   = logic[index];

                if (!statement) {
                    // we have no matching statement.. Figure out something to do
                    //console.log('we have no matching statement');
                    return cb(null);
                }

                var value       = response[statement.question];
                var truthy      = self.statement_analysis(statement, value);

				//console.log('STATEMENT', statement, value, truthy);

                if (truthy) {
                    // we have a valid statement
                    //console.log('valid statement', statement, value);
                    var next_section = statement.section;
                    return cb(next_section);
                } else {
                    //console.log('invalid statement', statement.value, value);
                    check_statement(++index);
                }
            }

            check_statement(0);
        }

        check_sections(0);
    },
    statement_analysis: function(logic, value) {
        // returns true or false
        if (logic.comparator == 'equal to' && logic.value == value) {
            return true;
        } else if (logic.comparator == 'greater than' && logic.value > value) {
            return true;
        } else if (logic.comparator == 'less than' && logic.value < value) {
            return true;
        } else if (logic.comparator == 'not empty') {
			return true;
		}
        return false;
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
		console.log(data, err)
	}
}
