function draw_thumbnail(raw_data) {
  var max_points = 50000; // maximum points to render
  var two_ball = false;
  if (raw_data.two_ball) two_ball = raw_data.two_ball;
  var percent = 1;
  if (raw_data.percent) percent = raw_data.percent / 100;

  // console.log('raw points', raw_data);

  var w = +raw_data.dimensions,
    h = +raw_data.dimensions,
    raw_points = raw_data.coors.replace(/\\n/gi, '\n');

  var base = $('.d3');
  var base_svg = $('.svg_drawing');

  var svg;
  if (base_svg.length <= 0) {
    svg = d3.select(base[0])
      .append('svg')
      .attr('class', 'svg_drawing')
      .attr('width', w)
      .attr('height', h);
  } else {
    base_svg.empty();
    svg = d3.select(base_svg[0]);
  }

  var d3_data = {
    background: 'transparent', // transparent, #fdfaf3, #d6d2ca, #c9bb96
    stroke: '#797977', // #797977, #948252
    stroke_width: 3,
    stroke_edge: '#fdfaf3', // #fdfaf3, #f6ebcd
    stroke_edge_width: 6,
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

  var line = d3.radialLine()
    .radius(function(d, i) {
      // console.log('radius', d);
      return d.x * (w / 2 - stroke_edge_width / 2);
    })
    .angle(function(d) {
      // console.log('angle', d);
      return d.y;
    })
    .curve(d3.curveMonotoneX); //curveCatmullRom
  //.interpolate('basis')

  var two_line = d3.radialLine()
    .radius(function(d, i) {
      // console.log('radius', d);
      return d.x * (w / 2 - stroke_edge_width / 2);
    })
    .angle(function(d) {
      // console.log('angle', d);
      return d.y;
    })
    .curve(d3.curveMonotoneX); //curveCatmullRom
  //.interpolate('basis')

  if (d3_data.square == "true") {
    svg.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", d3_data.background);
  }

  if (d3_data.circle == "true") {
    svg.append("circle")
      .attr("cx", w / 2)
      .attr("cy", h / 2)
      .attr("r", w / 2 - (d3_data.circle_stroke_width / 2))
      .attr('stroke', d3_data.circle_stroke)
      .attr('stroke-width', d3_data.circle_stroke_width)
      .attr("fill", d3_data.background);
  }

  // console.log("Background", d3_data.background);

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
    // console.log("Given Points: ", return_value.length);
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
      console.log("Fix Start Point", first_point);
      return_value.unshift({y:first_point.y, x: Math.round(first_point.x)});
    }
    var last_point = return_value[return_value.length-1];
    if (last_point.x != 0 && last_point.x != 1) {
      console.log("Fix Last Point", last_point);
      return_value.push({y:last_point.y, x:Math.round(last_point.x)});
    }

    // console.log("Total Points: ", return_value.length);

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
        // lighter edge
        var edge_path = svg.append('path')
          .datum(line_array)
          .attr('d', line)
          .attr('stroke', d3_data.stroke_edge)
          .attr('stroke-width', stroke_edge_width)
          .style("stroke-linecap", "round") // stroke-linecap type
          .attr('fill', 'transparent')
          .attr('transform', 'translate(' + w / 2 + ',' + h / 2 + ')');

        if (two_ball) {
          var two_array = JSON.parse(JSON.stringify(line_array));
          _.each(two_array, function(two_point) {
            two_point.x -= 1.0;
          });

          // lighter edge
          var edge_path = svg.append('path')
            .datum(two_array)
            .attr('d', two_line)
            .attr('stroke', d3_data.stroke_edge)
            .attr('stroke-width', stroke_edge_width)
            .style("stroke-linecap", "round") // stroke-linecap type
            .attr('fill', 'transparent')
            .attr('transform', 'translate(' + w / 2 + ',' + h / 2 + ')');
        }

        var second_array = [];
        if (last_points.length > 0) second_array = last_points.concat(line_array);

        // darker path
        var path = svg.append('path')
          .datum(second_array)
          .attr('d', line)
          .attr('stroke', d3_data.stroke)
          .attr('stroke-width', stroke_width)
          .style("stroke-linecap", "round") // stroke-linecap type
          .attr('fill', 'transparent')
          .attr('transform', 'translate(' + w / 2 + ',' + h / 2 + ')');

        if (two_ball) {
          var two_array = JSON.parse(JSON.stringify(second_array));
          _.each(two_array, function(two_point) {
            two_point.x -= 1.0;
          });

          // darker path
          var path = svg.append('path')
            .datum(two_array)
            .attr('d', two_line)
            .attr('stroke', d3_data.stroke)
            .attr('stroke-width', stroke_width)
            .style("stroke-linecap", "round") // stroke-linecap type
            .attr('fill', 'transparent')
            .attr('transform', 'translate(' + w / 2 + ',' + h / 2 + ')');
        }

        last_points.push(point);
        if (last_points.length > point_count) last_points.shift();
      // }, 100*index);
    }
  });
}

function show_thumbnail(raw_data) {
  if (raw_data.animate && raw_data.percent && raw_data.percent < 100) {
    var percent = raw_data.percent;
    var i = 1;
    var drawInterval = setInterval(function() {
      raw_data.percent = percent * i;
      if (raw_data.percent >= 100) {
        raw_data.percent = 100;
        clearInterval(drawInterval);
        console.log("!! Drawing Complete");
      }
      draw_thumbnail(raw_data);
      i++;
    }, 1000);
  } else {
    draw_thumbnail(raw_data);
  }
}

$(document).ready(function() {
  var raw_data = $('.d3').data();

  // TODO: if it has data-id, request the file from sisbot
  if (raw_data.id && app.plugins.is_uuid(raw_data.id)) {
    console.log("UUID found:", raw_data.id);
    // get_track_verts
    app.post.fetch({_type: 'POST', endpoint:'/sisbot/get_track_verts', data: {id: raw_data.id}}, function(obj) {
      console.log("Track verts from Pi: ", obj);
      raw_data.coors = obj.resp;

      show_thumbnail(raw_data);
    });
  } else if (raw_data.coors) show_thumbnail(raw_data);
});
