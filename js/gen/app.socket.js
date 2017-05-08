app.socket = {
    initialize: function () {
        var self = this;

        app.scripts.fetch('js/libs/lib.socket.io.min.js', function () {
            if (!window.io) return false;

            if (app.current_session().get('mode') == 'walksmart') return false;

            _.extend(self, Backbone.Events);

            self.socket  = io.connect(app.config.get_api_url(), { test: 'data' });

            self.socket.on('on_register',   function(d) { self.is_registered(d);    });
            self.socket.on('disconnect',    function()  { self.on_disconnect();     });
            self.socket.on('broadcast',     function(d) { self.on_broadcast(d);     });
            self.socket.on('reconnect',     function()  { self.on_reconnect();      });

            self.listenTo(app, 'session:user_sign_in', self.on_sign_in);
            if (app.current_user())
                self.on_sign_in(_.pick(app.current_user().get('data'), 'id', 'type', 'user_id', 'username'));
        });
    },
    is_registered   : false,
    user_data       : false,
    on_disconnect: function () {
        console.log('socket: disconnected');
    },
    on_broadcast: function (data) {
        if (!_.isArray(data)) data = [ data ];

        _.each(data, function (item) {
            app.collection.upsert(item);
        });
    },
    on_register: function () {
        this.is_registered = true;
    },
    on_sign_in: function (data) {
        this.user_data = _.extend({}, data);
        this.user_data.id = data.user_id;
        this.register_session();
    },
    on_reconnect: function () {
        console.log('socket: reconnected');
        this.register_session();
    },
    register_session: function () {
        if (this.user_data == false)
            return false;

        console.log('socket: register');
        this.socket.emit('register', this.user_data);
    },
};
