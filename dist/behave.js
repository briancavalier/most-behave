(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('most'), require('@most/multicast'), require('@most/prelude')) :
  typeof define === 'function' && define.amd ? define(['exports', 'most', '@most/multicast', '@most/prelude'], factory) :
  (factory((global.mostBehave = global.mostBehave || {}),global.most,global.multicast,global.mostPrelude));
}(this, (function (exports,most,multicast,_most_prelude) { 'use strict';

multicast = 'default' in multicast ? multicast['default'] : multicast;

var sample = _most_prelude.curry2(function (event, behavior) { return behavior.sample(event); });

var always = function (x) { return new Constant(x); };

var Constant = function Constant (value) {
  this.value = value;
};

Constant.prototype.sample = function sample (stream) {
  return most.constant(this.value, stream)
};

var stepper = _most_prelude.curry2(function (initial, updates) { return new Stepper(most.startWith(initial, updates)); });

var Stepper = function Stepper (updates) {
  this.updates = updates;
};

Stepper.prototype.sample = function sample (stream) {
  return most.sampleWith(stream, this.updates)
};

var map$1 = _most_prelude.curry2(function (f, behavior) { return new Map(f, behavior); });

var Map = function Map (f, behavior) {
  this.f = f;
  this.behavior = behavior;
};

Map.prototype.sample = function sample (stream) {
  return most.map(this.f, this.behavior.sample(stream))
};

var liftA2 = _most_prelude.curry3(function (f, b1, b2) { return new LiftA2(f, b1, b2); });

var LiftA2 = function LiftA2 (f, b1, b2) {
  this.f = f;
  this.b1 = b1;
  this.b2 = b2;
};

LiftA2.prototype.sample = function sample (stream) {
  var s = multicast(stream);
  return most.zip(this.f, this.b1.sample(s), this.b2.sample(s))
};

exports.sample = sample;
exports.always = always;
exports.stepper = stepper;
exports.map = map$1;
exports.liftA2 = liftA2;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=behave.js.map
