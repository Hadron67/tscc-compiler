(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.jscc = {})));
}(this, (function (exports) { 'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var BSIZE = 32;
var BitSet = (function () {
    function BitSet(_size) {
        this._size = _size;
        this._s = new Array(Math.ceil(_size / BSIZE));
        for (var i = 0; i < this._s.length; i++) {
            this._s[i] = 0;
        }
    }
    BitSet.prototype.add = function (i) {
        var block = Math.floor(i / BSIZE);
        var offset = i - block * BSIZE;
        var orig = this._s[block];
        this._s[block] |= (1 << offset);
        return orig !== this._s[block];
    };
    BitSet.prototype.addAll = function () {
        for (var i = 0; i < this._s.length; i++) {
            this._s[i] = ~0;
        }
    };
    BitSet.prototype.remove = function (i) {
        var block = Math.floor(i / BSIZE);
        var offset = i - block * BSIZE;
        var orig = this._s[block];
        this._s[block] &= ~(1 << offset);
        return orig !== this._s[block];
    };
    BitSet.prototype.removeAll = function () {
        for (var i = 0; i < this._s.length; i++) {
            this._s[i] = 0;
        }
    };
    BitSet.prototype.contains = function (i) {
        var block = Math.floor(i / BSIZE);
        var offset = i - block * BSIZE;
        return (this._s[block] & (1 << offset)) !== 0;
    };
    BitSet.prototype.union = function (set, mask) {
        var changed = false;
        for (var i = 0; i < this._s.length; i++) {
            var orig = this._s[i];
            var source = set._s[i];
            mask && (source &= mask._s[i]);
            this._s[i] |= source;
            changed = (this._s[i] !== orig) || changed;
        }
        return changed;
    };
    BitSet.prototype.hasIntersection = function (set) {
        for (var i = 0; i < this._s.length; i++) {
            if ((this._s[i] & set._s[i]) !== 0) {
                return true;
            }
        }
        return false;
    };
    BitSet.prototype.equals = function (set) {
        for (var i = 0; i < this._s.length; i++) {
            if (this._s[i] !== set._s[i]) {
                return false;
            }
        }
        return true;
    };
    BitSet.prototype.forEach = function (cb) {
        for (var i = 0; i < this._size; i++) {
            this.contains(i) && cb(i);
        }
    };
    BitSet.prototype.hash = function () {
        var ret = '';
        for (var i = 0; i < this._s.length; i++) {
            ret += this._s[i].toString(16) + '-';
        }
        return ret;
    };
    return BitSet;
}());

var YYTAB = '    ';
var DEBUG = true;
var console$1 = {
    assert: function (expr) {
        if (!expr) {
            throw new Error('Assertion failed');
        }
    },
    log: function (s) { }
};
function setDebugger(d) {
    return console$1.log = d.log;
}
function setTab(t) {
    return YYTAB = t;
}

function cm(a, b) {
    if ((a === Inf.oo && b !== Inf.oo) || (a !== Inf._oo && b === Inf._oo) || a > b) {
        return 1;
    }
    else if ((a === Inf._oo && b !== Inf._oo) || (a !== Inf.oo && b === Inf.oo) || a < b) {
        return -1;
    }
    else {
        return 0;
    }
}
var Inf;
(function (Inf) {
    Inf["oo"] = "oo";
    Inf["_oo"] = "-oo";
})(Inf || (Inf = {}));

var Interval = (function () {
    function Interval(a, b) {
        this.dataSet = null;
        this.a = a;
        this.b = b;
    }
    Interval.prototype.insertBefore = function (a, b, data) {
        if (this.parent.isValid(this) && !this.parent.noMerge && this.a === b + 1) {
            this.a = a;
            return this;
        }
        else {
            var it = this.parent.createInterval(a, b, data);
            it.prev = this.prev;
            it.next = this;
            this.prev.next = it;
            this.prev = it;
            return it;
        }
    };
    Interval.prototype.contains = function (a) {
        return cm(this.a, a) <= 0 && cm(this.b, a) >= 0;
    };
    Interval.prototype.overlaps = function (a, b) {
        return !(cm(a, this.b) > 0 || cm(b, this.a) < 0);
    };
    Interval.prototype.insertAfter = function (a, b, data) {
        if (this.parent.isValid(this) && !this.parent.noMerge && this.b === a - 1) {
            this.b = b;
            return this;
        }
        else {
            var it = this.parent.createInterval(a, b, data);
            it.prev = this;
            it.next = this.next;
            this.next.prev = it;
            this.next = it;
            return it;
        }
    };
    Interval.prototype.splitLeft = function (a) {
        if (cm(a, this.a) > 0) {
            var ret = this.insertBefore(this.a, a - 1);
            this.parent.noMerge && ret.dataSet.union(this.dataSet);
            this.a = a;
            return ret;
        }
        return this;
    };
    Interval.prototype.splitRight = function (b) {
        if (cm(b, this.b) < 0) {
            var ret = this.insertAfter(b + 1, this.b);
            this.parent.noMerge && ret.dataSet.union(this.dataSet);
            this.b = b;
            return ret;
        }
        return this;
    };
    Interval.prototype.remove = function () {
        this.prev.next = this.next;
        this.next.prev = this.prev;
        return this;
    };
    Interval.prototype.checkMerge = function () {
        if (this.a !== Inf._oo && this.prev.a !== null && this.a === this.prev.b + 1) {
            this.a = this.prev.a;
            this.prev.remove();
        }
        if (this.b !== Inf.oo && this.next.a !== null && this.b === this.next.a - 1) {
            this.b = this.next.b;
            this.next.remove();
        }
        return this;
    };
    Interval.prototype.toString = function (mapper) {
        var ret = '';
        function dfmapper(c) {
            return c === Inf.oo ? '+oo' : c === Inf._oo ? '-oo' : c.toString();
        }
        var a = (mapper || dfmapper)(this.a);
        var b = (mapper || dfmapper)(this.b);
        if (this.a === this.b) {
            ret += a;
        }
        else {
            ret += this.a === Inf._oo ? '(' + a : '[' + a;
            ret += ',';
            ret += this.b === Inf.oo ? b + ')' : b + ']';
        }
        this.dataSet && (ret += this.dataSet.toString());
        return ret;
    };
    return Interval;
}());
function checkArg(a, b) {
    if (cm(a, b) > 0) {
        throw new Error("illegal argument: \"a\"(" + a + ") must be no more than \"b\"(" + b + ")");
    }
}
var IntervalSet = (function () {
    function IntervalSet(dataSetConstructor) {
        this.head = new Interval(0, 0);
        this.head.parent = this;
        this.tail = new Interval(null, null);
        this.tail.parent = this;
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.noMerge = typeof dataSetConstructor !== 'undefined';
        this.dataSetConstructor = dataSetConstructor || null;
    }
    IntervalSet.prototype.isValid = function (it) {
        return it !== this.head && it !== this.tail;
    };
    IntervalSet.prototype.createInterval = function (a, b, data) {
        if (data === void 0) { data = null; }
        var ret = new Interval(a, b);
        ret.parent = this;
        this.dataSetConstructor && (ret.dataSet = this.dataSetConstructor());
        data && ret.dataSet.add(data);
        return ret;
    };
    IntervalSet.prototype.fitPoint = function (a, b) {
        for (var it = this.head; it !== this.tail; it = it.next) {
            if ((it === this.head || cm(a, it.b) > 0) && (it.next === this.tail || cm(b, it.next.a) < 0)) {
                return it;
            }
        }
        return null;
    };
    IntervalSet.prototype.overlaped = function (a, b) {
        var start = null, end = null;
        var it = this.head.next;
        for (; it !== this.tail && !it.overlaps(a, b); it = it.next)
            ;
        if (it === this.tail) {
            return null;
        }
        start = end = it;
        for (; it !== this.tail && it.overlaps(a, b); it = it.next) {
            end = it;
        }
        return [start, end];
    };
    IntervalSet.prototype.add = function (a, b, data) {
        if (b === void 0) { b = a; }
        var noMerge = this.noMerge;
        DEBUG && checkArg(a, b);
        var overlap = this.overlaped(a, b);
        if (overlap === null) {
            this.fitPoint(a, b).insertAfter(a, b, data);
        }
        else {
            if (!noMerge) {
                var a1 = cm(a, overlap[0].a) < 0 ? a : overlap[0].a;
                var b1 = cm(b, overlap[1].b) > 0 ? b : overlap[1].b;
                overlap[0].a = a1;
                overlap[0].b = b1;
                overlap[0].next = overlap[1].next;
                overlap[1].next.prev = overlap[0];
                overlap[0].checkMerge();
            }
            else {
                if (overlap[0].contains(a)) {
                    overlap[0].splitLeft(a);
                }
                else {
                    overlap[0].insertBefore(a, overlap[0].a - 1, data);
                }
                if (overlap[1].contains(b)) {
                    overlap[1].splitRight(b);
                }
                else {
                    overlap[1].insertAfter(overlap[1].b + 1, b, data);
                }
                for (var it = overlap[0]; it !== overlap[1]; it = it.next) {
                    it.dataSet.add(data);
                    if (it.b + 1 < it.next.a) {
                        it.insertAfter(it.b + 1, it.next.a - 1, data);
                    }
                }
                overlap[1].dataSet.add(data);
            }
        }
        return this;
    };
    IntervalSet.prototype.remove = function (a, b) {
        checkArg(a, b);
        var overlap = this.overlaped(a, b);
        if (overlap !== null) {
            overlap[0].contains(a) && overlap[0].splitLeft(a);
            overlap[1].contains(b) && overlap[1].splitRight(b);
            overlap[0].prev.next = overlap[1].next;
            overlap[1].next.prev = overlap[0].prev;
        }
        return this;
    };
    IntervalSet.prototype.removeAll = function () {
        this.head.next = this.tail;
        this.tail.prev = this.head;
        return this;
    };
    IntervalSet.prototype.forEach = function (cb) {
        for (var it = this.head.next; it !== this.tail; it = it.next) {
            cb(it.a, it.b, it);
        }
        return this;
    };
    IntervalSet.prototype.union = function (s) {
        for (var it = s.head.next; it !== s.tail; it = it.next) {
            this.add(it.a, it.b);
        }
        return this;
    };
    IntervalSet.prototype.contains = function (a) {
        for (var it = this.head.next; it !== this.tail; it = it.next) {
            if (it.contains(a)) {
                return true;
            }
        }
        return false;
    };
    IntervalSet.prototype.toString = function (mapper) {
        var ret = '';
        var t = false;
        for (var it = this.head.next; it !== this.tail; it = it.next) {
            if (t) {
                ret += ',';
            }
            t = true;
            ret += it.toString(mapper);
        }
        return ret === '' ? 'phi' : ret;
    };
    return IntervalSet;
}());

var oo = Inf.oo;
var _oo = Inf._oo;
var CharSet = (function (_super) {
    __extends(CharSet, _super);
    function CharSet(datac) {
        return _super.call(this, datac) || this;
    }
    CharSet.prototype.addAll = function () {
        _super.prototype.add.call(this, 0, Inf.oo);
    };
    CharSet.prototype.constainsAll = function () {
        var c = this.head.next;
        return c.next === this.tail && c.a === 0 && c.b === oo;
    };
    CharSet.prototype.toString = function () {
        return _super.prototype.toString.call(this, function (c) {
            if (c !== oo && c !== _oo) {
                if (c >= 0x20 && c <= 0x7e) {
                    return '\'' + String.fromCharCode(c) + '\'';
                }
                else {
                    return '\\x' + c.toString(16);
                }
            }
            else if (c === oo) {
                return 'oo';
            }
            else {
                return '-oo';
            }
        });
    };
    return CharSet;
}(IntervalSet));

var endl = '\n';
var OutputStream = (function () {
    function OutputStream() {
    }
    OutputStream.prototype.writeln = function (s) {
        s && this.write(s);
        this.write(endl);
    };
    return OutputStream;
}());
var StringOS = (function (_super) {
    __extends(StringOS, _super);
    function StringOS() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.s = '';
        return _this;
    }
    StringOS.prototype.write = function (s) {
        this.s += s;
    };
    StringOS.prototype.reset = function () {
        this.s = '';
    };
    return StringOS;
}(OutputStream));
function StringIS(s) {
    var i = 0;
    return {
        peek: function () {
            return s.charAt(i) || null;
        },
        next: function () {
            var ret = this.peek();
            i++;
            return ret;
        }
    };
}
function biss(iss) {
    var backup = [];
    return {
        peek: function () {
            return backup.length > 0 ? backup[backup.length - 1] : iss.peek();
        },
        next: function () {
            if (backup.length > 0) {
                return backup.pop();
            }
            else {
                return iss.next();
            }
        },
        backup: function (c) {
            backup.push(c);
        }
    };
}


var io = Object.freeze({
	endl: endl,
	OutputStream: OutputStream,
	StringOS: StringOS,
	StringIS: StringIS,
	biss: biss
});

var Action;
(function (Action) {
    Action[Action["START"] = 0] = "START";
    Action[Action["END"] = 1] = "END";
    Action[Action["NONE"] = 2] = "NONE";
})(Action || (Action = {}));
var maxlen = 0;
var StateArray = (function (_super) {
    __extends(StateArray, _super);
    function StateArray() {
        var _this = _super.call(this, 0) || this;
        Object.setPrototypeOf(_this, StateArray.prototype);
        return _this;
    }
    StateArray.prototype.add = function (s) {
        for (var _i = 0, _a = this; _i < _a.length; _i++) {
            var s2 = _a[_i];
            if (s === s2) {
                return;
            }
        }
        this.length > maxlen && (maxlen = this.length);
        this.push(s);
    };
    StateArray.prototype.union = function (s) {
        for (var _i = 0, s_1 = s; _i < s_1.length; _i++) {
            var state = s_1[_i];
            this.add(state);
        }
    };
    StateArray.prototype.toArray = function () {
        var ret = [];
        for (var _i = 0, _a = this; _i < _a.length; _i++) {
            var s = _a[_i];
            ret.push(s);
        }
        return ret;
    };
    return StateArray;
}(Array));
var Arc = (function () {
    function Arc(from, to) {
        this.chars = new CharSet();
        this.from = from;
        this.to = to;
    }
    return Arc;
}());
var EndAction = (function () {
    function EndAction() {
        this.priority = 0;
        this.id = 0;
        this.data = null;
    }
    return EndAction;
}());
var State = (function () {
    function State(endAction) {
        this.valid = false;
        this.arcs = [];
        this.epsilons = [];
        this.index = 0;
        this.isStart = false;
        this.isEnd = false;
        this.marker = false;
        this.endAction = null;
        this.endAction = endAction || null;
    }
    State.prototype.findArc = function (to) {
        for (var _i = 0, _a = this.arcs; _i < _a.length; _i++) {
            var arc = _a[_i];
            if (arc.to === to) {
                return arc;
            }
        }
        return null;
    };
    State.prototype.to = function (s) {
        var arc = this.findArc(s);
        if (arc === null) {
            arc = new Arc(this, s);
            this.arcs.push(arc);
        }
        s.valid = true;
        return arc;
    };
    State.prototype.epsilonTo = function (s) {
        this.epsilons.push(s);
    };
    State.prototype.hasDefinate = function () {
        return this.arcs.length === 1 && this.arcs[0].chars.constainsAll();
    };
    State.prototype.iterator = function (epOnly) {
        if (epOnly === void 0) { epOnly = false; }
        var queue = [this];
        var states = [this];
        this.marker = true;
        return function () {
            if (queue.length > 0) {
                var s = queue.pop();
                if (!epOnly) {
                    for (var _i = 0, _a = s.arcs; _i < _a.length; _i++) {
                        var arc = _a[_i];
                        var to = arc.to;
                        if (!to.marker) {
                            queue.push(to);
                            states.push(to);
                            to.marker = true;
                        }
                    }
                }
                for (var _b = 0, _c = s.epsilons; _b < _c.length; _b++) {
                    var to_1 = _c[_b];
                    if (!to_1.marker) {
                        queue.push(to_1);
                        states.push(to_1);
                        to_1.marker = true;
                    }
                }
                return s;
            }
            else {
                for (var _d = 0, states_1 = states; _d < states_1.length; _d++) {
                    var state = states_1[_d];
                    state.marker = false;
                }
                return null;
            }
        };
    };
    State.prototype.forEach = function (cb, epOnly) {
        if (epOnly === void 0) { epOnly = false; }
        var queue = [this];
        var states = [this];
        this.marker = true;
        while (queue.length > 0) {
            var s = queue.pop();
            cb(s);
            if (!epOnly) {
                for (var _i = 0, _a = s.arcs; _i < _a.length; _i++) {
                    var arc = _a[_i];
                    var to = arc.to;
                    if (!to.marker) {
                        queue.push(to);
                        states.push(to);
                        to.marker = true;
                    }
                }
            }
            for (var _b = 0, _c = s.epsilons; _b < _c.length; _b++) {
                var to_2 = _c[_b];
                if (!to_2.marker) {
                    queue.push(to_2);
                    states.push(to_2);
                    to_2.marker = true;
                }
            }
        }
        for (var _d = 0, states_2 = states; _d < states_2.length; _d++) {
            var state = states_2[_d];
            state.marker = false;
        }
    };
    State.prototype.number = function () {
        var i = 0;
        this.forEach(function (state) {
            state.index = i++;
        });
    };
    State.prototype.print = function (os, recursive) {
        if (recursive === void 0) { recursive = true; }
        function single(cela) {
            var ret = '';
            ret += "state " + cela.index;
            if (cela.isStart) {
                ret += '(start)';
            }
            if (cela.endAction) {
                ret += "(end " + cela.endAction.id + ")";
            }
            ret += endl;
            for (var i = 0; i < cela.arcs.length; i++) {
                var arc = cela.arcs[i];
                ret += ("" + YYTAB + arc.chars.toString() + " -> state " + arc.to.index + endl);
            }
            if (cela.epsilons.length > 0) {
                ret += YYTAB + "epsilon: ";
                for (var i = 0; i < cela.epsilons.length; i++) {
                    if (i > 0) {
                        ret += ',';
                    }
                    ret += cela.epsilons[i].index.toString();
                }
                ret += endl;
            }
            return ret;
        }
        if (!recursive) {
            os.write(single(this));
        }
        else {
            this.forEach(function (state) {
                os.write(single(state));
            });
        }
    };
    State.prototype.toString = function (recursive) {
        if (recursive === void 0) { recursive = true; }
        var ss = new StringOS();
        this.print(ss, recursive);
        return ss.s;
    };
    State.prototype.copyEndFrom = function (state) {
        if (state.endAction !== null) {
            if (this.endAction !== null) {
                if (this.endAction.priority < state.endAction.priority) {
                    this.endAction = state.endAction;
                }
            }
            else {
                this.endAction = state.endAction;
            }
        }
    };
    State.prototype.removeEpsilons = function () {
        var valid = [this];
        this.forEach(function (s) {
            if (s.valid) {
                valid.push(s);
            }
        });
        for (var i = 0; i < valid.length; i++) {
            var s = valid[i];
            s.forEach(function (state) {
                if (state !== s) {
                    for (var j = 0; j < state.arcs.length; j++) {
                        var arc = state.arcs[j];
                        s.to(arc.to).chars.union(arc.chars);
                    }
                    s.copyEndFrom(state);
                }
            }, true);
            s.epsilons.length = 0;
        }
        for (var i = 0; i < valid.length; i++) {
            valid[i].index = i;
        }
    };
    State.prototype.count = function () {
        var c = 0;
        this.forEach(function () {
            c++;
        });
        return c;
    };
    State.prototype.size = function () {
        var i = 0;
        this.forEach(function () {
            i++;
        });
        return i;
    };
    State.prototype.allChars = function (set) {
        for (var i = 0; i < this.arcs.length; i++) {
            var arc = this.arcs[i];
            arc.chars.forEach(function (a, b) {
                set.add(a, b, arc.to);
            });
        }
    };
    State.prototype.getState = function (char) {
        for (var i = 0; i < this.arcs.length; i++) {
            var arc = this.arcs[i];
            if (arc.chars.contains(char)) {
                return arc.to;
            }
        }
        return null;
    };
    State.prototype.hasArc = function () {
        return this.arcs.length > 0;
    };
    State.prototype.clone = function () {
    };
    State.prototype.toDFA = function () {
        var dfaStates = {};
        var states = [];
        var dfaCount = 0;
        var stateCount = this.count();
        var set = new CharSet(function () { return new StateArray(); });
        var initState = new CompoundState(stateCount, [this]);
        initState.index = dfaCount++;
        states.push(initState);
        dfaStates[initState.hash()] = initState;
        var queue = [initState];
        while (queue.length > 0) {
            var s = queue.shift();
            set.removeAll();
            s.allChars(set);
            set.forEach(function (chara, charb, it) {
                var cpState = new CompoundState(stateCount, it.dataSet.toArray());
                var cphash = cpState.hash();
                if (dfaStates[cphash]) {
                    cpState = dfaStates[cphash];
                }
                else {
                    dfaStates[cphash] = cpState;
                    queue.push(cpState);
                    cpState.index = dfaCount++;
                    states.push(cpState);
                }
                s.to(cpState).chars.add(chara, charb);
            });
        }
        initState.release();
        return {
            head: initState,
            states: states
        };
    };
    return State;
}());
var CompoundState = (function (_super) {
    __extends(CompoundState, _super);
    function CompoundState(stateCount, states) {
        var _this = _super.call(this) || this;
        _this.isEnd = _this.isStart = false;
        _this.valid = true;
        _this.states = states;
        _this.stateSet = new BitSet(stateCount);
        for (var i = 0; i < states.length; i++) {
            _this.stateSet.add(states[i].index);
            _this.copyEndFrom(states[i]);
            _this.isStart = _this.isStart || states[i].isStart;
        }
        return _this;
    }
    CompoundState.prototype.hash = function () {
        return this.stateSet.hash();
    };
    CompoundState.prototype.allChars = function (set) {
        for (var i = 0; i < this.states.length; i++) {
            this.states[i].allChars(set);
        }
    };
    CompoundState.prototype.forEach = function (cb) {
        _super.prototype.forEach.call(this, cb);
    };
    CompoundState.prototype.release = function () {
        this.forEach(function (state) {
            state.states.length = 0;
        });
    };
    return CompoundState;
}(State));

var DFA = (function () {
    function DFA(states) {
        this.states = states;
        this.start = states[0];
    }
    DFA.prototype.print = function (os) {
        for (var _i = 0, _a = this.states; _i < _a.length; _i++) {
            var s = _a[_i];
            s.print(os, false);
            os.writeln();
        }
    };
    DFA.prototype.toString = function () {
        var ret = '';
        for (var i = 0; i < this.states.length; i++) {
            ret += this.states[i].toString() + '\n';
        }
        return ret;
    };
    DFA.prototype.matcher = function (stream) {
        var bs = biss(stream);
        var backups = [];
        var matched = [];
        var marker = null;
        var c = bs.peek();
        var cs;
        function nc() {
            if (marker !== null) {
                backups.push(c);
            }
            matched.push(c);
            bs.next();
            c = bs.peek();
        }
        function rollback() {
            cs = marker;
            marker = null;
            while (backups.length > 0) {
                bs.backup(backups.pop());
                matched.pop();
            }
        }
        var cela = this;
        return function () {
            c = bs.peek();
            cs = cela.start;
            matched.length = 0;
            backups.length = 0;
            marker = null;
            var ns;
            while (true) {
                if (cs.endAction !== null) {
                    if (cs.hasArc()) {
                        ns = c !== null ? cs.getState(c.charCodeAt(0)) : null;
                        if (ns === null) {
                            return { matched: matched.join(''), action: cs.endAction };
                        }
                        else {
                            backups.length = 0;
                            marker = cs;
                            cs = ns;
                            nc();
                        }
                    }
                    else {
                        return { matched: matched.join(''), action: cs.endAction };
                    }
                }
                else {
                    ns = c !== null ? cs.getState(c.charCodeAt(0)) : null;
                    if (ns === null) {
                        if (marker !== null) {
                            rollback();
                            return { matched: matched.join(''), action: cs.endAction };
                        }
                        else if (c === null) {
                            return null;
                        }
                        else {
                            throw new Error('unexpected character "' + c + '"');
                        }
                    }
                    else {
                        cs = ns;
                        nc();
                    }
                }
            }
        };
    };
    return DFA;
}());

var JsccError = (function () {
    function JsccError(msg, type) {
        if (type === void 0) { type = 'Error'; }
        this.msg = msg;
        this.type = type;
    }
    JsccError.prototype.toString = function (opt) {
        if (opt === void 0) { opt = {}; }
        var escape = !!opt.escape;
        var ret = this.type;
        if (opt.typeClass) {
            ret = "<span class=\"" + opt.typeClass + "\">" + ret + "</span>";
        }
        ret += ': ';
        ret += escape ? this.msg.replace(/</g, '&lt').replace(/>/g, '&gt') : this.msg;
        return ret;
    };
    return JsccError;
}());
var CompilationError = (function (_super) {
    __extends(CompilationError, _super);
    function CompilationError(msg, line) {
        var _this = _super.call(this, msg, 'CompilationError') || this;
        _this.line = line;
        return _this;
    }
    CompilationError.prototype.toString = function (opt) {
        return _super.prototype.toString.call(this, opt) + " (at line " + this.line + ")";
    };
    return CompilationError;
}(JsccError));
var JsccWarning = (function (_super) {
    __extends(JsccWarning, _super);
    function JsccWarning(msg) {
        return _super.call(this, msg, 'Warning') || this;
    }
    return JsccWarning;
}(JsccError));

var PatternException = (function (_super) {
    __extends(PatternException, _super);
    function PatternException(msg) {
        return _super.call(this, msg, 'PatternException') || this;
    }
    return PatternException;
}(JsccError));

function stackReader(str, strs) {
    var stack = [{ sptr: 0, s: str, name: '' }];
    var top = stack[0];
    function checkNested(name) {
        for (var i = 0; i < stack.length; i++) {
            if (stack[i].name === name) {
                throw new PatternException('cannot use pattern "' + name + '" which leads to loop reference');
            }
        }
    }
    return {
        next: function () {
            top.sptr++;
            if (top.sptr >= top.s.length) {
                stack.length > 1 && stack.pop();
                top = stack[stack.length - 1];
            }
        },
        peek: function () {
            return top.s[top.sptr] || null;
        },
        pushTo: function (name) {
            var nn = strs ? strs[name] : null;
            if (!nn) {
                throw new PatternException('undefined name "' + name + '"');
            }
            checkNested(name);
            stack.push({ sptr: 0, s: '(' + nn + ')', name: name });
            top = stack[stack.length - 1];
        }
    };
}
function compile(input, regs) {
    if (regs === void 0) { regs = {}; }
    var reader = stackReader(input, regs);
    var c = reader.peek();
    function nc() {
        reader.next();
        c = reader.peek();
    }
    function notEof(reason) {
        if (c === null) {
            throw new PatternException('unexpected end of string' + (reason ? ', ' + reason : ''));
        }
    }
    function ns() {
        var s = new State();
        return s;
    }
    function eof() {
        return c === null;
    }
    function expect(c1) {
        if (c !== c1) {
            throw new PatternException('unexpected character "' + c + '",expecting "' + c1 + '"');
        }
        nc();
    }
    function rexp(start) {
        var ret = simpleRE(start);
        while (!eof() && c === '|') {
            nc();
            var es = ns();
            start.epsilonTo(es);
            simpleRE(es).epsilonTo(ret);
        }
        return ret;
    }
    function simpleRE(start) {
        var ret = start;
        do {
            ret = basicRE(ret);
        } while (!eof() && c !== '|' && c !== ')');
        return ret;
    }
    function basicRE(start) {
        var holder = ns();
        start.epsilonTo(holder);
        var ret = primitive(holder);
        if (c === '*') {
            nc();
            ret.epsilonTo(holder);
            var nn = ns();
            holder.epsilonTo(nn);
            return nn;
        }
        else if (c === '+') {
            nc();
            var count = ns();
            ret.epsilonTo(count);
            count.epsilonTo(holder);
            return count;
        }
        else if (c === '?') {
            nc();
            var nn2 = ns();
            holder.epsilonTo(nn2);
            ret.epsilonTo(nn2);
            return nn2;
        }
        else {
            return ret;
        }
    }
    function primitive(start) {
        notEof();
        if (c === '(') {
            nc();
            var ret = rexp(start);
            expect(')');
            return ret;
        }
        else if (c === '.') {
            nc();
            var ret = ns();
            start.to(ret).chars.addAll();
            return ret;
        }
        else if (c === '[') {
            nc();
            var neg = c === '^';
            neg && nc();
            var ret = ns();
            var set = start.to(ret).chars;
            neg && set.addAll();
            while (c !== ']' && !eof()) {
                setItem(set, neg);
            }
            expect(']');
            return ret;
        }
        else if (c === '{') {
            nc();
            var name = '';
            while (c !== '}') {
                notEof();
                name += c;
                nc();
            }
            nc();
            reader.pushTo(name);
            c = reader.peek();
            return simpleRE(start);
        }
        else {
            var ret = ns();
            start.to(ret).chars.add(gchar());
            return ret;
        }
    }
    function gchar() {
        notEof();
        if (c === '\\') {
            nc();
            var ret_1 = c.charCodeAt(0);
            switch (c) {
                case 't': ret_1 = '\t';
                case 'n': ret_1 = '\n';
                case 'r': ret_1 = '\r';
                case 'x':
                    nc();
                    var code = '';
                    while (c !== null && /[0-9a-fA-F]/.test(c)) {
                        code += c;
                        nc();
                    }
                    return parseInt(code, 16);
                default: ret_1 = c;
            }
            nc();
            return ret_1.charCodeAt(0);
        }
        else {
            var ret = c.charCodeAt(0);
            nc();
            return ret;
        }
    }
    function setItem(set, neg) {
        var s = gchar();
        var from = s, to = s;
        if (c === '-') {
            nc();
            to = gchar();
            if (to < from) {
                throw new PatternException('left hand side must be larger than right hand side in wild card character (got "'
                    + from.toString(16) + '" < "'
                    + to.toString(16) + '")');
            }
        }
        if (neg) {
            set.remove(from, to);
        }
        else {
            set.add(from, to);
        }
    }
    var head = ns();
    head.isStart = true;
    var tail = rexp(head);
    return {
        result: head,
        tail: tail
    };
}
function compileRaw(input) {
    var sptr = 0;
    var c = input.charAt(sptr);
    function ns() {
        var s = new State();
        return s;
    }
    function nc() {
        c = input.charAt(++sptr) || null;
    }
    function eof() {
        return c === null;
    }
    var head = ns();
    head.isStart = true;
    var tail = head;
    while (!eof()) {
        var s = ns();
        tail.to(s).chars.add(c.charCodeAt(0));
        tail = s;
        nc();
    }
    return {
        result: head,
        tail: tail
    };
}

function lexerBuilder(regs) {
    if (regs === void 0) { regs = {}; }
    var actions = [];
    var pr = 0;
    function ns() {
        var ret = new State();
        return ret;
    }
    var head = ns();
    return {
        lexRule: function (reg, id, data, raw) {
            var action = new EndAction();
            action.priority = pr++;
            action.id = id;
            action.data = data || null;
            var cpd = (!!raw ? compileRaw(reg) : compile(reg, regs));
            cpd.tail.endAction = action;
            head.epsilonTo(cpd.result);
            actions.push(action);
        },
        done: function () {
            head.removeEpsilons();
            var dhead = head.toDFA();
            var ret = new DFA(dhead.states);
            return ret;
        }
    };
}
function lexer(defs, regs) {
    var getdef;
    if (typeof defs !== 'function') {
        getdef = function () {
            return defs.shift() || null;
        };
    }
    else {
        getdef = defs;
    }
    var bd = lexerBuilder(regs);
    var def = getdef();
    while (def !== null) {
        bd.lexRule(def.regexp, def.id, def.data, def.raw);
        def = getdef();
    }
    return bd.done();
}



var pattern = Object.freeze({
	lexer: lexer,
	lexerBuilder: lexerBuilder
});

var TokenSet = (function (_super) {
    __extends(TokenSet, _super);
    function TokenSet(tcount) {
        return _super.call(this, tcount) || this;
    }
    TokenSet.prototype.toString = function (g) {
        var ret = '';
        var first = true;
        if (this.contains(0)) {
            ret += '""';
            first = false;
        }
        for (var i = 0; i < g.tokenCount; i++) {
            if (this.contains(i + 1)) {
                if (!first) {
                    ret += ',';
                }
                ret += '"' + g.tokens[i].sym + '"';
                first = false;
            }
        }
        return ret;
    };
    return TokenSet;
}(BitSet));

var Action$1;
(function (Action) {
    Action[Action["NONE"] = 1] = "NONE";
    Action[Action["SHIFT"] = 2] = "SHIFT";
    Action[Action["REDUCE"] = 3] = "REDUCE";
})(Action$1 || (Action$1 = {}));
var Item = (function () {
    function Item(rule, ik) {
        this.marker = 0;
        this.shift = null;
        this.actionType = Action$1.NONE;
        this.changed = true;
        this.rule = rule;
        this.isKernel = ik;
        this.lah = new TokenSet(rule.g.tokenCount);
    }
    Item.prototype.canShift = function () {
        return this.rule.rhs.length > this.marker;
    };
    Item.prototype.getShift = function () {
        return this.rule.rhs[this.marker];
    };
    Item.prototype.toString = function (opt) {
        if (opt === void 0) { opt = {}; }
        var showlah = (opt && opt.showlah) || false;
        var showTrailer = (opt && opt.showTrailer) || false;
        var ret = '[ ' + this.rule.toString(this.marker) + (showlah ? ',{ ' + this.lah.toString(this.rule.g) + ' }' : '') + ' ]';
        this.isKernel && (ret += '*');
        if (showTrailer) {
            switch (this.actionType) {
                case Action$1.NONE:
                    ret += '(-)';
                    break;
                case Action$1.SHIFT:
                    ret += '(s' + this.shift.stateIndex + ')';
                    break;
                case Action$1.REDUCE:
                    ret += '(r)';
                    break;
            }
        }
        return ret;
    };
    Item.prototype.hash = function () {
        return this.rule.index + '-' + this.marker;
    };
    Item.prototype.hasRRConflictWith = function (i) {
        return this.actionType === Action$1.REDUCE && i.actionType === Action$1.REDUCE && this.rule.index !== i.rule.index && this.lah.hasIntersection(i.lah);
    };
    Item.prototype.getFollowSet = function (set) {
        var g = this.rule.g;
        var i;
        for (i = this.marker + 1; i < this.rule.rhs.length; i++) {
            var mItem = this.rule.rhs[i];
            if (g.isToken(mItem)) {
                set.add(mItem + 1);
                break;
            }
            else {
                var set1 = g.nts[-mItem - 1].firstSet;
                set.union(set1);
                set.remove(0);
                if (!set1.contains(0)) {
                    break;
                }
            }
        }
        if (i === this.rule.rhs.length) {
            set.union(this.lah);
        }
    };
    Item.NULL = {};
    return Item;
}());
var ItemSet = (function () {
    function ItemSet(g) {
        this.it = {};
        this.complete = false;
        this.index = -1;
        this.stateIndex = 0;
        this.prev = null;
        this.next = null;
        this.merges = [];
        this.g = g;
        this.data = this;
    }
    ItemSet.prototype.add = function (rule, marker, ik, lah, reset) {
        var h = rule.index + '-' + marker;
        var it = this.it[h];
        if (it === undefined) {
            var n = new Item(rule, ik);
            n.marker = marker;
            if (lah) {
                n.lah.union(lah);
            }
            this.it[h] = n;
            return true;
        }
        else if (lah) {
            var ret = it.lah.union(lah);
            if (reset && ret && it.canShift()) {
                it.actionType = Action$1.NONE;
            }
            ret && (it.changed = true);
            return ret;
        }
    };
    ItemSet.prototype.contains = function () {
    };
    ItemSet.prototype.closure = function () {
        var changed = true;
        var tSet = new TokenSet(this.g.tokenCount);
        var cela = this;
        while (changed) {
            changed = false;
            for (var hash in this.it) {
                var item = this.it[hash];
                if (item.changed && item.canShift()) {
                    var ritem = item.getShift();
                    if (ritem < 0) {
                        tSet.removeAll();
                        item.getFollowSet(tSet);
                        this.g.forEachRuleOfNt(-ritem - 1, function (rule) {
                            changed = cela.add(rule, 0, false, tSet, false) || changed;
                            return false;
                        });
                    }
                }
                item.changed = false;
            }
        }
    };
    ItemSet.prototype.toString = function (opt) {
        var showTrailer = (opt && opt.showTrailer) || false;
        var opt2 = { showTrailer: showTrailer };
        var ret = 's' + this.stateIndex + '';
        if (this.index !== null) {
            ret += '(i' + this.index;
        }
        else {
            ret += '(i?';
        }
        if (this.merges.length > 0) {
            ret += ',merged from ';
            for (var i = 0; i < this.merges.length; i++) {
                if (i > 0) {
                    ret += ',';
                }
                ret += 'i' + this.merges[i];
            }
        }
        ret += ')' + endl;
        for (var hash in this.it) {
            ret += this.it[hash].toString(opt2) + endl;
        }
        return ret;
    };
    ItemSet.prototype.kernelHash = function () {
        var ret = 0;
        for (var hash in this.it) {
            var item = this.it[hash];
            if (item.isKernel) {
                ret += item.rule.index << 5 + item.rule.index + item.marker;
            }
        }
        return String(ret);
    };
    ItemSet.prototype.forEach = function (cb) {
        for (var h in this.it) {
            cb(this.it[h]);
        }
    };
    ItemSet.prototype.canMergeTo = function (s) {
        for (var h1 in this.it) {
            var it1 = this.it[h1];
            var found = false, hasConflict = false, hasIdentical = false;
            for (var h2 in s.it) {
                var it2 = s.it[h2];
                if (it1.rule.index === it2.rule.index && it1.marker === it2.marker) {
                    hasIdentical = it1.lah.equals(it2.lah);
                    found = it1.isKernel && it2.isKernel;
                }
                hasConflict = hasConflict || it1.hasRRConflictWith(it2);
                if (it2.isKernel && this.it[h2] === undefined) {
                    return false;
                }
            }
            if (it1.isKernel && !found || hasConflict && !hasIdentical) {
                return false;
            }
        }
        return true;
    };
    ItemSet.prototype.mergeTo = function (s) {
        var ret = false;
        for (var h in s.it) {
            var it = s.it[h];
            ret = this.add(it.rule, it.marker, it.isKernel, it.lah, true) || ret;
        }
        this.merges.push(s.index);
        return ret;
    };
    return ItemSet;
}());

var List = (function () {
    function List() {
        this.size = 0;
        this.head = { prev: null, next: null, data: null };
        this.tail = { prev: null, next: null, data: null };
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
    List.prototype.append = function (n) {
        n.prev = this.tail.prev;
        n.next = this.tail;
        this.tail.prev.next = n;
        this.tail.prev = n;
        this.size++;
    };
    List.prototype.pull = function () {
        var n = this.head.next;
        this.head.next = n.next;
        n.next.prev = this.head;
        n.prev = n.next = null;
        this.size--;
        return n.data;
    };
    List.prototype.isEmpty = function () {
        return this.size === 0;
    };
    List.prototype.forEach = function (cb) {
        for (var a = this.head.next; a !== this.tail; a = a.next) {
            cb(a.data);
        }
    };
    List.prototype.remove = function (n) {
        n.next.prev = n.prev;
        n.prev.next = n.next;
        this.size--;
    };
    List.prototype.iterator = function () {
        var p = this.head;
        var cela = this;
        return function () {
            return p !== cela.tail ? (p = p.next, p.data) : null;
        };
    };
    return List;
}());

var Assoc;
(function (Assoc) {
    Assoc[Assoc["UNDEFINED"] = 0] = "UNDEFINED";
    Assoc[Assoc["LEFT"] = 1] = "LEFT";
    Assoc[Assoc["RIGHT"] = 2] = "RIGHT";
    Assoc[Assoc["NON"] = 3] = "NON";
})(Assoc || (Assoc = {}));

function convertTokenToString(t) {
    return t.alias === null ? "<" + t.sym + ">" : "\"" + t.alias + "\"";
}

function printParseTable(os, cela, doneList) {
    var g = cela.g;
    var tokenCount = g.tokenCount;
    var ntCount = g.nts.length;
    doneList.forEach(function (set) {
        var i = set.stateIndex;
        var shift = '';
        var reduce = '';
        var gotot = '';
        os.writeln("state " + i);
        set.forEach(function (item) {
            os.writeln(YYTAB + item.toString({ showTrailer: false }));
        });
        if (cela.defred[i] !== -1) {
            os.writeln(YYTAB + "default action: reduce with rule " + cela.defred[i]);
        }
        else {
            os.writeln(YYTAB + 'no default action');
        }
        for (var j = 0; j < tokenCount; j++) {
            var item = cela.lookupShift(i, j);
            if (item !== null && item !== Item.NULL) {
                if (item.actionType === Action$1.SHIFT) {
                    shift += "" + YYTAB + convertTokenToString(g.tokens[j]) + " : shift, and go to state " + item.shift.stateIndex + endl;
                }
                else {
                    reduce += "" + YYTAB + convertTokenToString(g.tokens[j]) + " : reduce with rule " + item.rule.index + endl;
                }
            }
        }
        for (var j = 0; j < ntCount; j++) {
            var item = cela.lookupGoto(i, j);
            if (item !== null) {
                gotot += "" + YYTAB + g.nts[j].sym + " : go to state " + item.shift.stateIndex + endl;
            }
        }
        os.writeln(shift + reduce + gotot);
        os.writeln('');
    });
}
var ParseTable = (function () {
    function ParseTable(g, stateCount) {
        this.defred = null;
        this.g = g;
        var tokenCount = g.tokenCount;
        var ntCount = g.nts.length;
        this.stateCount = stateCount;
        this.shift = new Array(tokenCount * stateCount);
        this.gotot = new Array(ntCount * stateCount);
        for (var i = 0; i < this.shift.length; i++) {
            this.shift[i] = null;
        }
        for (var i = 0; i < this.gotot.length; i++) {
            this.gotot[i] = null;
        }
    }
    ParseTable.prototype.forEachShift = function (cb) {
        for (var state = 0; state < this.stateCount; state++) {
            for (var tk = 0; tk < this.g.tokens.length; tk++) {
                var item = this.lookupShift(state, tk);
                item && cb(item, state, tk);
            }
        }
    };
    ParseTable.prototype.forEachGoto = function (cb) {
        for (var state = 0; state < this.stateCount; state++) {
            for (var nt = 0; nt < this.g.nts.length; nt++) {
                var item = this.lookupGoto(state, nt);
                item && cb(item, state, nt);
            }
        }
    };
    ParseTable.prototype.lookupShift = function (state, token) {
        return this.shift[this.g.tokenCount * state + token];
    };
    ParseTable.prototype.lookupGoto = function (state, nt) {
        return this.gotot[this.g.nts.length * state + nt];
    };
    ParseTable.prototype._getDefRed = function (state, apool) {
        for (var i = 0; i < apool.length; i++) {
            apool[i] = 0;
        }
        for (var tk = 0; tk < this.g.tokenCount; tk++) {
            var item = this.lookupShift(state, tk);
            item && item.actionType === Action$1.REDUCE && apool[item.rule.index]++;
        }
        var ret = 0;
        for (var i = 0; i < apool.length; i++) {
            apool[i] > apool[ret] && (ret = i);
        }
        return apool[ret] > 0 ? ret : -1;
    };
    ParseTable.prototype.findDefAct = function () {
        this.defred = new Array(this.stateCount);
        var apool = new Array(this.g.rules.length);
        for (var i = 0; i < this.stateCount; i++) {
            var def = this._getDefRed(i, apool);
            this.defred[i] = def;
            if (def !== -1) {
                for (var tk = 0; tk < this.g.tokens.length; tk++) {
                    var item = this.lookupShift(i, tk);
                    item && item.actionType === Action$1.REDUCE && item.rule.index === def &&
                        (this.shift[this.g.tokenCount * i + tk] = null);
                }
            }
        }
    };
    return ParseTable;
}());

var ConflictType;
(function (ConflictType) {
    ConflictType[ConflictType["RR"] = 0] = "RR";
    ConflictType[ConflictType["SR"] = 1] = "SR";
})(ConflictType || (ConflictType = {}));

var Conflict = (function () {
    function Conflict() {
    }
    Conflict.prototype.toString = function () {
        return "state " + this.set.stateIndex + ", " + Conflict.cNames[this.type] + " conflict:" + endl +
            (YYTAB + "token: " + convertTokenToString(this.token) + endl) +
            (YYTAB + "used rule: " + this.used.toString() + endl) +
            (YYTAB + "discarded rule: " + this.discarded.toString());
    };
    Conflict.cNames = ['reduce/reduce', 'shift/reduce'];
    return Conflict;
}());
function genInitialSet(g) {
    var start = g.nts[0].rules[0];
    var iset = new ItemSet(g);
    iset.index = 0;
    var set1 = new TokenSet(g.tokenCount);
    set1.add(1);
    iset.add(start, 0, true, set1, false);
    return iset;
}
function genItemSets(g) {
    var htable = {};
    var iterations = 0;
    function addToTable(iset) {
        var h = iset.kernelHash();
        if (htable[h] === undefined) {
            htable[h] = [];
        }
        htable[h].push(iset);
    }
    function forEachInBucket(set, cb) {
        var b = htable[set.kernelHash()];
        if (b !== undefined) {
            for (var i = 0; i < b.length; i++) {
                if (cb(b[i]))
                    break;
            }
        }
    }
    var index = 1;
    var todoList = new List();
    var incList = new List();
    var doneList = new List();
    todoList.append(genInitialSet(g));
    while (!todoList.isEmpty() || !incList.isEmpty()) {
        var comeFrom = null;
        if (!incList.isEmpty()) {
            var set = comeFrom = incList.pull();
            set.forEach(function (item) {
                if (item.actionType === Action$1.NONE) {
                    console$1.assert(item.canShift());
                    var shift = item.getShift();
                    var newSet = new ItemSet(g);
                    newSet.index = index++;
                    todoList.append(newSet);
                    set.forEach(function (item1) {
                        if (item1.canShift()) {
                            var rItem = item1.getShift();
                            if (rItem === shift) {
                                item1.actionType = Action$1.SHIFT;
                                item1.shift = newSet;
                                newSet.add(item1.rule, item1.marker + 1, true, item1.lah, false);
                            }
                        }
                    });
                }
            });
            set.complete = true;
            doneList.append(set);
        }
        while (!todoList.isEmpty()) {
            var set = todoList.pull();
            set.closure();
            set.forEach(function (item) {
                if (!item.canShift()) {
                    item.actionType = Action$1.REDUCE;
                }
            });
            var merged = null;
            forEachInBucket(set, function (gSet) {
                if (gSet.canMergeTo(set)) {
                    if (gSet.mergeTo(set)) {
                        if (gSet.complete) {
                            merged = gSet;
                        }
                    }
                    if (comeFrom !== null) {
                        comeFrom.forEach(function (sItem) {
                            if (sItem.actionType === Action$1.SHIFT && sItem.shift === set) {
                                sItem.shift = gSet;
                            }
                        });
                    }
                    set = null;
                    return true;
                }
                return false;
            });
            if (merged !== null) {
                doneList.remove(merged);
                incList.append(merged);
                merged.complete = false;
            }
            else if (set !== null) {
                incList.append(set);
                addToTable(set);
            }
        }
        iterations++;
    }
    var i = 0;
    doneList.forEach(function (set) {
        set.stateIndex = i++;
    });
    return {
        result: doneList,
        iterations: iterations
    };
}
function genParseTable(g, doneList) {
    var conflicts = [];
    function resolveSRConflict(set, shift, reduce) {
        var token = g.tokens[shift.getShift()];
        if (token.assoc !== Assoc.UNDEFINED) {
            var ruleP = reduce.rule.pr;
            if (ruleP !== -1) {
                if (ruleP > token.pr) {
                    return reduce;
                }
                else if (ruleP < token.pr) {
                    return shift;
                }
                else {
                    if (token.assoc === Assoc.LEFT) {
                        return reduce;
                    }
                    else if (token.assoc === Assoc.RIGHT) {
                        return shift;
                    }
                    else if (token.assoc === Assoc.NON) {
                        return Item.NULL;
                    }
                    else {
                        console$1.assert(false);
                    }
                }
            }
        }
        var cf = new Conflict();
        cf.type = ConflictType.SR;
        cf.set = set;
        cf.token = token;
        cf.used = shift;
        cf.discarded = reduce;
        conflicts.push(cf);
        return shift;
    }
    function resolveRRConflict(set, r1, r2, token) {
        var tdef = g.tokens[token];
        if (r1.rule.pr !== -1 && r2.rule.pr !== -1 && r1.rule.pr !== r2.rule.pr) {
            return r1.rule.pr > r2.rule.pr ? r1 : r2;
        }
        else {
            var used = r1.rule.index > r2.rule.index ? r2 : r1;
            var discarded = r1.rule.index > r2.rule.index ? r1 : r2;
            var cf = new Conflict();
            cf.type = ConflictType.RR;
            cf.set = set;
            cf.token = tdef;
            cf.used = used;
            cf.discarded = discarded;
            conflicts.push(cf);
            return used;
        }
    }
    var ptable = new ParseTable(g, doneList.size);
    doneList.forEach(function (set) {
        set.forEach(function (item) {
            if (item.actionType === Action$1.SHIFT) {
                var sItem = item.getShift();
                if (g.isToken(sItem)) {
                    var tindex = set.stateIndex * g.tokenCount + sItem;
                    var cItem = ptable.shift[tindex];
                    if (cItem !== null) {
                        if (cItem.actionType === Action$1.REDUCE) {
                            ptable.shift[tindex] = resolveSRConflict(set, item, cItem);
                        }
                        else {
                            console$1.assert(cItem.shift === item.shift);
                        }
                    }
                    else {
                        ptable.shift[tindex] = item;
                    }
                }
                else {
                    var tindex = set.stateIndex * g.nts.length + (-sItem - 1);
                    ptable.gotot[tindex] = item;
                }
            }
            else if (item.actionType === Action$1.REDUCE) {
                for (var i = 0; i < g.tokenCount; i++) {
                    if (item.lah.contains(i + 1)) {
                        var index = set.stateIndex * g.tokenCount + i;
                        var cItem = ptable.shift[index];
                        if (cItem !== null) {
                            if (cItem.actionType === Action$1.REDUCE) {
                                ptable.shift[index] = resolveRRConflict(set, cItem, item, i);
                            }
                            else if (cItem.actionType === Action$1.SHIFT) {
                                ptable.shift[index] = resolveSRConflict(set, cItem, item);
                            }
                        }
                        else {
                            ptable.shift[index] = item;
                        }
                    }
                }
            }
            else {
                console$1.assert(false);
            }
        });
    });
    return {
        result: ptable,
        conflicts: conflicts
    };
}

function testParse(g, pt, tokens) {
    var tk = [];
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var tname = tokens_1[_i];
        var tdef = void 0;
        if (/<[^>]+>/.test(tname)) {
            tdef = g.findTokenByName(tname.substr(1, tname.length - 2));
            if (tdef === null) {
                throw new JsccError("cannot recognize " + tname + " as a token");
            }
        }
        else {
            var defs = g.findTokensByAlias(tname);
            if (defs.length === 0) {
                throw new JsccError("cannot recognize \"" + tname + "\" as a token");
            }
            if (defs.length > 1) {
                var msg = '';
                for (var _a = 0, defs_1 = defs; _a < defs_1.length; _a++) {
                    var def = defs_1[_a];
                    msg += "<" + def.sym + "> ";
                }
                throw new JsccError("cannot recognize \"" + tname + "\" as a token, since it can be " + msg);
            }
            tdef = defs[0];
        }
        tk.push(tdef);
    }
    var state = [0];
    var stack = [];
    var ret = [];
    function s() {
        return state[state.length - 1];
    }
    function shift(ns) {
        state.push(ns);
        var tdef = tk.shift();
        stack.push(convertTokenToString(tdef));
    }
    function reduce(rule) {
        state.length -= rule.rhs.length;
        stack.length -= rule.rhs.length;
        stack.push(rule.lhs.sym);
        var gotot = pt.lookupGoto(s(), rule.lhs.index).shift.stateIndex;
        state.push(gotot);
    }
    function dump() {
        var ret = '';
        for (var _i = 0, stack_1 = stack; _i < stack_1.length; _i++) {
            var s_1 = stack_1[_i];
            ret += s_1 + ' ';
        }
        ret += '| ';
        for (var _a = 0, tk_1 = tk; _a < tk_1.length; _a++) {
            var tdef = tk_1[_a];
            ret += convertTokenToString(tdef);
            ret += ' ';
        }
        return ret;
    }
    ret.push(dump());
    do {
        var item = pt.lookupShift(s(), tk[0] ? tk[0].index : 0);
        if (item !== null) {
            if (item === Item.NULL) {
                ret.push('syntax error!');
                break;
            }
            else if (item.actionType === Action$1.SHIFT) {
                if (tk.length === 0) {
                    ret.push('accepted!');
                    break;
                }
                shift(item.shift.stateIndex);
            }
            else if (item.actionType === Action$1.REDUCE) {
                if (reduce(item.rule)) {
                    break;
                }
            }
            else {
                console.assert(false);
            }
        }
        else {
            var ri = pt.defred[s()];
            if (ri !== -1) {
                reduce(g.rules[ri]);
            }
            else {
                ret.push('syntax error!');
                break;
            }
        }
        ret.push(dump());
    } while (true);
    return ret;
}

function sorter(cmp) {
    var a = [];
    function insert(i, obj) {
        a.push(null);
        for (var j = a.length - 1; j > i; j--) {
            a[j] = a[j - 1];
        }
        a[i] = obj;
    }
    return {
        add: function (b) {
            var i;
            for (i = 0; i < a.length; i++) {
                if ((i === 0 || cmp(b, a[i - 1]) >= 0) && cmp(b, a[i]) <= 0) {
                    break;
                }
            }
            insert(i, b);
        },
        done: function () {
            return a;
        }
    };
}
var RowEntry = (function () {
    function RowEntry(emptyCount, row) {
        this.emptyCount = emptyCount;
        this.row = row;
        this.dp = 0;
    }
    return RowEntry;
}());
function compress(source) {
    function empty(i, j) {
        j = j - sorted[i].dp;
        return j < 0 || j >= source.columns || source.isEmpty(sorted[i].row, j);
    }
    function fit(i, dp) {
        for (var j = 0; j < source.columns; j++) {
            if (!empty(i, j)) {
                for (var k = 0; k < i; k++) {
                    if (!empty(k, j + dp)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    function getFitdp(i) {
        var dp = 0;
        while (-dp < source.columns && source.isEmpty(sorted[i].row, -dp)) {
            dp--;
        }
        while (!fit(i, dp)) {
            dp++;
        }
        return dp;
    }
    var tmpsorted = sorter(function (a, b) {
        return a.emptyCount < b.emptyCount ? -1 :
            a.emptyCount > b.emptyCount ? 1 : 0;
    });
    for (var i = 0; i < source.rows; i++) {
        tmpsorted.add(new RowEntry(source.emptyCount(i), i));
    }
    var sorted = tmpsorted.done();
    var maxdp = 0, mindp = 0;
    var dps = new Array(source.rows);
    var initDp = 0;
    while (-initDp < source.columns && source.isEmpty(sorted[0].row, -initDp)) {
        initDp--;
    }
    dps[sorted[0].row] = sorted[0].dp = initDp;
    for (var i = 1; i < sorted.length; i++) {
        var row = sorted[i].row;
        var dp = getFitdp(i);
        dps[row] = sorted[i].dp = dp;
        dp > maxdp && (maxdp = dp);
        dp < mindp && (mindp = dp);
    }
    return {
        dps: dps,
        len: maxdp + source.columns
    };
}

function action(pt) {
    var emCount = [];
    for (var state = 0; state < pt.stateCount; state++) {
        emCount.push(0);
        for (var tk = 0; tk < pt.g.tokens.length; tk++) {
            pt.lookupShift(state, tk) === null && (emCount[state]++);
        }
    }
    return {
        rows: pt.stateCount,
        columns: pt.g.tokens.length,
        isEmpty: function (state, token) {
            return pt.lookupShift(state, token) === null;
        },
        emptyCount: function (state) {
            return emCount[state];
        }
    };
}
function gotot(pt) {
    var emCount = [];
    for (var state = 0; state < pt.stateCount; state++) {
        emCount.push(0);
        for (var nt = 0; nt < pt.g.nts.length; nt++) {
            pt.lookupShift(state, nt) === null && (emCount[state]++);
        }
    }
    return {
        rows: pt.stateCount,
        columns: pt.g.nts.length,
        isEmpty: function (state, nt) {
            return pt.lookupGoto(state, nt) === null;
        },
        emptyCount: function (nt) {
            return emCount[nt];
        }
    };
}
function initArray(len, cb) {
    var ret = new Array(len);
    for (var i = 0; i < len; i++) {
        ret[i] = cb(i);
    }
    return ret;
}
var CompressedPTable = (function () {
    function CompressedPTable(ptable) {
        this.g = ptable.g;
        this.defred = ptable.defred;
        this.stateCount = ptable.stateCount;
        var actionCResult = compress(action(ptable));
        var gotoCResult = compress(gotot(ptable));
        this.disact = actionCResult.dps;
        this.disgoto = gotoCResult.dps;
        this.pact = initArray(actionCResult.len, function () { return null; });
        this.checkact = initArray(actionCResult.len, function () { return 0; });
        var cela = this;
        ptable.forEachShift(function (it, state, token) {
            console$1.assert(cela.pact[cela.disact[state] + token] === null);
            cela.pact[cela.disact[state] + token] = it;
            cela.checkact[cela.disact[state] + token] = state;
        });
        this.pgoto = initArray(gotoCResult.len, function () { return null; });
        this.checkgoto = initArray(gotoCResult.len, function () { return 0; });
        ptable.forEachGoto(function (it, state, nt) {
            console$1.assert(cela.pgoto[cela.disgoto[state] + nt] === null);
            cela.pgoto[cela.disgoto[state] + nt] = it;
            cela.checkgoto[cela.disgoto[state] + nt] = state;
        });
    }
    CompressedPTable.prototype.lookupShift = function (state, token) {
        var index = this.disact[state] + token;
        if (index >= 0 && index < this.pact.length && this.checkact[index] === state) {
            return this.pact[this.disact[state] + token];
        }
        else {
            return null;
        }
    };
    CompressedPTable.prototype.lookupGoto = function (state, nt) {
        var index = this.disgoto[state] + nt;
        if (index >= 0 && index < this.pgoto.length && this.checkgoto[index] === state) {
            return this.pgoto[this.disgoto[state] + nt];
        }
        else {
            return null;
        }
    };
    return CompressedPTable;
}());

var Rule = (function () {
    function Rule(g, lhs, line) {
        this.g = g;
        this.lhs = lhs;
        this.line = line;
        this.pr = -1;
        this.rhs = [];
        this.action = null;
        this.index = 0;
        this.vars = {};
        this.usedVars = {};
    }
    Rule.prototype.calcPr = function () {
        if (this.pr === -1) {
            for (var i = this.rhs.length - 1; i >= 0; i--) {
                var item = this.rhs[i];
                if (item >= 0) {
                    this.g.tokens[item].assoc !== Assoc.UNDEFINED &&
                        (this.pr = this.g.tokens[item].pr);
                }
            }
        }
    };
    Rule.prototype.getVarSp = function (v, ecb) {
        if (this.lhs.parents.length !== 1) {
            if (this.lhs.parents.length > 1) {
                ecb("LHS of the rule is referenced by more than one rule");
            }
            else {
                ecb("this rule is unreachable");
            }
            return null;
        }
        var ret = this.rhs.length;
        var pos = this.lhs.parents[0].pos;
        var rule = this.lhs.parents[0].rule;
        while (true) {
            var vdef = rule.vars[v];
            if (vdef !== undefined && vdef.val < pos) {
                ret += pos - vdef.val;
                return ret;
            }
            if (rule.lhs.parents.length !== 1) {
                if (rule.lhs.parents.length > 1) {
                    ecb("\"" + rule.lhs.sym + "\" is referenced by more than one rule or unreachable");
                }
                else {
                    ecb("variable is undefined");
                }
                return null;
            }
            ret += pos;
            pos = rule.lhs.parents[0].pos;
            rule = rule.lhs.parents[0].rule;
        }
    };
    Rule.prototype.toString = function (marker) {
        var ret = this.index + ': ' + this.lhs.sym + ' =>';
        for (var i = 0; i < this.rhs.length; i++) {
            var r = this.rhs[i];
            if (marker === i) {
                ret += ' .';
            }
            if (r >= 0) {
                ret += ' ' + convertTokenToString(this.g.tokens[r]);
            }
            else {
                ret += ' ' + this.g.nts[-r - 1].sym;
            }
        }
        if (marker === this.rhs.length) {
            ret += ' .';
        }
        return ret;
    };
    return Rule;
}());
var Grammar = (function () {
    function Grammar() {
        this.tokens = [];
        this.tokenCount = 0;
        this.nts = [];
        this.rules = [];
    }
    Grammar.prototype.isToken = function (t) {
        return t >= 0;
    };
    Grammar.prototype.forEachRule = function (cb) {
        for (var i = 0; i < this.nts.length; i++) {
            var rules = this.nts[i].rules;
            for (var j = 0; j < rules.length; j++) {
                cb(i, rules[j]);
            }
        }
    };
    Grammar.prototype.forEachRuleOfNt = function (lhs, cb) {
        var rules = this.nts[lhs].rules;
        for (var j = 0; j < rules.length; j++) {
            if (cb(rules[j])) {
                break;
            }
        }
    };
    Grammar.prototype.genFirstSets = function () {
        var changed = true;
        var mask = new TokenSet(this.tokens.length);
        mask.addAll();
        mask.remove(0);
        while (changed) {
            changed = false;
            for (var nt = 0; nt < this.nts.length; nt++) {
                var rules = this.nts[nt].rules;
                var firstSet = this.nts[nt].firstSet;
                for (var j = 0; j < rules.length; j++) {
                    var rule = rules[j];
                    for (var k = 0; k < rule.rhs.length; k++) {
                        var ritem = rule.rhs[k];
                        if (this.isToken(ritem)) {
                            changed = firstSet.add(ritem + 1) || changed;
                            break;
                        }
                        else {
                            ritem = -ritem - 1;
                            if (nt !== ritem) {
                                changed = firstSet.union(this.nts[ritem].firstSet, mask) || changed;
                            }
                            if (!this.nts[ritem].firstSet.contains(0)) {
                                break;
                            }
                        }
                    }
                    k === rule.rhs.length && (changed = firstSet.add(0) || changed);
                }
            }
        }
    };
    Grammar.prototype.toString = function (opt) {
        if (opt === void 0) { opt = {}; }
        opt = opt || {};
        var endl = opt.endl || endl;
        var escape = opt.escape || false;
        var ret = '';
        this.forEachRule(function (lhs, rule) {
            var s = rule.toString();
            ret += s + endl;
        });
        if (opt.firstSets) {
            for (var i = 0; i < this.nts.length; i++) {
                var s = this.nts[i];
                ret += "First(" + s.sym + ") = { " + s.firstSet.toString(this) + " }" + endl;
            }
        }
        if (escape) {
            ret = ret.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        return ret.replace(/\n/g, endl);
    };
    Grammar.prototype.findTokenByName = function (t) {
        for (var _i = 0, _a = this.tokens; _i < _a.length; _i++) {
            var tk = _a[_i];
            if (tk.sym === t) {
                return tk;
            }
        }
        return null;
    };
    Grammar.prototype.findTokensByAlias = function (t) {
        var ret = [];
        for (var _i = 0, _a = this.tokens; _i < _a.length; _i++) {
            var tk = _a[_i];
            tk.alias === t && ret.push(tk);
        }
        return ret;
    };
    return Grammar;
}());

var File = (function () {
    function File() {
        this.grammar = null;
        this.lexDFA = [];
        this.opt = {};
        this.prefix = 'jj';
        this.header = '';
        this.extraArgs = '';
        this.initArg = '';
        this.initBody = '';
        this.epilogue = null;
    }
    return File;
}());

var CoroutineMgr = (function () {
    function CoroutineMgr(getRes) {
        this.getRes = getRes;
        this._blocked = {};
    }
    CoroutineMgr.prototype.wait = function (s, cr) {
        var r = this.getRes(s);
        if (r === undefined) {
            this._blocked[s] || (this._blocked[s] = []);
            this._blocked[s].push(cr);
        }
        else {
            cr(true, r);
        }
    };
    CoroutineMgr.prototype.signal = function (s, data) {
        var crs = this._blocked[s];
        if (crs !== undefined) {
            for (var _i = 0, crs_1 = crs; _i < crs_1.length; _i++) {
                var cr = crs_1[_i];
                cr(true, data);
            }
            delete this._blocked[s];
        }
    };
    CoroutineMgr.prototype.fail = function () {
        for (var s in this._blocked) {
            for (var _i = 0, _a = this._blocked[s]; _i < _a.length; _i++) {
                var cr = _a[_i];
                cr(false, null);
            }
        }
    };
    return CoroutineMgr;
}());

var CmdArray = (function () {
    function CmdArray(label) {
        this.label = label;
        this.opcodes = [];
    }
    return CmdArray;
}());

function createLexBuilder(ctx) {
    var _head = new State();
    var _currentState = null;
    var _unionStack = [];
    var _simpleStack = [];
    var _currentArc = null;
    var _isInverse = false;
    var possibleAlias = null;
    var _first = false;
    var _scount = 0;
    var _regexpVars = {};
    var _states = [new CmdArray('')];
    var _stateMap = { DEFAULT: 0 };
    var requiringState;
    var _selectedStates = [];
    var _selectedVar = null;
    var _ar = [];
    requiringState = new CoroutineMgr(function (s) { return _stateMap[s]; });
    return {
        prepareVar: prepareVar,
        endVar: endVar,
        prepareLex: prepareLex,
        selectState: selectState,
        newState: newState,
        end: end,
        enterUnion: enterUnion,
        endUnionItem: endUnionItem,
        leaveUnion: leaveUnion,
        enterSimple: enterSimple,
        simplePostfix: simplePostfix,
        addString: addString,
        addVar: addVar,
        beginSet: beginSet,
        addSetItem: addSetItem,
        endSet: endSet,
        build: build,
        getPossibleAlias: function () { return possibleAlias; },
        requiringState: requiringState
    };
    function _emit(func) {
        if (_selectedVar !== null) {
            _selectedVar.opcodes.push(func);
        }
        else {
            for (var _i = 0, _selectedStates_1 = _selectedStates; _i < _selectedStates_1.length; _i++) {
                var sn = _selectedStates_1[_i];
                sn.opcodes.push(func);
            }
        }
    }
    function _exec(a) {
        _head = _currentState = new State();
        _head.isStart = true;
        _unionStack.length = 0;
        _simpleStack.length = 0;
        _currentArc = null;
        _isInverse = false;
        _ar.length = 0;
        _ar.push({
            pc: 0,
            cmds: a
        });
        while (_ar.length > 0) {
            var top_1 = _ar[_ar.length - 1];
            top_1.cmds.opcodes[top_1.pc++]();
            top_1 = _ar[_ar.length - 1];
            top_1.pc >= top_1.cmds.opcodes.length && _ar.pop();
        }
        _head.removeEpsilons();
        var dhead = _head.toDFA();
        var ret = new DFA(dhead.states);
        return ret;
    }
    function prepareVar(vname, line) {
        var vdef = _regexpVars[vname];
        if (vdef !== undefined) {
            ctx.err(new CompilationError("variable \"" + vname + "\" was already defined at line " + vdef.line, line));
        }
        vdef = _regexpVars[vname] = {
            line: line,
            cmds: new CmdArray(vname)
        };
        _selectedVar = vdef.cmds;
    }
    function endVar() {
        _selectedVar = null;
    }
    function prepareLex() {
        _selectedStates.length = 0;
    }
    function selectState(s) {
        var sn = _stateMap[s];
        if (sn === undefined) {
            sn = _stateMap[s] = _states.length;
            _states.push(new CmdArray(''));
            requiringState.signal(s, sn);
        }
        _selectedStates.push(_states[_stateMap[s]]);
    }
    function newState() {
        _first = true;
        possibleAlias = null;
        _emit(function () {
            _currentState = new State();
            _head.epsilonTo(_currentState);
        });
    }
    function end(action, label) {
        if (label === void 0) { label = '(untitled)'; }
        for (var _i = 0, _selectedStates_2 = _selectedStates; _i < _selectedStates_2.length; _i++) {
            var sn = _selectedStates_2[_i];
            sn.label = "<" + label + ">";
        }
        _emit(function () {
            var ac = new EndAction();
            ac.id = ac.priority = _scount++;
            ac.data = action;
            _currentState.endAction = ac;
        });
    }
    function enterUnion() {
        _emit(function () {
            _unionStack.push({
                head: _currentState,
                tail: new State()
            });
        });
    }
    function endUnionItem() {
        _emit(function () {
            var top = _unionStack[_unionStack.length - 1];
            _currentState.epsilonTo(top.tail);
            _currentState = top.head;
        });
    }
    function leaveUnion() {
        _emit(function () {
            _currentState = _unionStack.pop().tail;
        });
    }
    function enterSimple() {
        _emit(function () {
            _simpleStack.push(_currentState);
        });
    }
    function simplePostfix(postfix) {
        postfix === '' || (possibleAlias = null, _first = false);
        _emit(function () {
            var top = _simpleStack.pop();
            if (postfix === '?') {
                top.epsilonTo(_currentState);
            }
            else if (postfix === '+') {
                _currentState.epsilonTo(top);
            }
            else if (postfix === '*') {
                _currentState.epsilonTo(top);
                _currentState = top;
            }
        });
    }
    function addString(s) {
        if (_first) {
            possibleAlias = s;
            _first = false;
        }
        else {
            possibleAlias = null;
        }
        _emit(function () {
            for (var i = 0; i < s.length; i++) {
                var ns = new State();
                _currentState.to(ns).chars.add(s.charCodeAt(i));
                _currentState = ns;
            }
        });
    }
    function addVar(vname, line) {
        _first = false;
        possibleAlias = null;
        _emit(function () {
            var vdef = _regexpVars[vname];
            if (vdef === undefined) {
                ctx.err(new CompilationError("use of undefined variable \"" + vname + "\"", line));
            }
            var cmds = vdef.cmds;
            for (var i = 0; i < _ar.length; i++) {
                var aitem = _ar[i];
                if (aitem.cmds === cmds) {
                    var msg = "circular dependence in lexical variable detected: " + cmds.label;
                    for (i++; i < _ar.length; i++) {
                        msg += " -> " + _ar[i].cmds.label;
                    }
                    msg += " -> " + cmds.label;
                    ctx.err(new CompilationError(msg, line));
                    return;
                }
            }
            _ar.push({
                pc: 0,
                cmds: cmds
            });
        });
    }
    function beginSet(inverse) {
        _first = false;
        possibleAlias = null;
        _emit(function () {
            _isInverse = inverse;
            var ns = new State();
            _currentArc = _currentState.to(ns);
            _currentState = ns;
            inverse && _currentArc.chars.addAll();
        });
    }
    function addSetItem(from, to, line1, line2) {
        if (from.length !== 1) {
            ctx.err(new CompilationError("character expected in union, got \"" + from + "\"", line1));
            return;
        }
        if (to.length !== 1) {
            ctx.err(new CompilationError("character expected in union, got \"" + to + "\"", line2));
            return;
        }
        if (from.charCodeAt(0) > to.charCodeAt(0)) {
            ctx.err(new CompilationError("left hand side must be larger than right hand side in wild card character (got '" + from + "' > '" + to + "')", line1));
        }
        _emit(function () {
            _isInverse ?
                _currentArc.chars.remove(from.charCodeAt(0), to.charCodeAt(0)) :
                _currentArc.chars.add(from.charCodeAt(0), to.charCodeAt(0));
        });
    }
    function endSet() {
        _emit(function () {
            _currentArc = null;
        });
    }
    function build() {
        var dfas = [];
        for (var _i = 0, _states_1 = _states; _i < _states_1.length; _i++) {
            var state = _states_1[_i];
            dfas.push(_exec(state));
        }
        requiringState.fail();
        return dfas;
    }
}

function noCode(c) {
}
function returnToken(tk) {
    return {
        toCode: noCode,
        token: tk.index
    };
}
function pushState(n) {
    return {
        toCode: function (c) {
            c.pushLexState(n);
        },
        token: -1
    };
}
function popState() {
    return {
        toCode: function (c) {
            c.popLexState();
        },
        token: -1
    };
}
function blockAction(b, line) {
    return {
        toCode: function (c) {
            c.addBlock(b, line);
        },
        token: -1
    };
}
function setImg(img) {
    return {
        toCode: function (c) {
            c.setImg(img);
        },
        token: -1
    };
}

var TokenRefType;
(function (TokenRefType) {
    TokenRefType[TokenRefType["TOKEN"] = 0] = "TOKEN";
    TokenRefType[TokenRefType["STRING"] = 1] = "STRING";
    TokenRefType[TokenRefType["NAME"] = 2] = "NAME";
})(TokenRefType || (TokenRefType = {}));

function createFileBuilder(ctx) {
    var _f = new File();
    var _g = new Grammar();
    var _tokenNameTable = {};
    var _tokenAliasTable = {};
    var _ruleStack = [];
    var _sematicVar = null;
    var _ntTable = {};
    var _requiringNt = null;
    var _genIndex = 0;
    var _first = true;
    var _pr = 1;
    var _onCommit = [];
    var _onDone = [];
    var lexBuilder;
    var _pseudoTokens = {};
    _f.grammar = _g;
    lexBuilder = createLexBuilder(ctx);
    _requiringNt = new CoroutineMgr(function (s) { return _ntTable[s]; });
    defToken('EOF', null, 0);
    return {
        err: err,
        defToken: defToken,
        getTokenByAlias: getTokenByAlias,
        getTokenByName: getTokenByName,
        defineTokenPrec: defineTokenPrec,
        setOpt: setOpt,
        setHeader: setHeader,
        setExtraArg: setExtraArg,
        setType: setType,
        setInit: setInit,
        setEpilogue: setEpilogue,
        incPr: incPr,
        prepareRule: prepareRule,
        addRuleUseVar: addRuleUseVar,
        addRuleSematicVar: addRuleSematicVar,
        addRuleItem: addRuleItem,
        addAction: addAction,
        defineRulePr: defineRulePr,
        commitRule: commitRule,
        addPushStateAction: addPushStateAction,
        build: build,
        lexBuilder: lexBuilder
    };
    function _top() {
        return _ruleStack[_ruleStack.length - 1];
    }
    function _splitAction(line) {
        var saved = _sematicVar;
        _sematicVar = null;
        var t = _top();
        var s = '@' + _genIndex++;
        prepareRule(s, line);
        var gen = _top();
        addAction(t.action);
        commitRule();
        t.action = null;
        addRuleItem(s, TokenRefType.NAME, line);
        _sematicVar = saved;
        for (var vname in t.vars) {
            var v = t.vars[vname];
            gen.usedVars[vname] = { val: v.val, line: v.line };
        }
        for (var vname in t.usedVars) {
            var v = t.usedVars[vname];
            gen.usedVars[vname] = { val: v.val, line: v.line };
        }
    }
    function err(msg, line) {
        ctx.err(new CompilationError(msg, line));
    }
    function defToken(name, alias, line) {
        var tkdef = _tokenNameTable[name];
        if (tkdef !== undefined) {
            return tkdef;
        }
        else {
            tkdef = {
                index: _g.tokens.length,
                sym: name,
                alias: alias,
                line: line,
                pr: 0,
                assoc: Assoc.UNDEFINED,
                used: false
            };
            if (alias !== null) {
                _tokenAliasTable[alias] || (_tokenAliasTable[alias] = []);
                _tokenAliasTable[alias].push(tkdef);
            }
            _tokenNameTable[name] = tkdef;
            _g.tokens.push(tkdef);
            return tkdef;
        }
    }
    function getTokenByAlias(a, line) {
        var aa = _tokenAliasTable[a];
        if (aa === undefined) {
            err("cannot identify \"" + a + "\" as a token", line);
            return null;
        }
        else if (aa.length > 1) {
            var ret = '';
            for (var i = 0; i < aa.length; i++) {
                i > 0 && (ret += ',');
                ret += "<" + aa[i].sym + ">";
            }
            err("cannot identify " + a + " as a token, since it could be " + ret, line);
            return null;
        }
        return aa[0];
    }
    function getTokenByName(t, line) {
        var ret = _tokenNameTable[t];
        if (ret === undefined) {
            err("cannot identify <" + t + "> as a token", line);
            return null;
        }
        return ret;
    }
    function defineTokenPrec(tid, assoc, type, line) {
        if (type === TokenRefType.TOKEN) {
            var tk = getTokenByName(tid, line);
            if (tk !== null) {
                tk.assoc = assoc;
                tk.pr = _pr;
            }
        }
        else if (type === TokenRefType.STRING) {
            var tk = getTokenByAlias(tid, line);
            if (tk !== null) {
                tk.assoc = assoc;
                tk.pr = _pr;
            }
        }
        else if (type === TokenRefType.NAME) {
            var t2 = _pseudoTokens[tid] = _pseudoTokens[tid] || {
                assoc: assoc,
                pr: _pr,
                line: line
            };
        }
    }
    function setOpt(name, value) {
        _f.opt[name] = value;
    }
    function setHeader(h) {
        _f.header = h;
    }
    function setExtraArg(a) {
        _f.extraArgs = a;
    }
    function setType(t) {
        _f.sematicType = t;
    }
    function setInit(arg, body) {
        _f.initArg = arg;
        _f.initBody = body;
    }
    function incPr() {
        _pr++;
    }
    function setEpilogue(ep) {
        _f.epilogue = ep;
    }
    function prepareRule(lhs, line) {
        if (_first) {
            _first = false;
            prepareRule('(accept)', line);
            addRuleItem(lhs, TokenRefType.NAME, line);
            addRuleItem('EOF', TokenRefType.TOKEN, line);
            commitRule();
        }
        var nt = _ntTable[lhs];
        if (nt === undefined) {
            nt = _ntTable[lhs] = {
                index: _g.nts.length,
                sym: lhs,
                firstSet: null,
                used: false,
                rules: [],
                parents: []
            };
            _g.nts.push(nt);
            _requiringNt.signal(lhs, nt);
        }
        var nr = new Rule(_g, nt, line);
        _ruleStack.push(nr);
    }
    function addRuleUseVar(vname, line) {
        var t = _top();
        if (t.usedVars[vname] !== undefined) {
            err("re-use of sematic variable \"" + vname + "\"", line);
        }
        else {
            t.usedVars[vname] = { line: line, val: 0 };
        }
    }
    function addRuleSematicVar(vname, line) {
        var t = _top();
        if (t.usedVars[vname] !== undefined) {
            err("variable \"" + vname + "\" conflicts with imported variable defined at line " + t.usedVars[vname].line, line);
        }
        else if (t.vars[vname] !== undefined) {
            err("sematic variable \"" + vname + "\" is already defined at line " + t.vars[vname].line, line);
        }
        else {
            _sematicVar = { line: line, val: vname };
        }
    }
    function addRuleItem(id, type, line) {
        var t = _top();
        if (t.action !== null) {
            _splitAction(line);
        }
        if (_sematicVar !== null) {
            t.vars[_sematicVar.val] = { val: t.rhs.length, line: _sematicVar.line };
            _sematicVar = null;
        }
        if (type === TokenRefType.NAME) {
            var pos_1 = t.rhs.length;
            t.rhs.push(0);
            _requiringNt.wait(id, function (su, nt) {
                if (su) {
                    t.rhs[pos_1] = -nt.index - 1;
                    nt.parents.push({
                        rule: t,
                        pos: pos_1
                    });
                    nt.used = true;
                }
                else {
                    err("use of undefined non terminal " + id, line);
                }
            });
        }
        else if (type === TokenRefType.TOKEN) {
            var tl = _tokenNameTable[id];
            if (tl === undefined) {
                err("cannot recognize <" + id + "> as a token", line);
                return;
            }
            t.rhs.push(tl.index);
            tl.used = true;
        }
        else if (type === TokenRefType.STRING) {
            var td = getTokenByAlias(id, line);
            if (td !== null) {
                t.rhs.push(td.index);
                td.used = true;
            }
        }
    }
    function addAction(b) {
        var t = _top();
        if (t.action !== null) {
            _splitAction(t.line);
        }
        t.action = b;
        if (_sematicVar !== null) {
            t.vars[_sematicVar.val] = { val: t.rhs.length, line: _sematicVar.line };
            _sematicVar = null;
            _splitAction(t.line);
        }
    }
    function defineRulePr(token, type, line) {
        if (type === TokenRefType.STRING || type === TokenRefType.TOKEN) {
            var tk = type === TokenRefType.STRING ?
                getTokenByAlias(token, line) :
                getTokenByName(token, line);
            if (tk !== null) {
                if (tk.assoc === Assoc.UNDEFINED) {
                    err("precedence of token \"" + token + "\" has not been defined", line);
                    return;
                }
                _top().pr = tk.pr;
            }
        }
        else {
            var pt = _pseudoTokens[token];
            if (!pt) {
                err("pseudo token \"" + token + "\" is not defined", line);
            }
            _top().pr = pt.pr;
        }
    }
    function commitRule() {
        var t = _ruleStack.pop();
        t.index = _g.rules.length;
        t.lhs.rules.push(t);
        _g.rules.push(t);
        for (var _i = 0, _onCommit_1 = _onCommit; _i < _onCommit_1.length; _i++) {
            var cb = _onCommit_1[_i];
            cb();
        }
        _onCommit.length = 0;
    }
    function addPushStateAction(acts, vn, line) {
        lexBuilder.requiringState.wait(vn, function (su, sn) {
            if (su) {
                acts.push(pushState(sn));
            }
            else {
                ctx.err(new CompilationError("state \"" + vn + "\" is undefined", line));
            }
        });
    }
    function build() {
        _g.tokenCount = _g.tokens.length;
        _g.tokens[0].used = true;
        _g.nts[0].used = true;
        for (var _i = 0, _a = _g.nts; _i < _a.length; _i++) {
            var nt = _a[_i];
            nt.firstSet = new TokenSet(_g.tokenCount);
            for (var _b = 0, _c = nt.rules; _b < _c.length; _b++) {
                var rule = _c[_b];
                rule.calcPr();
                var _loop_1 = function (vname) {
                    var v = rule.usedVars[vname];
                    v.val = rule.getVarSp(vname, function (msg) {
                        err("cannot find variable \"" + vname + "\": " + msg, v.line);
                    });
                };
                for (var vname in rule.usedVars) {
                    _loop_1(vname);
                }
            }
        }
        _f.lexDFA = lexBuilder.build();
        for (var _d = 0, _onDone_1 = _onDone; _d < _onDone_1.length; _d++) {
            var cb = _onDone_1[_d];
            cb();
        }
        _requiringNt.fail();
        return _f;
    }
}

function nodeFromToken(t) {
    return {
        val: t.val,
        ext: null,
        startLine: t.startLine,
        startColumn: t.startColumn,
        endLine: t.endLine,
        endColumn: t.endColumn
    };
}
function nodeFromTrivalToken(t) {
    return {
        val: null,
        ext: null,
        startLine: t.startLine,
        startColumn: t.startColumn,
        endLine: t.endLine,
        endColumn: t.endColumn
    };
}
function newNode(val) {
    return {
        val: val,
        ext: null,
        startLine: 0,
        startColumn: 0,
        endLine: 0,
        endColumn: 0
    };
}
function unescape(s) {
    return s
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\');
}
function moveDFA0(c, ret) {
    switch (ret.state) {
        case 0:
            ret.hasArc = true;
            ret.isEnd = false;
            if ((c >= 9 && c <= 10) || c === 13 || c === 32) {
                ret.state = 1;
            }
            else if (c === 34) {
                ret.state = 2;
            }
            else if (c === 36 || (c >= 65 && c <= 90) || c === 95 || (c >= 97 && c <= 122)) {
                ret.state = 3;
            }
            else if (c === 37) {
                ret.state = 4;
            }
            else if (c === 39) {
                ret.state = 5;
            }
            else if (c === 40) {
                ret.state = 6;
            }
            else if (c === 41) {
                ret.state = 7;
            }
            else if (c === 42) {
                ret.state = 8;
            }
            else if (c === 43) {
                ret.state = 9;
            }
            else if (c === 44) {
                ret.state = 10;
            }
            else if (c === 45) {
                ret.state = 11;
            }
            else if (c === 47) {
                ret.state = 12;
            }
            else if (c === 58) {
                ret.state = 13;
            }
            else if (c === 59) {
                ret.state = 14;
            }
            else if (c === 60) {
                ret.state = 15;
            }
            else if (c === 61) {
                ret.state = 16;
            }
            else if (c === 62) {
                ret.state = 17;
            }
            else if (c === 63) {
                ret.state = 18;
            }
            else if (c === 91) {
                ret.state = 19;
            }
            else if (c === 93) {
                ret.state = 20;
            }
            else if (c === 94) {
                ret.state = 21;
            }
            else if (c === 123) {
                ret.state = 22;
            }
            else if (c === 124) {
                ret.state = 23;
            }
            else if (c === 125) {
                ret.state = 24;
            }
            else {
                ret.state = -1;
            }
            break;
        case 1:
            ret.hasArc = true;
            ret.isEnd = true;
            if ((c >= 9 && c <= 10) || c === 13 || c === 32) {
                ret.state = 1;
            }
            else {
                ret.state = -1;
            }
            break;
        case 2:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 91) || c >= 93) {
                ret.state = 25;
            }
            else if (c === 34) {
                ret.state = 26;
            }
            else if (c === 92) {
                ret.state = 27;
            }
            else {
                ret.state = -1;
            }
            break;
        case 3:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c === 36 || (c >= 65 && c <= 90) || c === 95 || (c >= 97 && c <= 122)) {
                ret.state = 28;
            }
            else if ((c >= 48 && c <= 57)) {
                ret.state = 29;
            }
            else {
                ret.state = -1;
            }
            break;
        case 4:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 37) {
                ret.state = 30;
            }
            else if (c === 101) {
                ret.state = 31;
            }
            else if (c === 104) {
                ret.state = 32;
            }
            else if (c === 105) {
                ret.state = 33;
            }
            else if (c === 108) {
                ret.state = 34;
            }
            else if (c === 110) {
                ret.state = 35;
            }
            else if (c === 111) {
                ret.state = 36;
            }
            else if (c === 112) {
                ret.state = 37;
            }
            else if (c === 114) {
                ret.state = 38;
            }
            else if (c === 116) {
                ret.state = 39;
            }
            else if (c === 117) {
                ret.state = 40;
            }
            else {
                ret.state = -1;
            }
            break;
        case 5:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 91) || c >= 93) {
                ret.state = 41;
            }
            else if (c === 39) {
                ret.state = 42;
            }
            else if (c === 92) {
                ret.state = 43;
            }
            else {
                ret.state = -1;
            }
            break;
        case 6:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 7:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 8:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 9:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 10:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 11:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 12:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 42) {
                ret.state = 44;
            }
            else if (c === 47) {
                ret.state = 45;
            }
            else {
                ret.state = -1;
            }
            break;
        case 13:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 14:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 15:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 16:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c === 62) {
                ret.state = 46;
            }
            else {
                ret.state = -1;
            }
            break;
        case 17:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 18:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 19:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 20:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 21:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 22:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 23:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 24:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 25:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 91) || c >= 93) {
                ret.state = 25;
            }
            else if (c === 34) {
                ret.state = 26;
            }
            else if (c === 92) {
                ret.state = 27;
            }
            else {
                ret.state = -1;
            }
            break;
        case 26:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 27:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 34 || c === 39 || c === 92 || c === 98 || c === 102 || c === 110 || c === 114 || c === 116) {
                ret.state = 47;
            }
            else if (c === 117 || c === 120) {
                ret.state = 48;
            }
            else {
                ret.state = -1;
            }
            break;
        case 28:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c === 36 || (c >= 65 && c <= 90) || c === 95 || (c >= 97 && c <= 122)) {
                ret.state = 28;
            }
            else if ((c >= 48 && c <= 57)) {
                ret.state = 29;
            }
            else {
                ret.state = -1;
            }
            break;
        case 29:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c === 36 || (c >= 65 && c <= 90) || c === 95 || (c >= 97 && c <= 122)) {
                ret.state = 28;
            }
            else if ((c >= 48 && c <= 57)) {
                ret.state = 29;
            }
            else {
                ret.state = -1;
            }
            break;
        case 30:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 31:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 109) {
                ret.state = 49;
            }
            else if (c === 120) {
                ret.state = 50;
            }
            else {
                ret.state = -1;
            }
            break;
        case 32:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 51;
            }
            else {
                ret.state = -1;
            }
            break;
        case 33:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 110) {
                ret.state = 52;
            }
            else {
                ret.state = -1;
            }
            break;
        case 34:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 53;
            }
            else {
                ret.state = -1;
            }
            break;
        case 35:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 54;
            }
            else {
                ret.state = -1;
            }
            break;
        case 36:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 55;
            }
            else {
                ret.state = -1;
            }
            break;
        case 37:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 56;
            }
            else {
                ret.state = -1;
            }
            break;
        case 38:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 105) {
                ret.state = 57;
            }
            else {
                ret.state = -1;
            }
            break;
        case 39:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 121) {
                ret.state = 58;
            }
            else {
                ret.state = -1;
            }
            break;
        case 40:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 115) {
                ret.state = 59;
            }
            else {
                ret.state = -1;
            }
            break;
        case 41:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 91) || c >= 93) {
                ret.state = 41;
            }
            else if (c === 39) {
                ret.state = 42;
            }
            else if (c === 92) {
                ret.state = 43;
            }
            else {
                ret.state = -1;
            }
            break;
        case 42:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 43:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 34 || c === 39 || c === 92 || c === 98 || c === 102 || c === 110 || c === 114 || c === 116) {
                ret.state = 60;
            }
            else if (c === 117 || c === 120) {
                ret.state = 61;
            }
            else {
                ret.state = -1;
            }
            break;
        case 44:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 62;
            }
            else if (c === 42) {
                ret.state = 63;
            }
            else if (c === 47) {
                ret.state = 64;
            }
            else {
                ret.state = -1;
            }
            break;
        case 45:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c <= 9 || c >= 11) {
                ret.state = 65;
            }
            else {
                ret.state = -1;
            }
            break;
        case 46:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 47:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 91) || c >= 93) {
                ret.state = 25;
            }
            else if (c === 34) {
                ret.state = 26;
            }
            else if (c === 92) {
                ret.state = 27;
            }
            else {
                ret.state = -1;
            }
            break;
        case 48:
            ret.hasArc = true;
            ret.isEnd = false;
            if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 66;
            }
            else {
                ret.state = -1;
            }
            break;
        case 49:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 67;
            }
            else {
                ret.state = -1;
            }
            break;
        case 50:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 68;
            }
            else {
                ret.state = -1;
            }
            break;
        case 51:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 69;
            }
            else {
                ret.state = -1;
            }
            break;
        case 52:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 105) {
                ret.state = 70;
            }
            else {
                ret.state = -1;
            }
            break;
        case 53:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 102) {
                ret.state = 71;
            }
            else if (c === 120) {
                ret.state = 72;
            }
            else {
                ret.state = -1;
            }
            break;
        case 54:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 110) {
                ret.state = 73;
            }
            else {
                ret.state = -1;
            }
            break;
        case 55:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 74;
            }
            else {
                ret.state = -1;
            }
            break;
        case 56:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 75;
            }
            else {
                ret.state = -1;
            }
            break;
        case 57:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 103) {
                ret.state = 76;
            }
            else {
                ret.state = -1;
            }
            break;
        case 58:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 77;
            }
            else {
                ret.state = -1;
            }
            break;
        case 59:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 78;
            }
            else {
                ret.state = -1;
            }
            break;
        case 60:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 91) || c >= 93) {
                ret.state = 41;
            }
            else if (c === 39) {
                ret.state = 42;
            }
            else if (c === 92) {
                ret.state = 43;
            }
            else {
                ret.state = -1;
            }
            break;
        case 61:
            ret.hasArc = true;
            ret.isEnd = false;
            if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 79;
            }
            else {
                ret.state = -1;
            }
            break;
        case 62:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 62;
            }
            else if (c === 42) {
                ret.state = 63;
            }
            else if (c === 47) {
                ret.state = 80;
            }
            else {
                ret.state = -1;
            }
            break;
        case 63:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 46 || c >= 48) {
                ret.state = 81;
            }
            else if (c === 47) {
                ret.state = 82;
            }
            else {
                ret.state = -1;
            }
            break;
        case 64:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 47) {
                ret.state = 83;
            }
            else {
                ret.state = -1;
            }
            break;
        case 65:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c <= 9 || c >= 11) {
                ret.state = 65;
            }
            else {
                ret.state = -1;
            }
            break;
        case 66:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 25;
            }
            else if (c === 34) {
                ret.state = 26;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 84;
            }
            else if (c === 92) {
                ret.state = 27;
            }
            else {
                ret.state = -1;
            }
            break;
        case 67:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 85;
            }
            else {
                ret.state = -1;
            }
            break;
        case 68:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 86;
            }
            else {
                ret.state = -1;
            }
            break;
        case 69:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 100) {
                ret.state = 87;
            }
            else {
                ret.state = -1;
            }
            break;
        case 70:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 88;
            }
            else {
                ret.state = -1;
            }
            break;
        case 71:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 89;
            }
            else {
                ret.state = -1;
            }
            break;
        case 72:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 73:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 90;
            }
            else {
                ret.state = -1;
            }
            break;
        case 74:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 105) {
                ret.state = 91;
            }
            else {
                ret.state = -1;
            }
            break;
        case 75:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 99) {
                ret.state = 92;
            }
            else {
                ret.state = -1;
            }
            break;
        case 76:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 104) {
                ret.state = 93;
            }
            else {
                ret.state = -1;
            }
            break;
        case 77:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 94;
            }
            else {
                ret.state = -1;
            }
            break;
        case 78:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 79:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 41;
            }
            else if (c === 39) {
                ret.state = 42;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 95;
            }
            else if (c === 92) {
                ret.state = 43;
            }
            else {
                ret.state = -1;
            }
            break;
        case 80:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 62;
            }
            else if (c === 42) {
                ret.state = 63;
            }
            else if (c === 47) {
                ret.state = 80;
            }
            else {
                ret.state = -1;
            }
            break;
        case 81:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 62;
            }
            else if (c === 42) {
                ret.state = 63;
            }
            else if (c === 47) {
                ret.state = 64;
            }
            else {
                ret.state = -1;
            }
            break;
        case 82:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 83:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 62;
            }
            else if (c === 42) {
                ret.state = 63;
            }
            else if (c === 47) {
                ret.state = 64;
            }
            else {
                ret.state = -1;
            }
            break;
        case 84:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 25;
            }
            else if (c === 34) {
                ret.state = 26;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 84;
            }
            else if (c === 92) {
                ret.state = 27;
            }
            else {
                ret.state = -1;
            }
            break;
        case 85:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 121) {
                ret.state = 96;
            }
            else {
                ret.state = -1;
            }
            break;
        case 86:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 97;
            }
            else {
                ret.state = -1;
            }
            break;
        case 87:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 98;
            }
            else {
                ret.state = -1;
            }
            break;
        case 88:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 89:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 90:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 115) {
                ret.state = 99;
            }
            else {
                ret.state = -1;
            }
            break;
        case 91:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 100;
            }
            else {
                ret.state = -1;
            }
            break;
        case 92:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 93:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 101;
            }
            else {
                ret.state = -1;
            }
            break;
        case 94:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 95:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 41;
            }
            else if (c === 39) {
                ret.state = 42;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 95;
            }
            else if (c === 92) {
                ret.state = 43;
            }
            else {
                ret.state = -1;
            }
            break;
        case 96:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 97:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 95) {
                ret.state = 102;
            }
            else {
                ret.state = -1;
            }
            break;
        case 98:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 103;
            }
            else {
                ret.state = -1;
            }
            break;
        case 99:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 115) {
                ret.state = 104;
            }
            else {
                ret.state = -1;
            }
            break;
        case 100:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 110) {
                ret.state = 105;
            }
            else {
                ret.state = -1;
            }
            break;
        case 101:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 102:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 106;
            }
            else {
                ret.state = -1;
            }
            break;
        case 103:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 104:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 107;
            }
            else {
                ret.state = -1;
            }
            break;
        case 105:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 106:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 108;
            }
            else {
                ret.state = -1;
            }
            break;
        case 107:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 99) {
                ret.state = 109;
            }
            else {
                ret.state = -1;
            }
            break;
        case 108:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 103) {
                ret.state = 110;
            }
            else {
                ret.state = -1;
            }
            break;
        case 109:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 110:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        default:
            ret.state = -1;
            ret.hasArc = false;
    }
}
function moveDFA1(c, ret) {
    switch (ret.state) {
        case 0:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c <= 122 || c === 124 || c >= 126) {
                ret.state = 1;
            }
            else if (c === 123) {
                ret.state = 2;
            }
            else if (c === 125) {
                ret.state = 3;
            }
            else {
                ret.state = -1;
            }
            break;
        case 1:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c <= 122 || c === 124 || c >= 126) {
                ret.state = 1;
            }
            else {
                ret.state = -1;
            }
            break;
        case 2:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 3:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        default:
            ret.state = -1;
            ret.hasArc = false;
    }
}
function moveDFA2(c, ret) {
    switch (ret.state) {
        case 0:
            ret.hasArc = true;
            ret.isEnd = false;
            ret.state = 1;
            break;
        case 1:
            ret.hasArc = true;
            ret.isEnd = true;
            ret.state = 1;
            break;
        default:
            ret.state = -1;
            ret.hasArc = false;
    }
}
var jjlexers = [
    moveDFA0,
    moveDFA1,
    moveDFA2,
];
var jjlexTokens0 = [
    -1, -1, -1, 1, -1, -1, 19, 20, 25, 26,
    34, 27, -1, 28, 30, 18, 21, 17, 24, 22,
    23, 33, 3, 32, 4, -1, 2, -1, 1, 1,
    31, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, 2, -1, -1, -1, 29, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, 6, -1, -1, -1, -1, -1, 10, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, 16, 7,
    -1, -1, 15, -1, 14, -1, 13, -1, -1, -1,
    -1, 8, -1, 11, -1, 5, -1, -1, -1, 9,
    12,
];
var jjlexTokens1 = [
    35, 35, 3, 4,
];
var jjlexTokens2 = [
    -1, 36,
];
var jjtokenCount = 37;
var jjactERR = 169;
var jjpact = [
    9, 7, 14, 15, 16, 149, 10, 11, 116, 12,
    83, 13, -49, 113, 114, -49, 157, 158, 156, -110,
    -50, 148, 146, -50, -86, 147, 5, -49, 116, 95,
    -104, 92, 95, 113, 114, -50, 25, 95, 153, -86,
    99, -86, 25, 95, -104, 94, -111, 66, 94, 127,
    64, 58, 54, 94, 100, 60, 168, 61, 47, 94,
    167, 46, 139, -38, 41, 42, 165, 164, 163, 55,
    139, 161, 126, 151, 150, 143, 110, 58, 131, 130,
    129, 128, 124, -104, 120, 119, 118, 110, 107, -93,
    105, 104, 103, 102, 101, 96, 89, 87, 86, 81,
    77, 75, 74, 70, 69, 68, 63, 56, 49, 45,
    43, 39, 35, 20, 29, 26, 20, 4, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0,
];
var jjdisact = [
    -37, 117, -5, -37, 115, -37, -37, 41, 112, -37,
    -37, 113, -37, -37, -37, -37, 112, -37, -37, -37,
    94, 35, -37, -37, -37, -37, -37, -37, -37, -37,
    80, -37, 36, 107, 108, -37, 57, -37, 72, -37,
    -37, -37, -37, 35, -37, -37, 86, -37, -37, 25,
    -37, 96, 46, -37, 104, 102, -37, -37, 100, -37,
    -37, 89, 82, -37, -37, -37, 82, -37, -37, -37,
    -37, 84, 9, -37, 97, 76, 95, 42, -37, 41,
    30, -37, 74, 27, 20, -37, 76, 76, 64, 87,
    -37, -37, -37, 89, -37, 88, -37, -37, -37, 87,
    -37, 59, -37, -37, 69, 84, -37, 67, -37, 80,
    65, -37, 80, -37, -37, 78, 76, -37, -37, -37,
    -37, 56, -37, 48, -37, -37, 7, -37, -37, -37,
    -13, -37, 43, 3, -37, 3, 40, -37, 46, -37,
    16, 15, -37, -37, -8, -37, 39, 70, -37, 68,
    66, 63, -37, -5, -37, -37, -37, -37, 46, 60,
    43, -37, -37, -37, -37, 33, -37, -37,
];
var jjcheckact = [
    2, 2, 2, 2, 2, 135, 2, 2, 130, 2,
    72, 2, 153, 130, 130, 153, 144, 144, 144, 140,
    133, 135, 135, 133, 72, 135, 2, 153, 126, 83,
    83, 80, 80, 126, 126, 133, 21, 21, 141, 72,
    84, 72, 7, 7, 79, 83, 77, 52, 80, 141,
    52, 140, 43, 21, 84, 49, 165, 49, 36, 7,
    160, 36, 159, 79, 32, 32, 158, 151, 150, 43,
    149, 147, 146, 138, 136, 132, 123, 77, 121, 116,
    115, 112, 110, 109, 107, 105, 104, 101, 99, 95,
    93, 89, 88, 87, 86, 82, 76, 75, 74, 71,
    66, 62, 61, 58, 55, 54, 51, 46, 38, 34,
    33, 30, 20, 16, 11, 8, 4, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0,
];
var jjdefred = [
    4, -1, -1, 0, -1, 3, 5, -1, -1, 103,
    103, -1, 103, 15, 16, 17, 1, 71, 72, 73,
    25, 7, 19, 20, 21, 23, 9, 10, 11, 103,
    -1, 70, -1, -1, -1, 18, -1, 12, 13, 79,
    75, 76, 29, -1, 26, 8, -1, 2, 14, -1,
    78, 82, 34, 24, -1, -1, 106, 108, -1, 74,
    79, 88, -1, 6, 28, 30, -1, 27, 22, 107,
    77, 98, 90, 86, -1, -1, 46, 109, 80, 99,
    -1, 87, 91, 37, -1, 84, -1, -1, -1, -1,
    100, 101, 102, -1, 97, 89, 94, 95, 81, -1,
    46, 36, 46, 111, -1, -1, 83, -1, 32, 37,
    -1, 41, -1, 43, 44, -1, -1, 96, 93, 31,
    35, -1, 39, 36, 52, 62, 103, 42, 45, 107,
    103, 33, 47, 52, 51, -1, 64, 67, 68, 40,
    104, -1, 52, 50, 57, 46, 63, -1, 61, -1,
    -1, -1, 38, 52, 53, 54, 55, 56, -1, 65,
    -1, 66, 69, 105, 58, -1, 60, 59,
];
var jjpgoto = [
    5, 90, 121, 7, 144, 33, 97, 121, 83, 81,
    21, 22, 143, 135, 154, 143, 135, 141, 111, 92,
    61, 139, 78, 79, 39, 35, 20, 165, 136, 137,
    161, 159, 120, 121, 84, 122, 116, 96, 87, 124,
    122, 116, 151, 140, 56, 58, 56, 58, 89, 114,
    116, 23, 114, 116, 71, 72, 64, 131, 66, 108,
    105, 75, 70, 51, 52, 23, 122, 116, 47, 43,
    32, 30, 27, 116, 16, 17, 18, 1, 77, 2,
    158, 124, 153, 134, 135, 132, 133, 134, 135, 110,
    124, 107, 124, 49, 50, 51, 37, 116, 36, 29,
    116, 26, 116, -1, 31, 18, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1,
];
var jjdisgoto = [
    76, -59, -4, -59, 40, -59, 21, 2, -59, 49,
    20, -59, 47, -59, -59, -59, 69, -59, -59, 33,
    -6, 16, -59, -59, -59, 88, -59, -59, -59, 44,
    -59, -59, -14, -59, 57, -59, -59, -59, 62, 54,
    -59, -59, 51, -59, -59, -59, -59, -59, -59, -59,
    -59, -22, 42, -59, -59, -59, -59, -59, -59, -59,
    22, 10, -59, -59, -59, 46, -59, -59, -59, 23,
    -59, -28, -38, -59, -9, -59, 16, -10, -59, -17,
    -30, -59, -59, -12, -59, -59, -59, -59, -59, -59,
    -59, -59, -59, -59, -59, 12, -59, -59, -59, -59,
    69, 42, 67, -59, -59, -59, -59, -59, -59, 14,
    -59, -59, -59, -59, -59, -59, -59, -59, -59, -59,
    -59, -59, -59, 40, 61, -59, 0, -59, -59, -12,
    -3, -59, -59, -11, -59, -25, -59, -59, -59, -59,
    -12, -59, 57, -59, -14, 58, 1, -59, -59, -3,
    -59, -59, -59, -14, -59, -59, -59, -59, -59, -4,
    -59, -59, -59, -59, -59, -59, -59, -59,
];
var jjruleLen = [
    2, 0, 6, 2, 0, 0, 6, 2, 4, 2,
    2, 2, 3, 0, 1, 1, 1, 1, 2, 1,
    1, 1, 4, 0, 3, 0, 1, 3, 2, 0,
    0, 6, 5, 7, 0, 2, 0, 0, 4, 1,
    3, 1, 2, 1, 1, 2, 0, 2, 3, 1,
    2, 1, 0, 3, 1, 1, 1, 0, 3, 4,
    3, 1, 1, 0, 1, 0, 3, 1, 1, 3,
    2, 1, 1, 0, 5, 1, 1, 3, 1, 0,
    4, 4, 0, 3, 1, 1, 1, 2, 0, 2,
    0, 1, 0, 4, 2, 2, 3, 1, 0, 1,
    2, 2, 2, 0, 0, 5, 2, 0, 1, 0,
    0, 5,
];
var jjlhs = [
    0, 2, 1, 3, 3, 5, 4, 4, 4, 4,
    4, 4, 4, 6, 6, 7, 7, 7, 8, 8,
    9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
    15, 14, 14, 14, 16, 17, 17, 19, 18, 18,
    20, 20, 21, 21, 21, 21, 23, 22, 24, 24,
    25, 25, 27, 26, 28, 28, 28, 28, 29, 29,
    29, 29, 30, 30, 31, 31, 32, 32, 33, 33,
    34, 34, 35, 37, 36, 38, 38, 39, 39, 41,
    40, 42, 42, 43, 43, 44, 44, 45, 45, 46,
    46, 47, 48, 47, 47, 47, 49, 49, 50, 50,
    50, 51, 51, 53, 54, 52, 55, 55, 56, 57,
    58, 56,
];
var jjtokenNames = [
    "EOF", "NAME", "STRING",
    "OPEN_BLOCK", "CLOSE_BLOCK", "OPT_DIR",
    "LEX_DIR", "LEFT_DIR", "RIGHT_DIR",
    "NONASSOC_DIR", "USE_DIR", "HEADER_DIR",
    "EXTRA_ARG_DIR", "EMPTY", "TYPE_DIR",
    "PREC_DIR", "INIT_DIR", "GT",
    "LT", "BRA", "KET",
    "EQU", "CBRA", "CKET",
    "QUESTION", "STAR", "PLUS",
    "DASH", "COLON", "ARROW",
    "EOL", "SEPERATOR", "OR",
    "WEDGE", "COMMA", "ANY_CODE",
    "ANY_EPLOGUE_CODE",
];
var jjtokenAlias = [
    null, null, null,
    "{", "}", "%option",
    "%lex", "%left", "%right",
    "%nonassoc", "%use", "%header",
    "%extra_arg", "%empty", "%type",
    "%prec", "%init", ">",
    "<", "(", ")",
    "=", "[", "]",
    "?", "*", "+",
    "-", ":", "=>",
    ";", "%%", "|",
    "^", ",", null,
    null,
];
function tokenToString(tk) {
    return jjtokenAlias[tk] === null ? "<" + jjtokenNames[tk] + ">" : "\"" + jjtokenAlias[tk] + "\"";
}
var Token = (function () {
    function Token(id, val, startLine, startColumn, endLine, endColumn) {
        this.id = id;
        this.val = val;
        this.startLine = startLine;
        this.startColumn = startColumn;
        this.endLine = endLine;
        this.endColumn = endColumn;
    }
    Token.prototype.clone = function () {
        return new Token(this.id, this.val, this.startLine, this.startColumn, this.endLine, this.endColumn);
    };
    Token.prototype.toString = function () {
        return (jjtokenAlias[this.id] === null ?
            "<" + jjtokenNames[this.id] + ">" :
            "\"" + jjtokenAlias[this.id] + "\"") + ("(\"" + this.val + "\")");
    };
    return Token;
}());
function createParser() {
    var _lexState;
    var _state;
    var _matched;
    var _token;
    var _marker = { state: -1, line: 0, column: 0 };
    var _backupCount;
    var _line;
    var _column;
    var _tline;
    var _tcolumn;
    var _lrState = [];
    var _sematicS = [];
    var _sematicVal;
    var _stop;
    var _handlers = {};
    var gb;
    var assoc;
    var lexacts;
    var ruleLhs;
    function init(b) {
        _lexState = [0];
        _state = 0;
        _matched = '';
        _token = new Token(-1, null, 0, 0, 0, 0);
        _marker.state = -1;
        _backupCount = 0;
        _line = _tline = 1;
        _column = _tcolumn = 1;
        _lrState = [0];
        _sematicS = [];
        _sematicVal = null;
        _stop = false;
        gb = b;
    }
    function _setImg(s) {
        _matched = s;
        _tline = _line;
        _tcolumn = _column;
    }
    function _prepareToken(tid) {
        _token.id = tid;
        _token.val = _matched;
        _token.startLine = _tline;
        _token.startColumn = _tcolumn;
        _token.endLine = _line;
        _token.endColumn = _column;
        _matched = '';
        _tline = _line;
        _tcolumn = _column;
    }
    function _returnToken() {
        _emit('token', jjtokenNames[_token.id], _token.val);
        while (!_stop && !_acceptToken(_token))
            ;
        _token.id = -1;
    }
    function _emit(name, a1, a2, a3) {
        var cbs = _handlers[name];
        if (cbs) {
            for (var i = 0; i < cbs.length; i++) {
                cbs[i](a1, a2, a3);
            }
        }
    }
    function on(name, cb) {
        _handlers[name] || (_handlers[name] = []);
        _handlers[name].push(cb);
    }
    function _doLexAction0(jjstaten) {
        var jjtk = jjlexTokens0[jjstaten];
        jjtk !== -1 && _prepareToken(jjtk);
        switch (jjstaten) {
            case 1:
                _setImg("");
                break;
            case 3:
                _sematicVal = nodeFromToken(_token);
                break;
            case 22:
                _sematicVal = nodeFromTrivalToken(_token);
                break;
            case 24:
                _sematicVal = nodeFromTrivalToken(_token);
                break;
            case 26:
                _sematicVal = nodeFromToken(_token);
                _sematicVal.val = unescape(_sematicVal.val.substr(1, _sematicVal.val.length - 2));
                break;
            case 28:
                _sematicVal = nodeFromToken(_token);
                break;
            case 29:
                _sematicVal = nodeFromToken(_token);
                break;
            case 42:
                _sematicVal = nodeFromToken(_token);
                _sematicVal.val = unescape(_sematicVal.val.substr(1, _sematicVal.val.length - 2));
                break;
            case 45:
                _setImg("");
                break;
            case 65:
                _setImg("");
                break;
            case 82:
                _setImg("");
                break;
            default: ;
        }
    }
    function _doLexAction1(jjstaten) {
        var jjtk = jjlexTokens1[jjstaten];
        jjtk !== -1 && _prepareToken(jjtk);
        switch (jjstaten) {
            case 0:
                _sematicVal = newNode(_token.val);
                break;
            case 1:
                _sematicVal = newNode(_token.val);
                break;
            case 2:
                _sematicVal = nodeFromTrivalToken(_token);
                break;
            case 3:
                _sematicVal = nodeFromTrivalToken(_token);
                break;
            default: ;
        }
    }
    function _doLexAction2(jjstaten) {
        var jjtk = jjlexTokens2[jjstaten];
        jjtk !== -1 && _prepareToken(jjtk);
        switch (jjstaten) {
            case 1:
                _sematicVal = nodeFromToken(_token);
                break;
            default: ;
        }
    }
    function _doLexAction(lexstate, state) {
        switch (lexstate) {
            case 0:
                _doLexAction0(state);
                break;
            case 1:
                _doLexAction1(state);
                break;
            case 2:
                _doLexAction2(state);
                break;
            default: ;
        }
        _token.id !== -1 && _returnToken();
    }
    function _rollback() {
        var ret = _matched.substr(_matched.length - _backupCount, _backupCount);
        _matched = _matched.substr(0, _matched.length - _backupCount);
        _backupCount = 0;
        _line = _marker.line;
        _column = _marker.column;
        _state = _marker.state;
        _marker.state = -1;
        return ret;
    }
    function _mark() {
        _marker.state = _state;
        _marker.line = _line;
        _marker.column = _column;
        _backupCount = 0;
    }
    function _consume(c) {
        c === '\n' ? (_line++, _column = 0) : (_column++);
        _matched += c;
        _marker.state !== -1 && (_backupCount++);
        return true;
    }
    function _acceptChar(c) {
        var lexstate = _lexState[_lexState.length - 1];
        var retn = { state: _state, hasArc: false, isEnd: false };
        jjlexers[lexstate](c.charCodeAt(0), retn);
        if (retn.isEnd) {
            if (retn.hasArc) {
                if (retn.state === -1) {
                    _doLexAction(lexstate, _state);
                    _marker.state = -1;
                    _backupCount = 0;
                    _state = 0;
                    return false;
                }
                else {
                    _mark();
                    _state = retn.state;
                    return _consume(c);
                }
            }
            else {
                _doLexAction(lexstate, _state);
                _marker.state = -1;
                _backupCount = 0;
                _state = 0;
                return false;
            }
        }
        else {
            if (retn.state === -1) {
                if (_marker.state !== -1) {
                    var s = _rollback();
                    _doLexAction(lexstate, _state);
                    _state = 0;
                    accept(s);
                    return false;
                }
                else {
                    _emit('lexicalerror', "unexpected character \"" + c + "\"", _line, _column);
                    return true;
                }
            }
            else {
                _state = retn.state;
                return _consume(c);
            }
        }
    }
    function _acceptEOF() {
        if (_state === 0) {
            _prepareToken(0);
            _returnToken();
            return true;
        }
        else {
            var lexstate = _lexState[_lexState.length - 1];
            var retn = { state: _state, hasArc: false, isEnd: false };
            jjlexers[lexstate](-1, retn);
            if (retn.isEnd) {
                _doLexAction(lexstate, _state);
                _state = 0;
                _marker.state = -1;
                return false;
            }
            else if (_marker.state !== -1) {
                var s = _rollback();
                _doLexAction(lexstate, _state);
                _state = 0;
                accept(s);
                return false;
            }
            else {
                _emit('lexicalerror', 'unexpected end of file');
                return true;
            }
        }
    }
    function accept(s) {
        for (var i = 0; i < s.length && !_stop;) {
            _acceptChar(s.charAt(i)) && i++;
        }
    }
    function end() {
        while (!_stop && !_acceptEOF())
            ;
        _stop = true;
    }
    function halt() {
        _stop = true;
    }
    function _doReduction(jjrulenum) {
        var jjnt = jjlhs[jjrulenum];
        var jjsp = _sematicS.length;
        var jjtop = _sematicS[jjsp - jjruleLen[jjrulenum]] || null;
        switch (jjrulenum) {
            case 1:
                _lexState.push(2);
                break;
            case 5:
                {
                    gb.lexBuilder.prepareLex();
                }
                break;
            case 9:
                var b = _sematicS[jjsp - 1];
                {
                    gb.setHeader(b.val);
                }
                break;
            case 10:
                var b = _sematicS[jjsp - 1];
                {
                    gb.setExtraArg(b.val);
                }
                break;
            case 11:
                var t = _sematicS[jjsp - 1];
                {
                    gb.setType(t.val);
                }
                break;
            case 12:
                var args = _sematicS[jjsp - 2];
                var b = _sematicS[jjsp - 1];
                {
                    gb.setInit(args.val, b.val);
                }
                break;
            case 14:
                var ep = _sematicS[jjsp - 1];
                {
                    gb.setEpilogue(ep);
                }
                break;
            case 15:
                {
                    assoc = Assoc.LEFT;
                }
                break;
            case 16:
                {
                    assoc = Assoc.RIGHT;
                }
                break;
            case 17:
                {
                    assoc = Assoc.NON;
                }
                break;
            case 20:
                var t = _sematicS[jjsp - 1];
                {
                    gb.defineTokenPrec(t.val, assoc, t.ext, t.startLine);
                }
                break;
            case 21:
                var t = _sematicS[jjsp - 1];
                {
                    gb.defineTokenPrec(t.val, assoc, TokenRefType.NAME, t.startLine);
                }
                break;
            case 22:
                var name = _sematicS[jjsp - 3];
                var val = _sematicS[jjsp - 1];
                {
                    gb.setOpt(name.val, val.val);
                }
                break;
            case 25:
                {
                    gb.lexBuilder.selectState('DEFAULT');
                }
                break;
            case 26:
                var s = _sematicS[jjsp - 1];
                {
                    gb.lexBuilder.selectState(s.val);
                }
                break;
            case 27:
                var s = _sematicS[jjsp - 1];
                {
                    gb.lexBuilder.selectState(s.val);
                }
                break;
            case 30:
                var v = _sematicS[jjsp - 1];
                {
                    gb.lexBuilder.prepareVar(v.val, v.startLine);
                }
                break;
            case 31:
                var v = _sematicS[jjsp - 6];
                {
                    gb.lexBuilder.endVar();
                }
                break;
            case 32:
                {
                    gb.lexBuilder.end(lexacts, '(untitled)');
                }
                break;
            case 33:
                var tn = _sematicS[jjsp - 5];
                {
                    var tdef = gb.defToken(tn.val, gb.lexBuilder.getPossibleAlias(), tn.startLine);
                    lexacts.push(returnToken(tdef));
                    gb.lexBuilder.end(lexacts, tn.val);
                }
                break;
            case 34:
                {
                    gb.lexBuilder.newState();
                }
                break;
            case 36:
                {
                    lexacts = [];
                }
                break;
            case 37:
                {
                    lexacts = [];
                }
                break;
            case 39:
                var b = _sematicS[jjsp - 1];
                {
                    lexacts = [blockAction(b.val, b.startLine)];
                }
                break;
            case 42:
                var vn = _sematicS[jjsp - 1];
                {
                    gb.addPushStateAction(lexacts, vn.val, vn.startLine);
                }
                break;
            case 43:
                {
                    lexacts.push(popState());
                }
                break;
            case 44:
                var b = _sematicS[jjsp - 1];
                {
                    lexacts.push(blockAction(b.val, b.startLine));
                }
                break;
            case 45:
                var s = _sematicS[jjsp - 1];
                {
                    lexacts.push(setImg(s.val));
                }
                break;
            case 46:
                {
                    gb.lexBuilder.enterUnion();
                }
                break;
            case 47:
                {
                    gb.lexBuilder.leaveUnion();
                }
                break;
            case 48:
                {
                    gb.lexBuilder.endUnionItem();
                }
                break;
            case 49:
                {
                    gb.lexBuilder.endUnionItem();
                }
                break;
            case 52:
                {
                    gb.lexBuilder.enterSimple();
                }
                break;
            case 53:
                var suffix = _sematicS[jjsp - 1];
                {
                    gb.lexBuilder.simplePostfix(suffix.val);
                }
                break;
            case 54:
                {
                    jjtop = newNode('+');
                }
                break;
            case 55:
                {
                    jjtop = newNode('?');
                }
                break;
            case 56:
                {
                    jjtop = newNode('*');
                }
                break;
            case 57:
                {
                    jjtop = newNode('');
                }
                break;
            case 60:
                var n = _sematicS[jjsp - 2];
                {
                    gb.lexBuilder.addVar(n.val, n.startLine);
                }
                break;
            case 61:
                var s = _sematicS[jjsp - 1];
                {
                    gb.lexBuilder.addString(s.val);
                }
                break;
            case 62:
                {
                    gb.lexBuilder.beginSet(true);
                }
                break;
            case 63:
                {
                    gb.lexBuilder.beginSet(false);
                }
                break;
            case 68:
                var s = _sematicS[jjsp - 1];
                {
                    gb.lexBuilder.addSetItem(s.val, s.val, s.startLine, s.startLine);
                }
                break;
            case 69:
                var from = _sematicS[jjsp - 3];
                var to = _sematicS[jjsp - 1];
                {
                    gb.lexBuilder.addSetItem(from.val, to.val, from.startLine, to.startLine);
                }
                break;
            case 73:
                var n = _sematicS[jjsp - 1];
                {
                    ruleLhs = n;
                }
                break;
            case 79:
                {
                    gb.prepareRule(ruleLhs.val, ruleLhs.startLine);
                }
                break;
            case 80:
                {
                    gb.commitRule();
                }
                break;
            case 83:
                var vn = _sematicS[jjsp - 1];
                {
                    gb.addRuleUseVar(vn.val, vn.startLine);
                }
                break;
            case 84:
                var vn = _sematicS[jjsp - 1];
                {
                    gb.addRuleUseVar(vn.val, vn.startLine);
                }
                break;
            case 89:
                var itn = _sematicS[jjsp - 2];
                {
                    gb.addRuleSematicVar(itn.val, itn.startLine);
                }
                break;
            case 91:
                var t = _sematicS[jjsp - 1];
                {
                    gb.addRuleItem(t.val, TokenRefType.NAME, t.startLine);
                }
                break;
            case 92:
                var vn = _sematicS[jjsp - 2];
                {
                    gb.addRuleSematicVar(vn.val, vn.startLine);
                }
                break;
            case 93:
                var vn = _sematicS[jjsp - 4];
                var t = _sematicS[jjsp - 1];
                {
                    gb.addRuleItem(t.val, TokenRefType.NAME, t.startLine);
                }
                break;
            case 94:
                var t = _sematicS[jjsp - 1];
                {
                    gb.addRuleItem(t.val, t.ext, t.startLine);
                }
                break;
            case 95:
                {
                    gb.addAction(lexacts);
                }
                break;
            case 96:
                var t = _sematicS[jjsp - 2];
                {
                    jjtop = t;
                    jjtop.ext = TokenRefType.TOKEN;
                }
                break;
            case 97:
                {
                    jjtop.ext = TokenRefType.STRING;
                }
                break;
            case 100:
                {
                    gb.addAction(lexacts);
                }
                break;
            case 101:
                var t = _sematicS[jjsp - 1];
                {
                    gb.defineRulePr(t.val, TokenRefType.NAME, t.startLine);
                }
                break;
            case 102:
                var t = _sematicS[jjsp - 1];
                {
                    gb.defineRulePr(t.val, t.ext, t.startLine);
                }
                break;
            case 103:
                _lexState.push(1);
                break;
            case 104:
                var open = _sematicS[jjsp - 2];
                var bl = _sematicS[jjsp - 1];
                _lexState.pop();
                break;
            case 105:
                var open = _sematicS[jjsp - 4];
                var bl = _sematicS[jjsp - 3];
                var close = _sematicS[jjsp - 1];
                {
                    jjtop = newNode('');
                    jjtop.val = bl.val;
                    jjtop.startLine = open.startLine;
                    jjtop.startColumn = open.startColumn;
                    jjtop.endLine = close.endLine;
                    jjtop.endColumn = close.endColumn;
                }
                break;
            case 106:
                var b = _sematicS[jjsp - 1];
                {
                    jjtop.val += b.val;
                }
                break;
            case 107:
                {
                    jjtop = newNode('');
                }
                break;
            case 109:
                _lexState.push(1);
                break;
            case 110:
                var b = _sematicS[jjsp - 1];
                _lexState.pop();
                break;
            case 111:
                var b = _sematicS[jjsp - 3];
                {
                    jjtop = newNode('');
                    jjtop.val = '{' + b.val + '}';
                }
                break;
        }
        _lrState.length -= jjruleLen[jjrulenum];
        var jjcstate = _lrState[_lrState.length - 1];
        _lrState.push(jjpgoto[jjdisgoto[jjcstate] + jjnt]);
        _sematicS.length -= jjruleLen[jjrulenum];
        _sematicS.push(jjtop);
    }
    function _acceptToken(t) {
        var cstate = _lrState[_lrState.length - 1];
        var ind = jjdisact[cstate] + t.id;
        var act = 0;
        if (ind < 0 || ind >= jjpact.length || jjcheckact[ind] !== cstate) {
            act = -jjdefred[cstate] - 1;
        }
        else {
            act = jjpact[ind];
        }
        if (act === jjactERR) {
            _syntaxError(t);
            return true;
        }
        else if (act > 0) {
            if (t.id === 0) {
                _stop = true;
                _emit('accept');
                return true;
            }
            else {
                _lrState.push(act - 1);
                _sematicS.push(_sematicVal);
                _sematicVal = null;
                return true;
            }
        }
        else if (act < 0) {
            _doReduction(-act - 1);
            return false;
        }
        else {
            _syntaxError(t);
            return true;
        }
    }
    function _syntaxError(t) {
        var msg = "unexpected token " + t.toString() + ", expecting one of the following token(s):\n";
        msg += _expected(_lrState[_lrState.length - 1]);
        _emit("syntaxerror", msg, t);
    }
    function _expected(state) {
        var dis = jjdisact[state];
        var ret = '';
        function expect(tk) {
            var ind = dis + tk;
            if (ind < 0 || ind >= jjpact.length || state !== jjcheckact[ind]) {
                return jjdefred[state] !== -1;
            }
            else {
                return true;
            }
        }
        for (var tk = 0; tk < jjtokenCount; tk++) {
            expect(tk) && (ret += "    " + tokenToString(tk) + " ..." + '\n');
        }
        return ret;
    }
    return {
        init: init,
        on: on,
        accept: accept,
        end: end,
        halt: halt
    };
}
function parse(ctx, source) {
    var parser = createParser();
    var err = false;
    parser.on('lexicalerror', function (msg, line, column) {
        ctx.err(new CompilationError(msg, line));
        parser.halt();
        err = true;
    });
    parser.on('syntaxerror', function (msg, token) {
        ctx.err(new CompilationError(msg, token.startLine));
        parser.halt();
        err = true;
    });
    var gb = createFileBuilder(ctx);
    parser.init(gb);
    parser.accept(source);
    parser.end();
    if (err) {
        return null;
    }
    else {
        return gb.build();
    }
}

