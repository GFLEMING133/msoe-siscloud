app.model.modal = {
	defaults: function (data) {
        var obj = {
            id		    : data.id,
            type        : 'modal',
            is_hidden   : 'true',
            header_text : 'Default Header',
            body_tmp    : 'modal-body-default-tmp',
            data    : {
                id		    : data.id,
                type        : 'modal'
            }
        };

        return obj;
    },
    on_init: function () {
        this.listenTo(app, 'modal:open', this.open);
        this.listenTo(app, 'modal:close', this.close);
    },
    open: function (msg) {
		var m = app.collection.get(msg.model_id);
		m.form_init();
		m.transfer_data_to_form();

		this.set(msg);
        this.set('is_hidden', 'false');
    },
    close: function () {
        this.set('is_hidden', 'true');
    },
	export_data: function () {
        // do nothing
		return this;
    },
	save: function () {
		// do nothing
		return this;
	}
};
