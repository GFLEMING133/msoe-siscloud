app.model.form = {
	defaults: function (data) {
		var obj = {
			id					: data.id,
			type				: 'form',
			next_section		: 'false',
			data		: {
				id					: data.id,
				type    			: 'form',
				deleted				: 'false',
				version				: this.current_version,

				name				: 'New Form',
				description			: '',
				instance_type		: '',
				instance_tags		: [],

				section_ids			: [],
				enable_form_logic	: {},		// section_id: true|false
				logic				: {},		// section_id: [{}, {}]
			}
		};

		return obj;
	},
	current_version: 2,
	versions: {
		'2': {
			forward: function (data) {
				data.section_ids = data.sections;
				delete data.sections;
				data.version = 2;
			},
			backward: function (data) {
				data.sections = data.section_ids;
				delete data.sections;
				data.version = 1;
			}
		}
	},
	before_save: function () {
		// Because we are saving. Not sure if it's a good place for it
		app.collection.add(this);
	},
	add_logic: function (params) {
		var key		= 'data.logic[' + params.section_id + ']';
		var logic	= {
			question	: 'false',
			comparator	: 'false',
			value		: '',
			section		: 'false'
		};

		this.add(key, logic).save();
	},
	remove_logic: function (params) {
		var key		= 'data.logic[' + params.section_id + ']';
		var opts	= this.get(key);
        var r		= opts.splice(+params.index, 1);

        this.set(key, opts).save();
        this.trigger('change:' + key);
        this.trigger('remove:' + key);
    },
	add_section: function () {
		var _id = this.get('next_section');

		if (app.plugins.falsy(_id))
			var _id = app.collection.add({ type: 'section' }).save().id;

		this.add('data.section_ids', _id)
			.set('data.enable_form_logic[' + _id + ']', 'false')
			.save()
			.set('next_section', 'false');
	},
	remove_section: function (id) {
		this.remove('data.section_ids', id);
		this.save();
		this.trigger('remove:data.section_ids', this);
	},
	duplicate: function (params) {
		params			= params.split('|');

		var model_id	= params[0];
		var index		= params[1];
		var model		= app.collection.get(model_id).get('data');

		delete model.id;

		var new_model	= app.collection.add(model);
		var order		= this.get('data.section_ids');

		order.splice(index, 0, new_model.id);

		this.set('data.section_ids', order).trigger('change:data.section_ids');
	},
	get_slugs: function () {
		var sections	= this.get('data.section_ids');
		var slugs		= [];

		_.each(sections, function (section_id) {
			var section = app.collection.get(section_id);
			var q		= section.get('data.questions');

			_.each(q, function (question_id) {
				var question	= app.collection.get(question_id);
				var slug		= app.plugins.slugify(question.attributes.name);

				slugs.push(slug);
			});
		});

		this.set('slugs', slugs);
		return slugs;
	}
};
