app.socket = {
    initialize: function() {
        var self = this;

        app.scripts.fetch('js/libs/lib.socket.io.min.js', function() {
            if (!window.io) return false;

            var sisbot_id = app.manager.get('sisbot_id');
            if (sisbot_id == 'false')
                return this;

            var sisbot_ip = app.collection.get(sisbot_id).get('data.local_ip');
            console.log('Socket session', sisbot_ip);

            self.socket = io.connect(sisbot_ip + ':3002');

            self.socket.on('disconnect', function() {       self.on_disconnect();   });
            self.socket.on('reconnect', function() {        self.on_reconnect();    });

            self.socket.on('set', function(d) {             self.on_set(d);         });
            self.socket.on('erase', function(d) {           self.on_erase(d);       });
            self.socket.on('test', function(d) {            self.on_test(d);        });

            self.socket.emit('register', { id: sisbot_id });
        });
    },
    on_disconnect: function() {
        console.log('socket: disconnected');
    },
    on_reconnect: function() {
        console.log('socket: reconnect');
    },
    on_set: function(data) {
        console.log('socket: on_set');

        if (!_.isArray(data)) data = [ data];

        _.each(data, function(datum) {
            if (datum && datum.id) app.collection.get(datum.id).set('data', datum);
        });
    },
    on_erase: function(data) {
        console.log('socket: erase');
        //app.collection.remove(data.id);
    },
    on_test: function(data) {
        console.log('socket: test', data);
    },
};
