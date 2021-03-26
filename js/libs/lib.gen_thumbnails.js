function draw_thumbnail(raw_data) {
	var start = Date.now();

  var two_ball = false;
  if (raw_data.two_ball && (raw_data.two_ball == 'true' || raw_data.two_ball == true)) two_ball = true;
  var percent = 1;
  if (raw_data.percent) percent = +raw_data.percent / 100;

  var max_points = 50000; // maximum points to render
  if (two_ball) max_points /= 2;

  // console.log('raw points', raw_data);

  var w = +raw_data.dimensions,
    h = +raw_data.dimensions,
    raw_points = raw_data.coors.replace(/\\n/gi, '\n');

  var base = $('.d3');
  var base_canvas = $('.canvas_drawing');

  var canvas;
  if (base_canvas.length <= 0) {
    canvas = d3.select(base[0])
      .append('canvas')
      .attr('class', 'canvas_drawing')
      .attr('width', w)
      .attr('height', h);
		console.log("Make Canvas");
  } else {
    base_canvas.empty();
    canvas = d3.select(base_canvas[0]);
		console.log("Select Canvas");
  }
	var ctx = canvas.node().getContext('2d');
	ctx.clearRect(0, 0, w, h); // clear the canvas

  var d3_data = {
    background: 'transparent', // transparent, #fdfaf3, #d6d2ca, #c9bb96
    stroke: '#797977', // #797977, #948252
    stroke_width: 3,
    stroke_edge: '#fdfaf3', // #fdfaf3, #f6ebcd
    stroke_edge_width: 5,
    points: [],
    steps: 0,
    r_max_dist: 0.1,
    retrace_steps: 5,
    loaded: "false",
    circle: "true",
    circle_stroke: '#d6d2ca',
    circle_stroke_width: 2,
    square: "false"
  };

  var stroke_width = d3_data.stroke_width * w / 400;
  var stroke_edge_width = d3_data.stroke_edge_width * w / 400;

  var f_line = d3.radialLine()
    .radius(function(d, i) {
			var r = d.x * (w / 2 - stroke_edge_width / 2);
      // console.log('radius', r);
      return r
    })
    .angle(function(d) {
      // console.log('angle', d.y);
      return d.y;
    })
    // .curve(d3.curveMonotoneX) //curveCatmullRom
  	.context(ctx);
  //.interpolate('basis')

  var f_two_line = d3.radialLine()
    .radius(function(d, i) {
      // console.log('radius', d);
      return d.x * (w / 2 - stroke_edge_width / 2);
    })
    .angle(function(d) {
      // console.log('angle', d);
      return d.y;
    })
    .curve(d3.curveMonotoneX) //curveCatmullRom
		.context(ctx);
  //.interpolate('basis')

  console.log("Background", d3_data.background);
	// return;

	if (d3_data.square == "true") {
		ctx.fillStyle = d3_data.background;
		ctx.beginPath();
		ctx.rect(0, 0, w, h);
		ctx.fill();
	}

	if (d3_data.circle == "true") {
		ctx.fillStyle = d3_data.background;
		ctx.beginPath();
		ctx.arc(w / 2, h / 2, w / 2 - (d3_data.circle_stroke_width / 2), 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.translate(w/2, h/2); // translate context just once

  function convert_verts_to_d3(data) {
    var return_value = [];
    // Step the file, line by line
    var lines = data.toString().trim().split('\n');
    // var regex = /^\s*$/; // eliminate empty lines
    var pos_regex = /^[0-9.e-]+\s+[0-9.e-]+/;

    _.map(lines, function(line) {
      // line.replace('\r','');
      line.trim();

      if (line.length > 0 && pos_regex.test(line)) {
        var values = line.split(/\s+/);
        var entry = {
          y: parseFloat(values[0]),
          x: parseFloat(values[1])
        }; // [theta, rho]
        return_value.push(entry);
      }
    });

    // reduce point count, if needed
    console.log("Given Points: ", return_value.length);
    if (return_value.length > max_points) {
      var total_count = return_value.length;
      var remove_every = Math.ceil(1 / (max_points / return_value.length));
      for (var i = total_count - 2 - remove_every; i > 1; i -= remove_every) {
        return_value.splice(i + 1, remove_every - 1);
      }
    }

    // force first/last rho
    var first_point = return_value[0];
    if (first_point.x != 0 && first_point.x != 1) {
      // console.log("Fix Start Point", first_point);
      return_value.unshift({y:first_point.y, x: Math.round(first_point.x)});
    }
    var last_point = return_value[return_value.length-1];
    if (last_point.x != 0 && last_point.x != 1) {
      // console.log("Fix Last Point", last_point);
      return_value.push({y:last_point.y, x:Math.round(last_point.x)});
    }

    console.log("Total Points: ", return_value.length);

    return return_value;
  };

  var points = convert_verts_to_d3(raw_points);

  // console.log("Point count: ", points.length);
  // reduce points to the percent given
  if (percent < 1) {
    points.length = Math.ceil(points.length * percent);
    // console.log("Reduced Points: ", points.length);
  }

  var interpolated_points = [];
  interpolated_points.push(points[0]);
  var last_point = interpolated_points[0];
  var r_max_dist = Math.min(0.785398, d3_data.r_max_dist);

  _.each(points, function(point, index) {
    if (index > 0) {
      var diff = Math.abs(last_point.y - point.y);
      if (diff > r_max_dist) {
        var steps = Math.ceil(diff / r_max_dist);
        for (var i = 1; i < steps - 1; i++) {
          interpolated_points.push({
            x: last_point.x + (point.x - last_point.x) * i / steps,
            y: last_point.y + (point.y - last_point.y) * i / steps
          })
        }
      }
      interpolated_points.push(point);
      last_point = point;
    }
  });

  //console.log("D3 Model: ", self.model.id, interpolated_points.length, self.model.get("d3_data.stroke"), self.model.get("d3_data.stroke_width"));

  var last_points = [];
  var point_count = Math.max(1, d3_data.retrace_steps);

  _.each(interpolated_points, function(point, index) {
    if (index < interpolated_points.length - 1) {
      // setTimeout(function() {
        var line_array = [point, interpolated_points[index + 1]];
				// console.log("Line Array", line_array);
        // lighter edge
				ctx.beginPath();
				ctx.strokeStyle = d3_data.stroke_edge;
				ctx.lineWidth = stroke_edge_width;
				ctx.lineCap = "round";
				f_line(line_array);
				ctx.stroke();

        if (two_ball) {
          var two_array = JSON.parse(JSON.stringify(line_array));
          _.each(two_array, function(two_point) {
            two_point.x -= 1.0;
          });

          // lighter edge
					ctx.beginPath();
					ctx.strokeStyle = d3_data.stroke_edge;
					ctx.lineWidth = stroke_edge_width;
					ctx.lineCap = "round";
					f_two_line(two_array);
					ctx.stroke();
        }

        var second_array = [];
        if (last_points.length > 0) second_array = last_points.concat(line_array);

        // darker path
				ctx.beginPath();
				ctx.strokeStyle = d3_data.stroke;
				ctx.lineWidth = stroke_width;
				ctx.lineCap = "round";
				f_line(second_array);
				ctx.stroke();

        if (two_ball) {
          var two_array = JSON.parse(JSON.stringify(second_array));
          _.each(two_array, function(two_point) {
            two_point.x -= 1.0;
          });

          // darker path
					ctx.beginPath();
					ctx.strokeStyle = d3_data.stroke;
					ctx.lineWidth = stroke_width;
					ctx.lineCap = "round";
					f_two_line(two_array);
					ctx.stroke();
        }

        last_points.push(point);
        if (last_points.length > point_count) last_points.shift();
      // }, 100*index);
    }
  });

	ctx.translate(-w/2, -h/2); // translate context back

	if (d3_data.square == "true") {
		ctx.beginPath();
		ctx.strokeStyle = d3_data.circle_stroke;
		ctx.lineWidth = d3_data.circle_stroke_width;
		ctx.rect(0, 0, w, h);
		ctx.stroke();
	}

	if (d3_data.circle == "true") {
		ctx.beginPath();
		ctx.strokeStyle = d3_data.circle_stroke;
		ctx.lineWidth = d3_data.circle_stroke_width;
		ctx.arc(w / 2, h / 2, w / 2 - (d3_data.circle_stroke_width / 2), 0, Math.PI * 2);
		ctx.stroke();
	}

	end = Date.now();
	console.log("Draw Thumbnail Finished", end-start);
}

function show_thumbnail(raw_data) {
	console.log('Show Thumbnail');
  if (raw_data.animate && raw_data.percent && raw_data.percent < 100) {
    var percent = raw_data.percent;
    var i = 1;
    var drawInterval = setInterval(function() {
      raw_data.percent = percent * i;
      if (raw_data.percent >= 100) {
        raw_data.percent = 100;
        clearInterval(drawInterval);
        // console.log("!! Drawing Complete");
      }
      draw_thumbnail(raw_data);
      i++;
    }, 1000);
  } else {
    draw_thumbnail(raw_data);
  }
}

$(document).ready(function() {
	console.log("Document Ready");
  var raw_data = $('.d3').data();

  // TODO: if the page has GET variables, split
  var fragment = window.location.hash;
	if (fragment.charAt(0) === '#') {
		fragment = fragment.slice(1);
		fragment = fragment.split('&');
		var count		= fragment.length;
		for (var i = 0; i < count; i++) {
			var obj = fragment[i].split('=');
			if (obj[0] == 'id')         raw_data.id = obj[1];
			if (obj[0] == 'animate')    raw_data.animate = obj[1];
      if (obj[0] == 'percent')    raw_data.percent = obj[1];
      if (obj[0] == 'two_ball')   raw_data.two_ball = obj[1];
      if (obj[0] == 'dimensions') raw_data.dimensions = obj[1];
		}
	}

  // if it has data-id, request the file from sisbot
  if (raw_data.id && app.plugins.is_uuid(raw_data.id)) {
    console.log("UUID found:", raw_data.id, app.config.get_sisbot_url()+'/sisbot/get_track_verts');

		var txt = '';
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function(){
		  if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
				raw_data.coors = xmlhttp.responseText;
				//
	      show_thumbnail(raw_data);
		  }
		};
		xmlhttp.open("GET",app.config.get_sisbot_url()+'/sisbot/get_thr/'+raw_data.id,true);
		xmlhttp.send();

    // get_track_verts
    // app.post.fetch({_type: 'POST', endpoint:'/sisbot/get_track_verts', data: {id: raw_data.id}}, function(obj) {
    //   console.log("Track verts from Pi: ", obj);
    //   if (obj.err) return alert(obj.err);
    //   raw_data.coors = obj.resp;
		//
    //   show_thumbnail(raw_data);
    // });
  } else if (raw_data.coors) {
		console.log("Coordinates inline");
		show_thumbnail(raw_data);
	}
});
