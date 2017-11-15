app.templates = {
    _tmp        : {},
    initialize  : function () {
        var self = this;

        $('#templates').children().each(function (i, tmp) {
            self.add($(tmp).attr('class'), $(tmp).html())
            $(tmp).remove();
        });
    },
    add: function (key, val) {
        this._tmp[key] = val;
    },
    get: function (str) {
        return app.templates._tmp[str] || '';
    },
    create: function (str, bind_env) {
        // wrap _.template because when it throws errors they are incredibly unhelpful
        try {
            var new_str = str.replace('&lt;','<').replace('&gt;','>');
            return _.template(new_str)
        } catch (err) {
            console.log('template.create: err', str, new_str, err, bind_env);
        }
    },
    _is_fetching: {},
    fetch: function (str, cb) {
        if (this.get(str) !== '')
            return cb(this.get(str));

        if (this._is_fetching[str])
            return this._is_fetching[str].push(cb);

        this._is_fetching[str]  = [cb];
        var self                = this;

        this._fetch(str, function(resp) {
            if (!_.isObject(resp))
                resp = { err: null, tmp: resp };

            if (resp.err)
                resp.tmp = 'Error loading template';

            self.add(str, resp.tmp);
            _.each(self._is_fetching[str], function(_cb) { _cb(resp.tmp); });
            delete self._is_fetching[str];
        });
    },
    _fetch: function (str, cb) {
        var self = this;

        $.get('tmp/' + str + '.html', function(resp) {
            cb(resp);
        }).fail(function() {
            self._fetch(str, cb);
        });
    }
};
