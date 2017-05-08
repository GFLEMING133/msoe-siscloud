app.scripts = {
    _scripts    : {},
    add: function (str) {
        this._scripts[str] = true;
    },
    get: function (str) {
        return app.scripts._scripts[str] || false;
    },
    _is_fetching: {},
    fetch: function (str, cb) {
        if (this.get(str))
            return cb();

        if (this._is_fetching[str])
            return this._is_fetching[str].push(cb);

        this._is_fetching[str]  = [cb];
        var self                = this;

        this._fetch(str, function() {
            self.add(str, str);
            _.each(self._is_fetching[str], function(_cb) { _cb(); });
            delete self._is_fetching[str];
        });
    },
    _fetch: function (script, cb) {
        var self = this;

        $.getScript(script, function() {
            cb();
        }).fail(function() {
            self._fetch(script, cb);
        });
    }
};
