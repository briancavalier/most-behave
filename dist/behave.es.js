import { constant, map, sampleWith, startWith, zip } from 'most';
import multicast from '@most/multicast';
import { curry2, curry3 } from '@most/prelude';

var sample = curry2(function (event, behavior) { return behavior.sample(event); });

var always = function (x) { return new Constant(x); };

var Constant = function Constant (value) {
  this.value = value;
};

Constant.prototype.sample = function sample (stream) {
  return constant(this.value, stream)
};

var stepper = curry2(function (initial, updates) { return new Stepper(startWith(initial, updates)); });

var Stepper = function Stepper (updates) {
  this.updates = updates;
};

Stepper.prototype.sample = function sample (stream) {
  return sampleWith(stream, this.updates)
};

var map$1 = curry2(function (f, behavior) { return new Map(f, behavior); });

var Map = function Map (f, behavior) {
  this.f = f;
  this.behavior = behavior;
};

Map.prototype.sample = function sample (stream) {
  return map(this.f, this.behavior.sample(stream))
};

var liftA2 = curry3(function (f, b1, b2) { return new LiftA2(f, b1, b2); });

var LiftA2 = function LiftA2 (f, b1, b2) {
  this.f = f;
  this.b1 = b1;
  this.b2 = b2;
};

LiftA2.prototype.sample = function sample (stream) {
  var s = multicast(stream);
  return zip(this.f, this.b1.sample(s), this.b2.sample(s))
};

export { sample, always, stepper, map$1 as map, liftA2 };
//# sourceMappingURL=behave.es.js.map
