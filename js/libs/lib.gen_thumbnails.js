$(document).ready(function() {
    var raw_data = $('.d3').data();

    console.log('raw points', raw_data);

    var w = +raw_data.dimensions,
        h = +raw_data.dimensions,
        raw_points = raw_data.coors.replace(/\\n/gi, '\n');

    var svg = d3.select($('.d3')[0])
        .append('svg')
        .attr('width', w)
        .attr('height', h);

    var d3_data = {
        background          : 'transparent', // transparent, #fdfaf3, #d6d2ca, #c9bb96
        stroke              : '#797977', // #797977, #948252
        stroke_width        : 3,
        stroke_edge         : '#fdfaf3', // #fdfaf3, #f6ebcd
        stroke_edge_width   : 7,
        points              :	[],
        steps               : 0,
        r_max_dist          : 0.1,
        retrace_steps       : 5,
        loaded              : "false",
        circle              : "true",
        circle_stroke       : '#d6d2ca',
        circle_stroke_width : 2,
        square              : "false"
    };

    var stroke_width        = d3_data.stroke_width * w / 400;
    var stroke_edge_width   = d3_data.stroke_edge_width * w / 400;

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

    console.log("Background", d3_data.background);

    function convert_verts_to_d3 (data) {
		var return_value = [];
		// Step the file, line by line
		var lines = data.toString().trim().split('\n');
		var regex = /^\s*$/; // eliminate empty lines

		_.map(lines, function(line) {
			line.trim();

			if (line.length > 0 && line.substring(0,1) != '#' && !line.match(regex)) {
				var values = line.split(/\s+/);
				var entry = {y:parseFloat(values[0]), x:parseFloat(values[1])}; // [theta, rho]
				return_value.push(entry);
			}
		});

		return return_value;
	};

    var points              = convert_verts_to_d3(raw_points);
    var interpolated_points = [];

    console.log('POINTS', points);

    interpolated_points.push(points[0]);
    var last_point          = interpolated_points[0];
    var r_max_dist          = Math.min(0.785398, d3_data.r_max_dist);

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

    var last_points     = [];
    var point_count     = Math.max(1, d3_data.retrace_steps);

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

            last_points.push(point);
            if (last_points.length > point_count) last_points.shift();
            // }, 50*index);
        }
    });
});
