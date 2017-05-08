app.model.section = {
	defaults: function (data) {
		var obj = {
			id			: data.id,
			type		: 'section',
			next_question: 'false',
			data		: {
				id				: data.id,
				type    		: 'section',
				deleted			: 'false',
				version     	: this.current_version,

				name			: 'New Section',
                question_ids    : [],
			}
		};

		return obj;
	},
	current_version: 2,
	versions: {
		'2': {
			forward: function (data) {
				data.question_ids = data.questions;
				delete data.questions;
				data.version = 2;
			},
			backward: function (data) {
				data.questions = data.question_ids;
				delete data.question_ids;
				data.version = 1;
			}
		}
	},
	add_question: function () {
		var q_id	= this.get('next_question');

		if (app.plugins.falsy(q_id))
			q_id	= app.collection.add({ type: 'question' }).save().id;

		this.add('data.question_ids', q_id)
			.save()
			.set('next_question', 'false');
	},
	remove_question: function (index) {
		var opts = this.get('data.question_ids');
        opts.splice(index, 1);
        this.save();
		this.trigger('remove:data.question_ids').trigger('change:data.question_ids');
	},
	duplicate: function (params) {
		var model_data	= _.extend({}, app.collection.get(params.id).get('data'));

		delete model_data.id;

		var new_model	= app.collection.add(model_data);

		var question = this.get('data.question_ids');
		question.splice(params.index, 0, new_model.id);
		this.set('data.question_ids', question).trigger('change:data.question_ids');

		this.save();
	},
	before_save: function () {
		if (app.plugins.falsy(this.get('data.organization_id')))
			this.set('data.organization_id', app.current_organization().id, { silent: true });
    }
};
