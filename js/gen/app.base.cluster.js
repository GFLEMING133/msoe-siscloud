app.base.cluster = Backbone.Collection.extend({
	initialize	: function (opts) {
		this.listenTo(app.collection,		'add',				this.on_add);
		this.listenTo(app.collection,		'export',			this.on_update);
		this.listenTo(app.collection,		'remove',			this.on_remove);
		this.listenTo(app.collection,		'fetch',		  this.on_fetch);
		//this.listenTo(app.collection,		'change:data',this.on_update);

		return this;
	},
	_comparator: [{ key: 'type', ord: 'dsc' }],
	comparator: function(item_a, item_b) {
		if (!_.isArray(this._comparator)) this._comparator = [ this._comparator ];

		var val = 0;

		for (var i = 0; i < this._comparator.length; i++) {
			var cmp = this._comparator[i];
			if (item_a.get(cmp.key) < item_b.get(cmp.key)) val = -1;
			if (item_a.get(cmp.key) > item_b.get(cmp.key)) val = 1;
			if (cmp.ord == 'dsc') val = -val;
			if (val !== 0) break;
		}

		return val;
    },
	_is_match: function (obj) {
		// obj = { json, is_valid, key, val }
		if (_.isNumber(obj.val))
			obj.val = '' + obj.val;

		if (!obj.json[obj.key]) {
			obj.is_valid = false;
		} else if (_.isString(obj.val)) {
			var ref = obj.json[obj.key];
			if (_.isArray(ref) && ref.indexOf(obj.val) == -1) {
				obj.is_valid = false;
			}
			if (_.isString(ref) && ref != '' + obj.val) {
				obj.is_valid = false;
			}
			if (_.isNumber(ref) && ref != +obj.val) {
				obj.is_valid = false;
			}
		} else if (_.isArray(obj.val)) {
			_.each(obj.val, function (tag) {
				if (obj.json[obj.key].indexOf(tag) == -1)
					obj.is_valid = false;
			});
		} else if (_.isObject(obj.val)) {
			if (obj.val.comparator == 'between') {
				if (obj.json[obj.key] > obj.val.start && obj.json[obj.key] < obj.val.end) {} else {
					obj.is_valid = false;
				}
			} else if (obj.val.comparator == 'equals') {
				if (obj.json[obj.key] != obj.val.value)
					obj.is_valid = false;
			} else if (obj.val.comparator == 'greaterthan') {
				if (obj.json[obj.key] <= obj.val.value)
					obj.is_valid = false;
			} else if (obj.val.comparator == 'lessthan') {
				if (obj.json[obj.key] >= obj.val.value)
					obj.is_valid = false;
			}
		}

		return obj;
	},
	on_init: function (opts) {
		var self = this;
		this.query = opts.query;

		_.each(this.query, function(val,key) {
			self.listenTo(app.collection,		'change:data'+key,		  self.on_fetch);
		});

		app.collection.each(function(model) {
			self._filter(model);
		});
	},
	on_fetch: function (model) {
		this._filter(model);
	},
	on_add: function (model) {
		this._filter(model);
	},
	on_update: function (model) {
		this._filter(model);
	},
	on_remove: function (model) {
		this.remove(model);
	},
	_filter: function (model) {
		var self	= this;

		var obj		= {
			is_valid	: true,
			json		: model.toJSON()
		};

		obj.json = _.extend(obj.json, obj.json.data);
		delete obj.json.data;

		if (!obj.json) {
			//app.log('Base Cluster Exception', model);
		} else {
			_.each(this.query, function (val, key) {
				obj.key = key;
				obj.val = val;
				self._is_match(obj);
			});

			if (obj.is_valid) {
				this.add(model).trigger('add', model);
			} else {
				this.remove(model);
			}
		}
	},
	get_match: function(given_obj) { // returns first match (in data) to given_obj
		var self	= this;
		var returnValue = undefined;

		this.each(function(model) {
			var obj		= {
				is_valid	: true,
				json		: model.toJSON()
			};

			obj.json = _.extend(obj.json, obj.json.data);
			delete obj.json.data;

			if (!obj.json) {
				//app.log('Base Cluster Exception', model);
			} else {
				//app.log("Get match", obj);
				_.each(given_obj, function (val, key) {
					obj.key = key;
					obj.val = val;
					self._is_match(obj);

					if (obj.is_valid && returnValue == undefined) {
						returnValue = model;
					}
				});
			}
		});

		return returnValue;
	}
});
