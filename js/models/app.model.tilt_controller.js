app.model.tilt_controller = {
  defaults: function (data) {
		var obj = {
			id			: data.id,
			type		: 'tilt_controller',

      is_ready    : 'false',

      el_id       : 'false',
      width       : 0,
      height      : 0,
      mid         : 0,
      ball_r      : 15,
      padding     : 10,

      is_listening: 'false',
      is_streaming: 'false',
      streaming_id: 'false',
      th_offset   : 0,
      send_offset : Math.PI/2,

      width       : 370,
      height      : 370,
      mid         : 185,

      x           : 185, // start at mid
      y           : 185, // start at mid
      theta       : 0, // remembering old theta

      ax          : 0, // x acceleration
      vx          : 0, // x velocity
      ay          : 0, // y acceleration
      vy          : 0, // y velocity
      friction    : 0.6, // 0-1, lower stops quicker, 1 is no slow down

      force       : 0, // tilt force to add to ball movement (taken from tilt)
      angle       : 0, // angle of force

      min_tilt: 1,
      max_tilt: 35,
      max_vel: 0.65, // max position velocity

      accel: 0.5, // table accel value
      vel: 1.5, // table vel
      thvmax: 1, // table thvmax
      send_delay: 5, // ms

      verts_to_send     : [], // save verts, then send when able
      is_sending_verts  : 'false', // currently sending

			data		: {
				id				: data.id,
				type    	: 'tilt_controller',
				version		: this.current_version,
			}
		};

		return obj;
	},

  sent_ms: 0, // milliseconds when last sent

  _old_x: 0, // accelerometer pos
  _old_y: 0, // accelerometer pos

	current_version : 1,
  on_init: function() {
    //
  },
  init_preview: function(data) {
    var self = this;
    app.log("Init Tilt Controller Preview", data);

    if (this.get('el_id') != data.el_id) this.set('el_id', data.el_id);

    var $el = $(data.el_id);

    var w = $el.innerWidth();
    this.set('width', w);
    this.set('height', w);
    var mid = w/2;
    this.set('mid', mid);
    this.set('x', mid); // update start ball_pos
    this.set('y', mid); // update start ball_pos
    var padding = this.get('padding');

    var svg = $('.tilt_preview');
    svg.attr('width', w)
      .attr('height', w)
      .attr("shape-rendering", "optimizeSpeed");

    var line_c = $('.line_c');
    line_c.attr('x1', mid).attr('x2', mid).attr('y1', mid).attr('y2', mid-40);
    var line_l = $('.line_l');
    line_l.attr('x1', mid).attr('x2', mid-10).attr('y1', mid-40).attr('y2', mid-30);
    var line_r = $('.line_r');
    line_r.attr('x1', mid).attr('x2', mid+10).attr('y1', mid-40).attr('y2', mid-30);

    var tilt_area = $('.tilt_area');
    tilt_area.attr('cx', mid)
      .attr('cy', mid)
      .attr('r', mid - padding);

    var tilt_position = $('.tilt_position');
    tilt_position.attr('r', this.get('ball_r')).attr('cx', mid).attr('cy', mid);

    var ball_position = $('.ball_position');
    ball_position.attr('cx', mid).attr('cy', mid);
  },
  _orientation_change: function(e) {
    // app.log("Orientation Change", e);
    var tNow = window.performance.now();

    var mid = this.get('mid');
    var padding = this.get('padding');
    var ball_r = this.get('ball_r');

    var x = e.gamma;
    var y = e.beta;
    // var z = e.alpha; // unused

    // make sure above minimum value
    var min_tilt = this.get('min_tilt');
    if (Math.abs(x) < min_tilt && Math.abs(y) < min_tilt) {
      x = 0;
      y = 0;
    }

    // prevent x flip
    var max_tilt = this.get('max_tilt');
    var max_flip = max_tilt - 5;
    if (x > max_flip && this._old_x < -max_flip) {
      x = -max_tilt;
      y = 180 - y; // this._old_y;
    } else if (x < -max_flip && this._old_x > max_flip) {
      x = max_tilt;
      y = 180 + y; // this._old_y;
    } else {
      // limit x
      if (x < -max_tilt) x = -max_tilt;
      else if (x > max_tilt) x = max_tilt;
      // limit y
      if (y < -max_tilt) y = -max_tilt;
      else if (y > max_tilt) y = max_tilt;
    }


    // change to polar
    var x_pos = x/max_tilt;
    var y_pos = y/max_tilt;
    var new_r = Math.sqrt(x_pos*x_pos + y_pos*y_pos);
    if (new_r > 1) new_r = 1; // clamp rho
    var new_th = Math.atan2(y, x);
    this.set('force', new_r);
    this.set('angle', new_th);
    var ax = Math.cos(new_th) * new_r;
    var ay = Math.sin(new_th) * new_r;

    this.set('ax', ax);
    this.set('ay', ay);

    // TODO: clamp
    // app.log("Orientation change, X:"+ax+" Y:"+ay, tNow);

    var ball_x = this.get('x');
    var old_x = this.get('x');
    var ball_y = this.get('y');
    var old_y = this.get('y');

    // update ball_position
    var friction = this.get('friction');
    var vx = this.get('vx');
    vx += ax;
    var vy = this.get('vy');
    vy += ay;

    // limit velocity
    var max_vel = this.get('max_vel');
    var v_r = Math.sqrt(vx*vx + vy*vy);
    if (v_r > max_vel) {
      var v_th = Math.atan2(vy, vx);
      var vx = Math.cos(v_th) * max_vel;
      var vy = Math.sin(v_th) * max_vel;

      // app.log("Velocity clamped", v_r, max_vel);
    }

    // reduce velocity with friction
    vx *= friction;
    this.set('vx', vx);
    vy *= friction;
    this.set('vy', vy);

    // set x, y for preview
    ball_x += vx;
    ball_y += vy;

    // keep within bounds
    var b_x = ball_x - mid;
    var b_y = ball_y - mid;
    var b_rho = Math.sqrt(b_x*b_x + b_y*b_y)/(mid-padding-ball_r);
    if (b_rho > 1) b_rho = 1;
    var b_r = (mid-padding-ball_r) * b_rho;
    var b_th;
    if (b_x != 0 || b_y != 0) b_th = Math.atan2(b_y, b_x); // make sure it won't be NaN
    else b_th = this.get('theta'); // use last value

    // TODO: fix th loop
    var th_offset = this.get('th_offset');
    var pi = Math.PI;
    var loop_th = pi * 2;
    var theta_old = this.get('theta'); // get old theta for compare
    this.set('theta', b_th); // save current theta for next time

    // app.log("b_h", b_th, theta_old);
    if (b_th - theta_old > pi) {
      th_offset -= loop_th;
      this.set('th_offset', th_offset);
    } else if (b_th - theta_old < -pi) {
      th_offset += loop_th;
      this.set('th_offset', th_offset);
    }
    b_th = b_th + th_offset;
    // app.log("accum_b_h", b_th);

    ball_x = mid + Math.cos(b_th) * b_r;
    ball_y = mid + Math.sin(b_th) * b_r;

    // TODO: send to table
    if (ball_x != old_x || ball_y != old_y) this.add('verts_to_send', {th:b_th+this.get('send_offset'),r:b_rho});
    if (this.get('is_sending_verts') == 'false' && this.get('verts_to_send').length > 0) this.send_verts();

    // app.log("Ball X,Y", ball_x, ball_y);
    this.set('x', ball_x);
    this.set('y', ball_y);

    var ball_position = $('.ball_position');
    ball_position.attr("cx", ball_x).attr("cy", ball_y);

    var tilt_position = $('.tilt_position');
    tilt_position.attr("cx", ax*(mid-padding-ball_r)+mid).attr("cy", ay*(mid-padding-ball_r)+mid);

    this._old_x = x;
    this._old_y = y;
  },
  send_verts: function() {
    var self = this;
    if (this.get('is_sending_verts') == 'true') return;

    var verts_to_send = JSON.parse(JSON.stringify(this.get('verts_to_send')));
    this.set('verts_to_send', []);

    if (verts_to_send.length > 0) {
      var ms_now = window.performance.now();
      app.log("Send Verts", ms_now - this.sent_ms, verts_to_send.length);
      var sisbot = app.manager.get_model('sisbot_id');
      sisbot._update_sisbot('add_verts_streaming', {id: self.get('streaming_id'), verts: verts_to_send, accel:self.get('accel'), vel: self.get('vel'), thvmax: self.get('thvmax')}, function(resp) {
        if (resp.err) {
          app.log("Verts error", resp);
          // put the sent verts back in beginnig of array
          var all_verts = self.get('verts_to_send');
          self.set('verts_to_send', verts_to_send.concat(all_verts));
        }

        // throttle the sending of new verts
        setTimeout(function() {
          self.set('is_sending_verts', 'false');
        }, self.get('send_delay'));
      });

      this.sent_ms = ms_now;
      this.set('is_sending_verts', 'true');
    }
  },
  start_listening: function() {
    var self = this;

    app.log("Tilt Controller: start_listening");
    this.set('is_ready', 'true');

    if (app.is_app) {
      if (app.platform == 'iOS' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(permissionState => {
          if (permissionState === 'granted') {
            app.log("Permission Granted");

            self._start_listening();
          }
        }).catch(console.error);
      } else {
        // handle regular non iOS 13+ devices
        self._start_listening();
      }
    } else {
      self._start_listening();
    }
  },
  orientation_func: null,
  _start_listening: function() {
    var self = this;

    // save new function to this (w/ ref to self), so we can remove the event listener later
    if (!this.orientation_func) {
      this.orientation_func = function(e) {
        self._orientation_change(e);
      };
    }

    var streaming = this.get('is_streaming');
    if (streaming == 'false') {
      app.log("Start Streaming");
      this.set('is_streaming', 'true');

      // add arrow to start of verts
      var th_offset = 0;
      var arrow_offset = Math.PI/6; // how wide of an arrow are we making?
      var arrow = [
        {th:th_offset, r:0},
        {th:th_offset, r:0.25},
        {th:th_offset+arrow_offset/2,r:0.22},
        {th:th_offset+arrow_offset,r:0.225},
        {th:th_offset+arrow_offset/2,r:0.22},
        {th:th_offset, r:0.25},
        {th:th_offset-arrow_offset/2,r:0.22},
        {th:th_offset-arrow_offset,r:0.225},
        {th:th_offset-arrow_offset/2,r:0.22},
        {th:th_offset, r:0.25},
        {th:th_offset, r:0}
      ];

      this.set('verts_to_send', arrow);

      // turn streaming on
      var sisbot = app.manager.get_model('sisbot_id');
      sisbot._update_sisbot('start_streaming', {accel:self.get('accel'), vel: self.get('vel'), thvmax: self.get('thvmax')}, function(resp) {
        if (resp.err) return app.log("Start Streaming Error", resp);

        app.log("Start Streaming Resp:", resp, sisbot.get('data.state'));

        // save streaming_id for streaming calls
        _.each(resp.resp, function(obj) {
          if (obj && obj.streaming_id) self.set('streaming_id', obj.streaming_id);
        });

        app.log("Start X,Y:", self.get('x'), self.get('y'));
        if (sisbot.get('data.state').includes('streaming')) {
          self.set('is_listening', 'true');

          // listen for changing page
    			self.listenToOnce(app.session, 'change:active.secondary', function () {
    				app.log("Page change: Stop streaming");
    				self.stop_listening();
    			});

          window.addEventListener('deviceorientation', self.orientation_func);
        } else {
          // start event listener
          self.listenTo(app, 'sisbot:state_change', self.state_listening);
        }
      });
    }
  },
  state_listening: function(data) {
    var self = this;
    if (data && data.state && data.state.includes('streaming')) {
      app.log("Tilt Controller: State changed", data, this.get('is_listening'), window.performance.now());
      if (data.state == 'streaming_waiting' && this.get('is_listening') == 'false') {
        this.set('is_listening', 'true');

        // listen for changing page
  			this.listenToOnce(app.session, 'change:active.secondary', function () {
  				app.log("Page change: Stop streaming");
  				self.stop_listening();
  			});

        this.send_verts();

        window.addEventListener('deviceorientation', this.orientation_func);
      }
    } else {
      // turn off listening
      this.stopListening(app, 'sisbot:state_change');
      this.set('is_listening', 'false');
    }
  },
  stop_listening: function() {
    var self = this;
    // Stops listener from triggering twice.
    this.stopListening(app.session, 'change:active.secondary');
    window.removeEventListener('deviceorientation', this.orientation_func);

    app.log("Stop Streaming");
    this.set('is_streaming', 'false')
      .set('is_listening', 'false')
      .set('is_ready', 'false');


    // turn streaming off
   if (self.get('streaming_id') !== 'false') {
     var sisbot = app.manager.get_model('sisbot_id');
     sisbot._update_sisbot('stop_streaming', {id: self.get('streaming_id')}, function(resp) {
       app.log("Stop Streaming Resp:", resp);
       self.set('streaming_id', 'false');
     });
   }
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
