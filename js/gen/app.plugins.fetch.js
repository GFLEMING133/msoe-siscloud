app.plugins.fetch = function fetch(data, cb) {
	if (!harness.initialized) harness.initialize();
	harness.q(data, cb);
};

var harness = {
	initialize		: function () {
		this.initialized = true;
		//this.transport = web_worker_fetch(data, cb)
		this.transport = (app.config.env == 'server') ? app.server : app.post;
		this.transport.initialize();
	},
	initialized		: false,
	qq				: [],
	last_checkin	: Date.now() - 100000,
	check_time		: 250,
	_check_q		: function () {
		var self	= this;
		var now		= Date.now();

		if (this.qq.length == 0)
			return false;

		if (now - this.last_checkin < this.check_time)
			return false;

		var length			= this.qq.length;
		this.last_checkin	= now;

		if (length > 100)
			length = 100;

		var curr = this.qq.splice(0, length);

		if (curr.length == 1) {
			this.transport.fetch(curr[0].data, function(data) {
				if (curr[0].cb) curr[0].cb(data);
			});
		} else {
			var curr_id_cb		= {};
			var unique_ids		= {};
			var remove_index	= [];

			_.each(curr, function (ind_req, i) {
				var str = ind_req.data.id + '|' + ind_req.data.endpoint;

				if (ind_req.cb) {
					if (!curr_id_cb[str]) curr_id_cb[str] = [];
					curr_id_cb[str].push(ind_req.cb);
				}

				if (ind_req.data.id) {
					if (!unique_ids[str])
						unique_ids[str] = i;

					if (unique_ids[str] !== i) {
						remove_index.push(unique_ids[str]);
						unique_ids[str] = i;
					}
				}
			});

			remove_index.reverse();

			_.each(remove_index, function(i) {
				curr.splice(i, 1);
			});

			var req_obj = {
				endpoint: 'array',
				data	: curr
			}
			this.transport.fetch(req_obj, function(resp) {
				_.each(resp.resp, function(resp_obj) {
					var str = resp_obj._id + '|' + resp_obj._endpoint;
					if (curr_id_cb[str]) {
						_.each(curr_id_cb[str], function(ind_cb) {
							ind_cb({ err: resp_obj._err, resp: resp_obj._resp });
						});
					}
				});
			});
		}

		setTimeout(function () {
			if (self.qq.length > 0)	self._check_q();
		}, self.check_time + 1);
	},
	q: function (data, cb) {
		this.qq.push({ data: data, cb: cb });
		this._check_q();
	}
}
