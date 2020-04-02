app.model.support_request = {
  defaults: function(data) {
    var obj = {
      id: data.id,
      type: 'support_request',

      is_submitting   : 'false',
      is_valid_email  : 'false',

      data: {
        id      : data.id,
        type    : 'support_request',
        version : this.current_version,

        email         :  'false',
        subject       : 'false',
        description   : 'false',
        order_num     : 'false',
        request_type  : 'false', // table_support|other_question
        // other request types: ordering_questions|quest_about_order_placed|bulk_purchase_request|distributor_request|
      }
    };

    return obj;
  },
  current_version: 1,
  on_init: function() {
    app.log("on_init() in app.model.support_request", this.id);

    var session_email = app.session.get('registration.email');
    if (session_email && session_email != '' && session_email != 'false') {
      if (app.plugins.valid_email(session_email)) {
        this.set('data.email', session_email).set('is_valid_email','true');
      }
    }

    return this;
  },
  save: function() {
    // do nothing
    return this;
  },
	/**************************** EDIT ****************************************/
	setup_edit: function () {
		this.set('edit', this.get('data')).set('errors', []);
	},
  confirm_email: function(data) {
    // app.log("Confirm Email:", data.value, app.plugins.valid_email(data));
    if (app.plugins.valid_email(data.value)) {
      app.log("Email confirmed:", data.value);
      this.set('is_valid_email', 'true');
    } else this.set('is_valid_email', 'false');
  },
  submit_request: function() {
    if (this.get('is_submitting') == 'true') return; // don't send twice

    app.log("Submit Support Request", this.get('edit'));
    var self = this;
    this.set('errors', []);

    // error checking
    var subject = this.get('edit.subject');
    if (!subject || subject == '' || subject == 'false') this.add('errors', 'Please include a subject'); // confirm subject
    var description = this.get('edit.description');
    if (!description || description == '' || description == 'false') this.add('errors', 'Please include a description'); // confirm description

    // exit if errors
    if (this.get('errors').length > 0) return;

    // mark submitting
    this.set('is_submitting', 'true');

    // add additional data to description
    var description = this.get('edit.description');
    // add table info
    var sisbot = app.manager.get_model('sisbot_id');
    description += '\n\nSisbot ID: '+sisbot.id;
    description += '\nSisbot Name: '+sisbot.get('data.name');
    if (sisbot.get('data.cson') != 'false') description += '\nConfig: '+sisbot.get('data.cson');
    description += '\nVersions: '+JSON.stringify(sisbot.get('local_versions'));
    // add app/browser info
    description += '\n\nUser agent: '+navigator.userAgent;
    if (app.is_app) {
      description += '\nApp version: '+app.config.version+', '+device.platform+' '+screen.width+'x'+screen.height;
    }

    // send to Webcenter
    var api_req = {
      _url: app.config.get_webcenter_url(),
      _type: 'POST',
      endpoint: 'users/support_request.json',
      subject: this.get('edit.subject'),
      description: description,
      email: this.get('edit.email'),
      request_type: this.get('edit.request_type')
      // custom_fields: [
      //   {id: 360005905632, value: }
      // ]
    };
    if (this.get('edit.order_num') != 'false') {
      // api_req.custom_fields.push({id: 360012022132, value: this.get('edit.order_num')});
      api_req.order_num = this.get('edit.order_num')
    }

    function cb(obj) {
      app.log("Support Request:", obj.resp);
      self.set('is_submitting', 'false');
      if (obj.err) {
        if (!_.isArray(obj.err)) obj.err = [obj.err];
        self.set('errors', obj.err);
        return self;
      }

      // change page to success
      if (obj.resp == 'ok') {
        var session_email = app.session.get('registration.email');
        if (!session_email || session_email == '' || session_email == 'false') app.session.set('registration.email', this.get('edit.email'));

        app.trigger('session:active', { secondary: 'support_success' });
      }
    }

    app.log("WC req:", api_req);
    app.post.fetch2(api_req, cb, 0);
  }
};
