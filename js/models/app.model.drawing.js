app.model.drawing = {
    defaults: function (data) {
		var obj = {
			id			: data.id,
			type		: 'drawing',

      el_id       : 'false',
      width       : 0,
      height      : 0,
      is_dragging : 'false',
      drag_pos    : {
        start   : { x: 0, y: 0, w: 0, h: 0 }, // position of press
        offset  : { x: 0, y: 0, r: 0, d: 0 }, // position since last key point
        origin  : { x: 0, y: 0 }, // position of last point
        current : { x: 0, y: 0, r: 0, d: 0 } // current position
      },
      coords     : [], // cartesian coordinates

      d3_data : {
          background          : 'transparent', // transparent, #fdfaf3, #d6d2ca, #c9bb96
          stroke              : '#797977', // #797977, #948252
          stroke_width        : 3,
          stroke_edge         : '#fdfaf3', // #fdfaf3, #f6ebcd
          stroke_edge_width   : 6,
          zero_stroke_width   : 1,
          points              :	[],
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
        mirror    : 'false', // reflect the movement
        multiply  : 1,        // repeat the movement this many times around theta

        verts     : [] // polar coordinates
			}
		};

		return obj;
	},
	current_version: 1,
  initialize: function() {
    this.listenTo('change:data.firstR', this.draw_preview);
    this.listenTo('change:data.lastR', this.draw_preview);
  },
  draw_preview: function(data) {
    var self = this;
    var $el = $(data.el_id);

    if (!$el) return; // exit if not able to draw
    // delay draw if library not loaded yet
    if (!window.hasOwnProperty('d3')) {
      return setTimeout(function() {
        console.log("Timeout Draw");
        self._draw_preview(data);
      }, 500);
    }

    console.log("Draw Preview", data);

    if (this.get('el_id') != data.el_id) this.set('el_id', data.el_id);

    this._draw_preview(data);
  },
  _draw_preview: function(data) {
    console.log("_Draw Preview", data);

    var self = this;
    var $el = $(data.el_id);
    $el.empty();

    var w = $el.innerWidth() - 20;
    this.set('width', w, {silent: true});
    var h = w;
    this.set('height', h, {silent: true});

    var d3_data = this.get('d3_data');

    var svg = d3.select($el[0])
      .append('svg')
      .attr('width', w)
      .attr('height', h);

    // circle border
    svg.append("circle")
      .attr("cx", w / 2)
      .attr("cy", h / 2)
      .attr("r", w / 2 - (d3_data.circle_stroke_width / 2))
      .attr('stroke', d3_data.circle_stroke)
      .attr('stroke-width', d3_data.circle_stroke_width)
      .attr("fill", d3_data.background);

    // zero line
    svg.append("line")
      .attr("x1", w / 2)
      .attr("y1", h / 2)
      .attr("x2", w / 2)
      .attr("y2", h)
      .attr('stroke', d3_data.circle_stroke)
      .attr('stroke-width', d3_data.zero_stroke_width);

    // start point
    var start_point = svg.append("circle")
      .attr("r", 3)
      .attr("fill", d3_data.start_color);
    if (this.get('edit.firstR') == 0) start_point.attr("cx", w / 2).attr("cy", h / 2);
    else start_point.attr("cx", w / 2).attr("cy", h - 2);

    // draw lines
    // get start_point
    var current_x = this.get('width') / 2;
    var current_y = this.get('height') / 2;
    if (this.get('edit.firstR') == 1) {
      current_y = this.get('height');
    }
    var coords = this.get('coords');
    _.each(coords, function(point) {
      svg.append("line")
        .attr("x1", point[0])
        .attr("y1", point[1])
        .attr("x2", current_x)
        .attr("y2", current_y)
        .attr('stroke', d3_data.stroke)
        .attr('stroke-width', d3_data.stroke_width)
        .attr('stroke-linecap', 'round');

      current_x = point[0];
      current_y = point[1];
    });
    if (this.get('is_dragging')) {
      svg.append("line")
        .attr("x1", this.get('drag_pos.current.x'))
        .attr("y1", this.get('drag_pos.current.y'))
        .attr("x2", current_x)
        .attr("y2", current_y)
        .attr('stroke', d3_data.stroke)
        .attr('stroke-width', d3_data.stroke_width)
        .attr('stroke-linecap', 'round');
    }

    // end point
    var end_point = svg.append("rect")
      .attr("width", 4)
      .attr("height", 4)
      .attr("fill", d3_data.end_color);
    if (this.get('edit.lastR') == 0) end_point.attr("x", w / 2 - 2).attr("y", h / 2 - 2);
    else end_point.attr("x", w / 2 - 2).attr("y", h - 4);

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
  start_drag: function(data) {
    console.log("Start Drag", data);
    this.set('is_dragging', 'true');

    // touch coordinates
    this.set('drag_pos.start.x', +data.offset_x);
    this.set('drag_pos.start.y', +data.offset_y);
    this.set('drag_pos.start.w', this.get('width') / 2);
    this.set('drag_pos.start.h', this.get('height') / 2);
    if (this.get('edit.firstR') == 1) {
      this.set('drag_pos.start.h', this.get('height'));
    }
    this.set('drag_pos.offset.x', +data.offset_x);
    this.set('drag_pos.offset.y', +data.offset_y);

    // draw coordinates
    var coords = this.get('coords');
    if (coords.length == 0) {
      this.set('drag_pos.current.x', this.get('width') / 2);
      this.set('drag_pos.current.y', this.get('height') / 2);
    }

    if (this.get('el_id') != 'false') this._draw_preview({el_id: this.get('el_id')});
  },
  drag: function(data) {
    if (this.get('is_dragging') == 'true') {
      var old_x = this.get('drag_pos.offset.x');
      var old_y = this.get('drag_pos.offset.y');
      var old_d = this.get('drag_pos.offset.d');
      var old_r = this.get('drag_pos.offset.r');

      if (data.offset_x != old_x || data.offset_y != old_y) {
        // rotation
        var dx = +data.offset_x - old_x;
        var dy = +data.offset_y - old_y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        var rotation = Math.atan2(dy, dx);

        // update current
        this.set('drag_pos.current.x', this.get('drag_pos.start.w') + this.get('drag_pos.offset.x') - this.get('drag_pos.start.x'));
        this.set('drag_pos.current.y', this.get('drag_pos.start.h') + this.get('drag_pos.offset.y') - this.get('drag_pos.start.y'));

        // add to the coords?
        if (Math.abs(rotation - old_r) > 0.3) {
          // console.log("Add Coords", this.get('drag_pos.current.x'), this.get('drag_pos.current.y'));
          this.add('coords', [this.get('drag_pos.current.x'), this.get('drag_pos.current.y')]);

          // update offset
          this.set('drag_pos.offset.x', +data.offset_x);
          this.set('drag_pos.offset.y', +data.offset_y);
          this.set('drag_pos.offset.d', dist);
          this.set('drag_pos.offset.r', rotation);

          if (this.get('el_id') != 'false') {
            console.log("Added coords");
            this._draw_preview({el_id: this.get('el_id')});
          }
        }
      }
    }
  },
  stop_drag: function(data) {
    console.log("Stop Drag", data, this.get('coords'));
    this.set('is_dragging', 'false');

    if (this.get('el_id') != 'false') this._draw_preview({el_id: this.get('el_id')});
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
  clear: function() {
    console.log("Drawing clear");
    this.set('coords', []);
    this.set('edit.verts', []);

    if (this.get('el_id') != 'false') this.draw_preview({el_id: this.get('el_id')});
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
    // do nothing
    return this;
  }
};
