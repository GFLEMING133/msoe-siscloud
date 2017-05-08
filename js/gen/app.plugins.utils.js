// Update the interpolator to {{= }} instead of <? >
_.templateSettings = {
	evaluate	: /\{\{(.+?)\}\}/gim,
	interpolate	: /\{\{\=(.+?)\}\}/gim
};

_.templateSettingsSub = {
	evaluate	: /\{\<(.+?)\}\>\}/gim,
	interpolate	: /\{\[\=(.+?)\]\}/gim
};

_.templateSub = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettingsSub);

	// Shit it needs
	var noMatch = /(.)^/;
	var escapes = {
		"'": "'",
		'\\': '\\',
		'\r': 'r',
		'\n': 'n',
		'\u2028': 'u2028',
		'\u2029': 'u2029'
	};
	var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;
	var escapeChar = function(match) {
		return '\\' + escapes[match];
	};

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offset.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    var render;
    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
};

app.plugins.length = function(obj) {
	return obj.length;
}

app.plugins.indexOf = function(obj, key) {
	return obj.indexOf(key);
}

app.plugins.json = {
	stringify: function (object) {
		return JSON.stringify(object).replace(/\"/gi, '~');
	},
	parse: function (string) {
		return JSON.parse(string.replace(/\~/gi, '"'));
	}
};

app.plugins.seconds_to_time = function (n) {
	var m = Math.floor(n / 60);
	var s = Math.floor(n % 60);
	var resp = ( ((m < 1) ? "0" : m) + ":" + ((s < 10) ? "0" + s.toString() : s) );
	return resp;
}

Object.defineProperty(Array.prototype, 'chunk', {
    value: function(chunkSize) {
        var R = [];
        for (var i=0; i<this.length; i+=chunkSize)
            R.push(this.slice(i,i+chunkSize));
        return R;
    }
});

function console_log(data) {
	console.log(data);
}

function silent_log(data) {
	// do nothing
}

function get_window_size() {
	var windowHeight = 0, windowWidth = 0;
	if (typeof (window.innerWidth) == 'number') {
		windowHeight = window.innerHeight;
		windowWidth = window.innerWidth;
	} else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
		windowHeight = document.documentElement.clientHeight;
		windowWidth = document.documentElement.clientWidth;
	} else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
		windowHeight = document.body.clientHeight;
		windowWidth = document.body.clientWidth;
	}
	return [windowWidth, windowHeight];
}

String.prototype.trunc = function (n, useWordBoundary) {
	var toLong = this.length > n,
	s_ = toLong ? this.substr(0,n-1) : this;
	s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
	return  toLong ? s_ + '&hellip;' : s_;
};

app.plugins.move_from_to_obj = function (_from, _to) {
	for (var prop in _to) { if (_to.hasOwnProperty(prop)) { delete _to[prop]; } }
	for (var prop in _from) { if (_from.hasOwnProperty(prop)) { _to[prop] = _from[prop] } }
}

app.plugins.date_overlap = function (d1_start, d1_end, d2_start, d2_end) {
	var overlap = false;
	if (d1_start <= d2_start && d2_start <= d1_end) {
		overlap = true;
	} else if (d1_start <= d2_end && d2_end <= d1_end) {
		overlap = true;
	} else if (d2_start <= d1_start && d2_end >= d1_end) {
		overlap = true;
	}
	return overlap;
}

app.plugins.hour_to_ampm = function(val) {
	var hour = (val % 12 == 0) ? '12' : (val % 12);
	var ampm = (val < 12) ? 'am' : 'pm';
	return hour + ampm;
}

app.plugins.hour_range = function(val) {
	var start	= +val.substr(0,2);
	var end		= start + 1;

	return app.plugins.hour_to_ampm(start) + '-' + app.plugins.hour_to_ampm(end);
}

app.plugins.arr_to_time = function (time_array) {
	return +time_array[0] + ':' + time_array[1] + time_array[2];
}

app.plugins.format_time = function (time_arr) {
	var hh = +time_arr[0];
	var mm = +time_arr[1];

	if (hh == 12)
		hh = 0;

	if (time_arr[2] == 'PM')
		hh += 12;

	var str = app.plugins.affix_zero(hh);
	str += ':';
	str += app.plugins.affix_zero(mm);

	return str;
}

app.plugins.slugify = function (name) {
	if (!name)	return name;
	else 		return name.toLowerCase().replace(/\s/gi, '_');
}

app.plugins.unslugify = function (name, ending) {
	if (!name)	return name;
	else 		return name.replace(/_id(s)?/, '').replace(/_/gi, ' ');
}

app.plugins.format_date = function (date_arr) {
	if (!date_arr) return '';

	var yyyy	= date_arr[2];
	var mm		= +date_arr[0];
	var dd		= +date_arr[1];

	var str = yyyy + '-';
	str += app.plugins.affix_zero(mm);
	str += '-';
	str += app.plugins.affix_zero(dd);

	return str;
}

