app.model.question = {
    defaults: function (data) {
		var obj = {
			id		            : data.id,
            type                : 'question',
            active              : 'false',
            forminstance_keys   : [],
			data	: {
				id			    : data.id,
				type    	    : 'question',
                version         : this.current_version,

                name		    : 'Question',
				category	    : 'text',
                placeholder     : 'Placeholder text here',
                default_value   : 'false',
                hint            : '',
                subtype         : 'false',                                  // questionmap: false, boolean, checkbox, quantity

                value           : 'What is your question?',
                options         : [ "Option 1" ],                           // radio, checkbox, dropdown
                start           : '1',                                      // scale, range
                end             : '5',                                      // scale, range
                start_label     : 'Start',                                  // scale
                end_label       : 'End',                                    // scale
                rows            : ['Row 1'],                                // grid
                columns         : ['Column 1'],                             // grid
                year            : 'true',                                   // date
                time            : 'false',                                  // date
                hashmap         : [{ key: 'key', value: 'value' }],         // hashmap
                form_instance   : [],                                       // form_instance
                filter          : [],                                       // form_instance
			}
		};

        return obj;
	},
    current_version: 1,
    on_init: function () {
        this.listenTo(app, 'update_active', this.update_active);
        this.on('add:data.options', this.on_add);
        this.on('change:data.form_instance[0]', this.get_forminstance_keys);
    },
    computed: [
        function (model) {
            var resp = {
                deps: ['data.category']
            };

            var cat     = model.get('data.category');
            var obj     = model.get('data');
            var opts    = '';

            //console.log('we are here', cat, obj, model._previousAttributes.category)

            if (cat == model._previousAttributes.category || model._previousAttributes.category == null)
                return resp;

            //var category = [  'text', 'password', 'paragraph', 'radio', 'checkbox', 'dropdown',
            //                  'hashmap', 'scale', 'range', 'grid', 'date', 'duration', 'timeperiod'
            //                  'forminstance', 'questionmap' ];

            var new_obj = {
                value           : '',                                       // text, paragraph, question_map
                default_value   : 'false',
                options         : [ "Option 1" ],                           // radio, checkbox, dropdown
                start           : '1',                                      // scale, range
                end             : '5',                                      // scale, range
                start_label     : 'Start',                                  // scale
                end_label       : 'End',                                    // scale
                rows            : ['Row 1'],                                // grid
                columns         : ['Column 1'],                             // grid
                year            : 'true',                                   // date
                time            : 'false',                                  // date
                hashmap         : [{ key: 'key', value: 'value' }],         // hashmap
                form_instance   : ['false', 'false', 'false']               // form_instance
            };

            model.set('data', _.extend(obj, new_obj));

            return resp;
        }
    ],
    get_forminstance_cluster: function () {
        var type        = this.get('data.form_instance[0]');
        var base_obj    = { type: type, is_deleted: 'false' };

        var filter      = this.get('data.filter');
        if (filter.length > 0) {
            var obj = {};
            _.each(filter, function(val, index) {
                obj[val.key] = val.value;
            });
            _.extend(base_obj, obj);
        }

        return base_obj;
    },
    add_hashmap_option: function () {
        this.add('data.hashmap', { key: 'key', value: 'value' });
        this.trigger('change:data.hashmap');
        this.save();
    },
    remove_hashmap_option: function (index) {
        var opts = this.get('data.hashmap');
        var r = opts.splice(index, 1);
        this.set('data.hashmap', opts).save();
        this.trigger('change:data.hashmap');
        this.trigger('remove:data.hashmap');
    },
    add_filter_option: function () {
        this.add('data.filter', { key: 'key', value: 'value' });
        this.trigger('change:data.filter');
        this.save();
    },
    remove_filter_option: function (index) {
        var opts = this.get('data.filter');
        var r = opts.splice(index, 1);
        this.set('data.filter', opts).save();
        this.trigger('change:data.filter');
        this.trigger('remove:data.filter');
    },
    add_option: function () {
        this.add('data.options', 'Option ' + (+this.get('data.options').length + 1));
        this.trigger('change:data.options');
        this.save();
    },
    add_row: function () {
        this.add('data.rows', 'Row ' + (this.get('data.rows').length + 1));
        this.trigger('change:data.rows').save();
        this.save();
    },
    add_column: function () {
        this.add('data.columns', 'Column ' + (this.get('data.columns').length + 1))
            .trigger('change:data.columns')
            .save(true);
    },
    remove_option: function (index) {
        var opts    = this.get('data.options');
        var r       = opts.splice(index, 1);
        this.set('data.options', opts)
            .save(true)
            .trigger('change:data.options')
            .trigger('remove:data.options');
    },
    remove_row: function (index) {
        var opts = this.get('data.rows');
        opts.splice(index, 1);
        this.set('data.rows', opts).save();
        this.trigger('change:data.rows');
        this.trigger('remove:data.rows');
    },
    remove_column: function (index) {
        var opts = this.get('data.columns');
        opts.splice(index, 1);
        this.set('data.columns', opts).save();
        this.trigger('change:data.columns');
        this.trigger('remove:data.columns');
    },
    update_active: function (msg) {
        var active = this.get('active');

        if (msg == this.id && active !== 'true')
            this.set('active', 'true');
        else if (msg !== this.id && active == 'true')
            this.set('active', 'false');
    },
    get_forminstance_keys: function () {
        console.log('reset forminstance keys');
		var data = this.get('data');
		var form_model = app.collection.get_form_model_by_type(data.form_instance[0]);
        var keys = (form_model) ? form_model.get_keys() : [];
        this.set('forminstance_keys', keys)
	},
    before_save: function () {
		if (app.plugins.falsy(this.get('data.organization_id')))
			this.set('data.organization_id', app.current_organization().id, { silent: true });
    }
};