var tsRenderer = function (input, output) {
    echoLine("/*");
    echoLine("    generated by jscc, an LALR(1) parser generator made by hadroncfy.");
    echoLine("    template for typescript, written by hadroncfy, aussi.");
    echoLine("*/");
    echo(input.file.header);
    var prefix = input.file.prefix;
    var tab = input.file.opt.tab || '    ';
    function echo(s) {
        output.write(s);
    }
    function echoLine(s) {
        output.writeln(s);
    }
    function leftAlign(s, al) {
        function repeat(s, t) {
            var ret = '';
            while (t-- > 0)
                ret += s;
            return ret;
        }
        return (s.length < al ? repeat(' ', al - s.length) : '') + s;
    }
    function printTable(tname, t, align, lc, mapper) {
        var count = 1;
        echoLine("");
        echo("var ");
        echo(prefix + tname);
        echoLine(" = [ ");
        echo(tab);
        for (var _i = 0, t_1 = t; _i < t_1.length; _i++) {
            var i = t_1[_i];
            echo(leftAlign(mapper(i), align));
            echo(',');
            count++ >= lc && (count = 1, echo(input.endl + tab));
        }
        echoLine("");
        echo("]; ");
    }
    function printState(state) {
        function arcToString(arc) {
            var ret = [];
            arc.chars.forEach(function (from, to) {
                if (from === to) {
                    ret.push("c === " + from);
                }
                else if (from === 0 && to !== Inf.oo) {
                    ret.push("c <= " + to);
                }
                else if (from !== 0 && to === Inf.oo) {
                    ret.push("c >= " + from);
                }
                else if (from !== 0 && to !== Inf.oo) {
                    ret.push("(c >= " + from + " && c <= " + to + ")");
                }
                else {
                    ret.push('true');
                }
            });
            return ret.join(' || ');
        }
        var first = true;
        echoLine("");
        echo("        case ");
        echo(state.index);
        echoLine(":");
        echo("            ret.hasArc = ");
        echo(state.arcs.length > 0 ? 'true' : 'false');
        echoLine(";");
        echo("            ret.isEnd = ");
        echo(state.endAction === null ? 'false' : 'true');
        echo(";");
        if (state.arcs.length === 0) {
            echoLine("");
            echo("            ret.state = -1;");
        }
        else if (state.hasDefinate()) {
            echoLine("");
            echo("            ret.state = ");
            echo(state.arcs[0].to.index);
            echo(";");
        }
        else {
            for (var _i = 0, _b = state.arcs; _i < _b.length; _i++) {
                var arc = _b[_i];
                echoLine("");
                echo("            ");
                echo(first ? (first = false, '') : 'else ');
                echo("if(");
                echo(arcToString(arc));
                echoLine("){");
                echo("                ret.state = ");
                echo(arc.to.index);
                echoLine(";");
                echo("            }");
            }
            echoLine("");
            echoLine("            else {");
            echoLine("                ret.state = -1;");
            echo("            } ");
        }
        echoLine("");
        echo("            break;");
    }
    function printDFA(dfa, n) {
        echoLine("");
        echo("function moveDFA");
        echo(n);
        echoLine("(c: number, ret: { state: number, hasArc: boolean, isEnd: boolean }){");
        echo("    switch(ret.state){");
        for (var _i = 0, _b = dfa.states; _i < _b.length; _i++) {
            var state = _b[_i];
            printState(state);
        }
        echoLine("");
        echoLine("        default:");
        echoLine("            ret.state = -1;");
        echoLine("            ret.hasArc = false;");
        echoLine("    }");
        echo("}");
    }
    function printLexTokens(dfa, n) {
        function getAction(act) {
            for (var _i = 0, act_1 = act; _i < act_1.length; _i++) {
                var a = act_1[_i];
                if (a.token !== -1) {
                    return a.token;
                }
            }
            return -1;
        }
        printTable('lexTokens' + n, dfa.states, 6, 10, function (state) {
            return state.endAction ? getAction(state.endAction.data).toString() : '-1';
        });
    }
    var dfas = input.file.lexDFA;
    echoLine("");
    echoLine("/*");
    echoLine("    find the next state to go in the dfa");
    echo("*/");
    for (var i = 0, _a = dfas; i < _a.length; i++) {
        printDFA(_a[i], i);
    }
    echoLine("");
    echoLine("");
    echoLine("/*");
    echoLine("    all the lexer data goes here.");
    echoLine("*/");
    echo("var ");
    echo(prefix);
    echo("lexers = [");
    for (var i = 0; i < dfas.length; i++) {
        echoLine("");
        echo("    moveDFA");
        echo(i);
        echo(",");
    }
    echoLine("");
    echoLine("];");
    echoLine("");
    echoLine("/*");
    echoLine("    tokens that a lexical dfa state can return");
    echo("*/");
    for (var i = 0, _a = dfas; i < _a.length; i++) {
        printLexTokens(_a[i], i);
    }
    echoLine("");
    var pt = input.pt;
    echoLine("");
    echo("var ");
    echo(prefix);
    echo("stateCount = ");
    echo(pt.stateCount);
    echoLine(";");
    echo("var ");
    echo(prefix);
    echo("tokenCount = ");
    echo(input.file.grammar.tokens.length);
    echoLine(";");
    echo("var ");
    echo(prefix);
    echo("actERR = ");
    echo(pt.stateCount + 1);
    echoLine(";");
    echoLine("/*");
    echo("    compressed action table: action = ");
    echo(prefix);
    echo("pact[");
    echo(prefix);
    echoLine("disact[STATE-NUM] + TOKEN]");
    echoLine("    when action > 0, shift the token and goto state (action - 1);");
    echoLine("    when action < 0, reduce with rule (1-action);");
    echoLine("    when action = 0, do default action.");
    echo("*/");
    printTable('pact', pt.pact, 6, 10, function (t) {
        if (t === null) {
            return '0';
        }
        else if (t === Item.NULL) {
            return String(pt.stateCount + 1);
        }
        else if (t.actionType === Action$1.SHIFT) {
            return (t.shift.stateIndex + 1).toString();
        }
        else if (t.actionType === Action$1.REDUCE) {
            return (-t.rule.index - 1).toString();
        }
    });
    echoLine("");
    echoLine("/*");
    echoLine("    displacement of action table.");
    echo("*/");
    printTable('disact', pt.disact, 6, 10, function (t) { return t.toString(); });
    echoLine("");
    echoLine("/*");
    echo("    used to check if a position in ");
    echo(prefix);
    echoLine("pact is out of bouds.");
    echo("    if ");
    echo(prefix);
    echo("checkact[");
    echo(prefix);
    echoLine("disact[STATE-NUM] + TOKEN] = STATE-NUM, this position is not out of bounds.");
    echo("*/");
    printTable('checkact', pt.checkact, 6, 10, function (t) { return t === undefined ? '0' : t.toString(); });
    echoLine("");
    echoLine("/*");
    echo("    default action table. action = ");
    echo(prefix);
    echoLine("defred[STATE-NUM],");
    echoLine("    where action is the number of the rule to reduce with.");
    echo("*/");
    printTable('defred', pt.defred, 6, 10, function (t) { return t.toString(); });
    echoLine("");
    echoLine("/*");
    echo("    compressed goto table: goto = ");
    echo(prefix);
    echo("pgoto[");
    echo(prefix);
    echoLine("disgoto[STATE-NUM] + NON_TERMINAL]");
    echo("*/");
    printTable('pgoto', pt.pgoto, 6, 10, function (t) {
        if (t === null) {
            return '-1';
        }
        else {
            return t.shift.stateIndex.toString();
        }
    });
    echoLine("");
    echoLine("/*");
    echoLine("    displacement of the goto table");
    echo("*/");
    printTable('disgoto', pt.disgoto, 6, 10, function (t) { return t.toString(); });
    echoLine("");
    echoLine("/*");
    echo("    length of each rule: rule length = ");
    echo(prefix);
    echoLine("ruleLen[RULE-NUM]");
    echo("*/");
    printTable('ruleLen', pt.g.rules, 6, 10, function (r) { return r.rhs.length.toString(); });
    echoLine("");
    echoLine("/*");
    echoLine("    index of the LHS of each rule");
    echo("*/");
    printTable('lhs', pt.g.rules, 6, 10, function (r) { return r.lhs.index.toString(); });
    echoLine("");
    echoLine("/*");
    echoLine("    token names");
    echo("*/");
    printTable('tokenNames', pt.g.tokens, 20, 3, function (t) { return "\"" + t.sym + "\""; });
    echoLine("");
    echoLine("/*");
    echoLine("    token alias");
    echo("*/");
    printTable('tokenAlias', pt.g.tokens, 20, 3, function (t) { return t.alias ? "\"" + t.alias + "\"" : "null"; });
    var className = input.file.opt.className || 'Parser';
    echoLine("");
    function printLexActionsFunc(dfa, n) {
        var codegen = {
            addBlock: function (b, line) {
                echoLine("");
                echo("                ");
                echo(b.replace(/\$token/g, '_token').replace(/\$\$/g, '_sematicVal'));
            },
            pushLexState: function (n) {
                echoLine("");
                echo("                _lexState.push(");
                echo(n);
                echo(");");
            },
            popLexState: function () {
                echoLine("");
                echo("                _lexState.pop();");
            },
            setImg: function (n) {
                echoLine("");
                echo("                _setImg(\"");
                echo(n);
                echo("\");");
            },
            returnToken: function (t) {
                echoLine("");
                echoLine("                this._token = {");
                echo("                    id: ");
                echo(t.index);
                echoLine(",");
                echoLine("                    val: this._matched.join('')");
                echo("                };");
            }
        };
        function hasNormalAction(a) {
            for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
                var act = a_1[_i];
                if (act.token === -1) {
                    return true;
                }
            }
            return false;
        }
        var statevn = prefix + 'staten';
        echoLine("");
        echo("    function _doLexAction");
        echo(n);
        echo("(");
        echo(statevn);
        echoLine(": number){");
        echo("        let ");
        echo(prefix);
        echo("tk = ");
        echo(prefix);
        echo("lexTokens");
        echo(n);
        echo("[");
        echo(statevn);
        echoLine("];");
        echo("        ");
        echo(prefix);
        echo("tk !== -1 && _prepareToken(");
        echo(prefix);
        echoLine("tk);");
        echo("        switch(");
        echo(statevn);
        echo("){");
        for (var i = 0, _a = dfa.states; i < _a.length; i++) {
            if (_a[i].endAction !== null && hasNormalAction(_a[i].endAction.data)) {
                echoLine("");
                echo("            case ");
                echo(i);
                echo(":");
                for (var _i = 0, _b = _a[i].endAction.data; _i < _b.length; _i++) {
                    var act = _b[_i];
                    act.token === -1 && act.toCode(codegen);
                }
                echoLine("");
                echo("                break;");
            }
        }
        echoLine("");
        echoLine("            default:;");
        echoLine("        }");
        echo("    }");
    }
    echoLine("");
    echoLine("");
    echoLine("function tokenToString(tk: number){");
    echo("    return ");
    echo(prefix);
    echo("tokenAlias[tk] === null ? `<${");
    echo(prefix);
    echo("tokenNames[tk]}>` : `\"${");
    echo(prefix);
    echoLine("tokenAlias[tk]}\"`;");
    echoLine("}");
    echoLine("");
    echoLine("class Token {");
    echoLine("    constructor(");
    echoLine("        public id: number,");
    echoLine("        public val: string,");
    echoLine("        public startLine: number,");
    echoLine("        public startColumn: number,");
    echoLine("        public endLine: number,");
    echoLine("        public endColumn: number");
    echoLine("    ){}");
    echoLine("    clone(){");
    echoLine("        return new Token(");
    echoLine("            this.id,");
    echoLine("            this.val,");
    echoLine("            this.startLine,");
    echoLine("            this.startColumn,");
    echoLine("            this.endLine,");
    echoLine("            this.endColumn");
    echoLine("        );");
    echoLine("    }");
    echoLine("    toString(){");
    echo("        return (");
    echo(prefix);
    echoLine("tokenAlias[this.id] === null ? ");
    echo("            `<${");
    echo(prefix);
    echoLine("tokenNames[this.id]}>` :");
    echo("            `\"${");
    echo(prefix);
    echoLine("tokenAlias[this.id]}\"`) + `(\"${this.val}\")`;");
    echoLine("    }");
    echoLine("}");
    echo("interface ");
    echo(className);
    echoLine("{");
    echo("    init(");
    echo(input.file.initArg);
    echoLine(");");
    echoLine("    accept(s: string);");
    echoLine("    end();");
    echoLine("    halt();");
    echoLine("    on(ent: string, cb: (a1?, a2?, a3?) => any);");
    echo("}");
    var stype = input.file.sematicType || 'any';
    echoLine("");
    echo("function createParser(): ");
    echo(className);
    echoLine(" {");
    echoLine("    // members for lexer");
    echoLine("    var _lexState: number[];");
    echoLine("    var _state: number;");
    echoLine("    var _matched: string;");
    echoLine("    var _token: Token;");
    echoLine("    ");
    echoLine("    var _marker: { state: number, line: number, column: number } = { state: -1, line: 0, column: 0 };");
    echoLine("    var _backupCount: number;");
    echoLine("");
    echoLine("    var _line: number;");
    echoLine("    var _column: number;");
    echoLine("    var _tline: number;");
    echoLine("    var _tcolumn: number;");
    echoLine("");
    echoLine("    // members for parser");
    echoLine("    var _lrState: number[] = [];");
    echo("    var _sematicS: ");
    echo(stype);
    echoLine("[] = [];");
    echo("    var _sematicVal: ");
    echo(stype);
    echoLine(";");
    echoLine("");
    echoLine("    var _stop;");
    echoLine("");
    echoLine("    var _handlers: {[s: string]: ((a1?, a2?, a3?) => any)[]} = {};");
    echoLine("");
    echoLine("    // extra members, defined by %extra_arg");
    echo("    ");
    echo(input.file.extraArgs);
    echoLine("");
    echoLine("");
    echoLine("    ");
    echo("    function init(");
    echo(input.file.initArg);
    echoLine("){");
    echoLine("        _lexState = [ 0 ];// DEFAULT");
    echoLine("        _state = 0;");
    echoLine("        _matched = '';");
    echoLine("        _token = new Token(-1, null, 0, 0, 0, 0);");
    echoLine("        _marker.state = -1;");
    echoLine("        _backupCount = 0;");
    echoLine("        _line = _tline = 1;");
    echoLine("        _column = _tcolumn = 1;");
    echoLine("        ");
    echoLine("        _lrState = [ 0 ];");
    echoLine("        _sematicS = [];");
    echoLine("        _sematicVal = null;");
    echoLine("");
    echoLine("        _stop = false;");
    echo("        ");
    echo(input.file.initBody);
    echoLine("");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  set ");
    echoLine("     */");
    echoLine("    function _setImg(s: string){");
    echoLine("        _matched = s;");
    echoLine("        _tline = _line;");
    echoLine("        _tcolumn = _column;");
    echoLine("    }");
    echoLine("    function _prepareToken(tid: number){");
    echoLine("        _token.id = tid;");
    echoLine("        _token.val = _matched;");
    echoLine("        _token.startLine = _tline;");
    echoLine("        _token.startColumn = _tcolumn;");
    echoLine("        _token.endLine = _line;");
    echoLine("        _token.endColumn = _column;");
    echoLine("");
    echoLine("        _matched = '';");
    echoLine("        _tline = _line;");
    echoLine("        _tcolumn = _column;");
    echoLine("    }");
    echoLine("    function _returnToken(){");
    echo("        _emit('token', ");
    echo(prefix);
    echoLine("tokenNames[_token.id], _token.val);");
    echoLine("        while(!_stop && !_acceptToken(_token));");
    echoLine("        _token.id = -1;");
    echoLine("    }");
    echoLine("    function _emit(name: string, a1?, a2?, a3?){");
    echoLine("        var cbs = _handlers[name];");
    echoLine("        if(cbs){");
    echoLine("            for(var i = 0; i < cbs.length; i++){");
    echoLine("                cbs[i](a1, a2, a3);");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    function on(name: string, cb: (a1?, a2?, a3?) => any){");
    echoLine("        _handlers[name] || (_handlers[name] = []);");
    echoLine("        _handlers[name].push(cb);");
    echo("    }");
    for (var i = 0, _a = dfas; i < _a.length; i++) {
        printLexActionsFunc(_a[i], i);
    }
    echoLine("");
    echoLine("    /**");
    echoLine("     *  do a lexical action");
    echoLine("     *  @api private");
    echoLine("     *  @internal");
    echoLine("     */");
    echoLine("    function _doLexAction(lexstate: number, state: number){");
    echo("        switch(lexstate){");
    for (var i = 0; i < dfas.length; i++) {
        echoLine("");
        echo("            case ");
        echo(i);
        echoLine(":");
        echo("                _doLexAction");
        echo(i);
        echoLine("(state);");
        echo("                break;");
    }
    echoLine("");
    echoLine("            default:;");
    echoLine("        }");
    echoLine("        _token.id !== -1 && _returnToken();");
    echoLine("    }");
    echoLine("    function _rollback(): string{");
    echoLine("        let ret = _matched.substr(_matched.length - _backupCount, _backupCount);");
    echoLine("        _matched = _matched.substr(0, _matched.length - _backupCount);");
    echoLine("        _backupCount = 0;");
    echoLine("        _line = _marker.line;");
    echoLine("        _column = _marker.column;");
    echoLine("        _state = _marker.state;");
    echoLine("        _marker.state = -1;");
    echoLine("        return ret;");
    echoLine("    }");
    echoLine("    function _mark(){");
    echoLine("        _marker.state = _state;");
    echoLine("        _marker.line = _line;");
    echoLine("        _marker.column = _column;");
    echoLine("        _backupCount = 0;");
    echoLine("    }");
    echoLine("    function _consume(c: string){");
    echoLine("        c === '\\n' ? (_line++, _column = 0) : (_column++);");
    echoLine("        _matched += c;");
    echoLine("        _marker.state !== -1 && (_backupCount++);");
    echoLine("        return true;");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  accept a character");
    echoLine("     *  @return - true if the character is consumed, false if not consumed");
    echoLine("     *  @api private");
    echoLine("     *  @internal");
    echoLine("     */");
    echoLine("    function _acceptChar(c: string){");
    echoLine("        var lexstate = _lexState[_lexState.length - 1];");
    echoLine("        var retn = { state: _state, hasArc: false, isEnd: false };");
    echo("        ");
    echo(prefix);
    echoLine("lexers[lexstate](c.charCodeAt(0), retn);");
    echoLine("        if(retn.isEnd){");
    echoLine("            // if current state is a terminate state, be careful");
    echoLine("            if(retn.hasArc){");
    echoLine("                if(retn.state === -1){");
    echoLine("                    // nowhere to go, stay where we are");
    echoLine("                    _doLexAction(lexstate, _state);");
    echoLine("                    // recover");
    echoLine("                    _marker.state = -1;");
    echoLine("                    _backupCount = 0;");
    echoLine("                    _state = 0;                    ");
    echoLine("                    // character not consumed");
    echoLine("                    return false;");
    echoLine("                }");
    echoLine("                else {");
    echoLine("                    // now we can either go to that new state, or stay where we are");
    echoLine("                    // it is prefered to move forward, but that could lead to errors,");
    echoLine("                    // so we need to memorize this state before move on, in case if ");
    echoLine("                    // an error occurs later, we could just return to this state.");
    echoLine("                    _mark();");
    echoLine("                    _state = retn.state;");
    echoLine("                    return _consume(c);");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                // current state doesn't lead to any state, just stay here.");
    echoLine("                _doLexAction(lexstate, _state);");
    echoLine("                // recover");
    echoLine("                _marker.state = -1;");
    echoLine("                _backupCount = 0;");
    echoLine("                _state = 0;");
    echoLine("                // character not consumed");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            if(retn.state === -1){");
    echoLine("                // nowhere to go at current state, error may have occured.");
    echoLine("                // check marker to verify that");
    echoLine("                if(_marker.state !== -1){");
    echoLine("                    // we have a previously marked state, which is a terminate state.");
    echoLine("                    var s = _rollback();");
    echoLine("                    _doLexAction(lexstate, _state);");
    echoLine("                    _state = 0;");
    echoLine("                    accept(s);");
    echoLine("                    // character not consumed");
    echoLine("                    return false;");
    echoLine("                }");
    echoLine("                else {");
    echoLine("                    // error occurs");
    echoLine("                    _emit('lexicalerror', `unexpected character \"${c}\"`, _line, _column);");
    echoLine("                    // force consume");
    echoLine("                    return true;");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                _state = retn.state;");
    echoLine("                // character consumed");
    echoLine("                return _consume(c);");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    function _acceptEOF(){");
    echoLine("        if(_state === 0){");
    echoLine("            // recover");
    echoLine("            _prepareToken(0);");
    echoLine("            _returnToken();");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            let lexstate = _lexState[_lexState.length - 1];");
    echoLine("            let retn = { state: _state, hasArc: false, isEnd: false };");
    echo("            ");
    echo(prefix);
    echoLine("lexers[lexstate](-1, retn);");
    echoLine("            if(retn.isEnd){");
    echoLine("                _doLexAction(lexstate, _state);");
    echoLine("                _state = 0;");
    echoLine("                _marker.state = -1;");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("            else if(_marker.state !== -1){");
    echoLine("                let s = _rollback();");
    echoLine("                _doLexAction(lexstate, _state);");
    echoLine("                _state = 0;");
    echoLine("                accept(s);");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                _emit('lexicalerror', 'unexpected end of file');");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  input a string");
    echoLine("     *  @api public");
    echoLine("     */");
    echoLine("    function accept(s: string){");
    echoLine("        for(let i = 0; i < s.length && !_stop;){");
    echoLine("            _acceptChar(s.charAt(i)) && i++;");
    echoLine("        }");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  tell the compiler that end of file is reached");
    echoLine("     *  @api public");
    echoLine("     */");
    echoLine("    function end(){");
    echoLine("        while(!_stop && !_acceptEOF());");
    echoLine("        _stop = true;");
    echoLine("    }");
    echoLine("    function halt(){");
    echoLine("        _stop = true;");
    echo("    }");
    function printReduceActions() {
        var codegen = {
            addBlock: function (b, line) {
                echoLine("");
                echo("                {");
                echo(b.replace(/\$\$/g, prefix + 'top'));
                echo("}");
            },
            pushLexState: function (n) {
                echoLine("");
                echo("                _lexState.push(");
                echo(n);
                echo(");");
            },
            popLexState: function () {
                echoLine("");
                echo("                _lexState.pop();");
            },
            setImg: function (n) {
                echoLine("");
                echo("                _setImg(\"");
                echo(n);
                echo("\");");
            },
            returnToken: function (t) {
                echoLine("");
                echoLine("                _token = {");
                echo("                    id: ");
                echo(t.index);
                echoLine(",");
                echoLine("                    val: _matched.join('')");
                echo("                };");
            }
        };
        for (var _i = 0, _b = input.file.grammar.rules; _i < _b.length; _i++) {
            var rule = _b[_i];
            if (rule.action !== null) {
                echoLine("");
                echo("            case ");
                echo(rule.index);
                echoLine(":");
                echo("                /* ");
                echo(rule.toString());
                echo(" */");
                for (var uvar in rule.vars) {
                    echoLine("");
                    echo("                var ");
                    echo(uvar);
                    echo(" = _sematicS[");
                    echo(prefix);
                    echo("sp - ");
                    echo(rule.rhs.length - rule.vars[uvar].val);
                    echo("];");
                }
                for (var uvar2 in rule.usedVars) {
                    echoLine("");
                    echo("                var ");
                    echo(uvar2);
                    echo(" = _sematicS[");
                    echo(prefix);
                    echo("sp - ");
                    echo(rule.usedVars[uvar2].val);
                    echo("];");
                }
                for (var _c = 0, _d = rule.action; _c < _d.length; _c++) {
                    var act = _d[_c];
                    act.toCode(codegen);
                }
                echoLine("");
                echo("                break;");
            }
        }
    }
    echoLine("");
    echo("    function _doReduction(");
    echo(prefix);
    echoLine("rulenum: number){");
    echo("        let ");
    echo(prefix);
    echo("nt = ");
    echo(prefix);
    echo("lhs[");
    echo(prefix);
    echoLine("rulenum];");
    echo("        let ");
    echo(prefix);
    echoLine("sp = _sematicS.length;");
    echo("        let ");
    echo(prefix);
    echo("top = _sematicS[");
    echo(prefix);
    echo("sp - ");
    echo(prefix);
    echo("ruleLen[");
    echo(prefix);
    echoLine("rulenum]] || null;");
    echo("        switch(");
    echo(prefix);
    echo("rulenum){");
    printReduceActions();
    echoLine("");
    echoLine("        }");
    echo("        _lrState.length -= ");
    echo(prefix);
    echo("ruleLen[");
    echo(prefix);
    echoLine("rulenum];");
    echo("        let ");
    echo(prefix);
    echoLine("cstate = _lrState[_lrState.length - 1];");
    echo("        _lrState.push(");
    echo(prefix);
    echo("pgoto[");
    echo(prefix);
    echo("disgoto[");
    echo(prefix);
    echo("cstate] + ");
    echo(prefix);
    echoLine("nt]);");
    echoLine("");
    echo("        _sematicS.length -= ");
    echo(prefix);
    echo("ruleLen[");
    echo(prefix);
    echoLine("rulenum];");
    echo("        _sematicS.push(");
    echo(prefix);
    echoLine("top);");
    echoLine("    }");
    echoLine("");
    echoLine("    function _acceptToken(t: Token){");
    echoLine("        // look up action table");
    echoLine("        let cstate = _lrState[_lrState.length - 1];");
    echo("        let ind = ");
    echo(prefix);
    echoLine("disact[cstate] + t.id;");
    echoLine("        let act = 0;");
    echo("        if(ind < 0 || ind >= ");
    echo(prefix);
    echo("pact.length || ");
    echo(prefix);
    echoLine("checkact[ind] !== cstate){");
    echo("            act = -");
    echo(prefix);
    echoLine("defred[cstate] - 1;");
    echoLine("        }");
    echoLine("        else {");
    echo("            act = ");
    echo(prefix);
    echoLine("pact[ind];");
    echoLine("        }");
    echo("        if(act === ");
    echo(prefix);
    echoLine("actERR){");
    echoLine("            // explicit error");
    echoLine("            _syntaxError(t);");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("        else if(act > 0){");
    echoLine("            // shift");
    echoLine("            if(t.id === 0){");
    echoLine("                // end of file");
    echoLine("                _stop = true;");
    echoLine("                _emit('accept');");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                _lrState.push(act - 1);");
    echoLine("                _sematicS.push(_sematicVal);");
    echoLine("                _sematicVal = null;");
    echoLine("                // token consumed");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echoLine("        else if(act < 0){");
    echoLine("            _doReduction(-act - 1);");
    echoLine("            return false;");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            // error");
    echoLine("            _syntaxError(t);");
    echoLine("            // force consume");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("    }");
    echoLine("    function _syntaxError(t: Token){");
    echoLine("        let msg = `unexpected token ${t.toString()}, expecting one of the following token(s):\\n`");
    echoLine("        msg += _expected(_lrState[_lrState.length - 1]);");
    echoLine("        _emit(\"syntaxerror\", msg, t);");
    echoLine("    }");
    echoLine("    function _expected(state: number){");
    echo("        let dis = ");
    echo(prefix);
    echoLine("disact[state];");
    echoLine("        let ret = '';");
    echoLine("        function expect(tk: number){");
    echoLine("            let ind = dis + tk;");
    echo("            if(ind < 0 || ind >= ");
    echo(prefix);
    echo("pact.length || state !== ");
    echo(prefix);
    echoLine("checkact[ind]){");
    echo("                return ");
    echo(prefix);
    echoLine("defred[state] !== -1;");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echo("        for(let tk = 0; tk < ");
    echo(prefix);
    echoLine("tokenCount; tk++){");
    echoLine("            expect(tk) && (ret += `    ${tokenToString(tk)} ...` + '\\n');");
    echoLine("        }");
    echoLine("        return ret;");
    echoLine("    }");
    echoLine("    return {");
    echoLine("        init,");
    echoLine("        on,");
    echoLine("        accept,");
    echoLine("        end,");
    echoLine("        halt");
    echoLine("    };");
    echoLine("}");
    echo(input.file.epilogue.val);
};

var templates = {};
function defineTemplate(name, render) {
    templates[name] = render;
}
function generateCode(lang, input, fc, cb) {
    var g = templates[lang];
    if (g === undefined) {
        throw ("template for language \"" + lang + "\" is not implemented yet");
    }
    else {
        templates[lang](input, fc);
    }
}
function templateExists(t) {
    return templates[t] !== undefined;
}
defineTemplate('typescript', function (input, fc) {
    tsRenderer(input, fc);
    fc.save('.ts');
});

var Result = (function () {
    function Result() {
        this.errors = [];
        this.warnings = [];
        this.terminated = false;
    }
    Result.prototype.warn = function (w) {
        this.warnings.push(w);
    };
    Result.prototype.err = function (e) {
        this.errors.push(e);
    };
    Result.prototype.printItemSets = function (stream) {
        stream.writeln(this.itemSets.size + ' state(s) in total,finished in ' + this.iterationCount + ' iteration(s).');
        this.itemSets.forEach(function (s) {
            stream.writeln(s.toString({ showTrailer: true }));
        });
    };
    Result.prototype.printTable = function (os) {
        printParseTable(os, this.parseTable, this.itemSets);
    };
    Result.prototype.printDFA = function (os) {
        for (var _i = 0, _a = this.file.lexDFA; _i < _a.length; _i++) {
            var s = _a[_i];
            s.print(os);
            os.writeln();
            os.writeln();
        }
    };
    Result.prototype.testParse = function (tokens) {
        return testParse(this.file.grammar, this.parseTable, tokens);
    };
    Result.prototype.printError = function (os, opt) {
        for (var _i = 0, _a = this.errors; _i < _a.length; _i++) {
            var e = _a[_i];
            os.writeln(e.toString(opt));
        }
        os.writeln();
    };
    Result.prototype.printWarning = function (os, opt) {
        for (var _i = 0, _a = this.warnings; _i < _a.length; _i++) {
            var w = _a[_i];
            os.writeln(w.toString(opt));
        }
        os.writeln();
    };
    Result.prototype.hasWarning = function () {
        return this.warnings.length > 0;
    };
    Result.prototype.hasError = function () {
        return this.errors.length > 0;
    };
    Result.prototype.warningSummary = function () {
        return this.warnings.length + " warning(s), " + this.errors.length + " error(s)";
    };
    Result.prototype.getTemplateInput = function () {
        return {
            endl: '\n',
            pt: this.parseTable,
            file: this.file
        };
    };
    return Result;
}());
function genResult(source) {
    var result = new Result();
    var f = parse(result, source);
    if (result.hasError()) {
        result.terminated = true;
        return result;
    }
    var g = f.grammar;
    result.file = f;
    f.opt.output = f.opt.output || 'typescript';
    for (var _i = 0, _a = g.tokens; _i < _a.length; _i++) {
        var s = _a[_i];
        if (!s.used) {
            result.warn(new JsccWarning("token <" + s.sym + "> is never used (defined at line " + s.line + ")"));
        }
    }
    for (var _b = 0, _c = g.nts; _b < _c.length; _b++) {
        var s2 = _c[_b];
        if (!s2.used) {
            result.warn(new JsccWarning("non terminal \"" + s2.sym + "\" is unreachable"));
        }
    }
    if (!templateExists(f.opt.output)) {
        result.err(new JsccError("template for '" + f.opt.output + "' is not implemented yet"));
    }
    if (result.hasError()) {
        result.terminated = true;
        return result;
    }
    g.genFirstSets();
    var temp = genItemSets(g);
    result.itemSets = temp.result;
    result.iterationCount = temp.iterations;
    var temp2 = genParseTable(g, result.itemSets);
    temp2.result.findDefAct();
    result.parseTable = new CompressedPTable(temp2.result);
    for (var _d = 0, _e = temp2.conflicts; _d < _e.length; _d++) {
        var cf = _e[_d];
        result.warn(new JsccWarning(cf.toString()));
    }
    return result;
}



var debug = Object.freeze({
	compress: compress,
	IntervalSet: IntervalSet
});

exports.Pattern = pattern;
exports.io = io;
exports.debug = debug;
exports.setDebugger = setDebugger;
exports.setTab = setTab;
exports.genResult = genResult;
exports.generateCode = generateCode;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=jscc.js.map
