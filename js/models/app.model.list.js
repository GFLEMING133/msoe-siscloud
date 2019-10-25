app.model.list = {
  defaults: function(data) {
    var obj = {
      id: data.id,
      type: 'list',

      offset: 0,
      limit: 30,
      limit_step: 30,
      total: 0, // pass in, so we know when to quit
      fetching_more: 'false',

      data: {
        id: data.id,
        type: 'list',
        version: this.current_version,
      }
    };

    return obj;
  },
  scroll_timeout: 200, // so we aren't constantly checking while scrolling
  scrolling: false, // in conjunction with scroll_timout, are we waiting for a timeout to finish?
  current_version: 1,
  on_init: function() {
    console.log("on_init() in app.model.list", this.id);

    this.on('change:offset', this.scrollTop);

    return this;
  },
  save: function() {
    // do nothing
    return this;
  },
  reset_params: function() {
    console.log("List: Reset limit", this.defaults({id: this.id}).limit);
    this.set('limit', this.defaults({id: this.id}).limit);
  },
  scroll_top: function() {
    $('.body-header').scrollTop(0);
  },
  scroll_check: function(data) {
    if (!this.scrolling) {
      var self = this;
      setTimeout(function() {
        if ($('.'+data).scrollTop() >= $('.'+data).prop('scrollHeight') - $('.'+data).outerHeight(true) - 60) {
          var limit = +self.get('limit');
          var limit_step = +self.get('limit_step');
          if (self.get('total') > limit) {
            console.log("List: Load More...", data, limit+limit_step);
            self.set('limit', limit+limit_step);
          }
        }
        self.scrolling = false;
      }, self.scroll_timeout);

      self.scrolling = true;
    }
  }
};
