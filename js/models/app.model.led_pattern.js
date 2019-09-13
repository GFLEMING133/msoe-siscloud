app.model.led_pattern = {
	defaults: function (data) {
		var obj = {
			id					: data.id,
			type				: 'led_pattern',

			display_primary_color: '0xFFFFFF',
			primary_text_color		: 'white', // css color for the button text, adjust based on primary lightness, white|black

			display_secondary_color: '0xFFFFFF',
			secondary_text_color	: 'white', // white|black

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
	on_init: function() {
		this.update_primary_color();
		this.update_secondary_color();

		this.on('change:data.led_primary_color', 				this.update_primary_color);
		this.on('change:data.led_secondary_color', 			this.update_secondary_color);
	},
	update_primary_color: function() {
		var color_data = this.get('data.led_primary_color');
		if (color_data != 'false') {
			// split individual colors
			var red = parseInt(color_data.substr(1, 2), 16);
			var green = parseInt(color_data.substr(3, 2), 16);
			var blue = parseInt(color_data.substr(5, 2), 16);
			// var white = parseInt(color_data.substr(7, 2), 16);

			var average = (red + green + blue)/3;
			if (average > 208) this.set('primary_text_color', 'black');
			else this.set('primary_text_color', 'white');

			this.set('display_primary_color', color_data.substr(0,7));

			console.log("Primary colors:", this.get('data.name'), red, green, blue, average, this.get('display_primary_color'));
		}
	},
	update_secondary_color: function() {
		var color_data = this.get('data.led_secondary_color');
		if (color_data != 'false') {
			// split individual colors
			var red = parseInt(color_data.substr(1, 2), 16);
			var green = parseInt(color_data.substr(3, 2), 16);
			var blue = parseInt(color_data.substr(5, 2), 16);
			// var white = parseInt(color_data.substr(7, 2), 16);

			var average = (red + green + blue)/3;
			if (average > 208) this.set('secondary_text_color', 'black');
			else this.set('secondary_text_color', 'white');

			this.set('display_secondary_color', color_data.substr(0,7));

			console.log("Secondary colors:", this.get('data.name'), red, green, blue, average, this.get('display_secondary_color'));
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

			console.log("Blue", scale, red, green, blue);
			red = red.toString(16);
			if (red.length < 2) red = '0'+red;
			green = green.toString(16);
			if (green.length < 2) green = '0'+green;
			blue = blue.toString(16);
			if (blue.length < 2) blue = '0'+blue;

			returnValue = '#'+red+green+blue+'FF';

			returnValue = '#'+red.toString(16)+green.toString(16)+blue.toString(16)+'FF';
		} else if (value > 0.5) {
			// orange: max 255, 147, 41
			// new: 255, 98, 0, 89 : FF620059
			var scale = 1.0-(value-0.5)*2;

			var red = 255; // doesn't change
			var green = Math.round(98 + (255-98) * scale);
			var blue = Math.round(255 * scale);
			var white = Math.round(89 + (255-89) * scale);

			console.log("Orange", scale, red, green, blue, white);
			red = red.toString(16);
			if (red.length < 2) red = '0'+red;
			green = green.toString(16);
			if (green.length < 2) green = '0'+green;
			blue = blue.toString(16);
			if (blue.length < 2) blue = '0'+blue;
			white = white.toString(16);
			if (white.length < 2) white = '0'+white;

			returnValue = '#'+red+green+blue+white;
		}

		return returnValue.toUpperCase();
	},
	set_white: function (level) {
		var self = this;

		console.log("White:", level, this.get('data.white_value'));
		this.set('data.white_value', +level).set('edit.white_value', +level);
		var white_color = this.get_white_color();
		// console.log("White:", white_color);
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
