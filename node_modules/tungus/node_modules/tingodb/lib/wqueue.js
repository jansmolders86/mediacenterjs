var safe = require('safe');
var _ = require('lodash');

function wqueue (limit,first) {
	this.limit = limit || 100;
	this._rc = 0;
	this._q = [];
	this._blocked = false;
	this._stoped = false;
	this._tc = -1;
	this.first = first || function (cb) {cb()};
}

wqueue.prototype.add = function(task,block,cb) {
	this._q.push({task:task,block:block, cb:cb});
	this._ping();
}

wqueue.prototype._exec = function (task,block,cb) {
	var self = this;
	self._blocked = block;
	self._tc++;
	if (self._tc==0) {
		self._blocked = true;
		self.first(function (err) {
			if (err) return cb(err);
			self._exec(task,block,cb)
		})
	} else {
		self._rc++;
		task(function () {
			cb.apply(this,arguments)
			self._rc--;
			if (self._rc==0)
				self._blocked = false;
			self._ping();
		})
	}
}

wqueue.prototype._ping = function () {
	var self = this;
	process.nextTick(function () {
		while (self._q.length>0 && self._rc<self.limit && !self._blocked && (!self._q[0].block || self._rc==0)  ) {
			var t = self._q.splice(0,1)[0];
			if (self._stoped)
				t.cb(new Error("Database is closed"));
			else {
				self._exec(t.task, t.block, t.cb)
			}
		}
	})
}

module.exports = wqueue;
