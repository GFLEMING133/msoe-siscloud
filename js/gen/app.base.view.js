Backbone.View.prototype.remove = function () {
	function on_remove(ctx) {
		ctx.on_remove();
		ctx.undelegateEvents();
		ctx.stopListening();
		ctx.$el.removeData().unbind().remove();

		if (ctx.$el.autosize)
			ctx.$el.autosize('autosize.destroy');

		_.each(ctx, function(val, prop) {
			delete ctx[prop];
		})

		ctx = undefined;
		delete ctx;
	}
	if (this.subviews) {
		//console.log('before remove', this.cid);
		this.remove_subviews(on_remove, this);
	} else {
		on_remove(this);
	}

	return this;
};

Backbone.View.prototype.subviews	= [];
Backbone.View.prototype.on_remove	= function () {};
Backbone.View.prototype.initialize	= function (options) { _.extend(this, options); this.render(); return this; }
Backbone.View.prototype.render		= function (options) { this.html(this.template(this)); return this; }

Backbone.View.prototype.remove_subviews = function(cb, ctx) {
	if (this.subviews.length == 0) {
		if (cb) cb(ctx);
		return false;
	}

	var subview = this.subviews.shift();

	subview.remove();
	this.remove_subviews(cb, ctx);
};
