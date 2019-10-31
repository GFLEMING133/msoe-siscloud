app.socket = {
	server_ip: null,
	reset_socket: false,
  initialize: function() {
    var self = this;

    app.scripts.fetch('js/libs/lib.socket.io.min.js', function() {
      if (!window.io) return false;

			self._setup();
    });
  },
	_setup: function() {
		var self = this;

		if (app.config.env == 'alpha') return this;

    var sisbot_id = app.manager.get('sisbot_id');
    if (sisbot_id == 'false') return this;

		if (app.manager.get_model('sisbot_id').is_legacy() == true) return this;

		// compare ip, if new, reset
		var ip = app.config.get_sisbot_url();
		if (ip == 'false') return; // stop if not set

    //    console.log('ip===', ip)
    // var ip = app.collection.get(sisbot_id).get('data.local_ip');

		if(ip.match(/^https?:\/\//i)) ip = ip.replace(/^https?:\/\//i, "");
		if(ip.match(/:[0-9]+\/?$/i)) ip = ip.replace(/:[0-9]+\/?$/i, "");

		if (this.reset_socket) {
			console.log("Socket: Reset new Socket");
		} else if (this.server_ip == ip) return console.log("Same Socket IP, skip recreate", ip);

		this.server_ip = ip;
    console.log('Socket: Address', this.server_ip);

		if (self.socket) {
			console.log("Socket: Close", self.socket);
			self.socket.close();
			delete self.socket;
		}

    self.socket = io.connect( 'http://' + this.server_ip + ':3002'); //change to 3000 for download to work

		self.socket.on('connect', function () {			self.on_connect();		});
    self.socket.on('reconnect', function() {        self.on_reconnect();    });
    self.socket.on('reconnect_attempt', function() {        self.on_reconnect_attempt();    });
    self.socket.on('disconnect', function() {       self.on_disconnect();   });
		self.socket.on('error', function(err) { 		self.on_error(err); 	});

    self.socket.on('set', function(d) {             self.on_set(d);         });
    self.socket.on('erase', function(d) {           self.on_erase(d);       });
    self.socket.on('test', function(d) {            self.on_test(d);        });

    self.socket.emit('register', { id: sisbot_id });

		this.reset_socket = false;
	},
  on_connect: function(socket) {
    console.log('Socket: connect');
		app.trigger("socket:connect", null);
  },
  on_reconnect: function() {
    console.log('Socket: reconnect');
		app.trigger("socket:reconnect", null);
  },
  on_reconnect_attempt: function() {
    console.log('Socket: reconnect_attempt');
		app.trigger("socket:reconnect_attempt", null);
  },
  on_disconnect: function() {
    console.log('Socket: disconnect');
		this.reset_socket = true;
		app.trigger("socket:disconnect", null);
  },
  on_error: function(err) {
    console.log('Socket: error', err);
		app.trigger("socket:error", err);
  },
  on_set: function(data) {
		app.manager.intake_data(data);
  },
  on_erase: function(data) {
    console.log('Socket: erase');
    //app.collection.remove(data.id);
  },
  on_test: function(data) {
    console.log('Socket: test', data);
  },
};
