app.socket = {
    initialize: function () {
        var self = this;
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
