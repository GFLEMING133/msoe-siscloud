app.model.led_pattern = {
	defaults: function (data) {
		var obj = {
			id					: data.id,
			type				: 'led_pattern',

			data				: {
				id									: data.id,
				type    						: 'led_pattern',
				version							: this.current_version,

        name          			: '',

				is_white						: 'false', // for white color balance
				white_value					: 0, // 0.0-1.0
				is_primary_color		: 'false', // uses primary color
				led_primary_color		: 'false', // #RRGGBBWW
				is_secondary_color	: 'false', // uses secondary color
				led_secondary_color	: 'false', // #RRGGBBWW
			}
		};

		return obj;
	},
	current_version: 1,
	setup_colors: function() {
		var sisbot = app.manager.get_model('sisbot_id');
		if (sisbot) {
			sisbot._update_pattern_colors();
		}
	},
	get_white_color: function() {
		var returnValue = '#FFFFFFFF';
		var value = this.get('data.white_value');

		if (value < 0.5) {
			// blue: max 64, 156, 255
			var scale = value * 2;

			var red = Math.round(64 + (255-64) * scale);
			var green = Math.round(156 + (255-156) * scale);
			var blue = 255; // doesn't change

			returnValue = '#'+red.toString(16)+green.toString(16)+blue.toString(16)+'FF';
		} else if (value > 0.5) {
			// orange: max 255, 147, 41
			var scale = 1.0-(value-0.5)*2;

			var red = 255; // doesn't change
			var green = Math.round(147 + (255-147) * scale);
			var blue = Math.round(41 + (255-41) * scale);

			returnValue = '#'+red.toString(16)+green.toString(16)+blue.toString(16)+'FF';
		}

		return returnValue.toUpperCase();
	},
	set_white: function (level) {
		var self = this;

		console.log("White:", level, this.get('data.white_value'));
		this.set('data.white_value', +level).set('edit.white_value', +level);
		var white_color = this.get_white_color();
		console.log("White:", white_color);
		this.set('data.primary_color', white_color);
		//

		var sisbot = app.manager.get_model('sisbot_id');
		sisbot.set('edit.led_primary_color', this.get('data.primary_color'));
		sisbot.led_color(); // update table
	},
	white_up: function () {
		var level = +this.get('data.white_value');
		if (level <= .95) level = level + .05;
		this.set_white(level);
	},
	white_down: function () {
		var level = +this.get('data.white_value');
		if (level >= .05) level = level - .05;
		this.set_white(level);
	},
	white_warm: function () {
		this.set_white(1);
	},
	white_cool: function () {
		this.set_white(0);
	},
};