app.plugins.cast_date_to_form = function (date_str) {
	// convert 2016-11-15 08:00 to ['2016-11-15', null, null, '08', '00', 'AM|PM']
	var yr = date_str.substr(0, 10);
	var hh = date_str.substr(11, 2);
	var mm = date_str.substr(14, 2);
	var ampm = (+hh >= 12) ? 'PM' : 'AM';
	if (+hh > 12)	hh = '' + (+hh - 12);
	if (+hh == 0)	hh = '12';
	return [yr, null, null, hh, mm, ampm];
}

app.plugins.cast_form_date = function (date_arr) {
	// convert ['2016-11-15', null, null, '08', '00', 'AM|PM'] to 2016-11-15 08:00
	var ymd			= date_arr[0];
	var time_arr	= date_arr.slice(3, 6);
	var time		= (time_arr.length == 0) ? '00:00' : app.plugins.format_time(time_arr);
	return ymd + ' ' + time;
}

app.plugins.affix_zero = function (num) {
	return (+num < 10) ? '0' + num : num;
}

app.plugins.compact = function (arr) {
	return _.without(_.compact(arr), 'false');
}

_.pass = function(iter, func, debug) {
	var comparator = false;
	var index;

	if (_.isObject(iter)) {
		var keys	= _.keys(iter);
		var vals	= _.values(iter);
		var length	= keys.length;

		for (index = 0; index < length; index++) {
			if (func(vals[index], keys[index]) == true) {
				if (debug) console.log('WE HIT TRUTHY');
				comparator = true;
				break;
			}
		}
	} else {
		var length	= arr.length;

		for (index = 0; index < length; index++) {
			if (func(arr[index]) == true) {
				if (debug) console.log('WE HIT TRUTHY');
				comparator = true;
				break;
			}
		}
	}

	return comparator;
}

app.plugins.falsy = function (val) {
	return ['', 'false', false, null, undefined, 'undefined'].indexOf(val) > -1;
}

app.plugins.is_uuid = function (uuid) {
	var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-4][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return pattern.test(uuid);
}

app.plugins.first_char_to_num = function (blah) {
	if (_.isNaN(+blah)) {
		return app.static.alphabet.indexOf(blah);
	} else {
		return +blah;
	}
}

app.plugins.is_week_even = function (day_moment, monday_is_first_dow) {
	var dow		= +day_moment.format('d');
	var wom		= +day_moment.format('w');
	if (dow == 0 && monday_is_first_dow) {
		wom++;
	}

	return (wom % 2 == 0) ? true : false;
}

app.plugins.turn_to_calendar = function (start_date, end_date) {
	// assumes YYYY-MM-DD

	var start	= moment(start_date);
	var end		= moment(end_date);

	var calendar = {
		prev_month		: moment(start).subtract(1, 'months').startOf('month'),
		next_month		: moment(end).add(1, 'months').startOf('month'),
		month_start		: moment(start).startOf('month'),
		month_end		: moment(end).endOf('month'),
		week_start		: moment(start).weeks() - 1,
		week_end		: moment(end).weeks()
	};

	// really useful for ui
	calendar.days = [];

	var iter = moment('2016-W' + app.plugins.affix_zero(calendar.week_start) + '-0');

	for (var i = calendar.week_start; i < calendar.week_end; i++) {
		var arr = [];
		for (var ii = 0; ii < 7; ii++) {
			var obj = {
				date	: iter.format('YYYY-MM-DD'),
				active	: (iter >= start && iter <= end) ? 'true' : 'false',
			};
			arr.push(obj);
			iter.add(1, 'days');
		}
		calendar.days.push(arr);
	}

	return calendar;
}

app.plugins.file_download = function (sUrl) {
	var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
	var isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;

    //iOS devices do not support downloading. We have to inform user about this.
    if (/(iP)/g.test(navigator.userAgent)) {
        alert('Your device does not support files downloading. Please try again in desktop browser.');
        return false;
    }

    //If in Chrome or Safari - download via virtual link click
    if (isChrome || isSafari) {
        //Creating new link node.
        var link = document.createElement('a');
        link.href = sUrl;

        if (link.download !== undefined) {
            //Set HTML5 download attribute. This will prevent file from opening if supported.
            var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
            link.download = fileName;
        }

        //Dispatching click event.
        if (document.createEvent) {
            var e = document.createEvent('MouseEvents');
            e.initEvent('click', true, true);
            link.dispatchEvent(e);
            return true;
        }
    }

    // Force file download (whether supported by server).
    if (sUrl.indexOf('?') === -1) {
        sUrl += '?download';
    }

    window.open(sUrl, '_self');
    return true;
}

app.plugins.valid_email = function(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

app.plugins.get_hash = function () {
	if (window && window.location && window.location.hash) {
		return window.location.hash.replace('#/', '');
	} else {
		return '';
	}
}
