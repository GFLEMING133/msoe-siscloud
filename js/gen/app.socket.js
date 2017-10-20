app.socket = {
	server_ip: null,
    initialize: function() {
        var self = this;

        app.scripts.fetch('js/libs/lib.socket.io.min.js', function() {
            if (!window.io) return false;

			self._setup();
        });
    },
	_setup: function() {
		var self = this;

	    var sisbot_id = app.manager.get('sisbot_id');
	    if (sisbot_id == 'false') return this;

		// compare ip, if new, reset
	    var ip = app.collection.get(sisbot_id).get('data.local_ip');
		if (ip != this.server_ip) {
			this.server_ip = ip;
		    console.log('Socket session', this.server_ip);

			if (self.socket) {
				self.socket.close();
				delete self.socket;
			}

		    self.socket = io.connect(this.server_ip + ':3002');

			self.socket.on('connect', function () {			self.on_connect();		});
		    self.socket.on('reconnect', function() {        self.on_reconnect();    });
		    self.socket.on('disconnect', function() {       self.on_disconnect();   });
			self.socket.on('error', function(err) { 		self.on_error(err); 	});

		    self.socket.on('set', function(d) {             self.on_set(d);         });
		    self.socket.on('erase', function(d) {           self.on_erase(d);       });
		    self.socket.on('test', function(d) {            self.on_test(d);        });

		    self.socket.emit('register', { id: sisbot_id });
		}
	},
    on_connect: function() {
        console.log('socket: connect');
		app.trigger("socket:connect", null);
    },
    on_reconnect: function() {
        console.log('socket: reconnect');
		app.trigger("socket:reconnect", null);
    },
    on_disconnect: function() {
        console.log('socket: disconnect');
		app.trigger("socket:disconnect", null);
    },
    on_error: function(err) {
        console.log('socket: error', err);
		app.trigger("socket:error", err);
    },
    on_set: function(data) {

        if (!_.isArray(data)) data = [data];

		console.log('socket: on_set', _.pluck(data, 'id'));

        _.each(data, function(datum) {
            if (datum && datum.id) {
				if (app.collection.exists(datum.id)) app.collection.get(datum.id).set('data', datum);
				else app.collection.add(datum);
			}
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
