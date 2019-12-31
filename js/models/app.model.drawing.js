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
      padding     : 10,
      smooth      : 0.125,
      is_dragging : 'false',
      drag_pos    : {
        start       : { x: 0, y: 0, w: 0, h: 0 }, // position of press
        offset      : { x: 0, y: 0, r: 0, d: 0 }, // position since last key point
        origin      : { x: 0, y: 0 }, // position of last point
        current     : { x: 0, y: 0, r: 0, d: 0 } // current position
      },
      paths       : [], // undo states
      redo_paths  : [], // redo states
      path_count  : 0, // for undo states
      redo_count  : 0, // for redo states
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
        mirror    : 'false', // false|horizontal|vertical|both
        multiply  : 5,       // repeat the movement this many times around theta
        divisor   : 2,       // when drawing on table, skip around pattern by 1/divisor
        verts     : [] // polar coordinates
			}
		};

		return obj;
	},
  scroll_el       : null, // memory for turning on/off scrolling
  max_r           : Math.PI/24, // how far line can rotate before adding new control point (Math.PI/24)
  min_dist        : 8, // how far line must extend before adding new control point (4)
	current_version : 1,
  on_init: function() {
    this.on('change:paths', this.update_path_count);
    this.on('add:paths', this.update_path_count);
    this.on('remove:paths', this.update_path_count);
  },
  firstR_change: function() {
    var firstR = this.get('edit.firstR');

    if (firstR == 1) this.set('edit.firstR', 0);
    else this.set('edit.firstR', 1);
  },
  _firstR_change: function() {
    var mirror = (this.get('edit.mirror') != 'false');
    if (mirror) this.set('edit.lastR', this.get('edit.firstR'), {silent:true});

    this._draw_paths();
  },
  lastR_change: function() {
    var lastR = this.get('edit.lastR');

    if (lastR == 1) this.set('edit.lastR', 0);
    else this.set('edit.lastR', 1);
  },
  step_mirror: function() {
    var mirror = this.get('edit.mirror');
    switch (mirror) {
      case 'false':
        this.set('edit.mirror', 'vertical');
        break;
      case 'vertical':
        this.set('edit.mirror', 'horizontal');
        break;
      case 'horizontal':
        this.set('edit.mirror', 'both');
        break;
      default:
        this.set('edit.mirror', 'false');
    }
  },
  mirror_change: function() {
    var mirror = (this.get('edit.mirror') != 'false');
    if (mirror) this.set('edit.lastR', this.get('edit.firstR'), {silent:true});

    var $h_zero_line = $('.h_zero_line');
    var h_zero_line = d3.select($h_zero_line[0]);
    var $v_zero_line = $('.v_zero_line');
    var v_zero_line = d3.select($v_zero_line[0]);
    switch (this.get('edit.mirror')) {
      case 'horizontal':
        h_zero_line.attr('visibility', 'visible');
        v_zero_line.attr('visibility', 'hidden');
        break;
      case 'vertical':
        h_zero_line.attr('visibility', 'hidden');
        v_zero_line.attr('visibility', 'visible');
        break;
      case 'both':
        h_zero_line.attr('visibility', 'visible');
        v_zero_line.attr('visibility', 'visible');
        break;
      default:
        h_zero_line.attr('visibility', 'hidden');
        v_zero_line.attr('visibility', 'hidden');
    }

    this._draw_paths();
  },
  multiply_change: function() {
    var multiply = this.get('edit.multiply');
    if (!_.isFinite(multiply)) this.set('edit.multiply', 1).set('data.multiply', 1);
    else if (multiply < 1) this.set('edit.multiply', 1).set('data.multiply', 1);

    this._draw_paths();
  },
  update_path_count: function() {
    this.set('path_count', _.size(this.get('paths')));
    this.set('redo_count', _.size(this.get('redo_paths')));
  },
  draw_preview: function(data) {
    var self = this;
    var $el = $(data.el_id);

    if (!$el) return; // exit if not able to draw
    if (this.get('is_ready') == 'true') {
      // app.log("Skip draw_preview");
      return; // already drawn
    }

    // delay draw if library not loaded yet
    if (!window.hasOwnProperty('d3')) {
      return setTimeout(function() {
        // app.log("Timeout Draw");
        self.draw_preview(data);
      }, 500);
    }

    // app.log("Draw Preview", data);

    if (this.get('el_id') != data.el_id) this.set('el_id', data.el_id);

    var w = $el.innerWidth();
    this.set('width', w);
    this.set('height', w);
    var mid = w/2;
    this.set('mid', mid);
    var padding = this.get('padding');

    if (this.get('path_count') < 1) {
      this.set('drag_pos.current.x', mid);
      this.set('drag_pos.current.y', mid);
      this.set('drag_pos.origin.x', mid);
      this.set('drag_pos.origin.y', mid);
    }

    // Add fields
    var d3_data = this.get('d3_data');
    var svg = d3.select($('.drawing_area')[0]);
    svg.attr('width', w)
      .attr('height', w)
      .attr("shape-rendering", "optimizeSpeed");

    // Zero lines
    svg.append("line")
      .attr("class", "h_zero_line")
      .attr("x1", mid)
      .attr("y1", padding)
      .attr("x2", mid)
      .attr("y2", w-padding)
      .attr('stroke', d3_data.circle_stroke)
      .attr('stroke-width', d3_data.zero_stroke_width)
      .attr('stroke-linecap', 'round');
    svg.append("line")
      .attr("class", "v_zero_line")
      .attr("x1", padding)
      .attr("y1", mid)
      .attr("x2", w-padding)
      .attr("y2", mid)
      .attr('stroke', d3_data.circle_stroke)
      .attr('stroke-width', d3_data.zero_stroke_width)
      .attr('stroke-linecap', 'round');
    this.mirror_change();

    // Circle border
    svg.append("circle")
      .attr("r", mid-padding)
      .attr("cx", mid)
      .attr("cy", mid)
      .attr('stroke', d3_data.circle_stroke)
      .attr('stroke-width', d3_data.circle_stroke_width)
      .attr("fill", "transparent");

    // rendering groups
    svg.append("g")
      .attr("class", "drawing_paths")
      .attr("stroke-linecap", "round")
      .attr("fill", "transparent")
      .attr("stroke", d3_data.mirror_stroke)
      .attr("stroke-width", d3_data.stroke_width);
    svg.append("g")
      .attr("class", "drawing_preview");
    svg.append("g")
      .attr("class", "drawing_lines");

    // touch  pos
    svg.append("circle")
      .attr("class", 'c_touch_start')
      .attr("r", 6)
      .attr("visibility", "hidden")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("fill", d3_data.touch_color);

    svg.append("circle")
      .attr("class", 'c_touch_end')
      .attr("r", 6)
      .attr("visibility", "hidden")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("fill", d3_data.touch_color);

    this.set('is_ready', 'true');

    this._draw_preview(data);
    this._draw_paths();

    // add listeners
    this.on('change:edit.firstR', this._firstR_change);
    this.on('change:edit.lastR', this._draw_paths);
    this.on('change:edit.mirror', this.mirror_change);
    this.on('change:edit.multiply', this.multiply_change);
    this.on('change:smooth', this._recreate_paths);

    this.on('add:paths', this._draw_paths);
    this.on('change:paths', this._draw_paths);
    this.on('remove:paths', this._draw_paths);
  },
  _draw_preview: function(data) {
    // app.log("_Draw Preview");

    var self = this;
    var $el = $('.drawing_preview');

    var $lines = $('.drawing_lines');
    $lines.empty();
    var lines = d3.select($lines[0]);

    var w = this.get('width');
    var h = this.get('height');
    var mid = this.get('mid');

    var mirror = this.get('edit.mirror') != 'false';
    var multiply = +this.get('edit.multiply');

    var d3_data = this.get('d3_data');

    var svg = d3.select($el[0]);

    var coords = this.get('coords');

    // get start_point
    var current_x = 0; //this.get('drag_pos.current.x');
    var current_y = 0; //this.get('drag_pos.current.y');

    // app.log("_Draw Preview: coords");

    // draw to drawing_lines
    if (this.get('is_dragging') == 'true') {

      current_x = coords[coords.length-1][0];
      current_y = coords[coords.length-1][1];

      // if (mirror) {
      //   var mid = w/2;
      //   var x1 = mid - this.get('drag_pos.current.x') + mid;
      //   var x2 = mid - current_x + mid;
      //
      //   self._line(lines, {x1:x1,y1:this.get('drag_pos.current.y'),x2:x2,y2:current_y,stroke:d3_data.mirror_stroke,stroke_width:d3_data.stroke_width});
      // }

      self._line(lines, {x1:this.get('drag_pos.current.x'),y1:this.get('drag_pos.current.y'),x2:current_x,y2:current_y,stroke:d3_data.stroke,stroke_width:d3_data.stroke_width});
    } else {
      $el.empty(); // clear preview lines
    }

    // drawing info
    var $c_touch_start = $('.c_touch_start');
    var c_touch_start = d3.select($c_touch_start[0]);
    var $c_touch_end = $('.c_touch_end');
    var c_touch_end = d3.select($c_touch_end[0]);
    if (this.get('is_dragging') == 'true') {
      c_touch_start.attr("visibility", "visible")
        .attr("cx", this.get('drag_pos.start.x'))
        .attr("cy", this.get('drag_pos.start.y'));
      c_touch_end.attr("visibility", "visible")
        .attr("cx", this.get('drag_pos.offset.x'))
        .attr("cy", this.get('drag_pos.offset.y'));
    } else {
      c_touch_start.attr("visibility", "hidden");
      c_touch_end.attr("visibility", "hidden");
    }

    // app.log("_Draw Preview: finished");
  },
  _recreate_paths: function() {
    // app.log("_recreate_paths()");
    var self = this;

    // remake path.d's
    var paths = this.get('paths');
    _.each(paths, function(path) {
      path.d = self._make_path(path.points);
    });

    this._draw_paths();
  },
  _draw_paths: function() {
    var self = this;
    var $el = $('.drawing_paths');
    $el.empty();

    var paths = this.get('paths');

    // app.log("Draw Paths", paths);

    var svg = d3.select($el[0]);
    var d3_data = this.get('d3_data');
    var mirror = this.get('edit.mirror');
    var multiply = Math.max(1, +this.get('edit.multiply'));
    var firstR = this.get('edit.firstR');
    var lastR = this.get('edit.lastR');
    var mid = this.get('mid');
    var padding = this.get('padding');

    // correct start rho if changed after drawing
    if (paths.length > 0) {
      var first_x = paths[0].start.x;
      var r_x = mid - firstR * (mid - padding);
      if (r_x != first_x) {
        svg.append("line")
          .attr("x1", r_x)
          .attr("x2", mid)
          .attr("y1", mid)
          .attr("y2", mid);
      }
    } else { // fix start pos
      // app.log("Start at padding");
      this.set('drag_pos.current.x',mid - (firstR * (mid - padding)));
    }

    for (var i=1; i <= multiply; i++) {
      var degrees = 360 / multiply * (i-1);

      _.each(paths, function(path, index) {
        svg.append("path")
          .attr("d", path.d)
          .attr('transform', 'rotate('+degrees+','+mid+','+mid+')');

        if (mirror != 'false') {
          if (mirror == 'both' || mirror == 'vertical') {
            svg.append("path")
              .attr('d', path.d)
              .attr('transform', 'translate(0,'+self.get('height')+') scale(1,-1) rotate('+degrees+','+mid+','+mid+')');
          }
          if (mirror == 'both' || mirror == 'horizontal') {
            svg.append("path")
              .attr('d', path.d)
              .attr('transform', 'translate('+self.get('width')+',0) scale(-1,1) rotate('+degrees+','+mid+','+mid+')');
          }
          if (mirror == 'both') {
            svg.append("path")
              .attr('d', path.d)
              .attr('transform', 'translate('+self.get('width')+','+self.get('height')+') scale(-1,-1) rotate('+degrees+','+mid+','+mid+')');
          }

          if (index == paths.length - 1) {
            if (self.get('is_dragging') == 'false') {
              if (mirror == 'horizontal') { // horizonal mirror connect
                svg.append("line")
                  .attr("class", "end_line")
                  .attr('x1', path.end.x)
                  .attr('x2', mid - path.end.x + mid)
                  .attr('y1', path.end.y)
                  .attr('y2', path.end.y)
                  .attr('transform', 'translate('+self.get('width')+',0) scale(-1,1) rotate('+degrees+','+mid+','+mid+')');
              }

              if (mirror == 'vertical' || mirror == 'both') { // vertical mirror connect
                svg.append("line")
                  .attr("class", "end_line")
                  .attr('x1', path.end.x)
                  .attr('x2', path.end.x)
                  .attr('y1', path.end.y)
                  .attr('y2', mid - path.end.y + mid)
                  .attr('transform', 'translate(0,'+self.get('height')+') scale(1,-1) rotate('+degrees+','+mid+','+mid+')');
              }

              if (mirror == 'both') {
                svg.append("line")
                  .attr("class", "end_line")
                  .attr('x1', mid - path.end.x + mid)
                  .attr('x2', mid - path.end.x + mid)
                  .attr('y1', path.end.y)
                  .attr('y2', mid - path.end.y + mid)
                  .attr('transform', 'translate(0,'+self.get('height')+') scale(1,-1) rotate('+degrees+','+mid+','+mid+')');
              }
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
            end_x = mid + Math.cos(new_r) * (mid - padding);
            end_y = mid + Math.sin(new_r) * (mid - padding);
          }

          if (self.get('is_dragging') == 'false') {
            // connect end to lastR
            svg.append("line")
              .attr("class", "end_line")
              .attr('x1', path.end.x)
              .attr('x2', end_x)
              .attr('y1', path.end.y)
              .attr('y2', end_y)
              .attr('transform', 'rotate('+degrees+','+mid+','+mid+')');
          }
        }
      });
    }

    // firstR
    svg.append("circle")
      .attr("r", 3)
      .attr("fill", d3_data.start_color)
      .attr("cx", mid - (mid - padding)*firstR)
      .attr("cy", mid)
      .attr("stroke-width", 0);

    // lastR
    svg.append("rect")
      .attr("width", 4)
      .attr("height", 4)
      .attr("fill", d3_data.end_color)
      .attr("x", mid - 2 - (mid - padding)*lastR)
      .attr("y", mid-2)
      .attr("stroke-width", 0);

    // start point
    if (this.get('is_dragging') == 'false') {
      svg.append("circle")
        .attr("r", 3)
        .attr("fill", d3_data.touch_color)
        .attr("cx", this.get('drag_pos.current.x'))
        .attr("cy", this.get('drag_pos.current.y'))
        .attr("stroke-width", 0);
    }

    // app.log("Draw Paths", paths.length, multiply);
  },
  _make_path: function(coords) {
    var self = this;
    var path = '';

    var coord_count = coords.length;
    _.each(coords, function(point, index) {
      if (index == 0) path += 'M'+point[0]+' '+point[1];
      else {
        if (self.get('smooth') > 0) path += self._b_bezierCommand(point, index, coords);
        else path += 'L'+point[0]+' '+point[1];
      }
    });
    // app.log("Path: ", self.get('smooth'), path);

    return path;
  },
  _b_line: function(pointA, pointB) {
    var lengthX = pointB[0] - pointA[0];
    var lengthY = pointB[1] - pointA[1];
    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX)
    };
  },
  _b_controlPoint: function(current, previous, next, reverse) {
    var p = previous || current;
    var n = next || current;

    // The smoothing ratio
    var smoothing = this.get('smooth');

    // Properties of the opposed-line
    var o = this._b_line(p, n);

    // If is end-control-point, add PI to the angle to go backward
    var angle = o.angle + (reverse ? Math.PI : 0);
    var length = o.length * smoothing;

    // The control point position is relative to the current point
    var x = current[0] + Math.cos(angle) * length;
    var y = current[1] + Math.sin(angle) * length;
    return [x, y];
  },
  _b_bezierCommand: function(point, i, a) {
    // start control point
    var [cpsX, cpsY] = this._b_controlPoint(a[i - 1], a[i - 2], point);
    // end control point
    var [cpeX, cpeY] = this._b_controlPoint(point, a[i - 1], a[i + 1], true);

    return 'C '+cpsX+','+cpsY+' '+cpeX+','+cpeY+' '+point[0]+','+point[1];
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
    // app.log("Start Drag", data);
    var w = this.get('width');
    var padding = this.get('padding');

    // touch coordinates
    this.set('drag_pos.start.x', +data.offset_x);
    this.set('drag_pos.start.y', +data.offset_y);
    this.set('drag_pos.offset.x', +data.offset_x);
    this.set('drag_pos.offset.y', +data.offset_y);

    this.set('drag_pos.origin.x', this.get('drag_pos.current.x'));
    this.set('drag_pos.origin.y', this.get('drag_pos.current.y'));

    // make sure touch is within circle
    var new_dx = +data.offset_x - w/2;
    var new_dy = +data.offset_y - w/2;
    var touch_dist = Math.sqrt(new_dx*new_dx + new_dy*new_dy);

    if (touch_dist < w/2 - padding) {
      this.set('is_dragging', 'true');
    } else return;

    // app.log("Coords", this.get('drag_pos.current'));

    // clear redo states
    this.set('redo_paths', []);

    // disable scrolling in app
    // if (app.is_app) {
      if (!this.scroll_el) this.scroll_el = $('.scroll');
      var offset_scroll = this.scroll_el.scrollTop();
      // app.log("Offset scroll", offset_scroll, this.get('drag_pos.start.y'));
      this.set('drag_pos.start.y', this.get('drag_pos.start.y') - offset_scroll);
      this.set('drag_pos.offset.y', this.get('drag_pos.offset.y') - offset_scroll);
      this.scroll_el.scrollTop(0);
      this.scroll_el.removeClass('scroll');
    // }

    // increase rendering speed
    d3.select($('.drawing_area')[0]).attr("shape-rendering", "crispEdges");

    // add first point
    this.add('coords', [this.get('drag_pos.current.x'), this.get('drag_pos.current.y')]);

    if (this.get('el_id') != 'false') {
      // hide end_lines
      var end_lines = $('.end_line');
      _.each(end_lines, function($el) {
        var line = d3.select($el);
        line.attr('visibility', 'hidden');
      });

      // this._draw_paths();
      this._draw_preview({el_id: this.get('el_id')});
    } else {
      // app.log("Start ", this.get('el_id'));
    }
    // app.log("Start Drag: finished");
  },
  drag: function(data) {
    var self = this;
    // app.log("Drag");
    if (this.get('is_dragging') == 'true') {
      var w = this.get('width');
      var h = this.get('height');
      var padding = this.get('padding');

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
        if (new_dist > w/2-padding) {
          var new_r = Math.atan2(new_dy, new_dx);
          new_x = w/2 + Math.cos(new_r) * (w/2-padding);
          new_y = h/2 + Math.sin(new_r) * (h/2-padding);
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
          // app.log("Add Coords", change, this.get('drag_pos.current.x'), this.get('drag_pos.current.y'));
          var point = [this.get('drag_pos.current.x'), this.get('drag_pos.current.y')];
          this.add('coords', point);

          this.set('drag_pos.origin.x', point[0]);
          this.set('drag_pos.origin.y', point[1]);

          // add to preview
          var $el = $('.drawing_preview');
          var svg = d3.select($el[0]);
          var mirror = this.get('edit.mirror');
          var multiply = +this.get('edit.multiply');
          var d3_data = this.get('d3_data');

          if (mirror != 'false') {
            var mid = w/2;
            var x1 = mid - point[0] + mid;
            var x2 = mid - old_x + mid;
            var y1 = mid - point[1] + mid;
            var y2 = mid - old_y + mid;

            if (mirror == 'vertical' || mirror == 'both') {
              self._line(svg, {
                x1:point[0],
                y1:y1,
                x2:old_x,
                y2:y2,
                stroke:d3_data.mirror_stroke,
                stroke_width:d3_data.stroke_width
              });

              // multiplier trails
              for (var i=2; i <= multiply; i++) {
                var degrees = 360 / multiply * (i-1);
                var new_point = self._rotate_coord([point[0], y1], degrees);
                var new_curr = self._rotate_coord([old_x, y2], degrees);
                self._line(svg, {
                  x1:new_point[0],
                  y1:new_point[1],
                  x2:new_curr[0],
                  y2:new_curr[1],
                  stroke:d3_data.mirror_stroke,
                  stroke_width:d3_data.stroke_width
                });
              }
            }
            if (mirror == 'horizontal' || mirror == 'both') {
              self._line(svg, {
                x1:x1,
                y1:point[1],
                x2:x2,
                y2:old_y,
                stroke:d3_data.mirror_stroke,
                stroke_width:d3_data.stroke_width
              });

              // multiplier trails
              for (var i=2; i <= multiply; i++) {
                var degrees = 360 / multiply * (i-1);
                var new_point = self._rotate_coord([x1, point[1]], degrees);
                var new_curr = self._rotate_coord([x2, old_y], degrees);
                self._line(svg, {
                  x1:new_point[0],
                  y1:new_point[1],
                  x2:new_curr[0],
                  y2:new_curr[1],
                  stroke:d3_data.mirror_stroke,
                  stroke_width:d3_data.stroke_width
                });
              }
            }

            if (mirror == 'both') {
              self._line(svg, {
                x1:x1,
                y1:y1,
                x2:x2,
                y2:y2,
                stroke:d3_data.mirror_stroke,
                stroke_width:d3_data.stroke_width
              });

              // multiplier trails
              for (var i=2; i <= multiply; i++) {
                var degrees = 360 / multiply * (i-1);
                var new_point = self._rotate_coord([x1, y1], degrees);
                var new_curr = self._rotate_coord([x2, y2], degrees);
                self._line(svg, {
                  x1:new_point[0],
                  y1:new_point[1],
                  x2:new_curr[0],
                  y2:new_curr[1],
                  stroke:d3_data.mirror_stroke,
                  stroke_width:d3_data.stroke_width
                });
              }
            }
          }

          // multiplier trails
          for (var i=2; i <= multiply; i++) {
            var degrees = 360 / multiply * (i-1);
            var new_point = self._rotate_coord(point, degrees);
            var new_curr = self._rotate_coord([old_x, old_y], degrees);
            self._line(svg, {x1:new_point[0],y1:new_point[1],x2:new_curr[0],y2:new_curr[1],stroke:d3_data.mirror_stroke,stroke_width:d3_data.stroke_width});
          }

          self._line(svg, {x1:point[0],y1:point[1],x2:old_x,y2:old_y,stroke:d3_data.stroke,stroke_width:d3_data.stroke_width});
        }

        // update offset
        this.set('drag_pos.offset.x', +data.offset_x);
        this.set('drag_pos.offset.y', +data.offset_y);

        if (this.get('el_id') != 'false') this._draw_preview({el_id: this.get('el_id')});
      }
    }
  },
  stop_drag: function(data) {
    // app.log("Stop Drag", data);
    if (this.get('is_dragging') == 'true') {

      // add last point
      var first_point = this.get('coords')[0];
      var point = [this.get('drag_pos.current.x'), this.get('drag_pos.current.y')];
      this.add('coords', point);

      this.set('is_dragging', 'false');

      // add coords to paths
      var path = this._make_path(this.get('coords'));
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

      // enable scrolling in app
      // if (app.is_app) {
        if (this.scroll_el) this.scroll_el.addClass('scroll');
        else app.log("Scroll element lost!");
      // }

      // draw smoothly
      d3.select($('.drawing_area')[0]).attr("shape-rendering", "optimizeSpeed");

      // app.log("Add path", obj);

      if (this.get('el_id') != 'false') this._draw_preview({el_id: this.get('el_id')});
      else app.log("El_id lost!");
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
      // app.log("Point:", polar_point);

      current_x = point[0];
      current_y = point[1];

			last_th = new_th;
		});


  },
  undo: function() {
    var paths = this.get('paths');
    // app.log("Undo", paths.length);

    if (paths.length > 0) {
      // pop off last path
      var path = paths.pop();

      // move start point
      this.set('drag_pos.current.x', path.start.x);
      this.set('drag_pos.current.y', path.start.y);

      // add to redo states
      this.add('redo_paths', path);

      this.update_path_count();
      this._draw_paths();
    }
  },
  redo: function() {
    var paths = this.get('redo_paths');
    // app.log("Redo", paths.length);

    if (paths.length > 0) {
      // pop off last path
      var path = paths.pop();

      // move start point
      this.set('drag_pos.current.x', path.end.x);
      this.set('drag_pos.current.y', path.end.y);

      // fix start_rho
      if (this.get('path_count') == 0) {
        var start = path.start;
        // app.log("Fix Start Rho", start);
        if (start.x == this.get('mid') && start.y == this.get('mid')) {
          // zero
        } else {
          // one
        }
      }

      // add to redo states
      this.add('paths', path);

      this.update_path_count();
      this._draw_paths();
    }
  },
  clear: function() {
    // app.log("Drawing clear");
    this.set('paths', []);
    this.set('coords', []);
    this.set('edit.verts', []);
    this.update_path_count();

    // reset start point
    this.set('drag_pos.current.x', +this.get('mid') - +this.get('edit.firstR') * (this.get('mid') - this.get('padding')));
    this.set('drag_pos.current.y', this.get('mid'));

    // app.log('Current', this.get('drag_pos.current'))

    if (this.get('el_id') != 'false') {
      this._draw_preview({el_id: this.get('el_id')});
      this._draw_paths();
    }
  },
	setup_edit: function () {
		this.set('edit', this.get('data')).set('errors', []);
		// app.log("Drawing edit", this.get('edit'));

		return this;
	},
  export_data: function () {
    // do nothing
    return this;
  },
  save: function () {
    // app.log("Save Drawing", this.get('edit'));
    var self = this;

    // save changes
    this.set('data', this.get('edit'));

    // loop through Paths
    var paths = self.get('paths');
    var mid = this.get('mid');
    var padding = this.get('padding');
    var mirror = this.get('edit.mirror');
    var firstR = +this.get('edit.firstR');
    var lastR = +this.get('edit.lastR');
    if (mirror != 'false') lastR = firstR;
    var length = this.get('edit.multiply');
    var divisor = this.get('edit.divisor');
    var is_even = true;
    var is_diff = (firstR != lastR && !(mirror != 'false'));
    var is_reversed = false;

    var skip = length/divisor;
    if (skip != Math.floor(skip)) {
    	skip = Math.floor(skip);
      is_even = false;
    }

    // SVG values
    var svg = '<svg>';
    var rho_max = mid - padding;

    var point = [0,0];

    // app.log("Settings", firstR, lastR, mirror, is_diff);

    var index = 0;
    for(var i=0; i < length; i++) {
    	var value = index % length; // value for which multiplier around table to draw now
      var degrees = 360 / length * value;
      // app.log("Draw:", value);

      if (is_diff && i > 0) paths = paths.reverse();

      var path_d = '';

      // draw path
      _.each(paths, function(path, path_index) {
        var points = JSON.parse(JSON.stringify(path.points));

        if (is_reversed) points = points.reverse();

        // smoothly arc around to first point
        if (path_index == 0 && index > 0 && ((lastR == 1 && is_reversed) || (firstR == 1 && is_diff && !is_reversed) || (firstR == 1 && mirror) || (firstR == 1 && lastR == 1))) {
          // arc to rho 1 start point
          var p = self._rotate_coord([points[0][0], points[0][1]], degrees);
          point = [(p[0]-mid)/rho_max, (p[1]-mid)/rho_max];
          var new_dx = point[0];
          var new_dy = point[1];
          var new_dist = Math.sqrt(new_dx*new_dx + new_dy*new_dy);
          var new_r = Math.atan2(new_dy, new_dx);
          point[0] = Math.cos(new_r);
          point[1] = Math.sin(new_r);

          // app.log("Arc to next", point[0]+', '+point[1]);
          path_d += 'R'+point[0]+','+point[1];
        }

        var limited_points = [];

        _.each(points, function(p, p_index) {
          var next_p = null;
          var next_point = null;
          if (value != 0) { // rotate points
            p = self._rotate_coord(p, degrees);
            if (p_index < points.length-1) next_p = self._rotate_coord(points[p_index+1], degrees);
          } else if (p_index < points.length-1)  next_p = points[p_index+1];

          // center points, reduce to 0-1
          point = [(p[0]-mid)/rho_max, (p[1]-mid)/rho_max];
          if (next_p) next_point = [(next_p[0]-mid)/rho_max, (next_p[1]-mid)/rho_max];

          // add to limited_points
          if (p_index == 0) limited_points.push(point);
          if (next_point) limited_points.push(next_point);
          if (limited_points.length > 4) limited_points.shift(); // keep length to no more than 4

          // make curves
          if (p_index == 0) path_d += 'M'+point[0]+' '+point[1];
          else {
            if (self.get('smooth') > 0) {
              var b_index = Math.min(2,p_index);
              if (p_index == points.length) b_index = 3;
              path_d += self._b_bezierCommand(point, b_index, limited_points);
            } else path_d += 'L'+point[0]+' '+point[1];
          }
        });
      });

      if (mirror != 'false') {
        // reverse paths
        paths = paths.reverse(); // reversed

        // vertical
        if (mirror == 'vertical' || mirror == 'both') {
          _.each(paths, function(path, path_index) {
            var points = JSON.parse(JSON.stringify(path.points));
            points.reverse();

            var limited_points = [];

            // draw mirrored path in reverse
            _.each(points, function(p, p_index) {
              var next_p = null;
              var next_point = null;
              p[1] = mid-p[1]+mid; // adjust to opposite side(y) of midpoint
              if (p_index < points.length-1) next_p = [points[p_index+1][0], mid-points[p_index+1][1]+mid]; // (don't modify original)

              if (value != 0) { // rotate points
                p = self._rotate_coord(p, degrees);
                if (p_index < points.length-1) next_p = self._rotate_coord(next_p, degrees);
              }

              // center points, reduce to 0-1
              point = [(p[0]-mid)/rho_max, (p[1]-mid)/rho_max];
              if (next_p) next_point = [(next_p[0]-mid)/rho_max, (next_p[1]-mid)/rho_max];

              // add to limited_points
              if (p_index == 0) limited_points.push(point);
              if (next_point) limited_points.push(next_point);
              if (limited_points.length > 4) limited_points.shift(); // keep length to no more than 4

              // make curves
              if (p_index == 0) path_d += 'L'+point[0]+' '+point[1];
              else {
                if (self.get('smooth') > 0) {
                  var b_index = Math.min(2,p_index);
                  if (p_index == points.length) b_index = 3;
                  path_d += self._b_bezierCommand(point, b_index, limited_points);
                } else path_d += 'L'+point[0]+' '+point[1];
              }
            });
          });
        }

        // fix order for both
        if (mirror == 'both') paths = paths.reverse(); // forward

        // horizontal
        if (mirror == 'horizontal' || mirror == 'both') {
          _.each(paths, function(path, path_index) {
            var points = JSON.parse(JSON.stringify(path.points));
            if (mirror != 'both') points.reverse();

            var limited_points = [];

            // draw mirrored path in reverse
            _.each(points, function(p, p_index) {
              var next_p = null;
              var next_point = null;
              p[0] = mid-p[0]+mid; // adjust to opposite side(x) of midpoint
              if (p_index < points.length-1) next_p = [mid-points[p_index+1][0]+mid, points[p_index+1][1]]; // (don't modify original)

              if (value != 0) { // rotate points
                p = self._rotate_coord(p, degrees);
                if (p_index < points.length-1) next_p = self._rotate_coord(next_p, degrees);
              }

              // center points, reduce to 0-1
              point = [(p[0]-mid)/rho_max, (p[1]-mid)/rho_max];
              if (next_p) next_point = [(next_p[0]-mid)/rho_max, (next_p[1]-mid)/rho_max];

              // add to limited_points
              if (p_index == 0) limited_points.push(point);
              if (next_point) limited_points.push(next_point);
              if (limited_points.length > 4) limited_points.shift(); // keep length to no more than 4

              // make curves
              if (p_index == 0) path_d += 'L'+point[0]+' '+point[1];
              else {
                if (self.get('smooth') > 0) {
                  var b_index = Math.min(2,p_index);
                  if (p_index == points.length) b_index = 3;
                  path_d += self._b_bezierCommand(point, b_index, limited_points);
                } else path_d += 'L'+point[0]+' '+point[1];
              }
            });
          });
        }

        // both
        if (mirror == 'both') {
          paths = paths.reverse(); // fix order for both

          _.each(paths, function(path, path_index) {
            var points = JSON.parse(JSON.stringify(path.points));
            points.reverse();

            var limited_points = [];

            // draw mirrored path in reverse
            _.each(points, function(p, p_index) {
              var next_p = null;
              var next_point = null;
              p[0] = mid-p[0]+mid; // adjust to opposite side(x) of midpoint
              p[1] = mid-p[1]+mid; // adjust to opposite side(y) of midpoint
              if (p_index < points.length-1) next_p = [mid-points[p_index+1][0]+mid, mid-points[p_index+1][1]+mid]; // (don't modify original)

              if (value != 0) { // rotate points
                p = self._rotate_coord(p, degrees);
                if (p_index < points.length-1) next_p = self._rotate_coord(next_p, degrees);
              }

              // center points, reduce to 0-1
              point = [(p[0]-mid)/rho_max, (p[1]-mid)/rho_max];
              if (next_p) next_point = [(next_p[0]-mid)/rho_max, (next_p[1]-mid)/rho_max];

              // add to limited_points
              if (p_index == 0) limited_points.push(point);
              if (next_point) limited_points.push(next_point);
              if (limited_points.length > 4) limited_points.shift(); // keep length to no more than 4

              // make curves
              if (p_index == 0) path_d += 'L'+point[0]+' '+point[1];
              else {
                if (self.get('smooth') > 0) {
                  var b_index = Math.min(2,p_index);
                  if (p_index == points.length) b_index = 3;
                  path_d += self._b_bezierCommand(point, b_index, limited_points);
                } else path_d += 'L'+point[0]+' '+point[1];
              }
            });
          });
        }

        // reverse paths back to original order
        paths = paths.reverse();
      }

      // bring last point to the given lastR
      var end_x = 0;
      var end_y = 0;
      if (is_reversed) {
        if (firstR == 1) { // draw straight out at same angle
          var new_dx = point[0];
          var new_dy = point[1];
          var new_dist = Math.sqrt(new_dx*new_dx + new_dy*new_dy);
          var new_r = Math.atan2(new_dy, new_dx);
          end_x = Math.cos(new_r);
          end_y = Math.sin(new_r);
        }
      } else {
        if (lastR == 1) { // draw straight out at same angle
          var new_dx = point[0];
          var new_dy = point[1];
          var new_dist = Math.sqrt(new_dx*new_dx + new_dy*new_dy);
          var new_r = Math.atan2(new_dy, new_dx);
          end_x = Math.cos(new_r);
          end_y = Math.sin(new_r);
        }
      }
      point = [end_x, end_y];
      // TODO: change to curves!!
      path_d += 'L'+end_x+','+end_y;
      // app.log("End Points", index, end_x, end_y, point);

      // app.log("Path:", path_d);
      svg += '<path d="'+path_d+'"></path>';

    	index += skip;
      if (is_even && i % divisor == divisor-1) index++;

      if (is_diff) is_reversed = !is_reversed; // reverse direction for next line
    }
    svg += '</svg>';

    // make track model and send to upload confirm page
    // app.log("SVG", svg);
    var track_obj = {
      name: 'My Drawing',
      type: 'track',
      original_file_type: 'draw',
      file_data: svg
    };

    // TODO: check for user, set created_by_name
    var community = app.session.get_model('community_id');
    if (community) {
      // app.log("User:", community.get('data'));
    } else {
      // app.log("No Community user connected");
    }

    var track = app.collection.add(track_obj);
    track.set('svg_scaled', 'true')
      .set('upload_status', 'false');

    // add(set) to manager upload list
    app.manager.set('tracks_to_upload', [track.get('data')]);

    // save for back button
    app.collection.add(this);
    app.session.set('active.drawing_id', this.id);

    app.trigger('session:active', {
      primary: 'media',
      secondary: 'draw-preview',
      track_id: track.id
    });

    // do nothing
    return this;
  }
};
