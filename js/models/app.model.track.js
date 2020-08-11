app.model.track = {
	defaults: function (data) {
		var obj = {
			id								: data.id,
			type							: 'track',

			is_adding					: 'false',
			playlist_ids			: [],
			playlist_not_ids	: [],

			upload_status										: 'hidden', // hidden|false|uploading|success
			table_was_playing								: 'false', // sisbot was playing before requesting thumbnail
			generating_thumbnails						: 'false',

			downloading_community_track 		: 'false',
			download_cloud									: 'false',
			track_checked										: 'false',
			is_community										: 'false', // track from webcenter
			is_downloaded 									: 'false', // community

			is_favorite											:'false',

			svg_scaled											: 'false', // for drawing app to have pre-scaled values

			show_cam												: 'false', // Expermental feature

			d3															:'false',
			d3_data : {
				background						: 'transparent', // transparent, #fdfaf3, #d6d2ca, #c9bb96
				stroke								: '#797977', // #797977, #948252
				stroke_width					: 3,
				stroke_edge						: '#fdfaf3', // #fdfaf3, #f6ebcd
				stroke_edge_width			: 6,
				points								: [],
				steps									: 0,
				r_max_dist						: 0.1,
				retrace_steps					: 5,
				loaded								: "false",
				circle								: "true",
				circle_stroke					: '#d6d2ca',
				circle_stroke_width		: 2,
				square								: "false"
			},
			edit_steps: 30, // for slider
			steps: 30, // steps between svg points to make
			max_steps: 30, // max steps

			data: {
				id: data.id,
				type: 'track',
				version: this.current_version,

				name: '',
				is_published: 'false',

				duration: '90',		// minutes

				created_by_id: 'false',
				email: 'false', // community
				created_by_name: 'false', // community
				is_public: 'true', // community
				is_deletable: 'true', // user is able to delete this track

				original_file_type: 'false', 	// thr|svg|draw|tilt
				has_verts_file: 'false',
				verts: '',		// temporary

				default_vel: 1,
				default_accel: 0.5,
				default_thvmax: 1,
				reversed: false,
				firstR: -1,
				lastR: -1,
				r_type: 'r', // r00|r01|r10|r11
				reversible: "false", // WC value
				// is_reversible		: "false", // Sisbot value

				cam_image				: "false", // Pi camera image

				download_count	: 0, // webcenter downloads
				popularity			: 0, // webcenter popularity rating
				is_approved			: 'true' // webcenter approval (could be false, if your own track)
			}
		};

		return obj;
	},
	current_version: 1,

	on_init: function () {
		this.on('change:track_checked', this.get_track_checked);

		// fix is_reversible if it doesn't exist
		if (!this.get('data.is_reversible')) {
			app.log("Fix is_reversible", this.id, this.get('data.reversible'));
			this.set('data.is_reversible', this.get('data.reversible'));
		}

		if (this.get('data.firstR') == this.get('data.lastR')) {
			this.set('data.reversible', 'false');
			this.set('data.is_reversible', 'false');
		}

		// fix if this track is community
		var sisbot = app.manager.get_model('sisbot_id');
		if (sisbot) {
			var track_ids = sisbot.get('data.track_ids');
			if (track_ids && _.isArray(track_ids)) {
				var track_index = track_ids.indexOf(this.id);
				if (track_index < 0) this.set('is_community', 'true');
			}
		}

		// var playlist = app.session.get_model('active.playlist_id')
	},
	save_track: function () {
		// app.log("Save Track", this.get('data'));
		var sisbot = app.manager.get_model('sisbot_id');
		sisbot.save_to_sisbot(this.get('data'), function (resp) {
			app.log("Track saved", resp);
		});
	},
	after_export: function () {
		app.current_session().set_active({ track_id: 'false' });
	},
	setup_edit: function (data) {
		this.set('edit', this.get('data')).set('errors', []);

		// remove unwanted values
		this.unset('edit.verts');
		this.unset('edit.file_data');

		// check if we need to
		if (data && data != this && data.set_created_by_name) {
			if (app.session.get('user_id') !== 'false') {
				var user = app.session.get_model('user_id');
				this.set('edit.created_by_name', user.get('data.username'));
				this.set('edit.created_by_id', user.get('data.artist_id'));
			} else if (app.session.get('registration.username')) {
				this.set('edit.created_by_name', app.session.get('registration.username'));
			}
		}

		return this;
	},
	get_track_checked: function () {
		if (this.get('track_checked') == 'true') {
			app.trigger('community:select_track', this);
		} else app.trigger('community:deselect_track', this);
	},
	/**************************** D3 RENDERING ***********************************/
	load_d3_data: function () {
		app.log("Load D3 Data", this.id);
		var self = this;
		self.set("d3_data.loaded", "false");
		app.manager.get_model('sisbot_id').track_get_verts(this, function (verts) {
			var points = self._convert_verts_to_d3(verts);

			// app.log("Points:", points);
			self.set("d3_data.points", points);
			self.set("d3_data.loaded", "true");
		});
	},
	_convert_verts_to_d3: function (data) {
		var return_value = [];
		// Step the file, line by line
		var lines = data.toString().trim().split('\n');
		var regex = /^\s*$/; // eliminate empty lines

		_.map(lines, function (line) {
			line.trim();

			if (line.length > 0 && line.substring(0, 1) != '#' && !line.match(regex)) {
				var values = line.split(/\s+/);
				var entry = { y: parseFloat(values[0]), x: parseFloat(values[1]) }; // [theta, rho]
				return_value.push(entry);
			}
		});

		return return_value;
	},
	get_thumbnail: function () {
		// exit if already generating
		if (this.get('generating_thumbnails') == 'true') return this;

		var self = this;
		self.set('generating_thumbnails', 'true');

		// make sure table is paused, sending verts can cause ball jitter
		var sisbot = app.manager.get_model('sisbot_id');
		if (sisbot.get('data.state') == 'playing') {
			sisbot.pause();
			this.set('table_was_playing', 'true');

			app.log("Wait longer for pause to finish");
			setTimeout(function () {
				self.set('generating_thumbnails', 'false');
				self.get_thumbnail();
			}, 4000);
		} else {
			// send generate message to sisbot to create thumbnail
			app.log("Get Thumbnail", this.get('data.name'));

			var data = { id: 'preview', dimensions: 400 };
			var original_type = this.get('data.original_file_type');
			if (original_type == 'svg' || original_type == 'draw') data.raw_coors = this.process_svg(this.get('data.file_data'));
			else data.raw_coors = this.get('data.verts');

			var address = app.manager.get_model('sisbot_id').get('data.local_ip')
			var post_data = {
				_url: 'http://' + address + '/',
				_type: 'POST',
				_timeout: 90000,
				endpoint: 'sisbot/thumbnail_preview_generate',
				data: data
			};

			// send to sisbot
			app.post.fetch(post_data, function exists_cb(obj) {
				self.set('generating_thumbnails', 'false');
				app.log('thumbnail response', obj);
				if (obj.err) {
					app.plugins.n.notification.alert(obj.err)
				} else {
					app.log('Thumbnail generated');
					if (self.get('table_was_playing') == 'true') {
						sisbot.play();
						self.set('table_was_playing', 'false');
					}
				}
			}, 0);
		}

		return this;
	},
	/**************************** GENERAL ***********************************/
	play_logic: function (track_index) {
		app.log("play_logic", track_index);
		var active = app.session.get('active');
		var current_track = app.manager.get_model('sisbot_id').get('data.active_track.id');
		app.log("Play Logic: active ", active, ", index " + track_index, ", current " + current_track, ", new " + this.id);
		if (active.primary == 'current' && this.id == current_track) {
			// do nothing, we're currently playing
		} else if (active.primary == 'current') {
			// we have another track on the playlist
			app.manager.get_model('sisbot_id').get_model('data.active_playlist_id').play_from_current(track_index);
		} else if (active.primary == 'media' && active.secondary == 'tracks') {
			// tracks overview page
			this.play();
		} else if (active.primary == 'media' && active.secondary == 'playlist') {
			app.collection.get(active.playlist_id).play(track_index);
		}
		app.trigger('modal:close');
	},
	play: function () {
		app.trigger('sisbot:set_track', this.get('data'));
	},
	delete: function () {
		app.trigger('sisbot:track_remove', this);
	},
	on_file_upload: function (data, file, field) {
		app.log("On File Upload:", data, file, field);
		if (/\.(svg|thr)$/i.test(file.name)) { // regex for allowed filetypes
			this.upload_verts_to_cloud(data);
		}
		return this;
	},
	upload_track_to_cloud: function () {
		this.set('data.is_saved', 'true');

		var post_data = this.get('data');

		post_data._url = app.config.get_webcenter_url();
		post_data._type = 'POST';
		post_data.endpoint = 'set';

		var verts_data = post_data.verts;
		post_data.verts = '';

		app.post.fetch(post_data, function cb(obj) { }, 0);

		this.upload_verts_to_cloud(verts_data);

		return this;
	},
	upload_verts_to_cloud: function (verts_data) {
		var self = this;
		this.set('upload_status', 'uploading');

		app.post.fetch({
			_url: app.config.get_webcenter_url(),
			_type: 'POST',
			endpoint: 'upload_track',
			id: this.id,
			verts: verts_data,
		}, function cb(obj) {
			if (obj.err) {
				self.set('upload_status', 'failure');
			} else {
				self.set('upload_status', 'success');
				self.set('data.has_verts_file', 'true');

				setTimeout(function () {
					self.set('upload_status', 'hidden');
				}, 2500);
			}
		}, 0);

		return this;
	},
	upload_track_to_sisbot: function () {
		var name = this.get('edit.name');
		var verts = this.get('edit.verts');
		var errors = [];

		if (name == '') errors.push('- Track Name cannot be empty');
		if (verts == '') errors.push('- Track Verts File cannot be empty');

		this.set('errors', errors);

		if (errors.length > 0) return this;

		this.set('upload_status', 'uploading').set('generating_thumbnails', 'true');

		// set verts to current settings if svg
		var original_type = this.get('data.original_file_type');
		if (original_type == 'svg' || original_type == 'draw') this.set('data.verts', this.process_svg(this.get('data.file_data')));

		// remove data.file_data, it is now verts
		this.unset('data.file_data');

		// save name to session, so it is populated automatically
		var created_by_name = this.get('edit.created_by_name');
		if (created_by_name != '' && created_by_name != 'false') {
			app.session.set('registration.username', created_by_name);
			app.session.save_session();
		}

		// track is good. Change some settings and upload to sisbot!
		this.set('data.name', this.get('edit.name'));
		if (created_by_name != '') this.set('data.created_by_name', created_by_name);
		if (this.get('edit.created_by_id') != 'false') this.set('data.created_by_id', this.get('edit.created_by_id'));
		this.set('data.has_verts_file', 'true');

		// if (app.manager.get('user_id') !== 'false') {
		// 	this.set('data.created_by_id', app.manager.get('user_id'));
		// 	this.set('data.created_by_name', app.manager.get_model('user_id').get('data.name'));
		// }

		// app.log("Track data to save:", JSON.stringify(this.get('data')));

		app.collection.add(this);
		app.trigger('sisbot:track_add', this);

		return this;
	},
	/**************************** SVG *****************************************/
	setup_steps: function () {
		this.set('edit_steps', this.get('steps'));

		return this;
	},
	set_steps: function (value) {
		if (value != this.get('steps')) {
			app.log("Set steps", this.get('edit_steps'), value);
			this.set('steps', +value).set('edit_steps', +value);
		}
	},
	steps_min: function () {
		if (this.get('steps') != 1) {
			this.set('steps', 1).set('edit_steps', 1);
			this.get_thumbnail();
		}
	},
	steps_max: function () {
		if (this.get('steps') != this.get('max_steps')) {
			this.set('steps', this.get('max_steps')).set('edit_steps', this.get('max_steps'));
			this.get_thumbnail();
		}
	},
	process_svg: function (file_data) {
		// app.log("Process svg", file_data);
		var self = this;

		// verts stores the file data
		var svg_xml = file_data;

		var oParser = new DOMParser();
		var oDOM = oParser.parseFromString(svg_xml, "text/xml");
		var pathElements = oDOM.getElementsByTagName("path");

		var verts = [];
		var steps = this.get('steps'); // make part of model

		_.each(pathElements, function (pathEl) {
			var path = pathEl.attributes.getNamedItem("d").value;
			var commands = path.split(/(?=[MmLlCcSsQqTtHhVvAaZzR])/); // any letter
			// app.log("Commands:", commands);

			// save so we can loop this object (z|Z)
			var is_first_point = true;
			var first_point;

			// remember last control point
			var control_point;
			var prev_command;

			_.each(commands, function (entry) {
				var command = entry.substring(0, 1);
				var points_string = entry.substring(1).trim();
				var data = points_string.match(/([-]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g);

				// app.log(entry, command, data);

				// trim extras, convert to numbers (if any)
				if (data) {
					for (var i = 0; i < data.length; i++) {
						data[i] = +data[i];
					}
				}

				switch (command) {
					case 'R':
						// app.log("Sisyphus arc, don't subdivide", data);
						if (data.length % 2 == 0) {
							for (var i = 0; i < data.length; i += 2) {
								if (is_first_point) {
									is_first_point = false;
									first_point = [data[0], data[1]];
									verts.push(first_point);
								} else {
									verts.push([data[i], data[i + 1]]);
								}
							}
						} else app.log("Error, wrong number of Start points");
						break;
					case 'M':
						// app.log("Move", data);
						if (data.length % 2 == 0) {
							for (var i = 0; i < data.length; i += 2) {
								if (is_first_point) {
									is_first_point = false;
									first_point = [data[0], data[1]];
									if (verts.length == 0) verts.push(first_point);
									else {
										var p0 = verts[verts.length - 1];
										var p1 = first_point;
										for (var j = 1; j <= steps; j++) {
											// app.log("fM ", p0, p1);
											var point = self._calculate_linear_point(j / steps, p0, p1);
											verts.push(point);
										}
									}
								} else {
									var p0 = verts[verts.length - 1];
									var p1 = [data[i], data[i + 1]];
									for (var j = 1; j <= steps; j++) {
										// app.log("M ", p0, p1);
										var point = self._calculate_linear_point(j / steps, p0, p1);
										verts.push(point);
									}
								}
							}
						} else app.log("Error, wrong number of Start points");
						break;
					case 'm':
						// app.log("move", data);
						if (data.length % 2 == 0) {
							for (var i = 0; i < data.length; i += 2) {
								if (is_first_point) {
									is_first_point = false;
									if (verts.length == 0) {
										first_point = [data[0], data[1]];
										verts.push(first_point);
									} else {
										var p0 = verts[verts.length - 1];
										var p1 = [p0[0] + data[i], p0[1] + data[i + 1]];
										first_point = p1;
										for (var j = 1; j <= steps; j++) {
											var point = self._calculate_linear_point(j / steps, p0, p1);
											verts.push(point);
										}
									}
								} else {
									var p0 = verts[verts.length - 1];
									var p1 = [p0[0] + data[i], p0[1] + data[i + 1]];
									for (var j = 1; j <= steps; j++) {
										var point = self._calculate_linear_point(j / steps, p0, p1);
										verts.push(point);
									}
								}
							}
						}
						else app.log("Error, wrong number of start points");
						break;
					case 'L':
						// app.log("Line", data);
						if (data.length % 2 == 0) {
							for (var i = 0; i < data.length; i += 2) {
								var p0 = verts[verts.length - 1];
								var p1 = [data[i], data[i + 1]];
								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_linear_point(j / steps, p0, p1);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong number of Line points");
						break;
					case 'l':
						// app.log("line", data);
						if (data.length % 2 == 0) {
							for (var i = 0; i < data.length; i += 2) {
								var p0 = verts[verts.length - 1];
								var p1 = [p0[0] + data[i], p0[1] + data[i + 1]];
								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_linear_point(j / steps, p0, p1);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong number of line points");
						break;
					case 'H':
						// app.log("Horizontal", data);
						for (var i = 0; i < data.length; i++) {
							var p0 = verts[verts.length - 1];
							var p1 = [data[i], p0[1]];
							for (var j = 1; j <= steps; j++) {
								var point = self._calculate_linear_point(j / steps, p0, p1);
								verts.push(point);
							}
						}
						break;
					case 'h':
						// app.log("horizontal", data);
						for (var i = 0; i < data.length; i++) {
							var p0 = verts[verts.length - 1];
							var p1 = [p0[0] + data[i], p0[1]];
							for (var j = 1; j <= steps; j++) {
								var point = self._calculate_linear_point(j / steps, p0, p1);
								verts.push(point);
							}
						}
						break;
					case 'V':
						// app.log("Vertical", data);
						for (var i = 0; i < data.length; i++) {
							var p0 = verts[verts.length - 1];
							var p1 = [p0[0], data[i]];
							for (var j = 1; j <= steps; j++) {
								var point = self._calculate_linear_point(j / steps, p0, p1);
								verts.push(point);
							}
						}
						break;
					case 'v':
						// app.log("vertical", data);
						for (var i = 0; i < data.length; i++) {
							var p0 = verts[verts.length - 1];
							var p1 = [p0[0], p0[1] + data[i]];
							for (var j = 1; j <= steps; j++) {
								var point = self._calculate_linear_point(j / steps, p0, p1);
								verts.push(point);
							}
						}
						break;
					case 'C':
						// app.log("Curve", data);
						if (data.length % 6 == 0) {
							for (var i = 0; i < data.length; i += 6) {
								var p0 = verts[verts.length - 1];
								var p1 = [data[i], data[i + 1]];
								var p2 = [data[i + 2], data[i + 3]];
								var p3 = [data[i + 4], data[i + 5]];

								control_point = p2; // remember
								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_bezier_point(j / steps, p0, p1, p2, p3);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong amount of Curve points", data.length, data);
						break;
					case 'c':
						// app.log("curve", data);
						if (data.length % 6 == 0) {
							for (var i = 0; i < data.length; i += 6) {
								var p0 = verts[verts.length - 1];
								var p1 = [p0[0] + data[i], p0[1] + data[i + 1]];
								var p2 = [p0[0] + data[i + 2], p0[1] + data[i + 3]];
								var p3 = [p0[0] + data[i + 4], p0[1] + data[i + 5]];

								control_point = p2; // remember
								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_bezier_point(j / steps, p0, p1, p2, p3);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong amount of curve points", data.length, data);
						break;
					case 'S':
						// app.log("Shortcut", data, prev_command);
						if (prev_command.toLowerCase() != 'c' && prev_command.toLowerCase() != 's') control_point = verts[verts.length - 1];
						if (data.length % 4 == 0) {
							for (var i = 0; i < data.length; i += 4) {
								var p0 = verts[verts.length - 1];
								var p1 = [p0[0] - control_point[0] + p0[0], p0[1] - control_point[1] + p0[1]]; // control point from before
								var p2 = [data[i], data[i + 1]];
								var p3 = [data[i + 2], data[i + 3]];

								control_point = p2; // remember
								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_bezier_point(j / steps, p0, p1, p2, p3);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong amount of Shortcut Curve points", data.length, data);
						break;
					case 's':
						// app.log("shortcut", data, prev_command);
						if (prev_command.toLowerCase() != 'c' && prev_command.toLowerCase() != 's') control_point = verts[verts.length - 1];
						if (data.length % 4 == 0) {
							for (var i = 0; i < data.length; i += 4) {
								var p0 = verts[verts.length - 1];
								var p1 = [p0[0] - control_point[0] + p0[0], p0[1] - control_point[1] + p0[1]];
								var p2 = [p0[0] + data[i], p0[1] + data[i + 1]];
								var p3 = [p0[0] + data[i + 2], p0[1] + data[i + 3]];

								control_point = p2; // remember
								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_bezier_point(j / steps, p0, p1, p2, p3);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong amount of shortcut curve points", data.length, data);
						break;
					case 'Q':
						// app.log("Quadratic", data, first_point);
						if (data.length % 4 == 0) {
							for (var i = 0; i < data.length; i += 4) {
								var p0 = verts[verts.length - 1];
								var p1 = [data[i], data[i + 1]];
								var p2 = [data[i], data[i + 1]];
								var p3 = [data[i + 2], data[i + 3]];

								control_point = p2; // remember
								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_bezier_point(j / steps, p0, p1, p2, p3);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong amount of Quadratic points", data.length, data);
						break;
						break;
					case 'q':
						// app.log("quadratic", data, first_point);
						if (data.length % 4 == 0) {
							for (var i = 0; i < data.length; i += 4) {
								var p0 = verts[verts.length - 1];
								var p1 = [p0[0] + data[i], p0[1] + data[i + 1]];
								var p2 = [p0[0] + data[i], p0[1] + data[i + 1]];
								var p3 = [p0[0] + data[i + 2], p0[1] + data[i + 3]];

								control_point = p2; // remember
								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_bezier_point(j / steps, p0, p1, p2, p3);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong amount of quadratic points", data.length, data);
						break;
					case 'T':
						// app.log("T", data, first_point);
						if (data.length % 2 == 0) {
							for (var i = 0; i < data.length; i += 2) {
								var p0 = verts[verts.length - 1];
								var p1 = [p0[0] - control_point[0] + p0[0], p0[1] - control_point[1] + p0[1]]; // control point from before
								var p2 = [p1[0], p1[1]];
								var p3 = [data[i], data[i + 1]];

								control_point = p2; // remember
								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_bezier_point(j / steps, p0, p1, p2, p3);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong amount of T Curve points", data.length, data);
						break;
					case 't':
						// app.log("t", data, first_point);
						if (data.length % 2 == 0) {
							for (var i = 0; i < data.length; i += 2) {
								var p0 = verts[verts.length - 1];
								var p1 = [p0[0] - control_point[0] + p0[0], p0[1] - control_point[1] + p0[1]];
								var p2 = [p1[0], p1[1]];
								var p3 = [p0[0] + data[i], p0[1] + data[i + 1]];

								control_point = p2; // remember
								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_bezier_point(j / steps, p0, p1, p2, p3);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong amount of t curve points", data.length, data);
						break;
					case 'A':
						// app.log("Arc", data);
						if (data.length % 7 == 0) {
							for (var i = 0; i < data.length; i += 7) {
								var rx = data[i];
								var ry = data[i + 1];
								var xAxisRotation = data[i + 2];
								var largeArcFlag = data[i + 3];
								var sweepFlag = data[i + 4];
								var p0 = verts[verts.length - 1];
								var p1 = [data[i + 5], data[i + 6]];

								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_elliptical_arc(j / steps, p0, p1, rx, ry, xAxisRotation, largeArcFlag, sweepFlag);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong number of Arc points");
						break;
					case 'a':
						// app.log("arc", data);
						if (data.length % 7 == 0) {
							for (var i = 0; i < data.length; i += 7) {
								var rx = data[i];
								var ry = data[i + 1];
								var xAxisRotation = data[i + 2];
								var largeArcFlag = data[i + 3];
								var sweepFlag = data[i + 4];
								var p0 = verts[verts.length - 1];
								var p1 = [p0[0] + data[i + 5], p0[1] + data[i + 6]];

								for (var j = 1; j <= steps; j++) {
									var point = self._calculate_elliptical_arc(j / steps, p0, p1, rx, ry, xAxisRotation, largeArcFlag, sweepFlag);
									verts.push(point);
								}
							}
						} else app.log("Error, wrong number of arc points");
						break;
					case 'Z':
						// app.log("Close", data, first_point);
						var p0 = verts[verts.length - 1];
						var p1 = first_point;
						for (var j = 1; j <= steps; j++) {
							var point = self._calculate_linear_point(j / steps, p0, p1);
							verts.push(point);
						}
						is_first_point = true; // reset to true for closing
						break;
					case 'z':
						// app.log("close", data, first_point);
						var p0 = verts[verts.length - 1];
						var p1 = first_point;
						for (var j = 1; j <= steps; j++) {
							var point = self._calculate_linear_point(j / steps, p0, p1);
							verts.push(point);
						}
						is_first_point = true; // reset to true for closing
						break;
					default:
						app.log("Unknown command", command);
						break;
				}

				prev_command = command; // remember last command
			});
		});

		// center resulting verts
		if (this.get('svg_scaled') != 'true') {
			var min_max = self._min_max(verts);
			var half_x = (min_max[2] - min_max[0]) / 2;
			var half_y = (min_max[3] - min_max[1]) / 2;
			_.each(verts, function (point) {
				point[0] = point[0] - min_max[0] - half_x;
				point[1] = point[1] - min_max[1] - half_y;
			});
		}
		// app.log("Centered Verts", JSON.parse(JSON.stringify(verts)));

		// convert to polar
		var th_offset = 0;
		var last_th = 0;
		var pi = Math.PI;
		var loop_th = pi * 2;
		_.each(verts, function (point) {
			var rho = Math.sqrt(point[0] * point[0] + point[1] * point[1]);
			var new_th = Math.atan2(point[1], point[0]) + pi / 2;
			// if (Math.abs(new_th) == pi) new_th = 0;
			if (new_th - last_th > pi) {
				th_offset -= loop_th;
				// app.log("- Point Th", point[0], ":", new_th, "-", last_th, "=", th_offset);
			} else if (new_th - last_th < -pi) {
				th_offset += loop_th;
				// app.log("+ Point Th", point[0], ":", new_th, "-", last_th, "=", th_offset);
			}
			point[0] = new_th + th_offset; // th
			point[1] = rho; // rho

			last_th = new_th;
		});

		// normalize
		if (this.get('svg_scaled') != 'true') {
			var polar_min_max = self._min_max(verts);
			_.each(verts, function (point, index) {
				point[1] /= polar_min_max[3];
			});
		}

		// fix start point if looping track
		var start_index = -1;
		if (Math.abs(verts[0][0] % loop_th - verts[verts.length - 1][0] % loop_th) < 0.000000001 && Math.abs(verts[0][1] - verts[verts.length - 1][1]) < 0.000000001) {
			// find the first instance of zero or one
			_.each(verts, function (point, index) {
				if (start_index < 0 && self._is_valid_first_rho(point)) {
					start_index = index;
				}
			});
		}

		// shift array if needed (not already start/end)
		if (start_index > 0 && start_index < verts.length - 1) {
			var first_group = verts.splice(0, start_index);

			// fix looping
			first_group.push(JSON.parse(JSON.stringify(verts[0]))); // end at same point
			verts.pop(); // remove duplicate/start/end

			// adjust looping th difference
			var loop_diff = Math.round((verts[verts.length - 1][0] - first_group[0][0]) / loop_th);
			if (loop_diff != 0) {
				_.each(first_group, function (point, index) {
					point[0] += loop_diff * loop_th;
				});
			}

			verts = verts.concat(first_group);
		}

		// make sure start/end are 0 or 1
		var start_rho = verts[0][1];
		if (start_rho != 1 && start_rho != 0) {
			if (start_rho <= 0.5) verts.unshift([verts[0][0], 0]);
			else verts.unshift([verts[0][0], 1]);
		}
		var end_rho = verts[verts.length - 1][1];
		if (end_rho != 1 && end_rho != 0) {
			if (end_rho <= 0.5) verts.push([verts[verts.length - 1][0], 0]);
			else verts.push([verts[verts.length - 1][0], 1]);
		}

		// convert to space separates, line separated string
		var verts_string = "";
		_.each(verts, function (point) {
			verts_string += point[0] + " " + point[1] + "\n";
		});

		// send to page for confirming the appearance/upload
		return verts_string;
	},
	_calculate_linear_point: function (t, p0, p1) {
		if (t == 0) return [p0[0], p0[1]]; // no calculation needed
		if (t == 1) return [p1[0], p1[1]]; // no calculation needed

		var p = [];
		p[0] = p0[0] + t * (p1[0] - p0[0]);
		p[1] = p0[1] + t * (p1[1] - p0[1]);

		return p;
	},
	_calculate_bezier_point: function (t, p0, p1, p2, p3) { // time 0-1, start point, control 1, control 2, end point
		if (t == 0) return [p0[0], p0[1]]; // no calculation needed
		if (t == 1) return [p3[0], p3[1]]; // no calculation needed

		var u = 1.0 - t;
		var tt = t * t;
		var uu = u * u;
		var uuu = uu * u;
		var ttt = tt * t;

		var p = [];
		p[0] = uuu * p0[0]; //first term
		p[1] = uuu * p0[1]; //first term
		p[0] += 3 * uu * t * p1[0]; //second term
		p[1] += 3 * uu * t * p1[1]; //second term
		p[0] += 3 * u * tt * p2[0]; //third term
		p[1] += 3 * u * tt * p2[1]; //third term
		p[0] += ttt * p3[0]; //fourth term
		p[1] += ttt * p3[1]; //fourth term

		return p;
	},
	_calculate_elliptical_arc: function (t, p0, p1, rx, ry, xAxisRotation, largeArcFlag, sweepFlag) {
		// In accordance to: http://www.w3.org/TR/SVG/implnote.html#ArcOutOfRangeParameters
		rx = Math.abs(rx);
		ry = Math.abs(ry);
		xAxisRotation = this._mod(xAxisRotation, 360);
		var xAxisRotationRadians = this._toRadians(xAxisRotation);
		// If the endpoints are identical, then this is equivalent to omitting the elliptical arc segment entirely.
		if (p0[0] === p1[0] && p0[1] === p1[1]) {
			return p0;
		}

		// If rx = 0 or ry = 0 then this arc is treated as a straight line segment joining the endpoints.
		if (rx === 0 || ry === 0) {
			return this._calculate_linear_point(t, p0, p1);
		}

		// Following "Conversion from endpoint to center parameterization"
		// http://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
		// Step #1: Compute transformedPoint
		var dx = (p0[0] - p1[0]) / 2;
		var dy = (p0[1] - p1[1]) / 2;
		var transformedPoint = {
			x: Math.cos(xAxisRotationRadians) * dx + Math.sin(xAxisRotationRadians) * dy,
			y: -Math.sin(xAxisRotationRadians) * dx + Math.cos(xAxisRotationRadians) * dy
		};
		// Ensure radii are large enough
		var radiiCheck = Math.pow(transformedPoint.x, 2) / Math.pow(rx, 2) + Math.pow(transformedPoint.y, 2) / Math.pow(ry, 2);
		if (radiiCheck > 1) {
			rx = Math.sqrt(radiiCheck) * rx;
			ry = Math.sqrt(radiiCheck) * ry;
		}

		// Step #2: Compute transformedCenter
		var cSquareNumerator = Math.pow(rx, 2) * Math.pow(ry, 2) - Math.pow(rx, 2) * Math.pow(transformedPoint.y, 2) - Math.pow(ry, 2) * Math.pow(transformedPoint.x, 2);
		var cSquareRootDenom = Math.pow(rx, 2) * Math.pow(transformedPoint.y, 2) + Math.pow(ry, 2) * Math.pow(transformedPoint.x, 2);
		var cRadicand = cSquareNumerator / cSquareRootDenom;
		// Make sure this never drops below zero because of precision
		cRadicand = cRadicand < 0 ? 0 : cRadicand;
		var cCoef = (largeArcFlag !== sweepFlag ? 1 : -1) * Math.sqrt(cRadicand);
		var transformedCenter = {
			x: cCoef * ((rx * transformedPoint.y) / ry),
			y: cCoef * (-(ry * transformedPoint.x) / rx)
		};

		// Step #3: Compute center
		var center = {
			x: Math.cos(xAxisRotationRadians) * transformedCenter.x - Math.sin(xAxisRotationRadians) * transformedCenter.y + ((p0[0] + p1[0]) / 2),
			y: Math.sin(xAxisRotationRadians) * transformedCenter.x + Math.cos(xAxisRotationRadians) * transformedCenter.y + ((p0[1] + p1[1]) / 2)
		};

		// Step #4: Compute start/sweep angles
		// Start angle of the elliptical arc prior to the stretch and rotate operations.
		// Difference between the start and end angles
		var startVector = {
			x: (transformedPoint.x - transformedCenter.x) / rx,
			y: (transformedPoint.y - transformedCenter.y) / ry
		};
		var startAngle = this._angleBetween({
			x: 1,
			y: 0
		}, startVector);

		var endVector = {
			x: (-transformedPoint.x - transformedCenter.x) / rx,
			y: (-transformedPoint.y - transformedCenter.y) / ry
		};
		var sweepAngle = this._angleBetween(startVector, endVector);

		if (!sweepFlag && sweepAngle > 0) {
			sweepAngle -= 2 * Math.PI;
		}
		else if (sweepFlag && sweepAngle < 0) {
			sweepAngle += 2 * Math.PI;
		}
		// We use % instead of `_mod()..)` because we want it to be -360deg to 360deg(but actually in radians)
		sweepAngle %= 2 * Math.PI;

		// From http://www.w3.org/TR/SVG/implnote.html#ArcParameterizationAlternatives
		var angle = startAngle + (sweepAngle * t);
		var ellipseComponentX = rx * Math.cos(angle);
		var ellipseComponentY = ry * Math.sin(angle);

		var point = [
			Math.cos(xAxisRotationRadians) * ellipseComponentX - Math.sin(xAxisRotationRadians) * ellipseComponentY + center.x,
			Math.sin(xAxisRotationRadians) * ellipseComponentX + Math.cos(xAxisRotationRadians) * ellipseComponentY + center.y
		];

		// Attach some extra info to use
		// point.ellipticalArcStartAngle = startAngle;
		// point.ellipticalArcEndAngle = startAngle+sweepAngle;
		// point.ellipticalArcAngle = angle;
		//
		// point.ellipticalArcCenter = center;
		// point.resultantRx = rx;
		// point.resultantRy = ry;

		return point;
	},
	_mod: function (x, m) {
		return (x % m + m) % m;
	},
	_toRadians: function (angle) {
		return angle * (Math.PI / 180);
	},
	_angleBetween: function (v0, v1) {
		var p = v0.x * v1.x + v0.y * v1.y;
		var n = Math.sqrt((Math.pow(v0.x, 2) + Math.pow(v0.y, 2)) * (Math.pow(v1.x, 2) + Math.pow(v1.y, 2)));
		var sign = v0.x * v1.y - v0.y * v1.x < 0 ? -1 : 1;
		var angle = sign * Math.acos(p / n);

		//var angle = Math.atan2(v0.y, v0.x) - Math.atan2(v1.y,  v1.x);

		return angle;
	},
	_min_max: function (given_array) {
		var min_x, max_x, min_y, max_y;
		_.each(given_array, function (point) {
			if (min_x == undefined || point[0] < min_x) min_x = point[0];
			if (max_x == undefined || point[0] > max_x) max_x = point[0];
			if (min_y == undefined || point[1] < min_y) min_y = point[1];
			if (max_y == undefined || point[1] > max_y) max_y = point[1];
		});

		return [min_x, min_y, max_x, max_y];
	},
	_is_valid_first_rho: function (given_point) {
		// return true if valid first rho (0 or 1)
		return (given_point[1] == 0 || given_point[1] == 1);
	},
	/**************************** PLAYLISTS ***********************************/
	playlist_obj: function () { // returns object to save in playlist (to retain speeds/reversed/etc per instance)
		var return_obj = {
			id: this.get('id'),
			vel: this.get('data.default_vel'),
			accel: this.get('data.default_accel'),
			thvmax: this.get('data.default_thvmax'),
			reversed: this.get('data.revered'),
			firstR: this.get('data.firstR'),
			lastR: this.get('data.lastR'),
			reversible: this.get('data.is_reversible')
		};
		return return_obj;
	},
	playlist_cancel: function () {
		this.set('is_adding', 'false');
		return this;
	},
	goBackFromHero: function () {
		var active = app.session.get('active');
		app.log("I made it to Hero");
		app.log('goBack =', active.goBack);
		if (active.goBack == 'playlist' || active.goBack == 'false') {
			app.trigger('session:active', { secondary: 'playlist' });
		} else {
			app.trigger('session:active', { secondary: 'tracks' });
		}
	},
	get_not_playlists: function () {
		var sisbot = app.current_session().get_model('sisyphus_manager_id').get_model('sisbot_id');
		var playlist_ids = [];
		var track_id = this.id;

		_.each(sisbot.get_model('data.playlist_ids'), function (p) {
			if (_.findIndex(p.get('data.tracks'), { id: track_id }) == -1)
				playlist_ids.push(p.id);
		});

		this.set('playlist_not_ids', playlist_ids);
		this.trigger('change:playlist_not_ids');
	},
	get_playlists: function () {
		var sisbot = app.current_session().get_model('sisyphus_manager_id').get_model('sisbot_id');
		var playlist_ids = [];
		var track_id = this.id;

		_.each(sisbot.get_model('data.playlist_ids'), function (p) {
			if (_.findIndex(p.get('data.tracks'), { id: track_id }) > -1)
				playlist_ids.push(p.id);
		});

		this.set('playlist_ids', playlist_ids);
	},
	is_playlist_favorite: function () {
		var playlist_model = app.manager.get_model('sisbot_id').get_model('data.favorite_playlist_id');

		if (playlist_model && playlist_model.has_track) {
			var has_track = playlist_model.has_track(this.id);
			this.set('is_favorite', '' + has_track);
		}
	},
	favorite_toggle: function (trackID) {
		if (app.manager.get_model('sisbot_id').is_legacy())
			app.plugins.n.notification.alert('This feature is unavailable because your Sisyphus firmware is not up to date. Please update your version in order to enable this feature',
				function (resp_num) {
					if (resp_num == 1) {
						return;
					}
					app.collection.get(playlist_id).add_track_and_save({ id: trackID });

				}, 'Outdated Firmware', ['OK']);

		var status = this.get('is_favorite');
		var fav_model = app.manager.get_model('sisbot_id').get_model('data.favorite_playlist_id');
		if (status == 'true' && fav_model) {
			fav_model.remove_track_and_save(this.id);
		} else if (fav_model) {
			fav_model.add_track_and_save({ id: trackID });
		}
		this.set('is_favorite', app.plugins.bool_opp[status]);
	},
	reversible_toggle: function () {
		var status = this.get('data.is_reversible');
		this.set('data.is_reversible', app.plugins.bool_opp[status]);
		this.save_track();
	},
	/**************************** COMMUNITY ***********************************/
	fetch_then_download: function () {
		var self = this;

		var req_obj = {
			_url: app.config.get_webcenter_url(),
			_type: 'POST',
			endpoint: 'tracks/get_track_header.json',
			id: this.id
		};

		function cb(obj) {
			if (obj.err || obj.resp.length == 0) {
				app.log(self.get('data.name') + " " + track_id);
				return app.plugins.n.notification.alert('There was an error downloading ' + self.get('data.name') +'. Please try again later - '+ JSON.stringify(obj.err))
			} else {
				self.set('data', obj.resp[0]);
				self.download();
			}
		}

		app.post.fetch(req_obj, cb, 0);
	},
	fetch_wc: function () {
		var self = this;

		var req_obj = {
			_url: app.config.get_webcenter_url(),
			_type: 'GET',
			endpoint: 'tracks/get_track_header.json',
			id: this.id
		};

		function cb(obj) {
			if (obj.err || obj.resp.length == 0) {
				return app.plugins.n.notification.alert('There was an error downloading '+ self.get('data.name') +'. Please try again later - '+ JSON.stringify(obj.err));
			} else {
				self.set('data', obj.resp[0]);
				self.download_wc();
			}
		}
		app.post.fetch(req_obj, cb, 0);
	},
	download_wc: function (skip_playlist_add) {
		var track_id = this.get('data.track_id');
		var self = this;

		var community = app.session.get_model('community_id');
		if (community.get('download_count') < 1) {
			community.set('download_count', 1);
		}

		app.trigger('modal:open', {
			'template': 'modal-overlay-downloading-tmp'
		});

		self.set('is_downloaded', 'true');
		self.set('downloading_community_track', 'true');
		self.set('download_cloud', 'true');

		var req_obj = {
			_url: app.config.get_webcenter_url(),
			_type: 'GET',
			endpoint: `tracks/${ track_id }/download.json?class=downloadTrackLink`,
			_timeout: 90000
		};

		function cb(obj) {
			if (obj.err) {
				app.log(self.get('data.name') + " " + track_id);
				app.log('obj.err ' + JSON.stringify(obj.err));
				app.trigger('modal:close');
				return app.plugins.n.notification.alert('There was an error downloading '+ self.get('data.name') +'. Please try again later - '+ JSON.stringify(obj.err))
			} else {
				app.log('track : download response = ', self.id);

				if (self.get('data.original_file_type') == 'thr') self.set('data.verts', obj.resp); // remove/change later
				else if (self.get('data.original_file_type') == 'svg') self.set('data.verts', obj.resp);
				else if (self.get('data.original_file_type') == 'draw') self.set('data.verts', obj.resp); // created via drawing page
				else {
					app.plugins.n.notification.alert('Failed to get verts for this download ' + self.id);
					self.set('is_downloaded', 'false');
					self.set('downloading_community_track', 'false');
					return;
				}
				self.set('data.verts', obj.resp)
					.set('is_downloaded', 'true')
					.set('track_checked', 'false');

				// let track_id = JSON.stringify(self.id); //pulling id
				// track_id = track_id.replace(/['"]+/g, ''); // removing extra quotes
				app.log("Downloaded ID:", self.id, self.get('data'));
				app.trigger('sisbot:track_add', self);

				if (!skip_playlist_add) app.trigger('modal:open', { 'track_id': self.id });

				// app.trigger('session:active', { secondary: 'false', primary: 'community' });
			}
		}

		app.post.fetch2(req_obj, cb, 0);
	}
};
