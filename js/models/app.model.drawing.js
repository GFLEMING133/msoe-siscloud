app.model.drawing = {
    defaults: function (data) {
		var obj = {
			id			: data.id,
			type		: 'drawing',

      is_ready    : 'false',

      el_id       : 'false',
      width       : 0,
      height      : 0,
      mid         : 0,
      is_dragging : 'false',
      drag_pos    : {
        start       : { x: 0, y: 0, w: 0, h: 0 }, // position of press
        offset      : { x: 0, y: 0, r: 0, d: 0 }, // position since last key point
        origin      : { x: 0, y: 0 }, // position of last point
        current     : { x: 0, y: 0, r: 0, d: 0 } // current position
      },
      paths       : [], // undo states
      path_count  : 0, // for undo states
      coords      : [], // cartesian coordinates

      d3_data : {
          background          : 'transparent', // transparent, #fdfaf3, #d6d2ca, #c9bb96
          stroke              : '#797977', // #797977, #948252
          mirror_stroke       : '#d6d2ca', // #797977, #948252
          stroke_width        : 3,
          stroke_edge         : '#fdfaf3', // #fdfaf3, #f6ebcd
          stroke_edge_width   : 6,
          zero_stroke_width   : 1,
          steps               : 0,
          r_max_dist          : 0.1,
          retrace_steps       : 5,
          loaded              : "false",
          circle              : "true",
          circle_stroke       : '#d6d2ca',
          circle_stroke_width : 2,
          start_color         : '#32B150',
          end_color           : '#990033',
          touch_color         : '#11b2fb',
          square              : "false"
      },

			data		: {
				id				: data.id,
				type    	: 'drawing',
				version		: this.current_version,

        name      : '',

				firstR		: 0,
				lastR			: 0,
        is_mirror : 'false', // reflect the movement
        multiply  : 1,       // repeat the movement this many times around theta
        divisor   : 2,       // when drawing on table, skip around pattern by 1/this

        verts     : [] // polar coordinates
			}
		};

		return obj;
	},
  max_r           : Math.PI/8,
  min_dist        : 4,
	current_version : 1,
  on_init: function() {
    this.on('change:paths', this.update_path_count);
    this.on('add:paths', this.update_path_count);
    this.on('remove:paths', this.update_path_count);
  },
  update_path_count: function() {
    this.set('path_count', _.size(this.get('paths')));
  },
  draw_preview: function(data) {
    var self = this;
    var $el = $(data.el_id);

    if (!$el) return; // exit if not able to draw
    if (this.get('is_ready') == 'true') {
      console.log("Skip draw_preview");
      return; // already drawn
    }

    // delay draw if library not loaded yet
    if (!window.hasOwnProperty('d3')) {
      return setTimeout(function() {
        console.log("Timeout Draw");
        self.draw_preview(data);
      }, 500);
    }

    console.log("Draw Preview", data);

    if (this.get('el_id') != data.el_id) this.set('el_id', data.el_id);

    var w = $el.innerWidth();
    this.set('width', w);
    this.set('height', w);
    this.set('mid', w/2);
    this.set('drag_pos.current.x', w/2);
    this.set('drag_pos.current.y', w/2);
    this.set('drag_pos.origin.x', w/2);
    this.set('drag_pos.origin.y', w/2);

    this.set('is_ready', 'true');

    this._draw_preview(data);

    // add listeners
    this.on('change:edit.firstR', this._draw_paths);
    this.on('change:edit.lastR', this._draw_paths);
    this.on('change:edit.is_mirror', this._draw_paths);
    this.on('change:edit.multiply', this._draw_paths);

    this.on('add:paths', this._draw_paths);
    this.on('change:paths', this._draw_paths);
    this.on('remove:paths', this._draw_paths);
  },
  _draw_preview: function(data) {
    // console.log("_Draw Preview", data);

    var self = this;
    var $el = $('.drawing_preview');
    $el.empty();

    var w = this.get('width');
    var h = this.get('height');
    var mid = this.get('mid');

    var is_mirror = this.get('edit.is_mirror') == 'true';
    var multiply = +this.get('edit.multiply');

    var d3_data = this.get('d3_data');

    var svg = d3.select($el[0]);

    var coords = this.get('coords');

    // get start_point
    var current_x = 0; //this.get('drag_pos.current.x');
    var current_y = 0; //this.get('drag_pos.current.y');

    // draw lines
    _.each(coords, function(point, index) {
      // skip first coord
      if (index > 0) {
        // mirrored trails
        if (is_mirror) {
          var mid = w/2;
          var x1 = mid - point[0] + mid;
          var x2 = mid - current_x + mid;

          self._line(svg, {x1:x1,y1:point[1],x2:x2,y2:current_y,stroke:d3_data.mirror_stroke,stroke_width:d3_data.stroke_width});

          // multiplier trails
          for (var i=2; i <= multiply; i++) {
            var degrees = 360 / multiply * (i-1);
            var new_point = self._rotate_coord([x1,point[1]], degrees);
            var new_curr = self._rotate_coord([x2, current_y], degrees);
            self._line(svg, {x1:new_point[0],y1:new_point[1],x2:new_curr[0],y2:new_curr[1],stroke:d3_data.mirror_stroke,stroke_width:d3_data.stroke_width});
          }
        }

        // multiplier trails
        for (var i=2; i <= multiply; i++) {
          var degrees = 360 / multiply * (i-1);
          var new_point = self._rotate_coord(point, degrees);
          var new_curr = self._rotate_coord([current_x, current_y], degrees);
          self._line(svg, {x1:new_point[0],y1:new_point[1],x2:new_curr[0],y2:new_curr[1],stroke:d3_data.mirror_stroke,stroke_width:d3_data.stroke_width});
        }

        self._line(svg, {x1:point[0],y1:point[1],x2:current_x,y2:current_y,stroke:d3_data.stroke,stroke_width:d3_data.stroke_width});
      }
      current_x = point[0];
      current_y = point[1];
    });
    if (this.get('is_dragging') == 'true') {
      if (is_mirror) {
        var mid = w/2;
        var x1 = mid - this.get('drag_pos.current.x') + mid;
        var x2 = mid - current_x + mid;

        self._line(svg, {x1:x1,y1:this.get('drag_pos.current.y'),x2:x2,y2:current_y,stroke:d3_data.mirror_stroke,stroke_width:d3_data.stroke_width});
      }

      self._line(svg, {x1:this.get('drag_pos.current.x'),y1:this.get('drag_pos.current.y'),x2:current_x,y2:current_y,stroke:d3_data.stroke,stroke_width:d3_data.stroke_width});
    }

    // drawing info
    if (this.get('is_dragging') == 'true') {
      svg.append("circle")
        .attr("r", 6)
        .attr("cx", this.get('drag_pos.start.x'))
        .attr("cy", this.get('drag_pos.start.y'))
        .attr("fill", d3_data.touch_color);

      svg.append("circle")
        .attr("r", 6)
        .attr("cx", this.get('drag_pos.offset.x'))
        .attr("cy", this.get('drag_pos.offset.y'))
        .attr("fill", d3_data.touch_color);
    }
  },
  _draw_paths: function() {
    var self = this;
    var $el = $('.drawing_paths');
    $el.empty();

    var paths = this.get('paths');
    if (paths.length == 0) return;

    var svg = d3.select($el[0]);
    var multiply = Math.max(1, +this.get('edit.multiply'));
    var lastR = this.get('edit.lastR');
    var mid = this.get('mid');

    // correct start rho if changed after drawing
    var first_y = paths[0].start.y;
    var firstR = +this.get('edit.firstR');
    var r_y = mid + firstR * (mid - 10);
    if (r_y != first_y) {
      svg.append("line")
        .attr("x1", mid)
        .attr("x2", mid)
        .attr("y1", r_y)
        .attr("y2", first_y);
    }

    console.log("Draw Paths", paths.length, multiply);
    for (var i=1; i <= multiply; i++) {
      var degrees = 360 / multiply * (i-1);

      _.each(paths, function(path, index) {
        svg.append("path")
          .attr("d", path.d)
          .attr('transform', 'rotate('+degrees+','+mid+','+mid+')');

        if (self.get('edit.is_mirror') == 'true') {
          svg.append("path")
            .attr('d', path.d)
            .attr('transform', 'translate('+self.get('width')+',0) scale(-1,1) rotate('+degrees+','+mid+','+mid+')');

          if (index == paths.length - 1) { // connect mirror to regular
            if (self.get('is_dragging') == 'false') {
              svg.append("line")
                .attr('x1', path.end.x)
                .attr('x2', mid - path.end.x + mid)
                .attr('y1', path.end.y)
                .attr('y2', path.end.y)
                .attr('transform', 'translate('+self.get('width')+',0) scale(-1,1) rotate('+degrees+','+mid+','+mid+')');
            }
          }
        } else if (index == paths.length - 1) { // draw to end point on last path
          var end_x = mid;
          var end_y = mid;
          if (lastR == 1) { // draw straight out at same angle
            var new_dx = path.end.x - mid;
            var new_dy = path.end.y - mid;
            var new_dist = Math.sqrt(new_dx*new_dx + new_dy*new_dy);
            var new_r = Math.atan2(new_dy, new_dx);
            end_x = mid + Math.cos(new_r) * (mid - 10);
            end_y = mid + Math.sin(new_r) * (mid - 10);
          }

          if (self.get('is_dragging') == 'false') {
            // connect end to lastR
            svg.append("line")
              .attr('x1', path.end.x)
              .attr('x2', end_x)
              .attr('y1', path.end.y)
              .attr('y2', end_y)
              .attr('transform', 'rotate('+degrees+','+mid+','+mid+')');
          }
        }
      });
    }
  },
  _make_path: function() {
    var self = this;
    var path = '';

    var coords = this.get('coords');
    _.each(coords, function(point, index) {
      if (index == 0) path += 'M';
      else path += 'L';
      path += point[0]+','+point[1];
    });
    // console.log("Path: ", path);

    return path;
  },
  _line: function(svg, obj) {
    svg.append("line")
      .attr("x1", obj.x1)
      .attr("y1", obj.y1)
      .attr("x2", obj.x2)
      .attr("y2", obj.y2)
      .attr('stroke', obj.stroke)
      .attr('stroke-width', obj.stroke_width)
      .attr('stroke-linecap', 'round');
  },
  _rotate_coord: function(point, degrees) {
    var w = +this.get('width') / 2;
    var h = +this.get('height') / 2;
    var x = point[0] - w;
    var y = point[1] - h;
    var angle = degrees * Math.PI / 180;

    // rotate point around center, by degrees
    var x1 = Math.cos(angle) * x + Math.sin(angle) * y;
    var y1 = Math.cos(angle) * y - Math.sin(angle) * x;

    return [x1+w,y1+h];
  },
  start_drag: function(data) {
    console.log("Start Drag", data);
    this.set('is_dragging', 'true');

    // touch coordinates
    this.set('drag_pos.start.x', +data.offset_x);
    this.set('drag_pos.start.y', +data.offset_y);
    this.set('drag_pos.start.w', this.get('width') / 2);
    this.set('drag_pos.start.h', this.get('height') / 2);
    if (this.get('edit.firstR') == 1) {
      this.set('drag_pos.start.h', this.get('height')-10);
    }
    this.set('drag_pos.offset.x', +data.offset_x);
    this.set('drag_pos.offset.y', +data.offset_y);

    this.set('drag_pos.origin.x', this.get('drag_pos.current.x'));
    this.set('drag_pos.origin.y', this.get('drag_pos.current.y'));

    // add first point
    this.add('coords', [this.get('drag_pos.current.x'), this.get('drag_pos.current.y')]);

    if (this.get('el_id') != 'false') {
      this._draw_paths();
      this._draw_preview({el_id: this.get('el_id')});
    } else {
      console.log("Start ", this.get('el_id'));
    }
  },
  drag: function(data) {
    if (this.get('is_dragging') == 'true') {
      var w = this.get('width');
      var h = this.get('height');

      var offset_x = this.get('drag_pos.offset.x');
      var offset_y = this.get('drag_pos.offset.y');

      var old_x = this.get('drag_pos.origin.x');
      var old_y = this.get('drag_pos.origin.y');

      if (data.offset_x != offset_x || data.offset_y != offset_y) {
        // rotation
        var dx = +data.offset_x - offset_x;
        var dy = +data.offset_y - offset_y;
        // var dist = Math.sqrt(dx*dx + dy*dy);
        var rotation = Math.atan2(dy, dx);

        // update current
        var new_x = this.get('drag_pos.current.x') + dx;
        var new_y = this.get('drag_pos.current.y') + dy;

        // make sure rho is < 1
        var new_dx = new_x - w/2;
        var new_dy = new_y - h/2;
        var new_dist = Math.sqrt(new_dx*new_dx + new_dy*new_dy);
        if (new_dist > w/2-10) {
          var new_r = Math.atan2(new_dy, new_dx);
          new_x = w/2 + Math.cos(new_r) * (w/2-10);
          new_y = h/2 + Math.sin(new_r) * (w/2-10);
        }

        this.set('drag_pos.current.x', new_x);
        this.set('drag_pos.current.y', new_y);

        var x = new_x - old_x;
        var y = new_y - old_y;
        var d = Math.sqrt(x*x + y*y);
        var r = Math.atan2(y, x);

        // add to the coords?
        var change = Math.abs(rotation - r);
        if (change > this.max_r && d > this.min_dist) {
          // console.log("Add Coords", change, this.get('drag_pos.current.x'), this.get('drag_pos.current.y'));
          var point = [this.get('drag_pos.current.x'), this.get('drag_pos.current.y')];
          this.add('coords', point);

          this.set('drag_pos.origin.x', point[0]);
          this.set('drag_pos.origin.y', point[1]);
        }

        // update offset
        this.set('drag_pos.offset.x', +data.offset_x);
        this.set('drag_pos.offset.y', +data.offset_y);

        if (this.get('el_id') != 'false') this._draw_preview({el_id: this.get('el_id')});
      }
    }
  },
  stop_drag: function(data) {
    if (this.get('is_dragging') == 'true') {
      console.log("Stop Drag", data);

      // add last point
      var first_point = this.get('coords')[0];
      var point = [this.get('drag_pos.current.x'), this.get('drag_pos.current.y')];
      this.add('coords', point);

      this.set('is_dragging', 'false');

      // add coords to paths
      var path = this._make_path();
      var obj = {
        d: path,
        points: this.get('coords'),
        start: {
          x: first_point[0],
          y: first_point[1]
        },
        end: {
          x: point[0],
          y: point[1]
        }
      };
      this.add('paths', obj);
      this.set('coords', []);

      // console.log("Add path", obj);

      if (this.get('el_id') != 'false') this._draw_preview({el_id: this.get('el_id')});
    }
  },
  update_verts: function() {
    // take coords, and convert to verts
    var coords = this.get('coords');

    // get start_point
    var current_x = this.get('width') / 2;
    var current_y = this.get('height') / 2;
    if (this.get('edit.firstR') == 1) {
      current_y = this.get('height');
    }

    // convert to polar
		var th_offset = 0;
		var last_th = 0;
		var pi = Math.PI;
		var loop_th = pi*2;
		_.each(coords, function(offset_point) {
      var point = [current_x + offset_point[0], current_y + offset_point[1]];

			var rho = Math.sqrt(point[0]*point[0]+point[1]*point[1]);
			var new_th =  Math.atan2(point[1],point[0])+pi/2;

      if (rho > 1) rho = 1;
      else if (rho < 0) {
        rho = -rho;
        new_th += loop_th;
      }

			if (new_th - last_th > pi) {
				th_offset -= loop_th;
			} else if (new_th - last_th < -pi) {
				th_offset += loop_th;
			}

      var polar_point = [new_th + th_offset, rho];
      this.add('edit.verts', polar_point);
      console.log("Point:", polar_point);

      current_x = point[0];
      current_y = point[1];

			last_th = new_th;
		});


  },
  undo: function() {
    var paths = this.get('paths');
    console.log("Undo", paths.length);

    if (paths.length > 0) {
      // pop off last path
      var path = paths.pop();

      // move start point
      this.set('drag_pos.current.x', path.start.x);
      this.set('drag_pos.current.y', path.start.y);

      this.update_path_count();
      this._draw_paths();
    }
  },
  clear: function() {
    console.log("Drawing clear");
    this.set('paths', []);
    this.set('coords', []);
    this.set('edit.verts', []);

    // reset start point
    this.set('drag_pos.current.x', this.get('mid'));
    this.set('drag_pos.current.y', +this.get('mid') + +this.get('edit.lastR') * (this.get('mid') - 10));

    if (this.get('el_id') != 'false') this._draw_preview({el_id: this.get('el_id')});
  },
	setup_edit: function () {
		this.set('edit', this.get('data')).set('errors', []);
		console.log("Drawing edit", this.get('edit'));

		return this;
	},
  export_data: function () {
    // do nothing
    return this;
  },
  save: function () {
    console.log("Save Drawing", this.get('edit'));
    var self = this;

    // loop through Paths
    var paths = self.get('paths');
    var mid = this.get('mid');
    var is_mirror = this.get('edit.is_mirror');
    var lastR = this.get('edit.lastR');
    if (is_mirror) lastR = this.get('edit.firstR');
    var length = this.get('edit.multiply');
    var divisor = this.get('edit.divisor');
    var is_even = true;

    var skip = length/divisor;
    if (skip != Math.floor(skip)) {
    	skip = Math.floor(skip);
      is_even = false;
    }

    // SVG values
    var svg = '<svg>';
    var rho_max = mid - 10;

    var index = 0;
    for(var i=0; i < length; i++) {
    	var value = index % length; // value for which multiplier around table to draw now
      console.log("Draw:", value);

      // draw path
      _.each(paths, function(path) {
        var points = path.points;
        var path_d = '';
        var point;

        _.each(points, function(p, index) {
          if (value != 0) { // rotate points
            var degrees = 360 / length * value;
            p = self._rotate_coord(p, degrees);
          }

          point = [(p[0]-mid)/rho_max, (p[1]-mid)/rho_max];

          if (index == 0) path_d += 'M'+point[0]+','+point[1];
          else path_d += 'L'+point[0]+','+point[1];
        });

        if (is_mirror == 'true') {
          var mirrored = points.reverse();
``
          // draw mirrored path in reverse
          _.each(points, function(p) {
            if (value != 0) { // rotate points
              var degrees = 360 / length * value;
              p = self._rotate_coord(p, degrees);
            }

            point = [(mid-p[0])/rho_max, (p[1]-mid)/rho_max]; // adjust to opposite side(x) of midpoint

            path_d += 'L'+point[0]+','+point[1];
          });
        }

        // TODO: bring last point to the given lastR
        var end_x = 0;
        var end_y = 0;
        if (lastR == 1) { // draw straight out at same angle
          var new_dx = point[0];
          var new_dy = point[1];
          var new_dist = Math.sqrt(new_dx*new_dx + new_dy*new_dy);
          var new_r = Math.atan2(new_dy, new_dx);
          end_x = Math.cos(new_r);
          end_y = Math.sin(new_r);
        }

        path_d += 'L'+end_x+','+end_y;

        svg += '<path d="'+path_d+'"></path>';
      });

    	index += skip;
      if (is_even && i % divisor == divisor-1) index++;
    }
    svg += '</svg>';

    // TODO: make track model and send to upload confirm page
    console.log("SVG", svg);
    var track_obj = {
      name: 'My Drawing',
      type: 'track',
      original_file_type: 'svg',
      file_data: svg
    };
    var track = app.collection.add(track_obj);
    track.set('svg_scaled', 'true')
      .set('upload_status', 'false');

    // TODO: change to own page?
    app.manager.add('tracks_to_upload', track.get('data'));

    app.trigger('session:active', {
      primary: 'settings',
      secondary: 'preview-upload',
      track_id: track.id
    });

    // do nothing
    return this;
  }
};
