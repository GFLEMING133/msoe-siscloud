app.plugins.n = {
	initialize: function () {
        if (app.is_app) {
            app.plugins.n = navigator;
        }
    },
	notification: {
		alert: function (msg, cb, title, btnName) {
	        if (!cb) cb = function() {};

			window.alert(msg);
			cb(1);
	    },
	    confirm: function (msg, cb, title, btnName) {
	        if (!cb) cb = function() {};
			var conf = window.confirm(msg);
			var resp = (conf == false) ? 1 : 2;
			cb(resp);
	    }
	}
};
