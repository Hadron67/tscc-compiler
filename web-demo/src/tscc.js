(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.tscc = {})));
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
    function Rule(g, lhs, pos) {
        this.g = g;
        this.lhs = lhs;
        this.pos = pos;
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
        this.header = [];
        this.output = null;
        this.extraArgs = null;
        this.initArg = null;
        this.initBody = null;
        this.epilogue = null;
        this.sematicType = null;
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

function newNode(val) {
    return {
        val: val,
        startLine: -1,
        startColumn: 0,
        endLine: 0,
        endColumn: 0
    };
}
function nodeBetween(from, to, val) {
    return {
        val: val,
        startLine: from.startLine,
        startColumn: from.startColumn,
        endLine: to.endLine,
        endColumn: to.endColumn
    };
}

function markPosition(pos, lines, marker) {
    if (marker === void 0) { marker = '^'; }
    function repeat(s, t) {
        var ret = '';
        while (t-- > 0) {
            ret += s;
        }
        return ret;
    }
    function width(s) {
        var ret = 0;
        for (var i = 0; i < s.length; i++) {
            ret += s.charCodeAt(i) > 0xff ? 2 : 1;
        }
        return ret;
    }
    if (pos.startLine !== -1) {
        var ret = "(line " + (pos.startLine + 1) + ", column " + (pos.startColumn + 1) + "):" + endl;
        var line = pos.startLine, col = pos.startColumn;
        ret += lines[line] + endl;
        ret += repeat(' ', col);
        var length_1 = width(lines[line]);
        while (line <= pos.endLine && col <= pos.endColumn) {
            ret += marker;
            if (col++ >= length_1) {
                col = 0;
                line++;
                ret += endl + lines[line] + endl;
                length_1 = width(lines[line]);
            }
        }
        return ret;
    }
    else {
        return '<internal position>';
    }
}

var unicodeES5IdentifierStart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 880, 884, 886, 887, 890, 893, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1162, 1319, 1329, 1366, 1369, 1369, 1377, 1415, 1488, 1514, 1520, 1522, 1568, 1610, 1646, 1647, 1649, 1747, 1749, 1749, 1765, 1766, 1774, 1775, 1786, 1788, 1791, 1791, 1808, 1808, 1810, 1839, 1869, 1957, 1969, 1969, 1994, 2026, 2036, 2037, 2042, 2042, 2048, 2069, 2074, 2074, 2084, 2084, 2088, 2088, 2112, 2136, 2208, 2208, 2210, 2220, 2308, 2361, 2365, 2365, 2384, 2384, 2392, 2401, 2417, 2423, 2425, 2431, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2493, 2493, 2510, 2510, 2524, 2525, 2527, 2529, 2544, 2545, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2649, 2652, 2654, 2654, 2674, 2676, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2749, 2749, 2768, 2768, 2784, 2785, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2877, 2877, 2908, 2909, 2911, 2913, 2929, 2929, 2947, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3024, 3024, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3133, 3133, 3160, 3161, 3168, 3169, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3261, 3261, 3294, 3294, 3296, 3297, 3313, 3314, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3389, 3406, 3406, 3424, 3425, 3450, 3455, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3585, 3632, 3634, 3635, 3648, 3654, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3760, 3762, 3763, 3773, 3773, 3776, 3780, 3782, 3782, 3804, 3807, 3840, 3840, 3904, 3911, 3913, 3948, 3976, 3980, 4096, 4138, 4159, 4159, 4176, 4181, 4186, 4189, 4193, 4193, 4197, 4198, 4206, 4208, 4213, 4225, 4238, 4238, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5888, 5900, 5902, 5905, 5920, 5937, 5952, 5969, 5984, 5996, 5998, 6000, 6016, 6067, 6103, 6103, 6108, 6108, 6176, 6263, 6272, 6312, 6314, 6314, 6320, 6389, 6400, 6428, 6480, 6509, 6512, 6516, 6528, 6571, 6593, 6599, 6656, 6678, 6688, 6740, 6823, 6823, 6917, 6963, 6981, 6987, 7043, 7072, 7086, 7087, 7098, 7141, 7168, 7203, 7245, 7247, 7258, 7293, 7401, 7404, 7406, 7409, 7413, 7414, 7424, 7615, 7680, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8305, 8305, 8319, 8319, 8336, 8348, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11502, 11506, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11648, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11823, 11823, 12293, 12295, 12321, 12329, 12337, 12341, 12344, 12348, 12353, 12438, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42527, 42538, 42539, 42560, 42606, 42623, 42647, 42656, 42735, 42775, 42783, 42786, 42888, 42891, 42894, 42896, 42899, 42912, 42922, 43000, 43009, 43011, 43013, 43015, 43018, 43020, 43042, 43072, 43123, 43138, 43187, 43250, 43255, 43259, 43259, 43274, 43301, 43312, 43334, 43360, 43388, 43396, 43442, 43471, 43471, 43520, 43560, 43584, 43586, 43588, 43595, 43616, 43638, 43642, 43642, 43648, 43695, 43697, 43697, 43701, 43702, 43705, 43709, 43712, 43712, 43714, 43714, 43739, 43741, 43744, 43754, 43762, 43764, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43968, 44002, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64285, 64287, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65136, 65140, 65142, 65276, 65313, 65338, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500,];
var unicodeES5IdentifierPart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 705, 710, 721, 736, 740, 748, 748, 750, 750, 768, 884, 886, 887, 890, 893, 902, 902, 904, 906, 908, 908, 910, 929, 931, 1013, 1015, 1153, 1155, 1159, 1162, 1319, 1329, 1366, 1369, 1369, 1377, 1415, 1425, 1469, 1471, 1471, 1473, 1474, 1476, 1477, 1479, 1479, 1488, 1514, 1520, 1522, 1552, 1562, 1568, 1641, 1646, 1747, 1749, 1756, 1759, 1768, 1770, 1788, 1791, 1791, 1808, 1866, 1869, 1969, 1984, 2037, 2042, 2042, 2048, 2093, 2112, 2139, 2208, 2208, 2210, 2220, 2276, 2302, 2304, 2403, 2406, 2415, 2417, 2423, 2425, 2431, 2433, 2435, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2492, 2500, 2503, 2504, 2507, 2510, 2519, 2519, 2524, 2525, 2527, 2531, 2534, 2545, 2561, 2563, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2620, 2620, 2622, 2626, 2631, 2632, 2635, 2637, 2641, 2641, 2649, 2652, 2654, 2654, 2662, 2677, 2689, 2691, 2693, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2748, 2757, 2759, 2761, 2763, 2765, 2768, 2768, 2784, 2787, 2790, 2799, 2817, 2819, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2869, 2873, 2876, 2884, 2887, 2888, 2891, 2893, 2902, 2903, 2908, 2909, 2911, 2915, 2918, 2927, 2929, 2929, 2946, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 3001, 3006, 3010, 3014, 3016, 3018, 3021, 3024, 3024, 3031, 3031, 3046, 3055, 3073, 3075, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3133, 3140, 3142, 3144, 3146, 3149, 3157, 3158, 3160, 3161, 3168, 3171, 3174, 3183, 3202, 3203, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3260, 3268, 3270, 3272, 3274, 3277, 3285, 3286, 3294, 3294, 3296, 3299, 3302, 3311, 3313, 3314, 3330, 3331, 3333, 3340, 3342, 3344, 3346, 3386, 3389, 3396, 3398, 3400, 3402, 3406, 3415, 3415, 3424, 3427, 3430, 3439, 3450, 3455, 3458, 3459, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3530, 3530, 3535, 3540, 3542, 3542, 3544, 3551, 3570, 3571, 3585, 3642, 3648, 3662, 3664, 3673, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3769, 3771, 3773, 3776, 3780, 3782, 3782, 3784, 3789, 3792, 3801, 3804, 3807, 3840, 3840, 3864, 3865, 3872, 3881, 3893, 3893, 3895, 3895, 3897, 3897, 3902, 3911, 3913, 3948, 3953, 3972, 3974, 3991, 3993, 4028, 4038, 4038, 4096, 4169, 4176, 4253, 4256, 4293, 4295, 4295, 4301, 4301, 4304, 4346, 4348, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4744, 4746, 4749, 4752, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4822, 4824, 4880, 4882, 4885, 4888, 4954, 4957, 4959, 4992, 5007, 5024, 5108, 5121, 5740, 5743, 5759, 5761, 5786, 5792, 5866, 5870, 5872, 5888, 5900, 5902, 5908, 5920, 5940, 5952, 5971, 5984, 5996, 5998, 6000, 6002, 6003, 6016, 6099, 6103, 6103, 6108, 6109, 6112, 6121, 6155, 6157, 6160, 6169, 6176, 6263, 6272, 6314, 6320, 6389, 6400, 6428, 6432, 6443, 6448, 6459, 6470, 6509, 6512, 6516, 6528, 6571, 6576, 6601, 6608, 6617, 6656, 6683, 6688, 6750, 6752, 6780, 6783, 6793, 6800, 6809, 6823, 6823, 6912, 6987, 6992, 7001, 7019, 7027, 7040, 7155, 7168, 7223, 7232, 7241, 7245, 7293, 7376, 7378, 7380, 7414, 7424, 7654, 7676, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8204, 8205, 8255, 8256, 8276, 8276, 8305, 8305, 8319, 8319, 8336, 8348, 8400, 8412, 8417, 8417, 8421, 8432, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8505, 8508, 8511, 8517, 8521, 8526, 8526, 8544, 8584, 11264, 11310, 11312, 11358, 11360, 11492, 11499, 11507, 11520, 11557, 11559, 11559, 11565, 11565, 11568, 11623, 11631, 11631, 11647, 11670, 11680, 11686, 11688, 11694, 11696, 11702, 11704, 11710, 11712, 11718, 11720, 11726, 11728, 11734, 11736, 11742, 11744, 11775, 11823, 11823, 12293, 12295, 12321, 12335, 12337, 12341, 12344, 12348, 12353, 12438, 12441, 12442, 12445, 12447, 12449, 12538, 12540, 12543, 12549, 12589, 12593, 12686, 12704, 12730, 12784, 12799, 13312, 19893, 19968, 40908, 40960, 42124, 42192, 42237, 42240, 42508, 42512, 42539, 42560, 42607, 42612, 42621, 42623, 42647, 42655, 42737, 42775, 42783, 42786, 42888, 42891, 42894, 42896, 42899, 42912, 42922, 43000, 43047, 43072, 43123, 43136, 43204, 43216, 43225, 43232, 43255, 43259, 43259, 43264, 43309, 43312, 43347, 43360, 43388, 43392, 43456, 43471, 43481, 43520, 43574, 43584, 43597, 43600, 43609, 43616, 43638, 43642, 43643, 43648, 43714, 43739, 43741, 43744, 43759, 43762, 43766, 43777, 43782, 43785, 43790, 43793, 43798, 43808, 43814, 43816, 43822, 43968, 44010, 44012, 44013, 44016, 44025, 44032, 55203, 55216, 55238, 55243, 55291, 63744, 64109, 64112, 64217, 64256, 64262, 64275, 64279, 64285, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65024, 65039, 65056, 65062, 65075, 65076, 65101, 65103, 65136, 65140, 65142, 65276, 65296, 65305, 65313, 65338, 65343, 65343, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500,];
var unicodeES3IdentifierStart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 543, 546, 563, 592, 685, 688, 696, 699, 705, 720, 721, 736, 740, 750, 750, 890, 890, 902, 902, 904, 906, 908, 908, 910, 929, 931, 974, 976, 983, 986, 1011, 1024, 1153, 1164, 1220, 1223, 1224, 1227, 1228, 1232, 1269, 1272, 1273, 1329, 1366, 1369, 1369, 1377, 1415, 1488, 1514, 1520, 1522, 1569, 1594, 1600, 1610, 1649, 1747, 1749, 1749, 1765, 1766, 1786, 1788, 1808, 1808, 1810, 1836, 1920, 1957, 2309, 2361, 2365, 2365, 2384, 2384, 2392, 2401, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2524, 2525, 2527, 2529, 2544, 2545, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2649, 2652, 2654, 2654, 2674, 2676, 2693, 2699, 2701, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2749, 2749, 2768, 2768, 2784, 2784, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2870, 2873, 2877, 2877, 2908, 2909, 2911, 2913, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 2997, 2999, 3001, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3168, 3169, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3294, 3294, 3296, 3297, 3333, 3340, 3342, 3344, 3346, 3368, 3370, 3385, 3424, 3425, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3585, 3632, 3634, 3635, 3648, 3654, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3760, 3762, 3763, 3773, 3773, 3776, 3780, 3782, 3782, 3804, 3805, 3840, 3840, 3904, 3911, 3913, 3946, 3976, 3979, 4096, 4129, 4131, 4135, 4137, 4138, 4176, 4181, 4256, 4293, 4304, 4342, 4352, 4441, 4447, 4514, 4520, 4601, 4608, 4614, 4616, 4678, 4680, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4742, 4744, 4744, 4746, 4749, 4752, 4782, 4784, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4814, 4816, 4822, 4824, 4846, 4848, 4878, 4880, 4880, 4882, 4885, 4888, 4894, 4896, 4934, 4936, 4954, 5024, 5108, 5121, 5740, 5743, 5750, 5761, 5786, 5792, 5866, 6016, 6067, 6176, 6263, 6272, 6312, 7680, 7835, 7840, 7929, 7936, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8319, 8319, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8497, 8499, 8505, 8544, 8579, 12293, 12295, 12321, 12329, 12337, 12341, 12344, 12346, 12353, 12436, 12445, 12446, 12449, 12538, 12540, 12542, 12549, 12588, 12593, 12686, 12704, 12727, 13312, 19893, 19968, 40869, 40960, 42124, 44032, 55203, 63744, 64045, 64256, 64262, 64275, 64279, 64285, 64285, 64287, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65136, 65138, 65140, 65140, 65142, 65276, 65313, 65338, 65345, 65370, 65382, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500,];
var unicodeES3IdentifierPart = [170, 170, 181, 181, 186, 186, 192, 214, 216, 246, 248, 543, 546, 563, 592, 685, 688, 696, 699, 705, 720, 721, 736, 740, 750, 750, 768, 846, 864, 866, 890, 890, 902, 902, 904, 906, 908, 908, 910, 929, 931, 974, 976, 983, 986, 1011, 1024, 1153, 1155, 1158, 1164, 1220, 1223, 1224, 1227, 1228, 1232, 1269, 1272, 1273, 1329, 1366, 1369, 1369, 1377, 1415, 1425, 1441, 1443, 1465, 1467, 1469, 1471, 1471, 1473, 1474, 1476, 1476, 1488, 1514, 1520, 1522, 1569, 1594, 1600, 1621, 1632, 1641, 1648, 1747, 1749, 1756, 1759, 1768, 1770, 1773, 1776, 1788, 1808, 1836, 1840, 1866, 1920, 1968, 2305, 2307, 2309, 2361, 2364, 2381, 2384, 2388, 2392, 2403, 2406, 2415, 2433, 2435, 2437, 2444, 2447, 2448, 2451, 2472, 2474, 2480, 2482, 2482, 2486, 2489, 2492, 2492, 2494, 2500, 2503, 2504, 2507, 2509, 2519, 2519, 2524, 2525, 2527, 2531, 2534, 2545, 2562, 2562, 2565, 2570, 2575, 2576, 2579, 2600, 2602, 2608, 2610, 2611, 2613, 2614, 2616, 2617, 2620, 2620, 2622, 2626, 2631, 2632, 2635, 2637, 2649, 2652, 2654, 2654, 2662, 2676, 2689, 2691, 2693, 2699, 2701, 2701, 2703, 2705, 2707, 2728, 2730, 2736, 2738, 2739, 2741, 2745, 2748, 2757, 2759, 2761, 2763, 2765, 2768, 2768, 2784, 2784, 2790, 2799, 2817, 2819, 2821, 2828, 2831, 2832, 2835, 2856, 2858, 2864, 2866, 2867, 2870, 2873, 2876, 2883, 2887, 2888, 2891, 2893, 2902, 2903, 2908, 2909, 2911, 2913, 2918, 2927, 2946, 2947, 2949, 2954, 2958, 2960, 2962, 2965, 2969, 2970, 2972, 2972, 2974, 2975, 2979, 2980, 2984, 2986, 2990, 2997, 2999, 3001, 3006, 3010, 3014, 3016, 3018, 3021, 3031, 3031, 3047, 3055, 3073, 3075, 3077, 3084, 3086, 3088, 3090, 3112, 3114, 3123, 3125, 3129, 3134, 3140, 3142, 3144, 3146, 3149, 3157, 3158, 3168, 3169, 3174, 3183, 3202, 3203, 3205, 3212, 3214, 3216, 3218, 3240, 3242, 3251, 3253, 3257, 3262, 3268, 3270, 3272, 3274, 3277, 3285, 3286, 3294, 3294, 3296, 3297, 3302, 3311, 3330, 3331, 3333, 3340, 3342, 3344, 3346, 3368, 3370, 3385, 3390, 3395, 3398, 3400, 3402, 3405, 3415, 3415, 3424, 3425, 3430, 3439, 3458, 3459, 3461, 3478, 3482, 3505, 3507, 3515, 3517, 3517, 3520, 3526, 3530, 3530, 3535, 3540, 3542, 3542, 3544, 3551, 3570, 3571, 3585, 3642, 3648, 3662, 3664, 3673, 3713, 3714, 3716, 3716, 3719, 3720, 3722, 3722, 3725, 3725, 3732, 3735, 3737, 3743, 3745, 3747, 3749, 3749, 3751, 3751, 3754, 3755, 3757, 3769, 3771, 3773, 3776, 3780, 3782, 3782, 3784, 3789, 3792, 3801, 3804, 3805, 3840, 3840, 3864, 3865, 3872, 3881, 3893, 3893, 3895, 3895, 3897, 3897, 3902, 3911, 3913, 3946, 3953, 3972, 3974, 3979, 3984, 3991, 3993, 4028, 4038, 4038, 4096, 4129, 4131, 4135, 4137, 4138, 4140, 4146, 4150, 4153, 4160, 4169, 4176, 4185, 4256, 4293, 4304, 4342, 4352, 4441, 4447, 4514, 4520, 4601, 4608, 4614, 4616, 4678, 4680, 4680, 4682, 4685, 4688, 4694, 4696, 4696, 4698, 4701, 4704, 4742, 4744, 4744, 4746, 4749, 4752, 4782, 4784, 4784, 4786, 4789, 4792, 4798, 4800, 4800, 4802, 4805, 4808, 4814, 4816, 4822, 4824, 4846, 4848, 4878, 4880, 4880, 4882, 4885, 4888, 4894, 4896, 4934, 4936, 4954, 4969, 4977, 5024, 5108, 5121, 5740, 5743, 5750, 5761, 5786, 5792, 5866, 6016, 6099, 6112, 6121, 6160, 6169, 6176, 6263, 6272, 6313, 7680, 7835, 7840, 7929, 7936, 7957, 7960, 7965, 7968, 8005, 8008, 8013, 8016, 8023, 8025, 8025, 8027, 8027, 8029, 8029, 8031, 8061, 8064, 8116, 8118, 8124, 8126, 8126, 8130, 8132, 8134, 8140, 8144, 8147, 8150, 8155, 8160, 8172, 8178, 8180, 8182, 8188, 8255, 8256, 8319, 8319, 8400, 8412, 8417, 8417, 8450, 8450, 8455, 8455, 8458, 8467, 8469, 8469, 8473, 8477, 8484, 8484, 8486, 8486, 8488, 8488, 8490, 8493, 8495, 8497, 8499, 8505, 8544, 8579, 12293, 12295, 12321, 12335, 12337, 12341, 12344, 12346, 12353, 12436, 12441, 12442, 12445, 12446, 12449, 12542, 12549, 12588, 12593, 12686, 12704, 12727, 13312, 19893, 19968, 40869, 40960, 42124, 44032, 55203, 63744, 64045, 64256, 64262, 64275, 64279, 64285, 64296, 64298, 64310, 64312, 64316, 64318, 64318, 64320, 64321, 64323, 64324, 64326, 64433, 64467, 64829, 64848, 64911, 64914, 64967, 65008, 65019, 65056, 65059, 65075, 65076, 65101, 65103, 65136, 65138, 65140, 65140, 65142, 65276, 65296, 65305, 65313, 65338, 65343, 65343, 65345, 65370, 65381, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500,];
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
    var internalLexVars = {
        'es3UnicodeIDStart': function () { return loadSet(unicodeES3IdentifierStart); },
        'es3UnicodeIDPart': function () { return loadSet(unicodeES3IdentifierPart); },
        'es5UnicodeIDStart': function () { return loadSet(unicodeES5IdentifierStart); },
        'es5UnicodeIDPart': function () { return loadSet(unicodeES5IdentifierPart); }
    };
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
        addSetItemRaw: addSetItemRaw,
        endSet: endSet,
        build: build,
        importVar: importVar,
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
    function singlePosErr(msg, pos) {
        ctx.requireLines(function (ctx, lines) {
            ctx.err(new JsccError(msg + ' ' + markPosition(pos, lines), 'Compilation error'));
        });
    }
    function redefineErr(what, prev, current) {
        ctx.requireLines(function (ctx, lines) {
            var msg = what + ' ' + markPosition(current, lines) + endl;
            msg += 'previous defination was at ' + markPosition(prev, lines);
            ctx.err(new JsccError(msg));
        });
    }
    function prepareVar(vname) {
        var vdef = _regexpVars[vname.val];
        if (vdef !== undefined) {
            redefineErr("variable \"" + vname.val + "\" was already defined", vdef.pos, vname);
        }
        vdef = _regexpVars[vname.val] = {
            pos: vname,
            cmds: new CmdArray(vname.val)
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
    function addVar(vname) {
        _first = false;
        possibleAlias = null;
        _emit(function () {
            var vdef = _regexpVars[vname.val];
            if (vdef === undefined) {
                singlePosErr("use of undefined variable \"" + vname.val + "\"", vname);
                return;
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
                    singlePosErr(msg, vname);
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
    function addSetItem(from, to) {
        if (from.val.length !== 1) {
            singlePosErr("character expected in union, got \"" + from.val + "\"", from);
            return;
        }
        if (from !== to && to.val.length !== 1) {
            singlePosErr("character expected in union, got \"" + to.val + "\"", to);
            return;
        }
        if (from.val.charCodeAt(0) > to.val.charCodeAt(0)) {
            singlePosErr("left hand side must be larger than right hand side in wild card character (got '" + from.val + "' > '" + to.val + "')", to);
            return;
        }
        addSetItemRaw(from.val.charCodeAt(0), to.val.charCodeAt(0));
    }
    function addSetItemRaw(from, to) {
        _emit(function () {
            _isInverse ?
                _currentArc.chars.remove(from, to) :
                _currentArc.chars.add(from, to);
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
    function loadSet(arcs) {
        beginSet(false);
        for (var i = 0, _a = arcs; i < _a.length; i += 2) {
            addSetItemRaw(_a[i], _a[i + 1]);
        }
        endSet();
    }
    function importVar(vn) {
        var cb = internalLexVars[vn.val];
        if (cb === undefined) {
            singlePosErr("import variable \"" + vn.val + "\" does not exist", vn);
            return;
        }
        cb();
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
    var file = new File();
    var grammar = new Grammar();
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
    file.grammar = grammar;
    lexBuilder = createLexBuilder(ctx);
    _requiringNt = new CoroutineMgr(function (s) { return _ntTable[s]; });
    defToken(newNode('EOF'), null);
    return {
        defToken: defToken,
        getTokenID: getTokenID,
        getTokenByAlias: getTokenByAlias,
        getTokenByName: getTokenByName,
        defineTokenPrec: defineTokenPrec,
        setOpt: setOpt,
        setOutput: setOutput,
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
    function _splitAction() {
        var saved = _sematicVar;
        _sematicVar = null;
        var t = _top();
        var s = '@' + _genIndex++;
        prepareRule(newNode(s));
        var gen = _top();
        addAction(t.action);
        commitRule();
        t.action = null;
        addRuleItem(newNode(s), TokenRefType.NAME);
        _sematicVar = saved;
        for (var vname in t.vars) {
            var v = t.vars[vname];
            gen.usedVars[vname] = { val: v.val, pos: v.pos };
        }
        for (var vname in t.usedVars) {
            var v = t.usedVars[vname];
            gen.usedVars[vname] = { val: v.val, pos: v.pos };
        }
    }
    function singlePosErr(msg, pos) {
        ctx.requireLines(function (ctx, lines) {
            ctx.err(new JsccError(msg + ' ' + markPosition(pos, lines), 'Compilation error'));
        });
    }
    function redefineWarn(what, prev, current) {
        ctx.requireLines(function (ctx, lines) {
            var msg = what + ' ' + markPosition(current, lines) + endl;
            msg += 'previous defination was at ' + markPosition(prev, lines);
            ctx.warn(new JsccWarning(msg));
        });
    }
    function defToken(name, alias) {
        var tkdef = _tokenNameTable[name.val];
        if (tkdef !== undefined) {
            tkdef.appears.push(name);
            return tkdef;
        }
        else {
            tkdef = {
                index: grammar.tokens.length,
                sym: name.val,
                alias: alias,
                pr: 0,
                assoc: Assoc.UNDEFINED,
                used: false,
                appears: [name]
            };
            if (alias !== null) {
                _tokenAliasTable[alias] || (_tokenAliasTable[alias] = []);
                _tokenAliasTable[alias].push(tkdef);
            }
            _tokenNameTable[name.val] = tkdef;
            grammar.tokens.push(tkdef);
            return tkdef;
        }
    }
    function getTokenByAlias(a) {
        var aa = _tokenAliasTable[a.val];
        if (aa === undefined) {
            singlePosErr("cannot identify \"" + a.val + "\" as a token", a);
            return null;
        }
        else if (aa.length > 1) {
            var ret = '';
            for (var i = 0; i < aa.length; i++) {
                i > 0 && (ret += ',');
                ret += "<" + aa[i].sym + ">";
            }
            singlePosErr("cannot identify " + a.val + " as a token, since it could be " + ret, a);
            return null;
        }
        return aa[0];
    }
    function getTokenByName(t) {
        var ret = _tokenNameTable[t.val];
        if (ret === undefined) {
            singlePosErr("cannot identify <" + t.val + "> as a token", t);
            return null;
        }
        return ret;
    }
    function getTokenID(t) {
        var tk = getTokenByName(t);
        return tk === null ? '0' : String(tk.index);
    }
    function defineTokenPrec(tid, assoc, type) {
        if (type === TokenRefType.TOKEN) {
            var tk = getTokenByName(tid);
            if (tk !== null) {
                tk.assoc = assoc;
                tk.pr = _pr;
            }
        }
        else if (type === TokenRefType.STRING) {
            var tk = getTokenByAlias(tid);
            if (tk !== null) {
                tk.assoc = assoc;
                tk.pr = _pr;
            }
        }
        else if (type === TokenRefType.NAME) {
            var t2 = _pseudoTokens[tid.val] = _pseudoTokens[tid.val] || {
                assoc: assoc,
                pr: _pr,
                pos: tid
            };
        }
    }
    function setOpt(name, value) {
        file.opt[name.val] = { name: name, val: value };
    }
    function setOutput(n) {
        if (file.output !== null) {
            redefineWarn('redefine of output', file.output, n);
        }
        file.output = n;
    }
    function setHeader(h) {
        file.header.push(h);
    }
    function setExtraArg(a) {
        if (file.extraArgs !== null) {
            redefineWarn('redefine of extra arguments', file.extraArgs, a);
        }
        file.extraArgs = a;
    }
    function setType(t) {
        if (file.sematicType !== null) {
            redefineWarn('redefine of sematic type', file.sematicType, t);
        }
        file.sematicType = t;
    }
    function setInit(arg, body) {
        if (file.initArg !== null) {
            redefineWarn('redefine of initializing block', file.initArg, arg);
        }
        file.initArg = arg;
        file.initBody = body;
    }
    function incPr() {
        _pr++;
    }
    function setEpilogue(ep) {
        file.epilogue = ep;
    }
    function prepareRule(lhs) {
        if (_first) {
            _first = false;
            prepareRule(newNode('(accept)'));
            addRuleItem(newNode(lhs.val), TokenRefType.NAME);
            addRuleItem(newNode('EOF'), TokenRefType.TOKEN);
            commitRule();
        }
        var nt = _ntTable[lhs.val];
        if (nt === undefined) {
            nt = _ntTable[lhs.val] = {
                index: grammar.nts.length,
                sym: lhs.val,
                firstSet: null,
                used: false,
                rules: [],
                parents: []
            };
            grammar.nts.push(nt);
            _requiringNt.signal(lhs.val, nt);
        }
        var nr = new Rule(grammar, nt, lhs);
        _ruleStack.push(nr);
    }
    function addRuleUseVar(vname) {
        var t = _top();
        if (t.usedVars[vname.val] !== undefined) {
            singlePosErr("re-use of sematic variable \"" + vname.val + "\"", vname);
        }
        else {
            t.usedVars[vname.val] = { pos: vname, val: 0 };
        }
    }
    function addRuleSematicVar(vname) {
        var t = _top();
        if (t.usedVars[vname.val] !== undefined) {
            singlePosErr("variable \"" + vname.val + "\" conflicts with another imported variable", vname);
        }
        else if (t.vars[vname.val] !== undefined) {
            singlePosErr("sematic variable \"" + vname.val + "\" is already defined", vname);
        }
        else {
            _sematicVar = vname;
        }
    }
    function addRuleItem(id, type) {
        var t = _top();
        if (t.action !== null) {
            _splitAction();
        }
        if (_sematicVar !== null) {
            t.vars[_sematicVar.val] = { val: t.rhs.length, pos: _sematicVar };
            _sematicVar = null;
        }
        if (type === TokenRefType.NAME) {
            var pos_1 = t.rhs.length;
            t.rhs.push(0);
            _requiringNt.wait(id.val, function (su, nt) {
                if (su) {
                    t.rhs[pos_1] = -nt.index - 1;
                    nt.parents.push({
                        rule: t,
                        pos: pos_1
                    });
                    nt.used = true;
                }
                else {
                    singlePosErr("use of undefined non terminal " + id.val, id);
                }
            });
        }
        else if (type === TokenRefType.TOKEN) {
            var tl = _tokenNameTable[id.val];
            if (tl === undefined) {
                singlePosErr("cannot recognize <" + id.val + "> as a token", id);
                return;
            }
            t.rhs.push(tl.index);
            tl.used = true;
        }
        else if (type === TokenRefType.STRING) {
            var td = getTokenByAlias(id);
            if (td !== null) {
                t.rhs.push(td.index);
                td.used = true;
            }
        }
    }
    function addAction(b) {
        var t = _top();
        if (t.action !== null) {
            _splitAction();
        }
        t.action = b;
        if (_sematicVar !== null) {
            t.vars[_sematicVar.val] = { val: t.rhs.length, pos: _sematicVar };
            _sematicVar = null;
            _splitAction();
        }
    }
    function defineRulePr(token, type) {
        if (type === TokenRefType.STRING || type === TokenRefType.TOKEN) {
            var tk = type === TokenRefType.STRING ?
                getTokenByAlias(token) :
                getTokenByName(token);
            if (tk !== null) {
                if (tk.assoc === Assoc.UNDEFINED) {
                    singlePosErr("precedence of token \"" + token.val + "\" has not been defined", token);
                    return;
                }
                _top().pr = tk.pr;
            }
        }
        else {
            var pt = _pseudoTokens[token.val];
            if (!pt) {
                singlePosErr("pseudo token \"" + token + "\" is not defined", token);
            }
            _top().pr = pt.pr;
        }
    }
    function commitRule() {
        var t = _ruleStack.pop();
        t.index = grammar.rules.length;
        t.lhs.rules.push(t);
        grammar.rules.push(t);
        for (var _i = 0, _onCommit_1 = _onCommit; _i < _onCommit_1.length; _i++) {
            var cb = _onCommit_1[_i];
            cb();
        }
        _onCommit.length = 0;
    }
    function addPushStateAction(acts, vn) {
        lexBuilder.requiringState.wait(vn.val, function (su, sn) {
            if (su) {
                acts.push(pushState(sn));
            }
            else {
                singlePosErr("state \"" + vn.val + "\" is undefined", vn);
            }
        });
    }
    function build() {
        grammar.tokenCount = grammar.tokens.length;
        grammar.tokens[0].used = true;
        grammar.nts[0].used = true;
        for (var _i = 0, _a = grammar.nts; _i < _a.length; _i++) {
            var nt = _a[_i];
            nt.firstSet = new TokenSet(grammar.tokenCount);
            for (var _b = 0, _c = nt.rules; _b < _c.length; _b++) {
                var rule = _c[_b];
                rule.calcPr();
                var _loop_1 = function (vname) {
                    var v = rule.usedVars[vname];
                    v.val = rule.getVarSp(vname, function (msg) {
                        singlePosErr("cannot find variable \"" + vname + "\": " + msg, v.pos);
                    });
                };
                for (var vname in rule.usedVars) {
                    _loop_1(vname);
                }
            }
        }
        file.lexDFA = lexBuilder.build();
        for (var _d = 0, _onDone_1 = _onDone; _d < _onDone_1.length; _d++) {
            var cb = _onDone_1[_d];
            cb();
        }
        _requiringNt.fail();
        return file;
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
var escapes = {
    'n': '\n',
    'f': '\f',
    'b': '\b',
    'r': '\r',
    't': '\t',
    '\\': '\\',
    '"': '"',
    "'": "'"
};
function unescape(s) {
    var ret = '';
    var i = 0;
    while (i < s.length) {
        var c = s.charAt(i);
        if (c === '\\') {
            c = s.charAt(++i);
            if (escapes[c]) {
                ret += escapes[c];
                i++;
            }
            else if (c === 'u' || c === 'x') {
                c = s.charAt(++i);
                var hex = '';
                while (/[0-9a-fA-F]/.test(c)) {
                    hex += c;
                    c = s.charAt(++i);
                }
                ret += String.fromCharCode(parseInt(hex, 16));
            }
        }
        else {
            ret += c;
            i++;
        }
    }
    return ret;
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
            else if (c === 170 || c === 181 || c === 186 || (c >= 192 && c <= 214) || (c >= 216 && c <= 246) || (c >= 248 && c <= 705) || (c >= 710 && c <= 721) || (c >= 736 && c <= 740) || c === 748 || c === 750 || (c >= 880 && c <= 884) || (c >= 886 && c <= 887) || (c >= 890 && c <= 893) || c === 902 || (c >= 904 && c <= 906) || c === 908 || (c >= 910 && c <= 929) || (c >= 931 && c <= 1013) || (c >= 1015 && c <= 1153) || (c >= 1162 && c <= 1319) || (c >= 1329 && c <= 1366) || c === 1369 || (c >= 1377 && c <= 1415) || (c >= 1488 && c <= 1514) || (c >= 1520 && c <= 1522) || (c >= 1568 && c <= 1610) || (c >= 1646 && c <= 1647) || (c >= 1649 && c <= 1747) || c === 1749 || (c >= 1765 && c <= 1766) || (c >= 1774 && c <= 1775) || (c >= 1786 && c <= 1788) || c === 1791 || c === 1808 || (c >= 1810 && c <= 1839) || (c >= 1869 && c <= 1957) || c === 1969 || (c >= 1994 && c <= 2026) || (c >= 2036 && c <= 2037) || c === 2042 || (c >= 2048 && c <= 2069) || c === 2074 || c === 2084 || c === 2088 || (c >= 2112 && c <= 2136) || c === 2208 || (c >= 2210 && c <= 2220) || (c >= 2308 && c <= 2361) || c === 2365 || c === 2384 || (c >= 2392 && c <= 2401) || (c >= 2417 && c <= 2423) || (c >= 2425 && c <= 2431) || (c >= 2437 && c <= 2444) || (c >= 2447 && c <= 2448) || (c >= 2451 && c <= 2472) || (c >= 2474 && c <= 2480) || c === 2482 || (c >= 2486 && c <= 2489) || c === 2493 || c === 2510 || (c >= 2524 && c <= 2525) || (c >= 2527 && c <= 2529) || (c >= 2544 && c <= 2545) || (c >= 2565 && c <= 2570) || (c >= 2575 && c <= 2576) || (c >= 2579 && c <= 2600) || (c >= 2602 && c <= 2608) || (c >= 2610 && c <= 2611) || (c >= 2613 && c <= 2614) || (c >= 2616 && c <= 2617) || (c >= 2649 && c <= 2652) || c === 2654 || (c >= 2674 && c <= 2676) || (c >= 2693 && c <= 2701) || (c >= 2703 && c <= 2705) || (c >= 2707 && c <= 2728) || (c >= 2730 && c <= 2736) || (c >= 2738 && c <= 2739) || (c >= 2741 && c <= 2745) || c === 2749 || c === 2768 || (c >= 2784 && c <= 2785) || (c >= 2821 && c <= 2828) || (c >= 2831 && c <= 2832) || (c >= 2835 && c <= 2856) || (c >= 2858 && c <= 2864) || (c >= 2866 && c <= 2867) || (c >= 2869 && c <= 2873) || c === 2877 || (c >= 2908 && c <= 2909) || (c >= 2911 && c <= 2913) || c === 2929 || c === 2947 || (c >= 2949 && c <= 2954) || (c >= 2958 && c <= 2960) || (c >= 2962 && c <= 2965) || (c >= 2969 && c <= 2970) || c === 2972 || (c >= 2974 && c <= 2975) || (c >= 2979 && c <= 2980) || (c >= 2984 && c <= 2986) || (c >= 2990 && c <= 3001) || c === 3024 || (c >= 3077 && c <= 3084) || (c >= 3086 && c <= 3088) || (c >= 3090 && c <= 3112) || (c >= 3114 && c <= 3123) || (c >= 3125 && c <= 3129) || c === 3133 || (c >= 3160 && c <= 3161) || (c >= 3168 && c <= 3169) || (c >= 3205 && c <= 3212) || (c >= 3214 && c <= 3216) || (c >= 3218 && c <= 3240) || (c >= 3242 && c <= 3251) || (c >= 3253 && c <= 3257) || c === 3261 || c === 3294 || (c >= 3296 && c <= 3297) || (c >= 3313 && c <= 3314) || (c >= 3333 && c <= 3340) || (c >= 3342 && c <= 3344) || (c >= 3346 && c <= 3386) || c === 3389 || c === 3406 || (c >= 3424 && c <= 3425) || (c >= 3450 && c <= 3455) || (c >= 3461 && c <= 3478) || (c >= 3482 && c <= 3505) || (c >= 3507 && c <= 3515) || c === 3517 || (c >= 3520 && c <= 3526) || (c >= 3585 && c <= 3632) || (c >= 3634 && c <= 3635) || (c >= 3648 && c <= 3654) || (c >= 3713 && c <= 3714) || c === 3716 || (c >= 3719 && c <= 3720) || c === 3722 || c === 3725 || (c >= 3732 && c <= 3735) || (c >= 3737 && c <= 3743) || (c >= 3745 && c <= 3747) || c === 3749 || c === 3751 || (c >= 3754 && c <= 3755) || (c >= 3757 && c <= 3760) || (c >= 3762 && c <= 3763) || c === 3773 || (c >= 3776 && c <= 3780) || c === 3782 || (c >= 3804 && c <= 3807) || c === 3840 || (c >= 3904 && c <= 3911) || (c >= 3913 && c <= 3948) || (c >= 3976 && c <= 3980) || (c >= 4096 && c <= 4138) || c === 4159 || (c >= 4176 && c <= 4181) || (c >= 4186 && c <= 4189) || c === 4193 || (c >= 4197 && c <= 4198) || (c >= 4206 && c <= 4208) || (c >= 4213 && c <= 4225) || c === 4238 || (c >= 4256 && c <= 4293) || c === 4295 || c === 4301 || (c >= 4304 && c <= 4346) || (c >= 4348 && c <= 4680) || (c >= 4682 && c <= 4685) || (c >= 4688 && c <= 4694) || c === 4696 || (c >= 4698 && c <= 4701) || (c >= 4704 && c <= 4744) || (c >= 4746 && c <= 4749) || (c >= 4752 && c <= 4784) || (c >= 4786 && c <= 4789) || (c >= 4792 && c <= 4798) || c === 4800 || (c >= 4802 && c <= 4805) || (c >= 4808 && c <= 4822) || (c >= 4824 && c <= 4880) || (c >= 4882 && c <= 4885) || (c >= 4888 && c <= 4954) || (c >= 4992 && c <= 5007) || (c >= 5024 && c <= 5108) || (c >= 5121 && c <= 5740) || (c >= 5743 && c <= 5759) || (c >= 5761 && c <= 5786) || (c >= 5792 && c <= 5866) || (c >= 5870 && c <= 5872) || (c >= 5888 && c <= 5900) || (c >= 5902 && c <= 5905) || (c >= 5920 && c <= 5937) || (c >= 5952 && c <= 5969) || (c >= 5984 && c <= 5996) || (c >= 5998 && c <= 6000) || (c >= 6016 && c <= 6067) || c === 6103 || c === 6108 || (c >= 6176 && c <= 6263) || (c >= 6272 && c <= 6312) || c === 6314 || (c >= 6320 && c <= 6389) || (c >= 6400 && c <= 6428) || (c >= 6480 && c <= 6509) || (c >= 6512 && c <= 6516) || (c >= 6528 && c <= 6571) || (c >= 6593 && c <= 6599) || (c >= 6656 && c <= 6678) || (c >= 6688 && c <= 6740) || c === 6823 || (c >= 6917 && c <= 6963) || (c >= 6981 && c <= 6987) || (c >= 7043 && c <= 7072) || (c >= 7086 && c <= 7087) || (c >= 7098 && c <= 7141) || (c >= 7168 && c <= 7203) || (c >= 7245 && c <= 7247) || (c >= 7258 && c <= 7293) || (c >= 7401 && c <= 7404) || (c >= 7406 && c <= 7409) || (c >= 7413 && c <= 7414) || (c >= 7424 && c <= 7615) || (c >= 7680 && c <= 7957) || (c >= 7960 && c <= 7965) || (c >= 7968 && c <= 8005) || (c >= 8008 && c <= 8013) || (c >= 8016 && c <= 8023) || c === 8025 || c === 8027 || c === 8029 || (c >= 8031 && c <= 8061) || (c >= 8064 && c <= 8116) || (c >= 8118 && c <= 8124) || c === 8126 || (c >= 8130 && c <= 8132) || (c >= 8134 && c <= 8140) || (c >= 8144 && c <= 8147) || (c >= 8150 && c <= 8155) || (c >= 8160 && c <= 8172) || (c >= 8178 && c <= 8180) || (c >= 8182 && c <= 8188) || c === 8305 || c === 8319 || (c >= 8336 && c <= 8348) || c === 8450 || c === 8455 || (c >= 8458 && c <= 8467) || c === 8469 || (c >= 8473 && c <= 8477) || c === 8484 || c === 8486 || c === 8488 || (c >= 8490 && c <= 8493) || (c >= 8495 && c <= 8505) || (c >= 8508 && c <= 8511) || (c >= 8517 && c <= 8521) || c === 8526 || (c >= 8544 && c <= 8584) || (c >= 11264 && c <= 11310) || (c >= 11312 && c <= 11358) || (c >= 11360 && c <= 11492) || (c >= 11499 && c <= 11502) || (c >= 11506 && c <= 11507) || (c >= 11520 && c <= 11557) || c === 11559 || c === 11565 || (c >= 11568 && c <= 11623) || c === 11631 || (c >= 11648 && c <= 11670) || (c >= 11680 && c <= 11686) || (c >= 11688 && c <= 11694) || (c >= 11696 && c <= 11702) || (c >= 11704 && c <= 11710) || (c >= 11712 && c <= 11718) || (c >= 11720 && c <= 11726) || (c >= 11728 && c <= 11734) || (c >= 11736 && c <= 11742) || c === 11823 || (c >= 12293 && c <= 12295) || (c >= 12321 && c <= 12329) || (c >= 12337 && c <= 12341) || (c >= 12344 && c <= 12348) || (c >= 12353 && c <= 12438) || (c >= 12445 && c <= 12447) || (c >= 12449 && c <= 12538) || (c >= 12540 && c <= 12543) || (c >= 12549 && c <= 12589) || (c >= 12593 && c <= 12686) || (c >= 12704 && c <= 12730) || (c >= 12784 && c <= 12799) || (c >= 13312 && c <= 19893) || (c >= 19968 && c <= 40908) || (c >= 40960 && c <= 42124) || (c >= 42192 && c <= 42237) || (c >= 42240 && c <= 42508) || (c >= 42512 && c <= 42527) || (c >= 42538 && c <= 42539) || (c >= 42560 && c <= 42606) || (c >= 42623 && c <= 42647) || (c >= 42656 && c <= 42735) || (c >= 42775 && c <= 42783) || (c >= 42786 && c <= 42888) || (c >= 42891 && c <= 42894) || (c >= 42896 && c <= 42899) || (c >= 42912 && c <= 42922) || (c >= 43000 && c <= 43009) || (c >= 43011 && c <= 43013) || (c >= 43015 && c <= 43018) || (c >= 43020 && c <= 43042) || (c >= 43072 && c <= 43123) || (c >= 43138 && c <= 43187) || (c >= 43250 && c <= 43255) || c === 43259 || (c >= 43274 && c <= 43301) || (c >= 43312 && c <= 43334) || (c >= 43360 && c <= 43388) || (c >= 43396 && c <= 43442) || c === 43471 || (c >= 43520 && c <= 43560) || (c >= 43584 && c <= 43586) || (c >= 43588 && c <= 43595) || (c >= 43616 && c <= 43638) || c === 43642 || (c >= 43648 && c <= 43695) || c === 43697 || (c >= 43701 && c <= 43702) || (c >= 43705 && c <= 43709) || c === 43712 || c === 43714 || (c >= 43739 && c <= 43741) || (c >= 43744 && c <= 43754) || (c >= 43762 && c <= 43764) || (c >= 43777 && c <= 43782) || (c >= 43785 && c <= 43790) || (c >= 43793 && c <= 43798) || (c >= 43808 && c <= 43814) || (c >= 43816 && c <= 43822) || (c >= 43968 && c <= 44002) || (c >= 44032 && c <= 55203) || (c >= 55216 && c <= 55238) || (c >= 55243 && c <= 55291) || (c >= 63744 && c <= 64109) || (c >= 64112 && c <= 64217) || (c >= 64256 && c <= 64262) || (c >= 64275 && c <= 64279) || c === 64285 || (c >= 64287 && c <= 64296) || (c >= 64298 && c <= 64310) || (c >= 64312 && c <= 64316) || c === 64318 || (c >= 64320 && c <= 64321) || (c >= 64323 && c <= 64324) || (c >= 64326 && c <= 64433) || (c >= 64467 && c <= 64829) || (c >= 64848 && c <= 64911) || (c >= 64914 && c <= 64967) || (c >= 65008 && c <= 65019) || (c >= 65136 && c <= 65140) || (c >= 65142 && c <= 65276) || (c >= 65313 && c <= 65338) || (c >= 65345 && c <= 65370) || (c >= 65382 && c <= 65470) || (c >= 65474 && c <= 65479) || (c >= 65482 && c <= 65487) || (c >= 65490 && c <= 65495) || (c >= 65498 && c <= 65500)) {
                ret.state = 25;
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
                ret.state = 26;
            }
            else if (c === 34) {
                ret.state = 27;
            }
            else if (c === 92) {
                ret.state = 28;
            }
            else {
                ret.state = -1;
            }
            break;
        case 3:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c === 36 || (c >= 65 && c <= 90) || c === 95 || (c >= 97 && c <= 122)) {
                ret.state = 29;
            }
            else if ((c >= 48 && c <= 57)) {
                ret.state = 30;
            }
            else if (c === 170 || c === 181 || c === 186 || (c >= 192 && c <= 214) || (c >= 216 && c <= 246) || (c >= 248 && c <= 705) || (c >= 710 && c <= 721) || (c >= 736 && c <= 740) || c === 748 || c === 750 || (c >= 880 && c <= 884) || (c >= 886 && c <= 887) || (c >= 890 && c <= 893) || c === 902 || (c >= 904 && c <= 906) || c === 908 || (c >= 910 && c <= 929) || (c >= 931 && c <= 1013) || (c >= 1015 && c <= 1153) || (c >= 1162 && c <= 1319) || (c >= 1329 && c <= 1366) || c === 1369 || (c >= 1377 && c <= 1415) || (c >= 1488 && c <= 1514) || (c >= 1520 && c <= 1522) || (c >= 1568 && c <= 1610) || (c >= 1646 && c <= 1647) || (c >= 1649 && c <= 1747) || c === 1749 || (c >= 1765 && c <= 1766) || (c >= 1774 && c <= 1775) || (c >= 1786 && c <= 1788) || c === 1791 || c === 1808 || (c >= 1810 && c <= 1839) || (c >= 1869 && c <= 1957) || c === 1969 || (c >= 1994 && c <= 2026) || (c >= 2036 && c <= 2037) || c === 2042 || (c >= 2048 && c <= 2069) || c === 2074 || c === 2084 || c === 2088 || (c >= 2112 && c <= 2136) || c === 2208 || (c >= 2210 && c <= 2220) || (c >= 2308 && c <= 2361) || c === 2365 || c === 2384 || (c >= 2392 && c <= 2401) || (c >= 2417 && c <= 2423) || (c >= 2425 && c <= 2431) || (c >= 2437 && c <= 2444) || (c >= 2447 && c <= 2448) || (c >= 2451 && c <= 2472) || (c >= 2474 && c <= 2480) || c === 2482 || (c >= 2486 && c <= 2489) || c === 2493 || c === 2510 || (c >= 2524 && c <= 2525) || (c >= 2527 && c <= 2529) || (c >= 2544 && c <= 2545) || (c >= 2565 && c <= 2570) || (c >= 2575 && c <= 2576) || (c >= 2579 && c <= 2600) || (c >= 2602 && c <= 2608) || (c >= 2610 && c <= 2611) || (c >= 2613 && c <= 2614) || (c >= 2616 && c <= 2617) || (c >= 2649 && c <= 2652) || c === 2654 || (c >= 2674 && c <= 2676) || (c >= 2693 && c <= 2701) || (c >= 2703 && c <= 2705) || (c >= 2707 && c <= 2728) || (c >= 2730 && c <= 2736) || (c >= 2738 && c <= 2739) || (c >= 2741 && c <= 2745) || c === 2749 || c === 2768 || (c >= 2784 && c <= 2785) || (c >= 2821 && c <= 2828) || (c >= 2831 && c <= 2832) || (c >= 2835 && c <= 2856) || (c >= 2858 && c <= 2864) || (c >= 2866 && c <= 2867) || (c >= 2869 && c <= 2873) || c === 2877 || (c >= 2908 && c <= 2909) || (c >= 2911 && c <= 2913) || c === 2929 || c === 2947 || (c >= 2949 && c <= 2954) || (c >= 2958 && c <= 2960) || (c >= 2962 && c <= 2965) || (c >= 2969 && c <= 2970) || c === 2972 || (c >= 2974 && c <= 2975) || (c >= 2979 && c <= 2980) || (c >= 2984 && c <= 2986) || (c >= 2990 && c <= 3001) || c === 3024 || (c >= 3077 && c <= 3084) || (c >= 3086 && c <= 3088) || (c >= 3090 && c <= 3112) || (c >= 3114 && c <= 3123) || (c >= 3125 && c <= 3129) || c === 3133 || (c >= 3160 && c <= 3161) || (c >= 3168 && c <= 3169) || (c >= 3205 && c <= 3212) || (c >= 3214 && c <= 3216) || (c >= 3218 && c <= 3240) || (c >= 3242 && c <= 3251) || (c >= 3253 && c <= 3257) || c === 3261 || c === 3294 || (c >= 3296 && c <= 3297) || (c >= 3313 && c <= 3314) || (c >= 3333 && c <= 3340) || (c >= 3342 && c <= 3344) || (c >= 3346 && c <= 3386) || c === 3389 || c === 3406 || (c >= 3424 && c <= 3425) || (c >= 3450 && c <= 3455) || (c >= 3461 && c <= 3478) || (c >= 3482 && c <= 3505) || (c >= 3507 && c <= 3515) || c === 3517 || (c >= 3520 && c <= 3526) || (c >= 3585 && c <= 3632) || (c >= 3634 && c <= 3635) || (c >= 3648 && c <= 3654) || (c >= 3713 && c <= 3714) || c === 3716 || (c >= 3719 && c <= 3720) || c === 3722 || c === 3725 || (c >= 3732 && c <= 3735) || (c >= 3737 && c <= 3743) || (c >= 3745 && c <= 3747) || c === 3749 || c === 3751 || (c >= 3754 && c <= 3755) || (c >= 3757 && c <= 3760) || (c >= 3762 && c <= 3763) || c === 3773 || (c >= 3776 && c <= 3780) || c === 3782 || (c >= 3804 && c <= 3807) || c === 3840 || (c >= 3904 && c <= 3911) || (c >= 3913 && c <= 3948) || (c >= 3976 && c <= 3980) || (c >= 4096 && c <= 4138) || c === 4159 || (c >= 4176 && c <= 4181) || (c >= 4186 && c <= 4189) || c === 4193 || (c >= 4197 && c <= 4198) || (c >= 4206 && c <= 4208) || (c >= 4213 && c <= 4225) || c === 4238 || (c >= 4256 && c <= 4293) || c === 4295 || c === 4301 || (c >= 4304 && c <= 4346) || (c >= 4348 && c <= 4680) || (c >= 4682 && c <= 4685) || (c >= 4688 && c <= 4694) || c === 4696 || (c >= 4698 && c <= 4701) || (c >= 4704 && c <= 4744) || (c >= 4746 && c <= 4749) || (c >= 4752 && c <= 4784) || (c >= 4786 && c <= 4789) || (c >= 4792 && c <= 4798) || c === 4800 || (c >= 4802 && c <= 4805) || (c >= 4808 && c <= 4822) || (c >= 4824 && c <= 4880) || (c >= 4882 && c <= 4885) || (c >= 4888 && c <= 4954) || (c >= 4992 && c <= 5007) || (c >= 5024 && c <= 5108) || (c >= 5121 && c <= 5740) || (c >= 5743 && c <= 5759) || (c >= 5761 && c <= 5786) || (c >= 5792 && c <= 5866) || (c >= 5870 && c <= 5872) || (c >= 5888 && c <= 5900) || (c >= 5902 && c <= 5905) || (c >= 5920 && c <= 5937) || (c >= 5952 && c <= 5969) || (c >= 5984 && c <= 5996) || (c >= 5998 && c <= 6000) || (c >= 6016 && c <= 6067) || c === 6103 || c === 6108 || (c >= 6176 && c <= 6263) || (c >= 6272 && c <= 6312) || c === 6314 || (c >= 6320 && c <= 6389) || (c >= 6400 && c <= 6428) || (c >= 6480 && c <= 6509) || (c >= 6512 && c <= 6516) || (c >= 6528 && c <= 6571) || (c >= 6593 && c <= 6599) || (c >= 6656 && c <= 6678) || (c >= 6688 && c <= 6740) || c === 6823 || (c >= 6917 && c <= 6963) || (c >= 6981 && c <= 6987) || (c >= 7043 && c <= 7072) || (c >= 7086 && c <= 7087) || (c >= 7098 && c <= 7141) || (c >= 7168 && c <= 7203) || (c >= 7245 && c <= 7247) || (c >= 7258 && c <= 7293) || (c >= 7401 && c <= 7404) || (c >= 7406 && c <= 7409) || (c >= 7413 && c <= 7414) || (c >= 7424 && c <= 7615) || (c >= 7680 && c <= 7957) || (c >= 7960 && c <= 7965) || (c >= 7968 && c <= 8005) || (c >= 8008 && c <= 8013) || (c >= 8016 && c <= 8023) || c === 8025 || c === 8027 || c === 8029 || (c >= 8031 && c <= 8061) || (c >= 8064 && c <= 8116) || (c >= 8118 && c <= 8124) || c === 8126 || (c >= 8130 && c <= 8132) || (c >= 8134 && c <= 8140) || (c >= 8144 && c <= 8147) || (c >= 8150 && c <= 8155) || (c >= 8160 && c <= 8172) || (c >= 8178 && c <= 8180) || (c >= 8182 && c <= 8188) || c === 8305 || c === 8319 || (c >= 8336 && c <= 8348) || c === 8450 || c === 8455 || (c >= 8458 && c <= 8467) || c === 8469 || (c >= 8473 && c <= 8477) || c === 8484 || c === 8486 || c === 8488 || (c >= 8490 && c <= 8493) || (c >= 8495 && c <= 8505) || (c >= 8508 && c <= 8511) || (c >= 8517 && c <= 8521) || c === 8526 || (c >= 8544 && c <= 8584) || (c >= 11264 && c <= 11310) || (c >= 11312 && c <= 11358) || (c >= 11360 && c <= 11492) || (c >= 11499 && c <= 11502) || (c >= 11506 && c <= 11507) || (c >= 11520 && c <= 11557) || c === 11559 || c === 11565 || (c >= 11568 && c <= 11623) || c === 11631 || (c >= 11648 && c <= 11670) || (c >= 11680 && c <= 11686) || (c >= 11688 && c <= 11694) || (c >= 11696 && c <= 11702) || (c >= 11704 && c <= 11710) || (c >= 11712 && c <= 11718) || (c >= 11720 && c <= 11726) || (c >= 11728 && c <= 11734) || (c >= 11736 && c <= 11742) || c === 11823 || (c >= 12293 && c <= 12295) || (c >= 12321 && c <= 12329) || (c >= 12337 && c <= 12341) || (c >= 12344 && c <= 12348) || (c >= 12353 && c <= 12438) || (c >= 12445 && c <= 12447) || (c >= 12449 && c <= 12538) || (c >= 12540 && c <= 12543) || (c >= 12549 && c <= 12589) || (c >= 12593 && c <= 12686) || (c >= 12704 && c <= 12730) || (c >= 12784 && c <= 12799) || (c >= 13312 && c <= 19893) || (c >= 19968 && c <= 40908) || (c >= 40960 && c <= 42124) || (c >= 42192 && c <= 42237) || (c >= 42240 && c <= 42508) || (c >= 42512 && c <= 42527) || (c >= 42538 && c <= 42539) || (c >= 42560 && c <= 42606) || (c >= 42623 && c <= 42647) || (c >= 42656 && c <= 42735) || (c >= 42775 && c <= 42783) || (c >= 42786 && c <= 42888) || (c >= 42891 && c <= 42894) || (c >= 42896 && c <= 42899) || (c >= 42912 && c <= 42922) || (c >= 43000 && c <= 43009) || (c >= 43011 && c <= 43013) || (c >= 43015 && c <= 43018) || (c >= 43020 && c <= 43042) || (c >= 43072 && c <= 43123) || (c >= 43138 && c <= 43187) || (c >= 43250 && c <= 43255) || c === 43259 || (c >= 43274 && c <= 43301) || (c >= 43312 && c <= 43334) || (c >= 43360 && c <= 43388) || (c >= 43396 && c <= 43442) || c === 43471 || (c >= 43520 && c <= 43560) || (c >= 43584 && c <= 43586) || (c >= 43588 && c <= 43595) || (c >= 43616 && c <= 43638) || c === 43642 || (c >= 43648 && c <= 43695) || c === 43697 || (c >= 43701 && c <= 43702) || (c >= 43705 && c <= 43709) || c === 43712 || c === 43714 || (c >= 43739 && c <= 43741) || (c >= 43744 && c <= 43754) || (c >= 43762 && c <= 43764) || (c >= 43777 && c <= 43782) || (c >= 43785 && c <= 43790) || (c >= 43793 && c <= 43798) || (c >= 43808 && c <= 43814) || (c >= 43816 && c <= 43822) || (c >= 43968 && c <= 44002) || (c >= 44032 && c <= 55203) || (c >= 55216 && c <= 55238) || (c >= 55243 && c <= 55291) || (c >= 63744 && c <= 64109) || (c >= 64112 && c <= 64217) || (c >= 64256 && c <= 64262) || (c >= 64275 && c <= 64279) || c === 64285 || (c >= 64287 && c <= 64296) || (c >= 64298 && c <= 64310) || (c >= 64312 && c <= 64316) || c === 64318 || (c >= 64320 && c <= 64321) || (c >= 64323 && c <= 64324) || (c >= 64326 && c <= 64433) || (c >= 64467 && c <= 64829) || (c >= 64848 && c <= 64911) || (c >= 64914 && c <= 64967) || (c >= 65008 && c <= 65019) || (c >= 65136 && c <= 65140) || (c >= 65142 && c <= 65276) || (c >= 65313 && c <= 65338) || (c >= 65345 && c <= 65370) || (c >= 65382 && c <= 65470) || (c >= 65474 && c <= 65479) || (c >= 65482 && c <= 65487) || (c >= 65490 && c <= 65495) || (c >= 65498 && c <= 65500)) {
                ret.state = 31;
            }
            else if ((c >= 768 && c <= 879) || (c >= 1155 && c <= 1159) || (c >= 1425 && c <= 1469) || c === 1471 || (c >= 1473 && c <= 1474) || (c >= 1476 && c <= 1477) || c === 1479 || (c >= 1552 && c <= 1562) || (c >= 1611 && c <= 1641) || c === 1648 || (c >= 1750 && c <= 1756) || (c >= 1759 && c <= 1764) || (c >= 1767 && c <= 1768) || (c >= 1770 && c <= 1773) || (c >= 1776 && c <= 1785) || c === 1809 || (c >= 1840 && c <= 1866) || (c >= 1958 && c <= 1968) || (c >= 1984 && c <= 1993) || (c >= 2027 && c <= 2035) || (c >= 2070 && c <= 2073) || (c >= 2075 && c <= 2083) || (c >= 2085 && c <= 2087) || (c >= 2089 && c <= 2093) || (c >= 2137 && c <= 2139) || (c >= 2276 && c <= 2302) || (c >= 2304 && c <= 2307) || (c >= 2362 && c <= 2364) || (c >= 2366 && c <= 2383) || (c >= 2385 && c <= 2391) || (c >= 2402 && c <= 2403) || (c >= 2406 && c <= 2415) || (c >= 2433 && c <= 2435) || c === 2492 || (c >= 2494 && c <= 2500) || (c >= 2503 && c <= 2504) || (c >= 2507 && c <= 2509) || c === 2519 || (c >= 2530 && c <= 2531) || (c >= 2534 && c <= 2543) || (c >= 2561 && c <= 2563) || c === 2620 || (c >= 2622 && c <= 2626) || (c >= 2631 && c <= 2632) || (c >= 2635 && c <= 2637) || c === 2641 || (c >= 2662 && c <= 2673) || c === 2677 || (c >= 2689 && c <= 2691) || c === 2748 || (c >= 2750 && c <= 2757) || (c >= 2759 && c <= 2761) || (c >= 2763 && c <= 2765) || (c >= 2786 && c <= 2787) || (c >= 2790 && c <= 2799) || (c >= 2817 && c <= 2819) || c === 2876 || (c >= 2878 && c <= 2884) || (c >= 2887 && c <= 2888) || (c >= 2891 && c <= 2893) || (c >= 2902 && c <= 2903) || (c >= 2914 && c <= 2915) || (c >= 2918 && c <= 2927) || c === 2946 || (c >= 3006 && c <= 3010) || (c >= 3014 && c <= 3016) || (c >= 3018 && c <= 3021) || c === 3031 || (c >= 3046 && c <= 3055) || (c >= 3073 && c <= 3075) || (c >= 3134 && c <= 3140) || (c >= 3142 && c <= 3144) || (c >= 3146 && c <= 3149) || (c >= 3157 && c <= 3158) || (c >= 3170 && c <= 3171) || (c >= 3174 && c <= 3183) || (c >= 3202 && c <= 3203) || c === 3260 || (c >= 3262 && c <= 3268) || (c >= 3270 && c <= 3272) || (c >= 3274 && c <= 3277) || (c >= 3285 && c <= 3286) || (c >= 3298 && c <= 3299) || (c >= 3302 && c <= 3311) || (c >= 3330 && c <= 3331) || (c >= 3390 && c <= 3396) || (c >= 3398 && c <= 3400) || (c >= 3402 && c <= 3405) || c === 3415 || (c >= 3426 && c <= 3427) || (c >= 3430 && c <= 3439) || (c >= 3458 && c <= 3459) || c === 3530 || (c >= 3535 && c <= 3540) || c === 3542 || (c >= 3544 && c <= 3551) || (c >= 3570 && c <= 3571) || c === 3633 || (c >= 3636 && c <= 3642) || (c >= 3655 && c <= 3662) || (c >= 3664 && c <= 3673) || c === 3761 || (c >= 3764 && c <= 3769) || (c >= 3771 && c <= 3772) || (c >= 3784 && c <= 3789) || (c >= 3792 && c <= 3801) || (c >= 3864 && c <= 3865) || (c >= 3872 && c <= 3881) || c === 3893 || c === 3895 || c === 3897 || (c >= 3902 && c <= 3903) || (c >= 3953 && c <= 3972) || (c >= 3974 && c <= 3975) || (c >= 3981 && c <= 3991) || (c >= 3993 && c <= 4028) || c === 4038 || (c >= 4139 && c <= 4158) || (c >= 4160 && c <= 4169) || (c >= 4182 && c <= 4185) || (c >= 4190 && c <= 4192) || (c >= 4194 && c <= 4196) || (c >= 4199 && c <= 4205) || (c >= 4209 && c <= 4212) || (c >= 4226 && c <= 4237) || (c >= 4239 && c <= 4253) || (c >= 4957 && c <= 4959) || (c >= 5906 && c <= 5908) || (c >= 5938 && c <= 5940) || (c >= 5970 && c <= 5971) || (c >= 6002 && c <= 6003) || (c >= 6068 && c <= 6099) || c === 6109 || (c >= 6112 && c <= 6121) || (c >= 6155 && c <= 6157) || (c >= 6160 && c <= 6169) || c === 6313 || (c >= 6432 && c <= 6443) || (c >= 6448 && c <= 6459) || (c >= 6470 && c <= 6479) || (c >= 6576 && c <= 6592) || (c >= 6600 && c <= 6601) || (c >= 6608 && c <= 6617) || (c >= 6679 && c <= 6683) || (c >= 6741 && c <= 6750) || (c >= 6752 && c <= 6780) || (c >= 6783 && c <= 6793) || (c >= 6800 && c <= 6809) || (c >= 6912 && c <= 6916) || (c >= 6964 && c <= 6980) || (c >= 6992 && c <= 7001) || (c >= 7019 && c <= 7027) || (c >= 7040 && c <= 7042) || (c >= 7073 && c <= 7085) || (c >= 7088 && c <= 7097) || (c >= 7142 && c <= 7155) || (c >= 7204 && c <= 7223) || (c >= 7232 && c <= 7241) || (c >= 7248 && c <= 7257) || (c >= 7376 && c <= 7378) || (c >= 7380 && c <= 7400) || c === 7405 || (c >= 7410 && c <= 7412) || (c >= 7616 && c <= 7654) || (c >= 7676 && c <= 7679) || (c >= 8204 && c <= 8205) || (c >= 8255 && c <= 8256) || c === 8276 || (c >= 8400 && c <= 8412) || c === 8417 || (c >= 8421 && c <= 8432) || (c >= 11503 && c <= 11505) || c === 11647 || (c >= 11744 && c <= 11775) || (c >= 12330 && c <= 12335) || (c >= 12441 && c <= 12442) || (c >= 42528 && c <= 42537) || c === 42607 || (c >= 42612 && c <= 42621) || c === 42655 || (c >= 42736 && c <= 42737) || c === 43010 || c === 43014 || c === 43019 || (c >= 43043 && c <= 43047) || (c >= 43136 && c <= 43137) || (c >= 43188 && c <= 43204) || (c >= 43216 && c <= 43225) || (c >= 43232 && c <= 43249) || (c >= 43264 && c <= 43273) || (c >= 43302 && c <= 43309) || (c >= 43335 && c <= 43347) || (c >= 43392 && c <= 43395) || (c >= 43443 && c <= 43456) || (c >= 43472 && c <= 43481) || (c >= 43561 && c <= 43574) || c === 43587 || (c >= 43596 && c <= 43597) || (c >= 43600 && c <= 43609) || c === 43643 || c === 43696 || (c >= 43698 && c <= 43700) || (c >= 43703 && c <= 43704) || (c >= 43710 && c <= 43711) || c === 43713 || (c >= 43755 && c <= 43759) || (c >= 43765 && c <= 43766) || (c >= 44003 && c <= 44010) || (c >= 44012 && c <= 44013) || (c >= 44016 && c <= 44025) || c === 64286 || (c >= 65024 && c <= 65039) || (c >= 65056 && c <= 65062) || (c >= 65075 && c <= 65076) || (c >= 65101 && c <= 65103) || (c >= 65296 && c <= 65305) || c === 65343) {
                ret.state = 32;
            }
            else {
                ret.state = -1;
            }
            break;
        case 4:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 37) {
                ret.state = 33;
            }
            else if (c === 101) {
                ret.state = 34;
            }
            else if (c === 104) {
                ret.state = 35;
            }
            else if (c === 105) {
                ret.state = 36;
            }
            else if (c === 108) {
                ret.state = 37;
            }
            else if (c === 110) {
                ret.state = 38;
            }
            else if (c === 111) {
                ret.state = 39;
            }
            else if (c === 112) {
                ret.state = 40;
            }
            else if (c === 114) {
                ret.state = 41;
            }
            else if (c === 116) {
                ret.state = 42;
            }
            else if (c === 117) {
                ret.state = 43;
            }
            else {
                ret.state = -1;
            }
            break;
        case 5:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 91) || c >= 93) {
                ret.state = 44;
            }
            else if (c === 39) {
                ret.state = 45;
            }
            else if (c === 92) {
                ret.state = 46;
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
                ret.state = 47;
            }
            else if (c === 47) {
                ret.state = 48;
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
                ret.state = 49;
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
            ret.isEnd = true;
            if (c === 36 || (c >= 65 && c <= 90) || c === 95 || (c >= 97 && c <= 122)) {
                ret.state = 29;
            }
            else if ((c >= 48 && c <= 57)) {
                ret.state = 30;
            }
            else if (c === 170 || c === 181 || c === 186 || (c >= 192 && c <= 214) || (c >= 216 && c <= 246) || (c >= 248 && c <= 705) || (c >= 710 && c <= 721) || (c >= 736 && c <= 740) || c === 748 || c === 750 || (c >= 880 && c <= 884) || (c >= 886 && c <= 887) || (c >= 890 && c <= 893) || c === 902 || (c >= 904 && c <= 906) || c === 908 || (c >= 910 && c <= 929) || (c >= 931 && c <= 1013) || (c >= 1015 && c <= 1153) || (c >= 1162 && c <= 1319) || (c >= 1329 && c <= 1366) || c === 1369 || (c >= 1377 && c <= 1415) || (c >= 1488 && c <= 1514) || (c >= 1520 && c <= 1522) || (c >= 1568 && c <= 1610) || (c >= 1646 && c <= 1647) || (c >= 1649 && c <= 1747) || c === 1749 || (c >= 1765 && c <= 1766) || (c >= 1774 && c <= 1775) || (c >= 1786 && c <= 1788) || c === 1791 || c === 1808 || (c >= 1810 && c <= 1839) || (c >= 1869 && c <= 1957) || c === 1969 || (c >= 1994 && c <= 2026) || (c >= 2036 && c <= 2037) || c === 2042 || (c >= 2048 && c <= 2069) || c === 2074 || c === 2084 || c === 2088 || (c >= 2112 && c <= 2136) || c === 2208 || (c >= 2210 && c <= 2220) || (c >= 2308 && c <= 2361) || c === 2365 || c === 2384 || (c >= 2392 && c <= 2401) || (c >= 2417 && c <= 2423) || (c >= 2425 && c <= 2431) || (c >= 2437 && c <= 2444) || (c >= 2447 && c <= 2448) || (c >= 2451 && c <= 2472) || (c >= 2474 && c <= 2480) || c === 2482 || (c >= 2486 && c <= 2489) || c === 2493 || c === 2510 || (c >= 2524 && c <= 2525) || (c >= 2527 && c <= 2529) || (c >= 2544 && c <= 2545) || (c >= 2565 && c <= 2570) || (c >= 2575 && c <= 2576) || (c >= 2579 && c <= 2600) || (c >= 2602 && c <= 2608) || (c >= 2610 && c <= 2611) || (c >= 2613 && c <= 2614) || (c >= 2616 && c <= 2617) || (c >= 2649 && c <= 2652) || c === 2654 || (c >= 2674 && c <= 2676) || (c >= 2693 && c <= 2701) || (c >= 2703 && c <= 2705) || (c >= 2707 && c <= 2728) || (c >= 2730 && c <= 2736) || (c >= 2738 && c <= 2739) || (c >= 2741 && c <= 2745) || c === 2749 || c === 2768 || (c >= 2784 && c <= 2785) || (c >= 2821 && c <= 2828) || (c >= 2831 && c <= 2832) || (c >= 2835 && c <= 2856) || (c >= 2858 && c <= 2864) || (c >= 2866 && c <= 2867) || (c >= 2869 && c <= 2873) || c === 2877 || (c >= 2908 && c <= 2909) || (c >= 2911 && c <= 2913) || c === 2929 || c === 2947 || (c >= 2949 && c <= 2954) || (c >= 2958 && c <= 2960) || (c >= 2962 && c <= 2965) || (c >= 2969 && c <= 2970) || c === 2972 || (c >= 2974 && c <= 2975) || (c >= 2979 && c <= 2980) || (c >= 2984 && c <= 2986) || (c >= 2990 && c <= 3001) || c === 3024 || (c >= 3077 && c <= 3084) || (c >= 3086 && c <= 3088) || (c >= 3090 && c <= 3112) || (c >= 3114 && c <= 3123) || (c >= 3125 && c <= 3129) || c === 3133 || (c >= 3160 && c <= 3161) || (c >= 3168 && c <= 3169) || (c >= 3205 && c <= 3212) || (c >= 3214 && c <= 3216) || (c >= 3218 && c <= 3240) || (c >= 3242 && c <= 3251) || (c >= 3253 && c <= 3257) || c === 3261 || c === 3294 || (c >= 3296 && c <= 3297) || (c >= 3313 && c <= 3314) || (c >= 3333 && c <= 3340) || (c >= 3342 && c <= 3344) || (c >= 3346 && c <= 3386) || c === 3389 || c === 3406 || (c >= 3424 && c <= 3425) || (c >= 3450 && c <= 3455) || (c >= 3461 && c <= 3478) || (c >= 3482 && c <= 3505) || (c >= 3507 && c <= 3515) || c === 3517 || (c >= 3520 && c <= 3526) || (c >= 3585 && c <= 3632) || (c >= 3634 && c <= 3635) || (c >= 3648 && c <= 3654) || (c >= 3713 && c <= 3714) || c === 3716 || (c >= 3719 && c <= 3720) || c === 3722 || c === 3725 || (c >= 3732 && c <= 3735) || (c >= 3737 && c <= 3743) || (c >= 3745 && c <= 3747) || c === 3749 || c === 3751 || (c >= 3754 && c <= 3755) || (c >= 3757 && c <= 3760) || (c >= 3762 && c <= 3763) || c === 3773 || (c >= 3776 && c <= 3780) || c === 3782 || (c >= 3804 && c <= 3807) || c === 3840 || (c >= 3904 && c <= 3911) || (c >= 3913 && c <= 3948) || (c >= 3976 && c <= 3980) || (c >= 4096 && c <= 4138) || c === 4159 || (c >= 4176 && c <= 4181) || (c >= 4186 && c <= 4189) || c === 4193 || (c >= 4197 && c <= 4198) || (c >= 4206 && c <= 4208) || (c >= 4213 && c <= 4225) || c === 4238 || (c >= 4256 && c <= 4293) || c === 4295 || c === 4301 || (c >= 4304 && c <= 4346) || (c >= 4348 && c <= 4680) || (c >= 4682 && c <= 4685) || (c >= 4688 && c <= 4694) || c === 4696 || (c >= 4698 && c <= 4701) || (c >= 4704 && c <= 4744) || (c >= 4746 && c <= 4749) || (c >= 4752 && c <= 4784) || (c >= 4786 && c <= 4789) || (c >= 4792 && c <= 4798) || c === 4800 || (c >= 4802 && c <= 4805) || (c >= 4808 && c <= 4822) || (c >= 4824 && c <= 4880) || (c >= 4882 && c <= 4885) || (c >= 4888 && c <= 4954) || (c >= 4992 && c <= 5007) || (c >= 5024 && c <= 5108) || (c >= 5121 && c <= 5740) || (c >= 5743 && c <= 5759) || (c >= 5761 && c <= 5786) || (c >= 5792 && c <= 5866) || (c >= 5870 && c <= 5872) || (c >= 5888 && c <= 5900) || (c >= 5902 && c <= 5905) || (c >= 5920 && c <= 5937) || (c >= 5952 && c <= 5969) || (c >= 5984 && c <= 5996) || (c >= 5998 && c <= 6000) || (c >= 6016 && c <= 6067) || c === 6103 || c === 6108 || (c >= 6176 && c <= 6263) || (c >= 6272 && c <= 6312) || c === 6314 || (c >= 6320 && c <= 6389) || (c >= 6400 && c <= 6428) || (c >= 6480 && c <= 6509) || (c >= 6512 && c <= 6516) || (c >= 6528 && c <= 6571) || (c >= 6593 && c <= 6599) || (c >= 6656 && c <= 6678) || (c >= 6688 && c <= 6740) || c === 6823 || (c >= 6917 && c <= 6963) || (c >= 6981 && c <= 6987) || (c >= 7043 && c <= 7072) || (c >= 7086 && c <= 7087) || (c >= 7098 && c <= 7141) || (c >= 7168 && c <= 7203) || (c >= 7245 && c <= 7247) || (c >= 7258 && c <= 7293) || (c >= 7401 && c <= 7404) || (c >= 7406 && c <= 7409) || (c >= 7413 && c <= 7414) || (c >= 7424 && c <= 7615) || (c >= 7680 && c <= 7957) || (c >= 7960 && c <= 7965) || (c >= 7968 && c <= 8005) || (c >= 8008 && c <= 8013) || (c >= 8016 && c <= 8023) || c === 8025 || c === 8027 || c === 8029 || (c >= 8031 && c <= 8061) || (c >= 8064 && c <= 8116) || (c >= 8118 && c <= 8124) || c === 8126 || (c >= 8130 && c <= 8132) || (c >= 8134 && c <= 8140) || (c >= 8144 && c <= 8147) || (c >= 8150 && c <= 8155) || (c >= 8160 && c <= 8172) || (c >= 8178 && c <= 8180) || (c >= 8182 && c <= 8188) || c === 8305 || c === 8319 || (c >= 8336 && c <= 8348) || c === 8450 || c === 8455 || (c >= 8458 && c <= 8467) || c === 8469 || (c >= 8473 && c <= 8477) || c === 8484 || c === 8486 || c === 8488 || (c >= 8490 && c <= 8493) || (c >= 8495 && c <= 8505) || (c >= 8508 && c <= 8511) || (c >= 8517 && c <= 8521) || c === 8526 || (c >= 8544 && c <= 8584) || (c >= 11264 && c <= 11310) || (c >= 11312 && c <= 11358) || (c >= 11360 && c <= 11492) || (c >= 11499 && c <= 11502) || (c >= 11506 && c <= 11507) || (c >= 11520 && c <= 11557) || c === 11559 || c === 11565 || (c >= 11568 && c <= 11623) || c === 11631 || (c >= 11648 && c <= 11670) || (c >= 11680 && c <= 11686) || (c >= 11688 && c <= 11694) || (c >= 11696 && c <= 11702) || (c >= 11704 && c <= 11710) || (c >= 11712 && c <= 11718) || (c >= 11720 && c <= 11726) || (c >= 11728 && c <= 11734) || (c >= 11736 && c <= 11742) || c === 11823 || (c >= 12293 && c <= 12295) || (c >= 12321 && c <= 12329) || (c >= 12337 && c <= 12341) || (c >= 12344 && c <= 12348) || (c >= 12353 && c <= 12438) || (c >= 12445 && c <= 12447) || (c >= 12449 && c <= 12538) || (c >= 12540 && c <= 12543) || (c >= 12549 && c <= 12589) || (c >= 12593 && c <= 12686) || (c >= 12704 && c <= 12730) || (c >= 12784 && c <= 12799) || (c >= 13312 && c <= 19893) || (c >= 19968 && c <= 40908) || (c >= 40960 && c <= 42124) || (c >= 42192 && c <= 42237) || (c >= 42240 && c <= 42508) || (c >= 42512 && c <= 42527) || (c >= 42538 && c <= 42539) || (c >= 42560 && c <= 42606) || (c >= 42623 && c <= 42647) || (c >= 42656 && c <= 42735) || (c >= 42775 && c <= 42783) || (c >= 42786 && c <= 42888) || (c >= 42891 && c <= 42894) || (c >= 42896 && c <= 42899) || (c >= 42912 && c <= 42922) || (c >= 43000 && c <= 43009) || (c >= 43011 && c <= 43013) || (c >= 43015 && c <= 43018) || (c >= 43020 && c <= 43042) || (c >= 43072 && c <= 43123) || (c >= 43138 && c <= 43187) || (c >= 43250 && c <= 43255) || c === 43259 || (c >= 43274 && c <= 43301) || (c >= 43312 && c <= 43334) || (c >= 43360 && c <= 43388) || (c >= 43396 && c <= 43442) || c === 43471 || (c >= 43520 && c <= 43560) || (c >= 43584 && c <= 43586) || (c >= 43588 && c <= 43595) || (c >= 43616 && c <= 43638) || c === 43642 || (c >= 43648 && c <= 43695) || c === 43697 || (c >= 43701 && c <= 43702) || (c >= 43705 && c <= 43709) || c === 43712 || c === 43714 || (c >= 43739 && c <= 43741) || (c >= 43744 && c <= 43754) || (c >= 43762 && c <= 43764) || (c >= 43777 && c <= 43782) || (c >= 43785 && c <= 43790) || (c >= 43793 && c <= 43798) || (c >= 43808 && c <= 43814) || (c >= 43816 && c <= 43822) || (c >= 43968 && c <= 44002) || (c >= 44032 && c <= 55203) || (c >= 55216 && c <= 55238) || (c >= 55243 && c <= 55291) || (c >= 63744 && c <= 64109) || (c >= 64112 && c <= 64217) || (c >= 64256 && c <= 64262) || (c >= 64275 && c <= 64279) || c === 64285 || (c >= 64287 && c <= 64296) || (c >= 64298 && c <= 64310) || (c >= 64312 && c <= 64316) || c === 64318 || (c >= 64320 && c <= 64321) || (c >= 64323 && c <= 64324) || (c >= 64326 && c <= 64433) || (c >= 64467 && c <= 64829) || (c >= 64848 && c <= 64911) || (c >= 64914 && c <= 64967) || (c >= 65008 && c <= 65019) || (c >= 65136 && c <= 65140) || (c >= 65142 && c <= 65276) || (c >= 65313 && c <= 65338) || (c >= 65345 && c <= 65370) || (c >= 65382 && c <= 65470) || (c >= 65474 && c <= 65479) || (c >= 65482 && c <= 65487) || (c >= 65490 && c <= 65495) || (c >= 65498 && c <= 65500)) {
                ret.state = 31;
            }
            else if ((c >= 768 && c <= 879) || (c >= 1155 && c <= 1159) || (c >= 1425 && c <= 1469) || c === 1471 || (c >= 1473 && c <= 1474) || (c >= 1476 && c <= 1477) || c === 1479 || (c >= 1552 && c <= 1562) || (c >= 1611 && c <= 1641) || c === 1648 || (c >= 1750 && c <= 1756) || (c >= 1759 && c <= 1764) || (c >= 1767 && c <= 1768) || (c >= 1770 && c <= 1773) || (c >= 1776 && c <= 1785) || c === 1809 || (c >= 1840 && c <= 1866) || (c >= 1958 && c <= 1968) || (c >= 1984 && c <= 1993) || (c >= 2027 && c <= 2035) || (c >= 2070 && c <= 2073) || (c >= 2075 && c <= 2083) || (c >= 2085 && c <= 2087) || (c >= 2089 && c <= 2093) || (c >= 2137 && c <= 2139) || (c >= 2276 && c <= 2302) || (c >= 2304 && c <= 2307) || (c >= 2362 && c <= 2364) || (c >= 2366 && c <= 2383) || (c >= 2385 && c <= 2391) || (c >= 2402 && c <= 2403) || (c >= 2406 && c <= 2415) || (c >= 2433 && c <= 2435) || c === 2492 || (c >= 2494 && c <= 2500) || (c >= 2503 && c <= 2504) || (c >= 2507 && c <= 2509) || c === 2519 || (c >= 2530 && c <= 2531) || (c >= 2534 && c <= 2543) || (c >= 2561 && c <= 2563) || c === 2620 || (c >= 2622 && c <= 2626) || (c >= 2631 && c <= 2632) || (c >= 2635 && c <= 2637) || c === 2641 || (c >= 2662 && c <= 2673) || c === 2677 || (c >= 2689 && c <= 2691) || c === 2748 || (c >= 2750 && c <= 2757) || (c >= 2759 && c <= 2761) || (c >= 2763 && c <= 2765) || (c >= 2786 && c <= 2787) || (c >= 2790 && c <= 2799) || (c >= 2817 && c <= 2819) || c === 2876 || (c >= 2878 && c <= 2884) || (c >= 2887 && c <= 2888) || (c >= 2891 && c <= 2893) || (c >= 2902 && c <= 2903) || (c >= 2914 && c <= 2915) || (c >= 2918 && c <= 2927) || c === 2946 || (c >= 3006 && c <= 3010) || (c >= 3014 && c <= 3016) || (c >= 3018 && c <= 3021) || c === 3031 || (c >= 3046 && c <= 3055) || (c >= 3073 && c <= 3075) || (c >= 3134 && c <= 3140) || (c >= 3142 && c <= 3144) || (c >= 3146 && c <= 3149) || (c >= 3157 && c <= 3158) || (c >= 3170 && c <= 3171) || (c >= 3174 && c <= 3183) || (c >= 3202 && c <= 3203) || c === 3260 || (c >= 3262 && c <= 3268) || (c >= 3270 && c <= 3272) || (c >= 3274 && c <= 3277) || (c >= 3285 && c <= 3286) || (c >= 3298 && c <= 3299) || (c >= 3302 && c <= 3311) || (c >= 3330 && c <= 3331) || (c >= 3390 && c <= 3396) || (c >= 3398 && c <= 3400) || (c >= 3402 && c <= 3405) || c === 3415 || (c >= 3426 && c <= 3427) || (c >= 3430 && c <= 3439) || (c >= 3458 && c <= 3459) || c === 3530 || (c >= 3535 && c <= 3540) || c === 3542 || (c >= 3544 && c <= 3551) || (c >= 3570 && c <= 3571) || c === 3633 || (c >= 3636 && c <= 3642) || (c >= 3655 && c <= 3662) || (c >= 3664 && c <= 3673) || c === 3761 || (c >= 3764 && c <= 3769) || (c >= 3771 && c <= 3772) || (c >= 3784 && c <= 3789) || (c >= 3792 && c <= 3801) || (c >= 3864 && c <= 3865) || (c >= 3872 && c <= 3881) || c === 3893 || c === 3895 || c === 3897 || (c >= 3902 && c <= 3903) || (c >= 3953 && c <= 3972) || (c >= 3974 && c <= 3975) || (c >= 3981 && c <= 3991) || (c >= 3993 && c <= 4028) || c === 4038 || (c >= 4139 && c <= 4158) || (c >= 4160 && c <= 4169) || (c >= 4182 && c <= 4185) || (c >= 4190 && c <= 4192) || (c >= 4194 && c <= 4196) || (c >= 4199 && c <= 4205) || (c >= 4209 && c <= 4212) || (c >= 4226 && c <= 4237) || (c >= 4239 && c <= 4253) || (c >= 4957 && c <= 4959) || (c >= 5906 && c <= 5908) || (c >= 5938 && c <= 5940) || (c >= 5970 && c <= 5971) || (c >= 6002 && c <= 6003) || (c >= 6068 && c <= 6099) || c === 6109 || (c >= 6112 && c <= 6121) || (c >= 6155 && c <= 6157) || (c >= 6160 && c <= 6169) || c === 6313 || (c >= 6432 && c <= 6443) || (c >= 6448 && c <= 6459) || (c >= 6470 && c <= 6479) || (c >= 6576 && c <= 6592) || (c >= 6600 && c <= 6601) || (c >= 6608 && c <= 6617) || (c >= 6679 && c <= 6683) || (c >= 6741 && c <= 6750) || (c >= 6752 && c <= 6780) || (c >= 6783 && c <= 6793) || (c >= 6800 && c <= 6809) || (c >= 6912 && c <= 6916) || (c >= 6964 && c <= 6980) || (c >= 6992 && c <= 7001) || (c >= 7019 && c <= 7027) || (c >= 7040 && c <= 7042) || (c >= 7073 && c <= 7085) || (c >= 7088 && c <= 7097) || (c >= 7142 && c <= 7155) || (c >= 7204 && c <= 7223) || (c >= 7232 && c <= 7241) || (c >= 7248 && c <= 7257) || (c >= 7376 && c <= 7378) || (c >= 7380 && c <= 7400) || c === 7405 || (c >= 7410 && c <= 7412) || (c >= 7616 && c <= 7654) || (c >= 7676 && c <= 7679) || (c >= 8204 && c <= 8205) || (c >= 8255 && c <= 8256) || c === 8276 || (c >= 8400 && c <= 8412) || c === 8417 || (c >= 8421 && c <= 8432) || (c >= 11503 && c <= 11505) || c === 11647 || (c >= 11744 && c <= 11775) || (c >= 12330 && c <= 12335) || (c >= 12441 && c <= 12442) || (c >= 42528 && c <= 42537) || c === 42607 || (c >= 42612 && c <= 42621) || c === 42655 || (c >= 42736 && c <= 42737) || c === 43010 || c === 43014 || c === 43019 || (c >= 43043 && c <= 43047) || (c >= 43136 && c <= 43137) || (c >= 43188 && c <= 43204) || (c >= 43216 && c <= 43225) || (c >= 43232 && c <= 43249) || (c >= 43264 && c <= 43273) || (c >= 43302 && c <= 43309) || (c >= 43335 && c <= 43347) || (c >= 43392 && c <= 43395) || (c >= 43443 && c <= 43456) || (c >= 43472 && c <= 43481) || (c >= 43561 && c <= 43574) || c === 43587 || (c >= 43596 && c <= 43597) || (c >= 43600 && c <= 43609) || c === 43643 || c === 43696 || (c >= 43698 && c <= 43700) || (c >= 43703 && c <= 43704) || (c >= 43710 && c <= 43711) || c === 43713 || (c >= 43755 && c <= 43759) || (c >= 43765 && c <= 43766) || (c >= 44003 && c <= 44010) || (c >= 44012 && c <= 44013) || (c >= 44016 && c <= 44025) || c === 64286 || (c >= 65024 && c <= 65039) || (c >= 65056 && c <= 65062) || (c >= 65075 && c <= 65076) || (c >= 65101 && c <= 65103) || (c >= 65296 && c <= 65305) || c === 65343) {
                ret.state = 32;
            }
            else {
                ret.state = -1;
            }
            break;
        case 26:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 91) || c >= 93) {
                ret.state = 26;
            }
            else if (c === 34) {
                ret.state = 27;
            }
            else if (c === 92) {
                ret.state = 28;
            }
            else {
                ret.state = -1;
            }
            break;
        case 27:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 28:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 34 || c === 39 || c === 92 || c === 98 || c === 102 || c === 110 || c === 114 || c === 116) {
                ret.state = 50;
            }
            else if (c === 117 || c === 120) {
                ret.state = 51;
            }
            else {
                ret.state = -1;
            }
            break;
        case 29:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c === 36 || (c >= 65 && c <= 90) || c === 95 || (c >= 97 && c <= 122)) {
                ret.state = 29;
            }
            else if ((c >= 48 && c <= 57)) {
                ret.state = 30;
            }
            else if (c === 170 || c === 181 || c === 186 || (c >= 192 && c <= 214) || (c >= 216 && c <= 246) || (c >= 248 && c <= 705) || (c >= 710 && c <= 721) || (c >= 736 && c <= 740) || c === 748 || c === 750 || (c >= 880 && c <= 884) || (c >= 886 && c <= 887) || (c >= 890 && c <= 893) || c === 902 || (c >= 904 && c <= 906) || c === 908 || (c >= 910 && c <= 929) || (c >= 931 && c <= 1013) || (c >= 1015 && c <= 1153) || (c >= 1162 && c <= 1319) || (c >= 1329 && c <= 1366) || c === 1369 || (c >= 1377 && c <= 1415) || (c >= 1488 && c <= 1514) || (c >= 1520 && c <= 1522) || (c >= 1568 && c <= 1610) || (c >= 1646 && c <= 1647) || (c >= 1649 && c <= 1747) || c === 1749 || (c >= 1765 && c <= 1766) || (c >= 1774 && c <= 1775) || (c >= 1786 && c <= 1788) || c === 1791 || c === 1808 || (c >= 1810 && c <= 1839) || (c >= 1869 && c <= 1957) || c === 1969 || (c >= 1994 && c <= 2026) || (c >= 2036 && c <= 2037) || c === 2042 || (c >= 2048 && c <= 2069) || c === 2074 || c === 2084 || c === 2088 || (c >= 2112 && c <= 2136) || c === 2208 || (c >= 2210 && c <= 2220) || (c >= 2308 && c <= 2361) || c === 2365 || c === 2384 || (c >= 2392 && c <= 2401) || (c >= 2417 && c <= 2423) || (c >= 2425 && c <= 2431) || (c >= 2437 && c <= 2444) || (c >= 2447 && c <= 2448) || (c >= 2451 && c <= 2472) || (c >= 2474 && c <= 2480) || c === 2482 || (c >= 2486 && c <= 2489) || c === 2493 || c === 2510 || (c >= 2524 && c <= 2525) || (c >= 2527 && c <= 2529) || (c >= 2544 && c <= 2545) || (c >= 2565 && c <= 2570) || (c >= 2575 && c <= 2576) || (c >= 2579 && c <= 2600) || (c >= 2602 && c <= 2608) || (c >= 2610 && c <= 2611) || (c >= 2613 && c <= 2614) || (c >= 2616 && c <= 2617) || (c >= 2649 && c <= 2652) || c === 2654 || (c >= 2674 && c <= 2676) || (c >= 2693 && c <= 2701) || (c >= 2703 && c <= 2705) || (c >= 2707 && c <= 2728) || (c >= 2730 && c <= 2736) || (c >= 2738 && c <= 2739) || (c >= 2741 && c <= 2745) || c === 2749 || c === 2768 || (c >= 2784 && c <= 2785) || (c >= 2821 && c <= 2828) || (c >= 2831 && c <= 2832) || (c >= 2835 && c <= 2856) || (c >= 2858 && c <= 2864) || (c >= 2866 && c <= 2867) || (c >= 2869 && c <= 2873) || c === 2877 || (c >= 2908 && c <= 2909) || (c >= 2911 && c <= 2913) || c === 2929 || c === 2947 || (c >= 2949 && c <= 2954) || (c >= 2958 && c <= 2960) || (c >= 2962 && c <= 2965) || (c >= 2969 && c <= 2970) || c === 2972 || (c >= 2974 && c <= 2975) || (c >= 2979 && c <= 2980) || (c >= 2984 && c <= 2986) || (c >= 2990 && c <= 3001) || c === 3024 || (c >= 3077 && c <= 3084) || (c >= 3086 && c <= 3088) || (c >= 3090 && c <= 3112) || (c >= 3114 && c <= 3123) || (c >= 3125 && c <= 3129) || c === 3133 || (c >= 3160 && c <= 3161) || (c >= 3168 && c <= 3169) || (c >= 3205 && c <= 3212) || (c >= 3214 && c <= 3216) || (c >= 3218 && c <= 3240) || (c >= 3242 && c <= 3251) || (c >= 3253 && c <= 3257) || c === 3261 || c === 3294 || (c >= 3296 && c <= 3297) || (c >= 3313 && c <= 3314) || (c >= 3333 && c <= 3340) || (c >= 3342 && c <= 3344) || (c >= 3346 && c <= 3386) || c === 3389 || c === 3406 || (c >= 3424 && c <= 3425) || (c >= 3450 && c <= 3455) || (c >= 3461 && c <= 3478) || (c >= 3482 && c <= 3505) || (c >= 3507 && c <= 3515) || c === 3517 || (c >= 3520 && c <= 3526) || (c >= 3585 && c <= 3632) || (c >= 3634 && c <= 3635) || (c >= 3648 && c <= 3654) || (c >= 3713 && c <= 3714) || c === 3716 || (c >= 3719 && c <= 3720) || c === 3722 || c === 3725 || (c >= 3732 && c <= 3735) || (c >= 3737 && c <= 3743) || (c >= 3745 && c <= 3747) || c === 3749 || c === 3751 || (c >= 3754 && c <= 3755) || (c >= 3757 && c <= 3760) || (c >= 3762 && c <= 3763) || c === 3773 || (c >= 3776 && c <= 3780) || c === 3782 || (c >= 3804 && c <= 3807) || c === 3840 || (c >= 3904 && c <= 3911) || (c >= 3913 && c <= 3948) || (c >= 3976 && c <= 3980) || (c >= 4096 && c <= 4138) || c === 4159 || (c >= 4176 && c <= 4181) || (c >= 4186 && c <= 4189) || c === 4193 || (c >= 4197 && c <= 4198) || (c >= 4206 && c <= 4208) || (c >= 4213 && c <= 4225) || c === 4238 || (c >= 4256 && c <= 4293) || c === 4295 || c === 4301 || (c >= 4304 && c <= 4346) || (c >= 4348 && c <= 4680) || (c >= 4682 && c <= 4685) || (c >= 4688 && c <= 4694) || c === 4696 || (c >= 4698 && c <= 4701) || (c >= 4704 && c <= 4744) || (c >= 4746 && c <= 4749) || (c >= 4752 && c <= 4784) || (c >= 4786 && c <= 4789) || (c >= 4792 && c <= 4798) || c === 4800 || (c >= 4802 && c <= 4805) || (c >= 4808 && c <= 4822) || (c >= 4824 && c <= 4880) || (c >= 4882 && c <= 4885) || (c >= 4888 && c <= 4954) || (c >= 4992 && c <= 5007) || (c >= 5024 && c <= 5108) || (c >= 5121 && c <= 5740) || (c >= 5743 && c <= 5759) || (c >= 5761 && c <= 5786) || (c >= 5792 && c <= 5866) || (c >= 5870 && c <= 5872) || (c >= 5888 && c <= 5900) || (c >= 5902 && c <= 5905) || (c >= 5920 && c <= 5937) || (c >= 5952 && c <= 5969) || (c >= 5984 && c <= 5996) || (c >= 5998 && c <= 6000) || (c >= 6016 && c <= 6067) || c === 6103 || c === 6108 || (c >= 6176 && c <= 6263) || (c >= 6272 && c <= 6312) || c === 6314 || (c >= 6320 && c <= 6389) || (c >= 6400 && c <= 6428) || (c >= 6480 && c <= 6509) || (c >= 6512 && c <= 6516) || (c >= 6528 && c <= 6571) || (c >= 6593 && c <= 6599) || (c >= 6656 && c <= 6678) || (c >= 6688 && c <= 6740) || c === 6823 || (c >= 6917 && c <= 6963) || (c >= 6981 && c <= 6987) || (c >= 7043 && c <= 7072) || (c >= 7086 && c <= 7087) || (c >= 7098 && c <= 7141) || (c >= 7168 && c <= 7203) || (c >= 7245 && c <= 7247) || (c >= 7258 && c <= 7293) || (c >= 7401 && c <= 7404) || (c >= 7406 && c <= 7409) || (c >= 7413 && c <= 7414) || (c >= 7424 && c <= 7615) || (c >= 7680 && c <= 7957) || (c >= 7960 && c <= 7965) || (c >= 7968 && c <= 8005) || (c >= 8008 && c <= 8013) || (c >= 8016 && c <= 8023) || c === 8025 || c === 8027 || c === 8029 || (c >= 8031 && c <= 8061) || (c >= 8064 && c <= 8116) || (c >= 8118 && c <= 8124) || c === 8126 || (c >= 8130 && c <= 8132) || (c >= 8134 && c <= 8140) || (c >= 8144 && c <= 8147) || (c >= 8150 && c <= 8155) || (c >= 8160 && c <= 8172) || (c >= 8178 && c <= 8180) || (c >= 8182 && c <= 8188) || c === 8305 || c === 8319 || (c >= 8336 && c <= 8348) || c === 8450 || c === 8455 || (c >= 8458 && c <= 8467) || c === 8469 || (c >= 8473 && c <= 8477) || c === 8484 || c === 8486 || c === 8488 || (c >= 8490 && c <= 8493) || (c >= 8495 && c <= 8505) || (c >= 8508 && c <= 8511) || (c >= 8517 && c <= 8521) || c === 8526 || (c >= 8544 && c <= 8584) || (c >= 11264 && c <= 11310) || (c >= 11312 && c <= 11358) || (c >= 11360 && c <= 11492) || (c >= 11499 && c <= 11502) || (c >= 11506 && c <= 11507) || (c >= 11520 && c <= 11557) || c === 11559 || c === 11565 || (c >= 11568 && c <= 11623) || c === 11631 || (c >= 11648 && c <= 11670) || (c >= 11680 && c <= 11686) || (c >= 11688 && c <= 11694) || (c >= 11696 && c <= 11702) || (c >= 11704 && c <= 11710) || (c >= 11712 && c <= 11718) || (c >= 11720 && c <= 11726) || (c >= 11728 && c <= 11734) || (c >= 11736 && c <= 11742) || c === 11823 || (c >= 12293 && c <= 12295) || (c >= 12321 && c <= 12329) || (c >= 12337 && c <= 12341) || (c >= 12344 && c <= 12348) || (c >= 12353 && c <= 12438) || (c >= 12445 && c <= 12447) || (c >= 12449 && c <= 12538) || (c >= 12540 && c <= 12543) || (c >= 12549 && c <= 12589) || (c >= 12593 && c <= 12686) || (c >= 12704 && c <= 12730) || (c >= 12784 && c <= 12799) || (c >= 13312 && c <= 19893) || (c >= 19968 && c <= 40908) || (c >= 40960 && c <= 42124) || (c >= 42192 && c <= 42237) || (c >= 42240 && c <= 42508) || (c >= 42512 && c <= 42527) || (c >= 42538 && c <= 42539) || (c >= 42560 && c <= 42606) || (c >= 42623 && c <= 42647) || (c >= 42656 && c <= 42735) || (c >= 42775 && c <= 42783) || (c >= 42786 && c <= 42888) || (c >= 42891 && c <= 42894) || (c >= 42896 && c <= 42899) || (c >= 42912 && c <= 42922) || (c >= 43000 && c <= 43009) || (c >= 43011 && c <= 43013) || (c >= 43015 && c <= 43018) || (c >= 43020 && c <= 43042) || (c >= 43072 && c <= 43123) || (c >= 43138 && c <= 43187) || (c >= 43250 && c <= 43255) || c === 43259 || (c >= 43274 && c <= 43301) || (c >= 43312 && c <= 43334) || (c >= 43360 && c <= 43388) || (c >= 43396 && c <= 43442) || c === 43471 || (c >= 43520 && c <= 43560) || (c >= 43584 && c <= 43586) || (c >= 43588 && c <= 43595) || (c >= 43616 && c <= 43638) || c === 43642 || (c >= 43648 && c <= 43695) || c === 43697 || (c >= 43701 && c <= 43702) || (c >= 43705 && c <= 43709) || c === 43712 || c === 43714 || (c >= 43739 && c <= 43741) || (c >= 43744 && c <= 43754) || (c >= 43762 && c <= 43764) || (c >= 43777 && c <= 43782) || (c >= 43785 && c <= 43790) || (c >= 43793 && c <= 43798) || (c >= 43808 && c <= 43814) || (c >= 43816 && c <= 43822) || (c >= 43968 && c <= 44002) || (c >= 44032 && c <= 55203) || (c >= 55216 && c <= 55238) || (c >= 55243 && c <= 55291) || (c >= 63744 && c <= 64109) || (c >= 64112 && c <= 64217) || (c >= 64256 && c <= 64262) || (c >= 64275 && c <= 64279) || c === 64285 || (c >= 64287 && c <= 64296) || (c >= 64298 && c <= 64310) || (c >= 64312 && c <= 64316) || c === 64318 || (c >= 64320 && c <= 64321) || (c >= 64323 && c <= 64324) || (c >= 64326 && c <= 64433) || (c >= 64467 && c <= 64829) || (c >= 64848 && c <= 64911) || (c >= 64914 && c <= 64967) || (c >= 65008 && c <= 65019) || (c >= 65136 && c <= 65140) || (c >= 65142 && c <= 65276) || (c >= 65313 && c <= 65338) || (c >= 65345 && c <= 65370) || (c >= 65382 && c <= 65470) || (c >= 65474 && c <= 65479) || (c >= 65482 && c <= 65487) || (c >= 65490 && c <= 65495) || (c >= 65498 && c <= 65500)) {
                ret.state = 31;
            }
            else if ((c >= 768 && c <= 879) || (c >= 1155 && c <= 1159) || (c >= 1425 && c <= 1469) || c === 1471 || (c >= 1473 && c <= 1474) || (c >= 1476 && c <= 1477) || c === 1479 || (c >= 1552 && c <= 1562) || (c >= 1611 && c <= 1641) || c === 1648 || (c >= 1750 && c <= 1756) || (c >= 1759 && c <= 1764) || (c >= 1767 && c <= 1768) || (c >= 1770 && c <= 1773) || (c >= 1776 && c <= 1785) || c === 1809 || (c >= 1840 && c <= 1866) || (c >= 1958 && c <= 1968) || (c >= 1984 && c <= 1993) || (c >= 2027 && c <= 2035) || (c >= 2070 && c <= 2073) || (c >= 2075 && c <= 2083) || (c >= 2085 && c <= 2087) || (c >= 2089 && c <= 2093) || (c >= 2137 && c <= 2139) || (c >= 2276 && c <= 2302) || (c >= 2304 && c <= 2307) || (c >= 2362 && c <= 2364) || (c >= 2366 && c <= 2383) || (c >= 2385 && c <= 2391) || (c >= 2402 && c <= 2403) || (c >= 2406 && c <= 2415) || (c >= 2433 && c <= 2435) || c === 2492 || (c >= 2494 && c <= 2500) || (c >= 2503 && c <= 2504) || (c >= 2507 && c <= 2509) || c === 2519 || (c >= 2530 && c <= 2531) || (c >= 2534 && c <= 2543) || (c >= 2561 && c <= 2563) || c === 2620 || (c >= 2622 && c <= 2626) || (c >= 2631 && c <= 2632) || (c >= 2635 && c <= 2637) || c === 2641 || (c >= 2662 && c <= 2673) || c === 2677 || (c >= 2689 && c <= 2691) || c === 2748 || (c >= 2750 && c <= 2757) || (c >= 2759 && c <= 2761) || (c >= 2763 && c <= 2765) || (c >= 2786 && c <= 2787) || (c >= 2790 && c <= 2799) || (c >= 2817 && c <= 2819) || c === 2876 || (c >= 2878 && c <= 2884) || (c >= 2887 && c <= 2888) || (c >= 2891 && c <= 2893) || (c >= 2902 && c <= 2903) || (c >= 2914 && c <= 2915) || (c >= 2918 && c <= 2927) || c === 2946 || (c >= 3006 && c <= 3010) || (c >= 3014 && c <= 3016) || (c >= 3018 && c <= 3021) || c === 3031 || (c >= 3046 && c <= 3055) || (c >= 3073 && c <= 3075) || (c >= 3134 && c <= 3140) || (c >= 3142 && c <= 3144) || (c >= 3146 && c <= 3149) || (c >= 3157 && c <= 3158) || (c >= 3170 && c <= 3171) || (c >= 3174 && c <= 3183) || (c >= 3202 && c <= 3203) || c === 3260 || (c >= 3262 && c <= 3268) || (c >= 3270 && c <= 3272) || (c >= 3274 && c <= 3277) || (c >= 3285 && c <= 3286) || (c >= 3298 && c <= 3299) || (c >= 3302 && c <= 3311) || (c >= 3330 && c <= 3331) || (c >= 3390 && c <= 3396) || (c >= 3398 && c <= 3400) || (c >= 3402 && c <= 3405) || c === 3415 || (c >= 3426 && c <= 3427) || (c >= 3430 && c <= 3439) || (c >= 3458 && c <= 3459) || c === 3530 || (c >= 3535 && c <= 3540) || c === 3542 || (c >= 3544 && c <= 3551) || (c >= 3570 && c <= 3571) || c === 3633 || (c >= 3636 && c <= 3642) || (c >= 3655 && c <= 3662) || (c >= 3664 && c <= 3673) || c === 3761 || (c >= 3764 && c <= 3769) || (c >= 3771 && c <= 3772) || (c >= 3784 && c <= 3789) || (c >= 3792 && c <= 3801) || (c >= 3864 && c <= 3865) || (c >= 3872 && c <= 3881) || c === 3893 || c === 3895 || c === 3897 || (c >= 3902 && c <= 3903) || (c >= 3953 && c <= 3972) || (c >= 3974 && c <= 3975) || (c >= 3981 && c <= 3991) || (c >= 3993 && c <= 4028) || c === 4038 || (c >= 4139 && c <= 4158) || (c >= 4160 && c <= 4169) || (c >= 4182 && c <= 4185) || (c >= 4190 && c <= 4192) || (c >= 4194 && c <= 4196) || (c >= 4199 && c <= 4205) || (c >= 4209 && c <= 4212) || (c >= 4226 && c <= 4237) || (c >= 4239 && c <= 4253) || (c >= 4957 && c <= 4959) || (c >= 5906 && c <= 5908) || (c >= 5938 && c <= 5940) || (c >= 5970 && c <= 5971) || (c >= 6002 && c <= 6003) || (c >= 6068 && c <= 6099) || c === 6109 || (c >= 6112 && c <= 6121) || (c >= 6155 && c <= 6157) || (c >= 6160 && c <= 6169) || c === 6313 || (c >= 6432 && c <= 6443) || (c >= 6448 && c <= 6459) || (c >= 6470 && c <= 6479) || (c >= 6576 && c <= 6592) || (c >= 6600 && c <= 6601) || (c >= 6608 && c <= 6617) || (c >= 6679 && c <= 6683) || (c >= 6741 && c <= 6750) || (c >= 6752 && c <= 6780) || (c >= 6783 && c <= 6793) || (c >= 6800 && c <= 6809) || (c >= 6912 && c <= 6916) || (c >= 6964 && c <= 6980) || (c >= 6992 && c <= 7001) || (c >= 7019 && c <= 7027) || (c >= 7040 && c <= 7042) || (c >= 7073 && c <= 7085) || (c >= 7088 && c <= 7097) || (c >= 7142 && c <= 7155) || (c >= 7204 && c <= 7223) || (c >= 7232 && c <= 7241) || (c >= 7248 && c <= 7257) || (c >= 7376 && c <= 7378) || (c >= 7380 && c <= 7400) || c === 7405 || (c >= 7410 && c <= 7412) || (c >= 7616 && c <= 7654) || (c >= 7676 && c <= 7679) || (c >= 8204 && c <= 8205) || (c >= 8255 && c <= 8256) || c === 8276 || (c >= 8400 && c <= 8412) || c === 8417 || (c >= 8421 && c <= 8432) || (c >= 11503 && c <= 11505) || c === 11647 || (c >= 11744 && c <= 11775) || (c >= 12330 && c <= 12335) || (c >= 12441 && c <= 12442) || (c >= 42528 && c <= 42537) || c === 42607 || (c >= 42612 && c <= 42621) || c === 42655 || (c >= 42736 && c <= 42737) || c === 43010 || c === 43014 || c === 43019 || (c >= 43043 && c <= 43047) || (c >= 43136 && c <= 43137) || (c >= 43188 && c <= 43204) || (c >= 43216 && c <= 43225) || (c >= 43232 && c <= 43249) || (c >= 43264 && c <= 43273) || (c >= 43302 && c <= 43309) || (c >= 43335 && c <= 43347) || (c >= 43392 && c <= 43395) || (c >= 43443 && c <= 43456) || (c >= 43472 && c <= 43481) || (c >= 43561 && c <= 43574) || c === 43587 || (c >= 43596 && c <= 43597) || (c >= 43600 && c <= 43609) || c === 43643 || c === 43696 || (c >= 43698 && c <= 43700) || (c >= 43703 && c <= 43704) || (c >= 43710 && c <= 43711) || c === 43713 || (c >= 43755 && c <= 43759) || (c >= 43765 && c <= 43766) || (c >= 44003 && c <= 44010) || (c >= 44012 && c <= 44013) || (c >= 44016 && c <= 44025) || c === 64286 || (c >= 65024 && c <= 65039) || (c >= 65056 && c <= 65062) || (c >= 65075 && c <= 65076) || (c >= 65101 && c <= 65103) || (c >= 65296 && c <= 65305) || c === 65343) {
                ret.state = 32;
            }
            else {
                ret.state = -1;
            }
            break;
        case 30:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c === 36 || (c >= 65 && c <= 90) || c === 95 || (c >= 97 && c <= 122)) {
                ret.state = 29;
            }
            else if ((c >= 48 && c <= 57)) {
                ret.state = 30;
            }
            else if (c === 170 || c === 181 || c === 186 || (c >= 192 && c <= 214) || (c >= 216 && c <= 246) || (c >= 248 && c <= 705) || (c >= 710 && c <= 721) || (c >= 736 && c <= 740) || c === 748 || c === 750 || (c >= 880 && c <= 884) || (c >= 886 && c <= 887) || (c >= 890 && c <= 893) || c === 902 || (c >= 904 && c <= 906) || c === 908 || (c >= 910 && c <= 929) || (c >= 931 && c <= 1013) || (c >= 1015 && c <= 1153) || (c >= 1162 && c <= 1319) || (c >= 1329 && c <= 1366) || c === 1369 || (c >= 1377 && c <= 1415) || (c >= 1488 && c <= 1514) || (c >= 1520 && c <= 1522) || (c >= 1568 && c <= 1610) || (c >= 1646 && c <= 1647) || (c >= 1649 && c <= 1747) || c === 1749 || (c >= 1765 && c <= 1766) || (c >= 1774 && c <= 1775) || (c >= 1786 && c <= 1788) || c === 1791 || c === 1808 || (c >= 1810 && c <= 1839) || (c >= 1869 && c <= 1957) || c === 1969 || (c >= 1994 && c <= 2026) || (c >= 2036 && c <= 2037) || c === 2042 || (c >= 2048 && c <= 2069) || c === 2074 || c === 2084 || c === 2088 || (c >= 2112 && c <= 2136) || c === 2208 || (c >= 2210 && c <= 2220) || (c >= 2308 && c <= 2361) || c === 2365 || c === 2384 || (c >= 2392 && c <= 2401) || (c >= 2417 && c <= 2423) || (c >= 2425 && c <= 2431) || (c >= 2437 && c <= 2444) || (c >= 2447 && c <= 2448) || (c >= 2451 && c <= 2472) || (c >= 2474 && c <= 2480) || c === 2482 || (c >= 2486 && c <= 2489) || c === 2493 || c === 2510 || (c >= 2524 && c <= 2525) || (c >= 2527 && c <= 2529) || (c >= 2544 && c <= 2545) || (c >= 2565 && c <= 2570) || (c >= 2575 && c <= 2576) || (c >= 2579 && c <= 2600) || (c >= 2602 && c <= 2608) || (c >= 2610 && c <= 2611) || (c >= 2613 && c <= 2614) || (c >= 2616 && c <= 2617) || (c >= 2649 && c <= 2652) || c === 2654 || (c >= 2674 && c <= 2676) || (c >= 2693 && c <= 2701) || (c >= 2703 && c <= 2705) || (c >= 2707 && c <= 2728) || (c >= 2730 && c <= 2736) || (c >= 2738 && c <= 2739) || (c >= 2741 && c <= 2745) || c === 2749 || c === 2768 || (c >= 2784 && c <= 2785) || (c >= 2821 && c <= 2828) || (c >= 2831 && c <= 2832) || (c >= 2835 && c <= 2856) || (c >= 2858 && c <= 2864) || (c >= 2866 && c <= 2867) || (c >= 2869 && c <= 2873) || c === 2877 || (c >= 2908 && c <= 2909) || (c >= 2911 && c <= 2913) || c === 2929 || c === 2947 || (c >= 2949 && c <= 2954) || (c >= 2958 && c <= 2960) || (c >= 2962 && c <= 2965) || (c >= 2969 && c <= 2970) || c === 2972 || (c >= 2974 && c <= 2975) || (c >= 2979 && c <= 2980) || (c >= 2984 && c <= 2986) || (c >= 2990 && c <= 3001) || c === 3024 || (c >= 3077 && c <= 3084) || (c >= 3086 && c <= 3088) || (c >= 3090 && c <= 3112) || (c >= 3114 && c <= 3123) || (c >= 3125 && c <= 3129) || c === 3133 || (c >= 3160 && c <= 3161) || (c >= 3168 && c <= 3169) || (c >= 3205 && c <= 3212) || (c >= 3214 && c <= 3216) || (c >= 3218 && c <= 3240) || (c >= 3242 && c <= 3251) || (c >= 3253 && c <= 3257) || c === 3261 || c === 3294 || (c >= 3296 && c <= 3297) || (c >= 3313 && c <= 3314) || (c >= 3333 && c <= 3340) || (c >= 3342 && c <= 3344) || (c >= 3346 && c <= 3386) || c === 3389 || c === 3406 || (c >= 3424 && c <= 3425) || (c >= 3450 && c <= 3455) || (c >= 3461 && c <= 3478) || (c >= 3482 && c <= 3505) || (c >= 3507 && c <= 3515) || c === 3517 || (c >= 3520 && c <= 3526) || (c >= 3585 && c <= 3632) || (c >= 3634 && c <= 3635) || (c >= 3648 && c <= 3654) || (c >= 3713 && c <= 3714) || c === 3716 || (c >= 3719 && c <= 3720) || c === 3722 || c === 3725 || (c >= 3732 && c <= 3735) || (c >= 3737 && c <= 3743) || (c >= 3745 && c <= 3747) || c === 3749 || c === 3751 || (c >= 3754 && c <= 3755) || (c >= 3757 && c <= 3760) || (c >= 3762 && c <= 3763) || c === 3773 || (c >= 3776 && c <= 3780) || c === 3782 || (c >= 3804 && c <= 3807) || c === 3840 || (c >= 3904 && c <= 3911) || (c >= 3913 && c <= 3948) || (c >= 3976 && c <= 3980) || (c >= 4096 && c <= 4138) || c === 4159 || (c >= 4176 && c <= 4181) || (c >= 4186 && c <= 4189) || c === 4193 || (c >= 4197 && c <= 4198) || (c >= 4206 && c <= 4208) || (c >= 4213 && c <= 4225) || c === 4238 || (c >= 4256 && c <= 4293) || c === 4295 || c === 4301 || (c >= 4304 && c <= 4346) || (c >= 4348 && c <= 4680) || (c >= 4682 && c <= 4685) || (c >= 4688 && c <= 4694) || c === 4696 || (c >= 4698 && c <= 4701) || (c >= 4704 && c <= 4744) || (c >= 4746 && c <= 4749) || (c >= 4752 && c <= 4784) || (c >= 4786 && c <= 4789) || (c >= 4792 && c <= 4798) || c === 4800 || (c >= 4802 && c <= 4805) || (c >= 4808 && c <= 4822) || (c >= 4824 && c <= 4880) || (c >= 4882 && c <= 4885) || (c >= 4888 && c <= 4954) || (c >= 4992 && c <= 5007) || (c >= 5024 && c <= 5108) || (c >= 5121 && c <= 5740) || (c >= 5743 && c <= 5759) || (c >= 5761 && c <= 5786) || (c >= 5792 && c <= 5866) || (c >= 5870 && c <= 5872) || (c >= 5888 && c <= 5900) || (c >= 5902 && c <= 5905) || (c >= 5920 && c <= 5937) || (c >= 5952 && c <= 5969) || (c >= 5984 && c <= 5996) || (c >= 5998 && c <= 6000) || (c >= 6016 && c <= 6067) || c === 6103 || c === 6108 || (c >= 6176 && c <= 6263) || (c >= 6272 && c <= 6312) || c === 6314 || (c >= 6320 && c <= 6389) || (c >= 6400 && c <= 6428) || (c >= 6480 && c <= 6509) || (c >= 6512 && c <= 6516) || (c >= 6528 && c <= 6571) || (c >= 6593 && c <= 6599) || (c >= 6656 && c <= 6678) || (c >= 6688 && c <= 6740) || c === 6823 || (c >= 6917 && c <= 6963) || (c >= 6981 && c <= 6987) || (c >= 7043 && c <= 7072) || (c >= 7086 && c <= 7087) || (c >= 7098 && c <= 7141) || (c >= 7168 && c <= 7203) || (c >= 7245 && c <= 7247) || (c >= 7258 && c <= 7293) || (c >= 7401 && c <= 7404) || (c >= 7406 && c <= 7409) || (c >= 7413 && c <= 7414) || (c >= 7424 && c <= 7615) || (c >= 7680 && c <= 7957) || (c >= 7960 && c <= 7965) || (c >= 7968 && c <= 8005) || (c >= 8008 && c <= 8013) || (c >= 8016 && c <= 8023) || c === 8025 || c === 8027 || c === 8029 || (c >= 8031 && c <= 8061) || (c >= 8064 && c <= 8116) || (c >= 8118 && c <= 8124) || c === 8126 || (c >= 8130 && c <= 8132) || (c >= 8134 && c <= 8140) || (c >= 8144 && c <= 8147) || (c >= 8150 && c <= 8155) || (c >= 8160 && c <= 8172) || (c >= 8178 && c <= 8180) || (c >= 8182 && c <= 8188) || c === 8305 || c === 8319 || (c >= 8336 && c <= 8348) || c === 8450 || c === 8455 || (c >= 8458 && c <= 8467) || c === 8469 || (c >= 8473 && c <= 8477) || c === 8484 || c === 8486 || c === 8488 || (c >= 8490 && c <= 8493) || (c >= 8495 && c <= 8505) || (c >= 8508 && c <= 8511) || (c >= 8517 && c <= 8521) || c === 8526 || (c >= 8544 && c <= 8584) || (c >= 11264 && c <= 11310) || (c >= 11312 && c <= 11358) || (c >= 11360 && c <= 11492) || (c >= 11499 && c <= 11502) || (c >= 11506 && c <= 11507) || (c >= 11520 && c <= 11557) || c === 11559 || c === 11565 || (c >= 11568 && c <= 11623) || c === 11631 || (c >= 11648 && c <= 11670) || (c >= 11680 && c <= 11686) || (c >= 11688 && c <= 11694) || (c >= 11696 && c <= 11702) || (c >= 11704 && c <= 11710) || (c >= 11712 && c <= 11718) || (c >= 11720 && c <= 11726) || (c >= 11728 && c <= 11734) || (c >= 11736 && c <= 11742) || c === 11823 || (c >= 12293 && c <= 12295) || (c >= 12321 && c <= 12329) || (c >= 12337 && c <= 12341) || (c >= 12344 && c <= 12348) || (c >= 12353 && c <= 12438) || (c >= 12445 && c <= 12447) || (c >= 12449 && c <= 12538) || (c >= 12540 && c <= 12543) || (c >= 12549 && c <= 12589) || (c >= 12593 && c <= 12686) || (c >= 12704 && c <= 12730) || (c >= 12784 && c <= 12799) || (c >= 13312 && c <= 19893) || (c >= 19968 && c <= 40908) || (c >= 40960 && c <= 42124) || (c >= 42192 && c <= 42237) || (c >= 42240 && c <= 42508) || (c >= 42512 && c <= 42527) || (c >= 42538 && c <= 42539) || (c >= 42560 && c <= 42606) || (c >= 42623 && c <= 42647) || (c >= 42656 && c <= 42735) || (c >= 42775 && c <= 42783) || (c >= 42786 && c <= 42888) || (c >= 42891 && c <= 42894) || (c >= 42896 && c <= 42899) || (c >= 42912 && c <= 42922) || (c >= 43000 && c <= 43009) || (c >= 43011 && c <= 43013) || (c >= 43015 && c <= 43018) || (c >= 43020 && c <= 43042) || (c >= 43072 && c <= 43123) || (c >= 43138 && c <= 43187) || (c >= 43250 && c <= 43255) || c === 43259 || (c >= 43274 && c <= 43301) || (c >= 43312 && c <= 43334) || (c >= 43360 && c <= 43388) || (c >= 43396 && c <= 43442) || c === 43471 || (c >= 43520 && c <= 43560) || (c >= 43584 && c <= 43586) || (c >= 43588 && c <= 43595) || (c >= 43616 && c <= 43638) || c === 43642 || (c >= 43648 && c <= 43695) || c === 43697 || (c >= 43701 && c <= 43702) || (c >= 43705 && c <= 43709) || c === 43712 || c === 43714 || (c >= 43739 && c <= 43741) || (c >= 43744 && c <= 43754) || (c >= 43762 && c <= 43764) || (c >= 43777 && c <= 43782) || (c >= 43785 && c <= 43790) || (c >= 43793 && c <= 43798) || (c >= 43808 && c <= 43814) || (c >= 43816 && c <= 43822) || (c >= 43968 && c <= 44002) || (c >= 44032 && c <= 55203) || (c >= 55216 && c <= 55238) || (c >= 55243 && c <= 55291) || (c >= 63744 && c <= 64109) || (c >= 64112 && c <= 64217) || (c >= 64256 && c <= 64262) || (c >= 64275 && c <= 64279) || c === 64285 || (c >= 64287 && c <= 64296) || (c >= 64298 && c <= 64310) || (c >= 64312 && c <= 64316) || c === 64318 || (c >= 64320 && c <= 64321) || (c >= 64323 && c <= 64324) || (c >= 64326 && c <= 64433) || (c >= 64467 && c <= 64829) || (c >= 64848 && c <= 64911) || (c >= 64914 && c <= 64967) || (c >= 65008 && c <= 65019) || (c >= 65136 && c <= 65140) || (c >= 65142 && c <= 65276) || (c >= 65313 && c <= 65338) || (c >= 65345 && c <= 65370) || (c >= 65382 && c <= 65470) || (c >= 65474 && c <= 65479) || (c >= 65482 && c <= 65487) || (c >= 65490 && c <= 65495) || (c >= 65498 && c <= 65500)) {
                ret.state = 31;
            }
            else if ((c >= 768 && c <= 879) || (c >= 1155 && c <= 1159) || (c >= 1425 && c <= 1469) || c === 1471 || (c >= 1473 && c <= 1474) || (c >= 1476 && c <= 1477) || c === 1479 || (c >= 1552 && c <= 1562) || (c >= 1611 && c <= 1641) || c === 1648 || (c >= 1750 && c <= 1756) || (c >= 1759 && c <= 1764) || (c >= 1767 && c <= 1768) || (c >= 1770 && c <= 1773) || (c >= 1776 && c <= 1785) || c === 1809 || (c >= 1840 && c <= 1866) || (c >= 1958 && c <= 1968) || (c >= 1984 && c <= 1993) || (c >= 2027 && c <= 2035) || (c >= 2070 && c <= 2073) || (c >= 2075 && c <= 2083) || (c >= 2085 && c <= 2087) || (c >= 2089 && c <= 2093) || (c >= 2137 && c <= 2139) || (c >= 2276 && c <= 2302) || (c >= 2304 && c <= 2307) || (c >= 2362 && c <= 2364) || (c >= 2366 && c <= 2383) || (c >= 2385 && c <= 2391) || (c >= 2402 && c <= 2403) || (c >= 2406 && c <= 2415) || (c >= 2433 && c <= 2435) || c === 2492 || (c >= 2494 && c <= 2500) || (c >= 2503 && c <= 2504) || (c >= 2507 && c <= 2509) || c === 2519 || (c >= 2530 && c <= 2531) || (c >= 2534 && c <= 2543) || (c >= 2561 && c <= 2563) || c === 2620 || (c >= 2622 && c <= 2626) || (c >= 2631 && c <= 2632) || (c >= 2635 && c <= 2637) || c === 2641 || (c >= 2662 && c <= 2673) || c === 2677 || (c >= 2689 && c <= 2691) || c === 2748 || (c >= 2750 && c <= 2757) || (c >= 2759 && c <= 2761) || (c >= 2763 && c <= 2765) || (c >= 2786 && c <= 2787) || (c >= 2790 && c <= 2799) || (c >= 2817 && c <= 2819) || c === 2876 || (c >= 2878 && c <= 2884) || (c >= 2887 && c <= 2888) || (c >= 2891 && c <= 2893) || (c >= 2902 && c <= 2903) || (c >= 2914 && c <= 2915) || (c >= 2918 && c <= 2927) || c === 2946 || (c >= 3006 && c <= 3010) || (c >= 3014 && c <= 3016) || (c >= 3018 && c <= 3021) || c === 3031 || (c >= 3046 && c <= 3055) || (c >= 3073 && c <= 3075) || (c >= 3134 && c <= 3140) || (c >= 3142 && c <= 3144) || (c >= 3146 && c <= 3149) || (c >= 3157 && c <= 3158) || (c >= 3170 && c <= 3171) || (c >= 3174 && c <= 3183) || (c >= 3202 && c <= 3203) || c === 3260 || (c >= 3262 && c <= 3268) || (c >= 3270 && c <= 3272) || (c >= 3274 && c <= 3277) || (c >= 3285 && c <= 3286) || (c >= 3298 && c <= 3299) || (c >= 3302 && c <= 3311) || (c >= 3330 && c <= 3331) || (c >= 3390 && c <= 3396) || (c >= 3398 && c <= 3400) || (c >= 3402 && c <= 3405) || c === 3415 || (c >= 3426 && c <= 3427) || (c >= 3430 && c <= 3439) || (c >= 3458 && c <= 3459) || c === 3530 || (c >= 3535 && c <= 3540) || c === 3542 || (c >= 3544 && c <= 3551) || (c >= 3570 && c <= 3571) || c === 3633 || (c >= 3636 && c <= 3642) || (c >= 3655 && c <= 3662) || (c >= 3664 && c <= 3673) || c === 3761 || (c >= 3764 && c <= 3769) || (c >= 3771 && c <= 3772) || (c >= 3784 && c <= 3789) || (c >= 3792 && c <= 3801) || (c >= 3864 && c <= 3865) || (c >= 3872 && c <= 3881) || c === 3893 || c === 3895 || c === 3897 || (c >= 3902 && c <= 3903) || (c >= 3953 && c <= 3972) || (c >= 3974 && c <= 3975) || (c >= 3981 && c <= 3991) || (c >= 3993 && c <= 4028) || c === 4038 || (c >= 4139 && c <= 4158) || (c >= 4160 && c <= 4169) || (c >= 4182 && c <= 4185) || (c >= 4190 && c <= 4192) || (c >= 4194 && c <= 4196) || (c >= 4199 && c <= 4205) || (c >= 4209 && c <= 4212) || (c >= 4226 && c <= 4237) || (c >= 4239 && c <= 4253) || (c >= 4957 && c <= 4959) || (c >= 5906 && c <= 5908) || (c >= 5938 && c <= 5940) || (c >= 5970 && c <= 5971) || (c >= 6002 && c <= 6003) || (c >= 6068 && c <= 6099) || c === 6109 || (c >= 6112 && c <= 6121) || (c >= 6155 && c <= 6157) || (c >= 6160 && c <= 6169) || c === 6313 || (c >= 6432 && c <= 6443) || (c >= 6448 && c <= 6459) || (c >= 6470 && c <= 6479) || (c >= 6576 && c <= 6592) || (c >= 6600 && c <= 6601) || (c >= 6608 && c <= 6617) || (c >= 6679 && c <= 6683) || (c >= 6741 && c <= 6750) || (c >= 6752 && c <= 6780) || (c >= 6783 && c <= 6793) || (c >= 6800 && c <= 6809) || (c >= 6912 && c <= 6916) || (c >= 6964 && c <= 6980) || (c >= 6992 && c <= 7001) || (c >= 7019 && c <= 7027) || (c >= 7040 && c <= 7042) || (c >= 7073 && c <= 7085) || (c >= 7088 && c <= 7097) || (c >= 7142 && c <= 7155) || (c >= 7204 && c <= 7223) || (c >= 7232 && c <= 7241) || (c >= 7248 && c <= 7257) || (c >= 7376 && c <= 7378) || (c >= 7380 && c <= 7400) || c === 7405 || (c >= 7410 && c <= 7412) || (c >= 7616 && c <= 7654) || (c >= 7676 && c <= 7679) || (c >= 8204 && c <= 8205) || (c >= 8255 && c <= 8256) || c === 8276 || (c >= 8400 && c <= 8412) || c === 8417 || (c >= 8421 && c <= 8432) || (c >= 11503 && c <= 11505) || c === 11647 || (c >= 11744 && c <= 11775) || (c >= 12330 && c <= 12335) || (c >= 12441 && c <= 12442) || (c >= 42528 && c <= 42537) || c === 42607 || (c >= 42612 && c <= 42621) || c === 42655 || (c >= 42736 && c <= 42737) || c === 43010 || c === 43014 || c === 43019 || (c >= 43043 && c <= 43047) || (c >= 43136 && c <= 43137) || (c >= 43188 && c <= 43204) || (c >= 43216 && c <= 43225) || (c >= 43232 && c <= 43249) || (c >= 43264 && c <= 43273) || (c >= 43302 && c <= 43309) || (c >= 43335 && c <= 43347) || (c >= 43392 && c <= 43395) || (c >= 43443 && c <= 43456) || (c >= 43472 && c <= 43481) || (c >= 43561 && c <= 43574) || c === 43587 || (c >= 43596 && c <= 43597) || (c >= 43600 && c <= 43609) || c === 43643 || c === 43696 || (c >= 43698 && c <= 43700) || (c >= 43703 && c <= 43704) || (c >= 43710 && c <= 43711) || c === 43713 || (c >= 43755 && c <= 43759) || (c >= 43765 && c <= 43766) || (c >= 44003 && c <= 44010) || (c >= 44012 && c <= 44013) || (c >= 44016 && c <= 44025) || c === 64286 || (c >= 65024 && c <= 65039) || (c >= 65056 && c <= 65062) || (c >= 65075 && c <= 65076) || (c >= 65101 && c <= 65103) || (c >= 65296 && c <= 65305) || c === 65343) {
                ret.state = 32;
            }
            else {
                ret.state = -1;
            }
            break;
        case 31:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c === 36 || (c >= 65 && c <= 90) || c === 95 || (c >= 97 && c <= 122)) {
                ret.state = 29;
            }
            else if ((c >= 48 && c <= 57)) {
                ret.state = 30;
            }
            else if (c === 170 || c === 181 || c === 186 || (c >= 192 && c <= 214) || (c >= 216 && c <= 246) || (c >= 248 && c <= 705) || (c >= 710 && c <= 721) || (c >= 736 && c <= 740) || c === 748 || c === 750 || (c >= 880 && c <= 884) || (c >= 886 && c <= 887) || (c >= 890 && c <= 893) || c === 902 || (c >= 904 && c <= 906) || c === 908 || (c >= 910 && c <= 929) || (c >= 931 && c <= 1013) || (c >= 1015 && c <= 1153) || (c >= 1162 && c <= 1319) || (c >= 1329 && c <= 1366) || c === 1369 || (c >= 1377 && c <= 1415) || (c >= 1488 && c <= 1514) || (c >= 1520 && c <= 1522) || (c >= 1568 && c <= 1610) || (c >= 1646 && c <= 1647) || (c >= 1649 && c <= 1747) || c === 1749 || (c >= 1765 && c <= 1766) || (c >= 1774 && c <= 1775) || (c >= 1786 && c <= 1788) || c === 1791 || c === 1808 || (c >= 1810 && c <= 1839) || (c >= 1869 && c <= 1957) || c === 1969 || (c >= 1994 && c <= 2026) || (c >= 2036 && c <= 2037) || c === 2042 || (c >= 2048 && c <= 2069) || c === 2074 || c === 2084 || c === 2088 || (c >= 2112 && c <= 2136) || c === 2208 || (c >= 2210 && c <= 2220) || (c >= 2308 && c <= 2361) || c === 2365 || c === 2384 || (c >= 2392 && c <= 2401) || (c >= 2417 && c <= 2423) || (c >= 2425 && c <= 2431) || (c >= 2437 && c <= 2444) || (c >= 2447 && c <= 2448) || (c >= 2451 && c <= 2472) || (c >= 2474 && c <= 2480) || c === 2482 || (c >= 2486 && c <= 2489) || c === 2493 || c === 2510 || (c >= 2524 && c <= 2525) || (c >= 2527 && c <= 2529) || (c >= 2544 && c <= 2545) || (c >= 2565 && c <= 2570) || (c >= 2575 && c <= 2576) || (c >= 2579 && c <= 2600) || (c >= 2602 && c <= 2608) || (c >= 2610 && c <= 2611) || (c >= 2613 && c <= 2614) || (c >= 2616 && c <= 2617) || (c >= 2649 && c <= 2652) || c === 2654 || (c >= 2674 && c <= 2676) || (c >= 2693 && c <= 2701) || (c >= 2703 && c <= 2705) || (c >= 2707 && c <= 2728) || (c >= 2730 && c <= 2736) || (c >= 2738 && c <= 2739) || (c >= 2741 && c <= 2745) || c === 2749 || c === 2768 || (c >= 2784 && c <= 2785) || (c >= 2821 && c <= 2828) || (c >= 2831 && c <= 2832) || (c >= 2835 && c <= 2856) || (c >= 2858 && c <= 2864) || (c >= 2866 && c <= 2867) || (c >= 2869 && c <= 2873) || c === 2877 || (c >= 2908 && c <= 2909) || (c >= 2911 && c <= 2913) || c === 2929 || c === 2947 || (c >= 2949 && c <= 2954) || (c >= 2958 && c <= 2960) || (c >= 2962 && c <= 2965) || (c >= 2969 && c <= 2970) || c === 2972 || (c >= 2974 && c <= 2975) || (c >= 2979 && c <= 2980) || (c >= 2984 && c <= 2986) || (c >= 2990 && c <= 3001) || c === 3024 || (c >= 3077 && c <= 3084) || (c >= 3086 && c <= 3088) || (c >= 3090 && c <= 3112) || (c >= 3114 && c <= 3123) || (c >= 3125 && c <= 3129) || c === 3133 || (c >= 3160 && c <= 3161) || (c >= 3168 && c <= 3169) || (c >= 3205 && c <= 3212) || (c >= 3214 && c <= 3216) || (c >= 3218 && c <= 3240) || (c >= 3242 && c <= 3251) || (c >= 3253 && c <= 3257) || c === 3261 || c === 3294 || (c >= 3296 && c <= 3297) || (c >= 3313 && c <= 3314) || (c >= 3333 && c <= 3340) || (c >= 3342 && c <= 3344) || (c >= 3346 && c <= 3386) || c === 3389 || c === 3406 || (c >= 3424 && c <= 3425) || (c >= 3450 && c <= 3455) || (c >= 3461 && c <= 3478) || (c >= 3482 && c <= 3505) || (c >= 3507 && c <= 3515) || c === 3517 || (c >= 3520 && c <= 3526) || (c >= 3585 && c <= 3632) || (c >= 3634 && c <= 3635) || (c >= 3648 && c <= 3654) || (c >= 3713 && c <= 3714) || c === 3716 || (c >= 3719 && c <= 3720) || c === 3722 || c === 3725 || (c >= 3732 && c <= 3735) || (c >= 3737 && c <= 3743) || (c >= 3745 && c <= 3747) || c === 3749 || c === 3751 || (c >= 3754 && c <= 3755) || (c >= 3757 && c <= 3760) || (c >= 3762 && c <= 3763) || c === 3773 || (c >= 3776 && c <= 3780) || c === 3782 || (c >= 3804 && c <= 3807) || c === 3840 || (c >= 3904 && c <= 3911) || (c >= 3913 && c <= 3948) || (c >= 3976 && c <= 3980) || (c >= 4096 && c <= 4138) || c === 4159 || (c >= 4176 && c <= 4181) || (c >= 4186 && c <= 4189) || c === 4193 || (c >= 4197 && c <= 4198) || (c >= 4206 && c <= 4208) || (c >= 4213 && c <= 4225) || c === 4238 || (c >= 4256 && c <= 4293) || c === 4295 || c === 4301 || (c >= 4304 && c <= 4346) || (c >= 4348 && c <= 4680) || (c >= 4682 && c <= 4685) || (c >= 4688 && c <= 4694) || c === 4696 || (c >= 4698 && c <= 4701) || (c >= 4704 && c <= 4744) || (c >= 4746 && c <= 4749) || (c >= 4752 && c <= 4784) || (c >= 4786 && c <= 4789) || (c >= 4792 && c <= 4798) || c === 4800 || (c >= 4802 && c <= 4805) || (c >= 4808 && c <= 4822) || (c >= 4824 && c <= 4880) || (c >= 4882 && c <= 4885) || (c >= 4888 && c <= 4954) || (c >= 4992 && c <= 5007) || (c >= 5024 && c <= 5108) || (c >= 5121 && c <= 5740) || (c >= 5743 && c <= 5759) || (c >= 5761 && c <= 5786) || (c >= 5792 && c <= 5866) || (c >= 5870 && c <= 5872) || (c >= 5888 && c <= 5900) || (c >= 5902 && c <= 5905) || (c >= 5920 && c <= 5937) || (c >= 5952 && c <= 5969) || (c >= 5984 && c <= 5996) || (c >= 5998 && c <= 6000) || (c >= 6016 && c <= 6067) || c === 6103 || c === 6108 || (c >= 6176 && c <= 6263) || (c >= 6272 && c <= 6312) || c === 6314 || (c >= 6320 && c <= 6389) || (c >= 6400 && c <= 6428) || (c >= 6480 && c <= 6509) || (c >= 6512 && c <= 6516) || (c >= 6528 && c <= 6571) || (c >= 6593 && c <= 6599) || (c >= 6656 && c <= 6678) || (c >= 6688 && c <= 6740) || c === 6823 || (c >= 6917 && c <= 6963) || (c >= 6981 && c <= 6987) || (c >= 7043 && c <= 7072) || (c >= 7086 && c <= 7087) || (c >= 7098 && c <= 7141) || (c >= 7168 && c <= 7203) || (c >= 7245 && c <= 7247) || (c >= 7258 && c <= 7293) || (c >= 7401 && c <= 7404) || (c >= 7406 && c <= 7409) || (c >= 7413 && c <= 7414) || (c >= 7424 && c <= 7615) || (c >= 7680 && c <= 7957) || (c >= 7960 && c <= 7965) || (c >= 7968 && c <= 8005) || (c >= 8008 && c <= 8013) || (c >= 8016 && c <= 8023) || c === 8025 || c === 8027 || c === 8029 || (c >= 8031 && c <= 8061) || (c >= 8064 && c <= 8116) || (c >= 8118 && c <= 8124) || c === 8126 || (c >= 8130 && c <= 8132) || (c >= 8134 && c <= 8140) || (c >= 8144 && c <= 8147) || (c >= 8150 && c <= 8155) || (c >= 8160 && c <= 8172) || (c >= 8178 && c <= 8180) || (c >= 8182 && c <= 8188) || c === 8305 || c === 8319 || (c >= 8336 && c <= 8348) || c === 8450 || c === 8455 || (c >= 8458 && c <= 8467) || c === 8469 || (c >= 8473 && c <= 8477) || c === 8484 || c === 8486 || c === 8488 || (c >= 8490 && c <= 8493) || (c >= 8495 && c <= 8505) || (c >= 8508 && c <= 8511) || (c >= 8517 && c <= 8521) || c === 8526 || (c >= 8544 && c <= 8584) || (c >= 11264 && c <= 11310) || (c >= 11312 && c <= 11358) || (c >= 11360 && c <= 11492) || (c >= 11499 && c <= 11502) || (c >= 11506 && c <= 11507) || (c >= 11520 && c <= 11557) || c === 11559 || c === 11565 || (c >= 11568 && c <= 11623) || c === 11631 || (c >= 11648 && c <= 11670) || (c >= 11680 && c <= 11686) || (c >= 11688 && c <= 11694) || (c >= 11696 && c <= 11702) || (c >= 11704 && c <= 11710) || (c >= 11712 && c <= 11718) || (c >= 11720 && c <= 11726) || (c >= 11728 && c <= 11734) || (c >= 11736 && c <= 11742) || c === 11823 || (c >= 12293 && c <= 12295) || (c >= 12321 && c <= 12329) || (c >= 12337 && c <= 12341) || (c >= 12344 && c <= 12348) || (c >= 12353 && c <= 12438) || (c >= 12445 && c <= 12447) || (c >= 12449 && c <= 12538) || (c >= 12540 && c <= 12543) || (c >= 12549 && c <= 12589) || (c >= 12593 && c <= 12686) || (c >= 12704 && c <= 12730) || (c >= 12784 && c <= 12799) || (c >= 13312 && c <= 19893) || (c >= 19968 && c <= 40908) || (c >= 40960 && c <= 42124) || (c >= 42192 && c <= 42237) || (c >= 42240 && c <= 42508) || (c >= 42512 && c <= 42527) || (c >= 42538 && c <= 42539) || (c >= 42560 && c <= 42606) || (c >= 42623 && c <= 42647) || (c >= 42656 && c <= 42735) || (c >= 42775 && c <= 42783) || (c >= 42786 && c <= 42888) || (c >= 42891 && c <= 42894) || (c >= 42896 && c <= 42899) || (c >= 42912 && c <= 42922) || (c >= 43000 && c <= 43009) || (c >= 43011 && c <= 43013) || (c >= 43015 && c <= 43018) || (c >= 43020 && c <= 43042) || (c >= 43072 && c <= 43123) || (c >= 43138 && c <= 43187) || (c >= 43250 && c <= 43255) || c === 43259 || (c >= 43274 && c <= 43301) || (c >= 43312 && c <= 43334) || (c >= 43360 && c <= 43388) || (c >= 43396 && c <= 43442) || c === 43471 || (c >= 43520 && c <= 43560) || (c >= 43584 && c <= 43586) || (c >= 43588 && c <= 43595) || (c >= 43616 && c <= 43638) || c === 43642 || (c >= 43648 && c <= 43695) || c === 43697 || (c >= 43701 && c <= 43702) || (c >= 43705 && c <= 43709) || c === 43712 || c === 43714 || (c >= 43739 && c <= 43741) || (c >= 43744 && c <= 43754) || (c >= 43762 && c <= 43764) || (c >= 43777 && c <= 43782) || (c >= 43785 && c <= 43790) || (c >= 43793 && c <= 43798) || (c >= 43808 && c <= 43814) || (c >= 43816 && c <= 43822) || (c >= 43968 && c <= 44002) || (c >= 44032 && c <= 55203) || (c >= 55216 && c <= 55238) || (c >= 55243 && c <= 55291) || (c >= 63744 && c <= 64109) || (c >= 64112 && c <= 64217) || (c >= 64256 && c <= 64262) || (c >= 64275 && c <= 64279) || c === 64285 || (c >= 64287 && c <= 64296) || (c >= 64298 && c <= 64310) || (c >= 64312 && c <= 64316) || c === 64318 || (c >= 64320 && c <= 64321) || (c >= 64323 && c <= 64324) || (c >= 64326 && c <= 64433) || (c >= 64467 && c <= 64829) || (c >= 64848 && c <= 64911) || (c >= 64914 && c <= 64967) || (c >= 65008 && c <= 65019) || (c >= 65136 && c <= 65140) || (c >= 65142 && c <= 65276) || (c >= 65313 && c <= 65338) || (c >= 65345 && c <= 65370) || (c >= 65382 && c <= 65470) || (c >= 65474 && c <= 65479) || (c >= 65482 && c <= 65487) || (c >= 65490 && c <= 65495) || (c >= 65498 && c <= 65500)) {
                ret.state = 31;
            }
            else if ((c >= 768 && c <= 879) || (c >= 1155 && c <= 1159) || (c >= 1425 && c <= 1469) || c === 1471 || (c >= 1473 && c <= 1474) || (c >= 1476 && c <= 1477) || c === 1479 || (c >= 1552 && c <= 1562) || (c >= 1611 && c <= 1641) || c === 1648 || (c >= 1750 && c <= 1756) || (c >= 1759 && c <= 1764) || (c >= 1767 && c <= 1768) || (c >= 1770 && c <= 1773) || (c >= 1776 && c <= 1785) || c === 1809 || (c >= 1840 && c <= 1866) || (c >= 1958 && c <= 1968) || (c >= 1984 && c <= 1993) || (c >= 2027 && c <= 2035) || (c >= 2070 && c <= 2073) || (c >= 2075 && c <= 2083) || (c >= 2085 && c <= 2087) || (c >= 2089 && c <= 2093) || (c >= 2137 && c <= 2139) || (c >= 2276 && c <= 2302) || (c >= 2304 && c <= 2307) || (c >= 2362 && c <= 2364) || (c >= 2366 && c <= 2383) || (c >= 2385 && c <= 2391) || (c >= 2402 && c <= 2403) || (c >= 2406 && c <= 2415) || (c >= 2433 && c <= 2435) || c === 2492 || (c >= 2494 && c <= 2500) || (c >= 2503 && c <= 2504) || (c >= 2507 && c <= 2509) || c === 2519 || (c >= 2530 && c <= 2531) || (c >= 2534 && c <= 2543) || (c >= 2561 && c <= 2563) || c === 2620 || (c >= 2622 && c <= 2626) || (c >= 2631 && c <= 2632) || (c >= 2635 && c <= 2637) || c === 2641 || (c >= 2662 && c <= 2673) || c === 2677 || (c >= 2689 && c <= 2691) || c === 2748 || (c >= 2750 && c <= 2757) || (c >= 2759 && c <= 2761) || (c >= 2763 && c <= 2765) || (c >= 2786 && c <= 2787) || (c >= 2790 && c <= 2799) || (c >= 2817 && c <= 2819) || c === 2876 || (c >= 2878 && c <= 2884) || (c >= 2887 && c <= 2888) || (c >= 2891 && c <= 2893) || (c >= 2902 && c <= 2903) || (c >= 2914 && c <= 2915) || (c >= 2918 && c <= 2927) || c === 2946 || (c >= 3006 && c <= 3010) || (c >= 3014 && c <= 3016) || (c >= 3018 && c <= 3021) || c === 3031 || (c >= 3046 && c <= 3055) || (c >= 3073 && c <= 3075) || (c >= 3134 && c <= 3140) || (c >= 3142 && c <= 3144) || (c >= 3146 && c <= 3149) || (c >= 3157 && c <= 3158) || (c >= 3170 && c <= 3171) || (c >= 3174 && c <= 3183) || (c >= 3202 && c <= 3203) || c === 3260 || (c >= 3262 && c <= 3268) || (c >= 3270 && c <= 3272) || (c >= 3274 && c <= 3277) || (c >= 3285 && c <= 3286) || (c >= 3298 && c <= 3299) || (c >= 3302 && c <= 3311) || (c >= 3330 && c <= 3331) || (c >= 3390 && c <= 3396) || (c >= 3398 && c <= 3400) || (c >= 3402 && c <= 3405) || c === 3415 || (c >= 3426 && c <= 3427) || (c >= 3430 && c <= 3439) || (c >= 3458 && c <= 3459) || c === 3530 || (c >= 3535 && c <= 3540) || c === 3542 || (c >= 3544 && c <= 3551) || (c >= 3570 && c <= 3571) || c === 3633 || (c >= 3636 && c <= 3642) || (c >= 3655 && c <= 3662) || (c >= 3664 && c <= 3673) || c === 3761 || (c >= 3764 && c <= 3769) || (c >= 3771 && c <= 3772) || (c >= 3784 && c <= 3789) || (c >= 3792 && c <= 3801) || (c >= 3864 && c <= 3865) || (c >= 3872 && c <= 3881) || c === 3893 || c === 3895 || c === 3897 || (c >= 3902 && c <= 3903) || (c >= 3953 && c <= 3972) || (c >= 3974 && c <= 3975) || (c >= 3981 && c <= 3991) || (c >= 3993 && c <= 4028) || c === 4038 || (c >= 4139 && c <= 4158) || (c >= 4160 && c <= 4169) || (c >= 4182 && c <= 4185) || (c >= 4190 && c <= 4192) || (c >= 4194 && c <= 4196) || (c >= 4199 && c <= 4205) || (c >= 4209 && c <= 4212) || (c >= 4226 && c <= 4237) || (c >= 4239 && c <= 4253) || (c >= 4957 && c <= 4959) || (c >= 5906 && c <= 5908) || (c >= 5938 && c <= 5940) || (c >= 5970 && c <= 5971) || (c >= 6002 && c <= 6003) || (c >= 6068 && c <= 6099) || c === 6109 || (c >= 6112 && c <= 6121) || (c >= 6155 && c <= 6157) || (c >= 6160 && c <= 6169) || c === 6313 || (c >= 6432 && c <= 6443) || (c >= 6448 && c <= 6459) || (c >= 6470 && c <= 6479) || (c >= 6576 && c <= 6592) || (c >= 6600 && c <= 6601) || (c >= 6608 && c <= 6617) || (c >= 6679 && c <= 6683) || (c >= 6741 && c <= 6750) || (c >= 6752 && c <= 6780) || (c >= 6783 && c <= 6793) || (c >= 6800 && c <= 6809) || (c >= 6912 && c <= 6916) || (c >= 6964 && c <= 6980) || (c >= 6992 && c <= 7001) || (c >= 7019 && c <= 7027) || (c >= 7040 && c <= 7042) || (c >= 7073 && c <= 7085) || (c >= 7088 && c <= 7097) || (c >= 7142 && c <= 7155) || (c >= 7204 && c <= 7223) || (c >= 7232 && c <= 7241) || (c >= 7248 && c <= 7257) || (c >= 7376 && c <= 7378) || (c >= 7380 && c <= 7400) || c === 7405 || (c >= 7410 && c <= 7412) || (c >= 7616 && c <= 7654) || (c >= 7676 && c <= 7679) || (c >= 8204 && c <= 8205) || (c >= 8255 && c <= 8256) || c === 8276 || (c >= 8400 && c <= 8412) || c === 8417 || (c >= 8421 && c <= 8432) || (c >= 11503 && c <= 11505) || c === 11647 || (c >= 11744 && c <= 11775) || (c >= 12330 && c <= 12335) || (c >= 12441 && c <= 12442) || (c >= 42528 && c <= 42537) || c === 42607 || (c >= 42612 && c <= 42621) || c === 42655 || (c >= 42736 && c <= 42737) || c === 43010 || c === 43014 || c === 43019 || (c >= 43043 && c <= 43047) || (c >= 43136 && c <= 43137) || (c >= 43188 && c <= 43204) || (c >= 43216 && c <= 43225) || (c >= 43232 && c <= 43249) || (c >= 43264 && c <= 43273) || (c >= 43302 && c <= 43309) || (c >= 43335 && c <= 43347) || (c >= 43392 && c <= 43395) || (c >= 43443 && c <= 43456) || (c >= 43472 && c <= 43481) || (c >= 43561 && c <= 43574) || c === 43587 || (c >= 43596 && c <= 43597) || (c >= 43600 && c <= 43609) || c === 43643 || c === 43696 || (c >= 43698 && c <= 43700) || (c >= 43703 && c <= 43704) || (c >= 43710 && c <= 43711) || c === 43713 || (c >= 43755 && c <= 43759) || (c >= 43765 && c <= 43766) || (c >= 44003 && c <= 44010) || (c >= 44012 && c <= 44013) || (c >= 44016 && c <= 44025) || c === 64286 || (c >= 65024 && c <= 65039) || (c >= 65056 && c <= 65062) || (c >= 65075 && c <= 65076) || (c >= 65101 && c <= 65103) || (c >= 65296 && c <= 65305) || c === 65343) {
                ret.state = 32;
            }
            else {
                ret.state = -1;
            }
            break;
        case 32:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c === 36 || (c >= 65 && c <= 90) || c === 95 || (c >= 97 && c <= 122)) {
                ret.state = 29;
            }
            else if ((c >= 48 && c <= 57)) {
                ret.state = 30;
            }
            else if (c === 170 || c === 181 || c === 186 || (c >= 192 && c <= 214) || (c >= 216 && c <= 246) || (c >= 248 && c <= 705) || (c >= 710 && c <= 721) || (c >= 736 && c <= 740) || c === 748 || c === 750 || (c >= 880 && c <= 884) || (c >= 886 && c <= 887) || (c >= 890 && c <= 893) || c === 902 || (c >= 904 && c <= 906) || c === 908 || (c >= 910 && c <= 929) || (c >= 931 && c <= 1013) || (c >= 1015 && c <= 1153) || (c >= 1162 && c <= 1319) || (c >= 1329 && c <= 1366) || c === 1369 || (c >= 1377 && c <= 1415) || (c >= 1488 && c <= 1514) || (c >= 1520 && c <= 1522) || (c >= 1568 && c <= 1610) || (c >= 1646 && c <= 1647) || (c >= 1649 && c <= 1747) || c === 1749 || (c >= 1765 && c <= 1766) || (c >= 1774 && c <= 1775) || (c >= 1786 && c <= 1788) || c === 1791 || c === 1808 || (c >= 1810 && c <= 1839) || (c >= 1869 && c <= 1957) || c === 1969 || (c >= 1994 && c <= 2026) || (c >= 2036 && c <= 2037) || c === 2042 || (c >= 2048 && c <= 2069) || c === 2074 || c === 2084 || c === 2088 || (c >= 2112 && c <= 2136) || c === 2208 || (c >= 2210 && c <= 2220) || (c >= 2308 && c <= 2361) || c === 2365 || c === 2384 || (c >= 2392 && c <= 2401) || (c >= 2417 && c <= 2423) || (c >= 2425 && c <= 2431) || (c >= 2437 && c <= 2444) || (c >= 2447 && c <= 2448) || (c >= 2451 && c <= 2472) || (c >= 2474 && c <= 2480) || c === 2482 || (c >= 2486 && c <= 2489) || c === 2493 || c === 2510 || (c >= 2524 && c <= 2525) || (c >= 2527 && c <= 2529) || (c >= 2544 && c <= 2545) || (c >= 2565 && c <= 2570) || (c >= 2575 && c <= 2576) || (c >= 2579 && c <= 2600) || (c >= 2602 && c <= 2608) || (c >= 2610 && c <= 2611) || (c >= 2613 && c <= 2614) || (c >= 2616 && c <= 2617) || (c >= 2649 && c <= 2652) || c === 2654 || (c >= 2674 && c <= 2676) || (c >= 2693 && c <= 2701) || (c >= 2703 && c <= 2705) || (c >= 2707 && c <= 2728) || (c >= 2730 && c <= 2736) || (c >= 2738 && c <= 2739) || (c >= 2741 && c <= 2745) || c === 2749 || c === 2768 || (c >= 2784 && c <= 2785) || (c >= 2821 && c <= 2828) || (c >= 2831 && c <= 2832) || (c >= 2835 && c <= 2856) || (c >= 2858 && c <= 2864) || (c >= 2866 && c <= 2867) || (c >= 2869 && c <= 2873) || c === 2877 || (c >= 2908 && c <= 2909) || (c >= 2911 && c <= 2913) || c === 2929 || c === 2947 || (c >= 2949 && c <= 2954) || (c >= 2958 && c <= 2960) || (c >= 2962 && c <= 2965) || (c >= 2969 && c <= 2970) || c === 2972 || (c >= 2974 && c <= 2975) || (c >= 2979 && c <= 2980) || (c >= 2984 && c <= 2986) || (c >= 2990 && c <= 3001) || c === 3024 || (c >= 3077 && c <= 3084) || (c >= 3086 && c <= 3088) || (c >= 3090 && c <= 3112) || (c >= 3114 && c <= 3123) || (c >= 3125 && c <= 3129) || c === 3133 || (c >= 3160 && c <= 3161) || (c >= 3168 && c <= 3169) || (c >= 3205 && c <= 3212) || (c >= 3214 && c <= 3216) || (c >= 3218 && c <= 3240) || (c >= 3242 && c <= 3251) || (c >= 3253 && c <= 3257) || c === 3261 || c === 3294 || (c >= 3296 && c <= 3297) || (c >= 3313 && c <= 3314) || (c >= 3333 && c <= 3340) || (c >= 3342 && c <= 3344) || (c >= 3346 && c <= 3386) || c === 3389 || c === 3406 || (c >= 3424 && c <= 3425) || (c >= 3450 && c <= 3455) || (c >= 3461 && c <= 3478) || (c >= 3482 && c <= 3505) || (c >= 3507 && c <= 3515) || c === 3517 || (c >= 3520 && c <= 3526) || (c >= 3585 && c <= 3632) || (c >= 3634 && c <= 3635) || (c >= 3648 && c <= 3654) || (c >= 3713 && c <= 3714) || c === 3716 || (c >= 3719 && c <= 3720) || c === 3722 || c === 3725 || (c >= 3732 && c <= 3735) || (c >= 3737 && c <= 3743) || (c >= 3745 && c <= 3747) || c === 3749 || c === 3751 || (c >= 3754 && c <= 3755) || (c >= 3757 && c <= 3760) || (c >= 3762 && c <= 3763) || c === 3773 || (c >= 3776 && c <= 3780) || c === 3782 || (c >= 3804 && c <= 3807) || c === 3840 || (c >= 3904 && c <= 3911) || (c >= 3913 && c <= 3948) || (c >= 3976 && c <= 3980) || (c >= 4096 && c <= 4138) || c === 4159 || (c >= 4176 && c <= 4181) || (c >= 4186 && c <= 4189) || c === 4193 || (c >= 4197 && c <= 4198) || (c >= 4206 && c <= 4208) || (c >= 4213 && c <= 4225) || c === 4238 || (c >= 4256 && c <= 4293) || c === 4295 || c === 4301 || (c >= 4304 && c <= 4346) || (c >= 4348 && c <= 4680) || (c >= 4682 && c <= 4685) || (c >= 4688 && c <= 4694) || c === 4696 || (c >= 4698 && c <= 4701) || (c >= 4704 && c <= 4744) || (c >= 4746 && c <= 4749) || (c >= 4752 && c <= 4784) || (c >= 4786 && c <= 4789) || (c >= 4792 && c <= 4798) || c === 4800 || (c >= 4802 && c <= 4805) || (c >= 4808 && c <= 4822) || (c >= 4824 && c <= 4880) || (c >= 4882 && c <= 4885) || (c >= 4888 && c <= 4954) || (c >= 4992 && c <= 5007) || (c >= 5024 && c <= 5108) || (c >= 5121 && c <= 5740) || (c >= 5743 && c <= 5759) || (c >= 5761 && c <= 5786) || (c >= 5792 && c <= 5866) || (c >= 5870 && c <= 5872) || (c >= 5888 && c <= 5900) || (c >= 5902 && c <= 5905) || (c >= 5920 && c <= 5937) || (c >= 5952 && c <= 5969) || (c >= 5984 && c <= 5996) || (c >= 5998 && c <= 6000) || (c >= 6016 && c <= 6067) || c === 6103 || c === 6108 || (c >= 6176 && c <= 6263) || (c >= 6272 && c <= 6312) || c === 6314 || (c >= 6320 && c <= 6389) || (c >= 6400 && c <= 6428) || (c >= 6480 && c <= 6509) || (c >= 6512 && c <= 6516) || (c >= 6528 && c <= 6571) || (c >= 6593 && c <= 6599) || (c >= 6656 && c <= 6678) || (c >= 6688 && c <= 6740) || c === 6823 || (c >= 6917 && c <= 6963) || (c >= 6981 && c <= 6987) || (c >= 7043 && c <= 7072) || (c >= 7086 && c <= 7087) || (c >= 7098 && c <= 7141) || (c >= 7168 && c <= 7203) || (c >= 7245 && c <= 7247) || (c >= 7258 && c <= 7293) || (c >= 7401 && c <= 7404) || (c >= 7406 && c <= 7409) || (c >= 7413 && c <= 7414) || (c >= 7424 && c <= 7615) || (c >= 7680 && c <= 7957) || (c >= 7960 && c <= 7965) || (c >= 7968 && c <= 8005) || (c >= 8008 && c <= 8013) || (c >= 8016 && c <= 8023) || c === 8025 || c === 8027 || c === 8029 || (c >= 8031 && c <= 8061) || (c >= 8064 && c <= 8116) || (c >= 8118 && c <= 8124) || c === 8126 || (c >= 8130 && c <= 8132) || (c >= 8134 && c <= 8140) || (c >= 8144 && c <= 8147) || (c >= 8150 && c <= 8155) || (c >= 8160 && c <= 8172) || (c >= 8178 && c <= 8180) || (c >= 8182 && c <= 8188) || c === 8305 || c === 8319 || (c >= 8336 && c <= 8348) || c === 8450 || c === 8455 || (c >= 8458 && c <= 8467) || c === 8469 || (c >= 8473 && c <= 8477) || c === 8484 || c === 8486 || c === 8488 || (c >= 8490 && c <= 8493) || (c >= 8495 && c <= 8505) || (c >= 8508 && c <= 8511) || (c >= 8517 && c <= 8521) || c === 8526 || (c >= 8544 && c <= 8584) || (c >= 11264 && c <= 11310) || (c >= 11312 && c <= 11358) || (c >= 11360 && c <= 11492) || (c >= 11499 && c <= 11502) || (c >= 11506 && c <= 11507) || (c >= 11520 && c <= 11557) || c === 11559 || c === 11565 || (c >= 11568 && c <= 11623) || c === 11631 || (c >= 11648 && c <= 11670) || (c >= 11680 && c <= 11686) || (c >= 11688 && c <= 11694) || (c >= 11696 && c <= 11702) || (c >= 11704 && c <= 11710) || (c >= 11712 && c <= 11718) || (c >= 11720 && c <= 11726) || (c >= 11728 && c <= 11734) || (c >= 11736 && c <= 11742) || c === 11823 || (c >= 12293 && c <= 12295) || (c >= 12321 && c <= 12329) || (c >= 12337 && c <= 12341) || (c >= 12344 && c <= 12348) || (c >= 12353 && c <= 12438) || (c >= 12445 && c <= 12447) || (c >= 12449 && c <= 12538) || (c >= 12540 && c <= 12543) || (c >= 12549 && c <= 12589) || (c >= 12593 && c <= 12686) || (c >= 12704 && c <= 12730) || (c >= 12784 && c <= 12799) || (c >= 13312 && c <= 19893) || (c >= 19968 && c <= 40908) || (c >= 40960 && c <= 42124) || (c >= 42192 && c <= 42237) || (c >= 42240 && c <= 42508) || (c >= 42512 && c <= 42527) || (c >= 42538 && c <= 42539) || (c >= 42560 && c <= 42606) || (c >= 42623 && c <= 42647) || (c >= 42656 && c <= 42735) || (c >= 42775 && c <= 42783) || (c >= 42786 && c <= 42888) || (c >= 42891 && c <= 42894) || (c >= 42896 && c <= 42899) || (c >= 42912 && c <= 42922) || (c >= 43000 && c <= 43009) || (c >= 43011 && c <= 43013) || (c >= 43015 && c <= 43018) || (c >= 43020 && c <= 43042) || (c >= 43072 && c <= 43123) || (c >= 43138 && c <= 43187) || (c >= 43250 && c <= 43255) || c === 43259 || (c >= 43274 && c <= 43301) || (c >= 43312 && c <= 43334) || (c >= 43360 && c <= 43388) || (c >= 43396 && c <= 43442) || c === 43471 || (c >= 43520 && c <= 43560) || (c >= 43584 && c <= 43586) || (c >= 43588 && c <= 43595) || (c >= 43616 && c <= 43638) || c === 43642 || (c >= 43648 && c <= 43695) || c === 43697 || (c >= 43701 && c <= 43702) || (c >= 43705 && c <= 43709) || c === 43712 || c === 43714 || (c >= 43739 && c <= 43741) || (c >= 43744 && c <= 43754) || (c >= 43762 && c <= 43764) || (c >= 43777 && c <= 43782) || (c >= 43785 && c <= 43790) || (c >= 43793 && c <= 43798) || (c >= 43808 && c <= 43814) || (c >= 43816 && c <= 43822) || (c >= 43968 && c <= 44002) || (c >= 44032 && c <= 55203) || (c >= 55216 && c <= 55238) || (c >= 55243 && c <= 55291) || (c >= 63744 && c <= 64109) || (c >= 64112 && c <= 64217) || (c >= 64256 && c <= 64262) || (c >= 64275 && c <= 64279) || c === 64285 || (c >= 64287 && c <= 64296) || (c >= 64298 && c <= 64310) || (c >= 64312 && c <= 64316) || c === 64318 || (c >= 64320 && c <= 64321) || (c >= 64323 && c <= 64324) || (c >= 64326 && c <= 64433) || (c >= 64467 && c <= 64829) || (c >= 64848 && c <= 64911) || (c >= 64914 && c <= 64967) || (c >= 65008 && c <= 65019) || (c >= 65136 && c <= 65140) || (c >= 65142 && c <= 65276) || (c >= 65313 && c <= 65338) || (c >= 65345 && c <= 65370) || (c >= 65382 && c <= 65470) || (c >= 65474 && c <= 65479) || (c >= 65482 && c <= 65487) || (c >= 65490 && c <= 65495) || (c >= 65498 && c <= 65500)) {
                ret.state = 31;
            }
            else if ((c >= 768 && c <= 879) || (c >= 1155 && c <= 1159) || (c >= 1425 && c <= 1469) || c === 1471 || (c >= 1473 && c <= 1474) || (c >= 1476 && c <= 1477) || c === 1479 || (c >= 1552 && c <= 1562) || (c >= 1611 && c <= 1641) || c === 1648 || (c >= 1750 && c <= 1756) || (c >= 1759 && c <= 1764) || (c >= 1767 && c <= 1768) || (c >= 1770 && c <= 1773) || (c >= 1776 && c <= 1785) || c === 1809 || (c >= 1840 && c <= 1866) || (c >= 1958 && c <= 1968) || (c >= 1984 && c <= 1993) || (c >= 2027 && c <= 2035) || (c >= 2070 && c <= 2073) || (c >= 2075 && c <= 2083) || (c >= 2085 && c <= 2087) || (c >= 2089 && c <= 2093) || (c >= 2137 && c <= 2139) || (c >= 2276 && c <= 2302) || (c >= 2304 && c <= 2307) || (c >= 2362 && c <= 2364) || (c >= 2366 && c <= 2383) || (c >= 2385 && c <= 2391) || (c >= 2402 && c <= 2403) || (c >= 2406 && c <= 2415) || (c >= 2433 && c <= 2435) || c === 2492 || (c >= 2494 && c <= 2500) || (c >= 2503 && c <= 2504) || (c >= 2507 && c <= 2509) || c === 2519 || (c >= 2530 && c <= 2531) || (c >= 2534 && c <= 2543) || (c >= 2561 && c <= 2563) || c === 2620 || (c >= 2622 && c <= 2626) || (c >= 2631 && c <= 2632) || (c >= 2635 && c <= 2637) || c === 2641 || (c >= 2662 && c <= 2673) || c === 2677 || (c >= 2689 && c <= 2691) || c === 2748 || (c >= 2750 && c <= 2757) || (c >= 2759 && c <= 2761) || (c >= 2763 && c <= 2765) || (c >= 2786 && c <= 2787) || (c >= 2790 && c <= 2799) || (c >= 2817 && c <= 2819) || c === 2876 || (c >= 2878 && c <= 2884) || (c >= 2887 && c <= 2888) || (c >= 2891 && c <= 2893) || (c >= 2902 && c <= 2903) || (c >= 2914 && c <= 2915) || (c >= 2918 && c <= 2927) || c === 2946 || (c >= 3006 && c <= 3010) || (c >= 3014 && c <= 3016) || (c >= 3018 && c <= 3021) || c === 3031 || (c >= 3046 && c <= 3055) || (c >= 3073 && c <= 3075) || (c >= 3134 && c <= 3140) || (c >= 3142 && c <= 3144) || (c >= 3146 && c <= 3149) || (c >= 3157 && c <= 3158) || (c >= 3170 && c <= 3171) || (c >= 3174 && c <= 3183) || (c >= 3202 && c <= 3203) || c === 3260 || (c >= 3262 && c <= 3268) || (c >= 3270 && c <= 3272) || (c >= 3274 && c <= 3277) || (c >= 3285 && c <= 3286) || (c >= 3298 && c <= 3299) || (c >= 3302 && c <= 3311) || (c >= 3330 && c <= 3331) || (c >= 3390 && c <= 3396) || (c >= 3398 && c <= 3400) || (c >= 3402 && c <= 3405) || c === 3415 || (c >= 3426 && c <= 3427) || (c >= 3430 && c <= 3439) || (c >= 3458 && c <= 3459) || c === 3530 || (c >= 3535 && c <= 3540) || c === 3542 || (c >= 3544 && c <= 3551) || (c >= 3570 && c <= 3571) || c === 3633 || (c >= 3636 && c <= 3642) || (c >= 3655 && c <= 3662) || (c >= 3664 && c <= 3673) || c === 3761 || (c >= 3764 && c <= 3769) || (c >= 3771 && c <= 3772) || (c >= 3784 && c <= 3789) || (c >= 3792 && c <= 3801) || (c >= 3864 && c <= 3865) || (c >= 3872 && c <= 3881) || c === 3893 || c === 3895 || c === 3897 || (c >= 3902 && c <= 3903) || (c >= 3953 && c <= 3972) || (c >= 3974 && c <= 3975) || (c >= 3981 && c <= 3991) || (c >= 3993 && c <= 4028) || c === 4038 || (c >= 4139 && c <= 4158) || (c >= 4160 && c <= 4169) || (c >= 4182 && c <= 4185) || (c >= 4190 && c <= 4192) || (c >= 4194 && c <= 4196) || (c >= 4199 && c <= 4205) || (c >= 4209 && c <= 4212) || (c >= 4226 && c <= 4237) || (c >= 4239 && c <= 4253) || (c >= 4957 && c <= 4959) || (c >= 5906 && c <= 5908) || (c >= 5938 && c <= 5940) || (c >= 5970 && c <= 5971) || (c >= 6002 && c <= 6003) || (c >= 6068 && c <= 6099) || c === 6109 || (c >= 6112 && c <= 6121) || (c >= 6155 && c <= 6157) || (c >= 6160 && c <= 6169) || c === 6313 || (c >= 6432 && c <= 6443) || (c >= 6448 && c <= 6459) || (c >= 6470 && c <= 6479) || (c >= 6576 && c <= 6592) || (c >= 6600 && c <= 6601) || (c >= 6608 && c <= 6617) || (c >= 6679 && c <= 6683) || (c >= 6741 && c <= 6750) || (c >= 6752 && c <= 6780) || (c >= 6783 && c <= 6793) || (c >= 6800 && c <= 6809) || (c >= 6912 && c <= 6916) || (c >= 6964 && c <= 6980) || (c >= 6992 && c <= 7001) || (c >= 7019 && c <= 7027) || (c >= 7040 && c <= 7042) || (c >= 7073 && c <= 7085) || (c >= 7088 && c <= 7097) || (c >= 7142 && c <= 7155) || (c >= 7204 && c <= 7223) || (c >= 7232 && c <= 7241) || (c >= 7248 && c <= 7257) || (c >= 7376 && c <= 7378) || (c >= 7380 && c <= 7400) || c === 7405 || (c >= 7410 && c <= 7412) || (c >= 7616 && c <= 7654) || (c >= 7676 && c <= 7679) || (c >= 8204 && c <= 8205) || (c >= 8255 && c <= 8256) || c === 8276 || (c >= 8400 && c <= 8412) || c === 8417 || (c >= 8421 && c <= 8432) || (c >= 11503 && c <= 11505) || c === 11647 || (c >= 11744 && c <= 11775) || (c >= 12330 && c <= 12335) || (c >= 12441 && c <= 12442) || (c >= 42528 && c <= 42537) || c === 42607 || (c >= 42612 && c <= 42621) || c === 42655 || (c >= 42736 && c <= 42737) || c === 43010 || c === 43014 || c === 43019 || (c >= 43043 && c <= 43047) || (c >= 43136 && c <= 43137) || (c >= 43188 && c <= 43204) || (c >= 43216 && c <= 43225) || (c >= 43232 && c <= 43249) || (c >= 43264 && c <= 43273) || (c >= 43302 && c <= 43309) || (c >= 43335 && c <= 43347) || (c >= 43392 && c <= 43395) || (c >= 43443 && c <= 43456) || (c >= 43472 && c <= 43481) || (c >= 43561 && c <= 43574) || c === 43587 || (c >= 43596 && c <= 43597) || (c >= 43600 && c <= 43609) || c === 43643 || c === 43696 || (c >= 43698 && c <= 43700) || (c >= 43703 && c <= 43704) || (c >= 43710 && c <= 43711) || c === 43713 || (c >= 43755 && c <= 43759) || (c >= 43765 && c <= 43766) || (c >= 44003 && c <= 44010) || (c >= 44012 && c <= 44013) || (c >= 44016 && c <= 44025) || c === 64286 || (c >= 65024 && c <= 65039) || (c >= 65056 && c <= 65062) || (c >= 65075 && c <= 65076) || (c >= 65101 && c <= 65103) || (c >= 65296 && c <= 65305) || c === 65343) {
                ret.state = 32;
            }
            else {
                ret.state = -1;
            }
            break;
        case 33:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 34:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 109) {
                ret.state = 52;
            }
            else if (c === 120) {
                ret.state = 53;
            }
            else {
                ret.state = -1;
            }
            break;
        case 35:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 54;
            }
            else {
                ret.state = -1;
            }
            break;
        case 36:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 109) {
                ret.state = 55;
            }
            else if (c === 110) {
                ret.state = 56;
            }
            else {
                ret.state = -1;
            }
            break;
        case 37:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 57;
            }
            else {
                ret.state = -1;
            }
            break;
        case 38:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 58;
            }
            else {
                ret.state = -1;
            }
            break;
        case 39:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 59;
            }
            else if (c === 117) {
                ret.state = 60;
            }
            else {
                ret.state = -1;
            }
            break;
        case 40:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 61;
            }
            else {
                ret.state = -1;
            }
            break;
        case 41:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 105) {
                ret.state = 62;
            }
            else {
                ret.state = -1;
            }
            break;
        case 42:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 63;
            }
            else if (c === 121) {
                ret.state = 64;
            }
            else {
                ret.state = -1;
            }
            break;
        case 43:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 115) {
                ret.state = 65;
            }
            else {
                ret.state = -1;
            }
            break;
        case 44:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 91) || c >= 93) {
                ret.state = 44;
            }
            else if (c === 39) {
                ret.state = 45;
            }
            else if (c === 92) {
                ret.state = 46;
            }
            else {
                ret.state = -1;
            }
            break;
        case 45:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 46:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 34 || c === 39 || c === 92 || c === 98 || c === 102 || c === 110 || c === 114 || c === 116) {
                ret.state = 66;
            }
            else if (c === 117 || c === 120) {
                ret.state = 67;
            }
            else {
                ret.state = -1;
            }
            break;
        case 47:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 68;
            }
            else if (c === 42) {
                ret.state = 69;
            }
            else if (c === 47) {
                ret.state = 70;
            }
            else {
                ret.state = -1;
            }
            break;
        case 48:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c <= 9 || c >= 11) {
                ret.state = 71;
            }
            else {
                ret.state = -1;
            }
            break;
        case 49:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 50:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 91) || c >= 93) {
                ret.state = 26;
            }
            else if (c === 34) {
                ret.state = 27;
            }
            else if (c === 92) {
                ret.state = 28;
            }
            else {
                ret.state = -1;
            }
            break;
        case 51:
            ret.hasArc = true;
            ret.isEnd = false;
            if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 72;
            }
            else {
                ret.state = -1;
            }
            break;
        case 52:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 73;
            }
            else {
                ret.state = -1;
            }
            break;
        case 53:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 74;
            }
            else {
                ret.state = -1;
            }
            break;
        case 54:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 75;
            }
            else {
                ret.state = -1;
            }
            break;
        case 55:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 76;
            }
            else {
                ret.state = -1;
            }
            break;
        case 56:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 105) {
                ret.state = 77;
            }
            else {
                ret.state = -1;
            }
            break;
        case 57:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 102) {
                ret.state = 78;
            }
            else if (c === 120) {
                ret.state = 79;
            }
            else {
                ret.state = -1;
            }
            break;
        case 58:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 110) {
                ret.state = 80;
            }
            else {
                ret.state = -1;
            }
            break;
        case 59:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 81;
            }
            else {
                ret.state = -1;
            }
            break;
        case 60:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 82;
            }
            else {
                ret.state = -1;
            }
            break;
        case 61:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 83;
            }
            else {
                ret.state = -1;
            }
            break;
        case 62:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 103) {
                ret.state = 84;
            }
            else {
                ret.state = -1;
            }
            break;
        case 63:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 107) {
                ret.state = 85;
            }
            else {
                ret.state = -1;
            }
            break;
        case 64:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 86;
            }
            else {
                ret.state = -1;
            }
            break;
        case 65:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 87;
            }
            else {
                ret.state = -1;
            }
            break;
        case 66:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 91) || c >= 93) {
                ret.state = 44;
            }
            else if (c === 39) {
                ret.state = 45;
            }
            else if (c === 92) {
                ret.state = 46;
            }
            else {
                ret.state = -1;
            }
            break;
        case 67:
            ret.hasArc = true;
            ret.isEnd = false;
            if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 88;
            }
            else {
                ret.state = -1;
            }
            break;
        case 68:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 68;
            }
            else if (c === 42) {
                ret.state = 69;
            }
            else if (c === 47) {
                ret.state = 89;
            }
            else {
                ret.state = -1;
            }
            break;
        case 69:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 46 || c >= 48) {
                ret.state = 90;
            }
            else if (c === 47) {
                ret.state = 91;
            }
            else {
                ret.state = -1;
            }
            break;
        case 70:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 47) {
                ret.state = 92;
            }
            else {
                ret.state = -1;
            }
            break;
        case 71:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c <= 9 || c >= 11) {
                ret.state = 71;
            }
            else {
                ret.state = -1;
            }
            break;
        case 72:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 26;
            }
            else if (c === 34) {
                ret.state = 27;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 93;
            }
            else if (c === 92) {
                ret.state = 28;
            }
            else {
                ret.state = -1;
            }
            break;
        case 73:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 94;
            }
            else {
                ret.state = -1;
            }
            break;
        case 74:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 95;
            }
            else {
                ret.state = -1;
            }
            break;
        case 75:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 100) {
                ret.state = 96;
            }
            else {
                ret.state = -1;
            }
            break;
        case 76:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 97;
            }
            else {
                ret.state = -1;
            }
            break;
        case 77:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 98;
            }
            else {
                ret.state = -1;
            }
            break;
        case 78:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 99;
            }
            else {
                ret.state = -1;
            }
            break;
        case 79:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 80:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 100;
            }
            else {
                ret.state = -1;
            }
            break;
        case 81:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 105) {
                ret.state = 101;
            }
            else {
                ret.state = -1;
            }
            break;
        case 82:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 102;
            }
            else {
                ret.state = -1;
            }
            break;
        case 83:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 99) {
                ret.state = 103;
            }
            else {
                ret.state = -1;
            }
            break;
        case 84:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 104) {
                ret.state = 104;
            }
            else {
                ret.state = -1;
            }
            break;
        case 85:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 105;
            }
            else {
                ret.state = -1;
            }
            break;
        case 86:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 106;
            }
            else {
                ret.state = -1;
            }
            break;
        case 87:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 88:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 44;
            }
            else if (c === 39) {
                ret.state = 45;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 107;
            }
            else if (c === 92) {
                ret.state = 46;
            }
            else {
                ret.state = -1;
            }
            break;
        case 89:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 68;
            }
            else if (c === 42) {
                ret.state = 69;
            }
            else if (c === 47) {
                ret.state = 89;
            }
            else {
                ret.state = -1;
            }
            break;
        case 90:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 68;
            }
            else if (c === 42) {
                ret.state = 69;
            }
            else if (c === 47) {
                ret.state = 70;
            }
            else {
                ret.state = -1;
            }
            break;
        case 91:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 92:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 68;
            }
            else if (c === 42) {
                ret.state = 69;
            }
            else if (c === 47) {
                ret.state = 70;
            }
            else {
                ret.state = -1;
            }
            break;
        case 93:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 26;
            }
            else if (c === 34) {
                ret.state = 27;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 93;
            }
            else if (c === 92) {
                ret.state = 28;
            }
            else {
                ret.state = -1;
            }
            break;
        case 94:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 121) {
                ret.state = 108;
            }
            else {
                ret.state = -1;
            }
            break;
        case 95:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 109;
            }
            else {
                ret.state = -1;
            }
            break;
        case 96:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 110;
            }
            else {
                ret.state = -1;
            }
            break;
        case 97:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 111;
            }
            else {
                ret.state = -1;
            }
            break;
        case 98:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 99:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 100:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 115) {
                ret.state = 112;
            }
            else {
                ret.state = -1;
            }
            break;
        case 101:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 113;
            }
            else {
                ret.state = -1;
            }
            break;
        case 102:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 117) {
                ret.state = 114;
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
            if (c === 116) {
                ret.state = 115;
            }
            else {
                ret.state = -1;
            }
            break;
        case 105:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 110) {
                ret.state = 116;
            }
            else {
                ret.state = -1;
            }
            break;
        case 106:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 107:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 44;
            }
            else if (c === 39) {
                ret.state = 45;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 107;
            }
            else if (c === 92) {
                ret.state = 46;
            }
            else {
                ret.state = -1;
            }
            break;
        case 108:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 109:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 95) {
                ret.state = 117;
            }
            else {
                ret.state = -1;
            }
            break;
        case 110:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 118;
            }
            else {
                ret.state = -1;
            }
            break;
        case 111:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 119;
            }
            else {
                ret.state = -1;
            }
            break;
        case 112:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 115) {
                ret.state = 120;
            }
            else {
                ret.state = -1;
            }
            break;
        case 113:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 110) {
                ret.state = 121;
            }
            else {
                ret.state = -1;
            }
            break;
        case 114:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 122;
            }
            else {
                ret.state = -1;
            }
            break;
        case 115:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 116:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 117:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 123;
            }
            else {
                ret.state = -1;
            }
            break;
        case 118:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 119:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 120:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 124;
            }
            else {
                ret.state = -1;
            }
            break;
        case 121:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 122:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 123:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 125;
            }
            else {
                ret.state = -1;
            }
            break;
        case 124:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 99) {
                ret.state = 126;
            }
            else {
                ret.state = -1;
            }
            break;
        case 125:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 103) {
                ret.state = 127;
            }
            else {
                ret.state = -1;
            }
            break;
        case 126:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 127:
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
            if (c <= 91 || (c >= 93 && c <= 122) || c === 124 || c >= 126) {
                ret.state = 1;
            }
            else if (c === 92) {
                ret.state = 2;
            }
            else if (c === 123) {
                ret.state = 3;
            }
            else if (c === 125) {
                ret.state = 4;
            }
            else {
                ret.state = -1;
            }
            break;
        case 1:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c <= 91 || (c >= 93 && c <= 122) || c === 124 || c >= 126) {
                ret.state = 1;
            }
            else if (c === 92) {
                ret.state = 5;
            }
            else {
                ret.state = -1;
            }
            break;
        case 2:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 122 || c === 124 || c >= 126) {
                ret.state = 6;
            }
            else if (c === 123 || c === 125) {
                ret.state = 7;
            }
            else {
                ret.state = -1;
            }
            break;
        case 3:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 4:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 5:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 122 || c === 124 || c >= 126) {
                ret.state = 6;
            }
            else {
                ret.state = -1;
            }
            break;
        case 6:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c <= 91 || (c >= 93 && c <= 122) || c === 124 || c >= 126) {
                ret.state = 1;
            }
            else if (c === 92) {
                ret.state = 5;
            }
            else {
                ret.state = -1;
            }
            break;
        case 7:
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
    -1, -1, -1, 1, -1, -1, 22, 23, 28, 29,
    37, 30, -1, 31, 33, 21, 24, 20, 27, 25,
    26, 36, 3, 35, 4, 1, -1, 2, -1, 1,
    1, 1, 1, 34, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, 2, -1, -1, -1, 32,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, 6,
    -1, -1, -1, -1, -1, -1, -1, 11, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, 17, 8,
    -1, -1, -1, 16, -1, -1, 15, -1, 14, -1,
    -1, -1, -1, -1, -1, 9, 7, -1, 12, 19,
    -1, 5, 18, -1, -1, -1, 10, 13,
];
var jjlexTokens1 = [
    38, 38, -1, 3, 4, -1, 38, 39,
];
var jjlexTokens2 = [
    -1, 40,
];
var jjtokenCount = 41;
var jjactERR = 184;
var jjpact = [
    9, 7, 15, 16, 17, 18, 94, 10, 11, -116,
    12, 161, 13, 14, 169, 170, 168, -53, 127, -117,
    -53, -91, -54, 124, 125, -54, 48, 49, 160, 5,
    159, 157, -53, 71, 158, 72, 127, -54, -91, -109,
    -91, 124, 125, 110, 67, 68, 106, -109, 103, 106,
    27, 106, 165, 67, 68, 27, 106, 111, 183, 77,
    63, -42, 75, 138, 54, 105, 182, 53, 105, 181,
    105, 180, 150, 178, 177, 105, 176, 64, 150, 174,
    173, 137, 163, 162, 154, 121, 142, 141, 140, 139,
    135, -109, 131, 130, 129, 121, 118, -98, 116, 115,
    114, 113, 112, 107, 100, 98, 97, 92, 88, 86,
    85, 81, 80, 79, 74, 70, 65, 58, 56, 55,
    52, 50, 46, 45, 44, 40, 22, 35, 33, 28,
    22, 4, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0,
];
var jjdisact = [
    -41, 131, -5, -41, 129, -41, -41, 54, 126, -41,
    -41, -41, -41, 126, 106, -41, -41, -41, 125, -41,
    -41, -41, 104, 49, -41, -41, -41, -41, -41, -41,
    -41, -41, -41, 103, 122, 88, -41, -5, 118, 119,
    -41, 63, -41, 118, 98, 77, -41, -41, -41, -41,
    40, -41, -41, 92, 95, -41, -41, -41, 0, -41,
    103, 58, -41, 112, 110, -41, -41, -41, 108, -41,
    -41, -41, 96, 87, -41, -41, -41, 87, -41, -41,
    -41, -41, 91, 5, -41, 105, 81, 103, 15, -41,
    36, 47, -41, 79, 44, 20, -41, 81, 81, 69,
    95, -41, -41, -41, 97, -41, 96, -41, -41, -41,
    95, -41, 64, -41, -41, 74, 92, -41, 72, -41,
    88, 70, -41, 88, -41, -41, 86, 84, -41, -41,
    -41, -41, 61, -41, 54, -41, -41, 12, -41, -41,
    -41, -6, -41, 49, 2, -41, 9, 46, -41, 52,
    -41, 6, 26, -41, -41, -13, -41, 45, 79, 57,
    -41, 76, 74, 70, -41, -3, -41, -41, -41, -41,
    50, 70, 51, 67, -41, -41, -41, -41, 40, -41,
    35, -41, -41,
];
var jjcheckact = [
    2, 2, 2, 2, 2, 2, 83, 2, 2, 151,
    2, 146, 2, 2, 155, 155, 155, 165, 141, 88,
    165, 83, 144, 141, 141, 144, 37, 37, 146, 2,
    146, 146, 165, 58, 146, 58, 137, 144, 83, 90,
    83, 137, 137, 95, 151, 151, 94, 94, 91, 91,
    23, 23, 152, 88, 88, 7, 7, 95, 180, 61,
    50, 90, 61, 152, 41, 94, 178, 41, 91, 173,
    23, 172, 171, 170, 163, 7, 162, 50, 161, 159,
    158, 157, 149, 147, 143, 134, 132, 127, 126, 123,
    121, 120, 118, 116, 115, 112, 110, 106, 104, 100,
    99, 98, 97, 93, 87, 86, 85, 82, 77, 73,
    72, 68, 64, 63, 60, 54, 53, 45, 44, 43,
    39, 38, 35, 34, 33, 22, 18, 14, 13, 8,
    4, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0,
];
var jjdefred = [
    4, -1, -1, 0, -1, 3, 5, -1, -1, 108,
    108, 108, 108, -1, -1, 19, 20, 21, 1, 76,
    77, 78, 29, 7, 23, 24, 25, 27, 9, 10,
    11, 108, 13, 14, -1, -1, 75, -1, -1, -1,
    22, -1, 12, -1, -1, 17, 84, 80, 81, 33,
    -1, 30, 8, -1, -1, 16, 2, 18, -1, 83,
    87, 38, 28, -1, -1, 111, 113, 114, -1, 15,
    79, 84, 93, -1, 6, 32, 34, -1, 31, 26,
    112, 82, 103, 95, 91, -1, -1, 50, 115, 85,
    104, -1, 92, 96, 41, -1, 89, -1, -1, -1,
    -1, 105, 106, 107, -1, 102, 94, 99, 100, 86,
    -1, 50, 40, 50, 117, -1, -1, 88, -1, 36,
    41, -1, 45, -1, 47, 48, -1, -1, 101, 98,
    35, 39, -1, 43, 40, 56, 67, 108, 46, 49,
    112, 108, 37, 51, 56, 55, -1, 69, 72, 73,
    44, 109, -1, 56, 54, 61, 50, 68, -1, -1,
    66, -1, -1, -1, 42, 56, 57, 58, 59, 60,
    -1, 70, -1, -1, 71, 74, 110, 62, -1, 64,
    -1, 63, 65,
];
var jjpgoto = [
    5, 155, 101, 132, 7, 94, 92, 23, 24, 154,
    146, 166, 163, 150, 65, 68, 154, 146, 152, 122,
    103, 108, 132, 65, 68, 100, 89, 90, 72, 46,
    40, 38, 174, 171, 98, 135, 133, 127, 75, 22,
    77, 178, 147, 148, 125, 127, 142, 119, 25, 116,
    125, 127, 107, 131, 132, 133, 127, 95, 82, 83,
    81, 60, 56, 50, 35, 33, 31, 127, 170, 135,
    25, 18, 19, 20, 1, 151, 2, 165, 145, 146,
    143, 144, 145, 146, 121, 135, 88, 133, 127, 118,
    135, 86, 61, 58, 59, 60, 42, 127, 36, 20,
    41, 37, 30, 127, 29, 127, 28, 127, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1,
];
var jjdisgoto = [
    73, -60, -4, -60, 36, -60, 34, -2, -60, 53,
    51, 49, 13, -60, 59, -60, -60, -60, 62, -60,
    -60, 63, 19, 20, -60, -60, -60, 89, -60, -60,
    -60, 43, -60, -60, -60, -60, -60, -10, -60, 50,
    -60, -60, -60, -60, -60, 55, 53, -60, -60, 78,
    -60, -60, -60, -60, -60, -60, -60, -60, -60, -60,
    -15, 23, -60, -60, -60, -60, -60, -60, -60, -60,
    -60, 19, 13, -60, -60, -60, 75, -60, -60, -60,
    30, -60, -25, -42, -60, 13, -60, 11, -34, -60,
    -17, -30, -60, -60, 2, -60, -60, -60, -60, -60,
    -60, -60, -60, -60, -60, -60, 0, -60, -60, -60,
    -60, 66, 29, 61, -60, -60, -60, -60, -60, -60,
    34, -60, -60, -60, -60, -60, -60, -60, -60, -60,
    -60, -60, -60, -60, 28, 55, -60, -9, -60, -60,
    19, -3, -60, -60, -11, -60, -29, -60, -60, -60,
    -60, -43, -60, 51, -60, -18, 45, 2, -60, -60,
    -60, -2, -60, -60, -60, -18, -60, -60, -60, -60,
    -60, 9, -60, -60, -60, -60, -60, -60, -60, -60,
    -60, -60, -60,
];
var jjruleLen = [
    2, 0, 6, 2, 0, 0, 6, 2, 4, 2,
    2, 2, 3, 2, 2, 4, 3, 0, 1, 1,
    1, 1, 2, 1, 1, 1, 4, 0, 3, 0,
    1, 3, 2, 0, 0, 6, 5, 7, 0, 2,
    0, 0, 4, 1, 3, 1, 2, 1, 1, 2,
    0, 2, 3, 1, 2, 1, 0, 3, 1, 1,
    1, 0, 3, 4, 3, 4, 1, 1, 0, 1,
    0, 3, 1, 1, 3, 2, 1, 1, 0, 5,
    1, 1, 3, 1, 0, 4, 4, 0, 3, 1,
    1, 1, 2, 0, 2, 0, 1, 0, 4, 2,
    2, 3, 1, 0, 1, 2, 2, 2, 0, 0,
    5, 2, 0, 1, 1, 0, 0, 5,
];
var jjlhs = [
    0, 2, 1, 3, 3, 5, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 6, 6, 7, 7, 8,
    8, 8, 9, 9, 10, 10, 11, 11, 12, 12,
    13, 13, 14, 14, 16, 15, 15, 15, 17, 18,
    18, 20, 19, 19, 21, 21, 22, 22, 22, 22,
    24, 23, 25, 25, 26, 26, 28, 27, 29, 29,
    29, 29, 30, 30, 30, 30, 30, 31, 31, 32,
    32, 33, 33, 34, 34, 35, 35, 36, 38, 37,
    39, 39, 40, 40, 42, 41, 43, 43, 44, 44,
    45, 45, 46, 46, 47, 47, 48, 49, 48, 48,
    48, 50, 50, 51, 51, 51, 52, 52, 54, 55,
    53, 56, 56, 57, 57, 58, 59, 57,
];
var jjtokenNames = [
    "EOF", "NAME", "STRING",
    "OPEN_BLOCK", "CLOSE_BLOCK", "OPT_DIR",
    "LEX_DIR", "TOKEN_DIR", "LEFT_DIR",
    "RIGHT_DIR", "NONASSOC_DIR", "USE_DIR",
    "HEADER_DIR", "EXTRA_ARG_DIR", "EMPTY",
    "TYPE_DIR", "PREC_DIR", "INIT_DIR",
    "OUTPUT_DIR", "IMPORT_DIR", "GT",
    "LT", "BRA", "KET",
    "EQU", "CBRA", "CKET",
    "QUESTION", "STAR", "PLUS",
    "DASH", "COLON", "ARROW",
    "EOL", "SEPERATOR", "OR",
    "WEDGE", "COMMA", "ANY_CODE",
    "ESCAPED_CHAR_IN_BLOCK", "ANY_EPLOGUE_CODE",
];
var jjtokenAlias = [
    null, null, null,
    "{", "}", "%option",
    "%lex", "%token", "%left",
    "%right", "%nonassoc", "%use",
    "%header", "%extra_arg", "%empty",
    "%type", "%prec", "%init",
    "%output", "%import", ">",
    "<", "(", ")",
    "=", "[", "]",
    "?", "*", "+",
    "-", ":", "=>",
    ";", "%%", "|",
    "^", ",", null,
    null, null,
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
    var jjlexState;
    var jjstate;
    var jjmatched;
    var jjtoken;
    var jjmarker = { state: -1, line: 0, column: 0 };
    var jjbackupCount;
    var jjline;
    var jjcolumn;
    var jjtline;
    var jjtcolumn;
    var jjlrState;
    var jjsematicS = [];
    var jjsematicVal;
    var jjstop;
    var jjhandlers = {};
    var gb;
    var assoc;
    var lexacts;
    var ruleLhs;
    return {
        init: init,
        on: on,
        accept: accept,
        end: end,
        halt: halt
    };
    function init(ctx1, b) {
        jjlexState = [0];
        jjstate = 0;
        jjmatched = '';
        jjtoken = new Token(-1, null, 0, 0, 0, 0);
        jjmarker.state = -1;
        jjbackupCount = 0;
        jjline = jjtline = 0;
        jjcolumn = jjtcolumn = 0;
        jjlrState = [0];
        jjsematicS = [];
        jjsematicVal = null;
        jjstop = false;
        gb = b;
        
    }
    function jjsetImg(s) {
        jjmatched = s;
        jjtline = jjline;
        jjtcolumn = jjcolumn;
    }
    function jjprepareToken(tid) {
        jjtoken.id = tid;
        jjtoken.val = jjmatched;
        jjtoken.startLine = jjtline;
        jjtoken.startColumn = jjtcolumn;
        jjtoken.endLine = jjline;
        jjtoken.endColumn = jjcolumn - 1;
        jjmatched = '';
        jjtline = jjline;
        jjtcolumn = jjcolumn;
    }
    function jjreturnToken() {
        jjemit('token', jjtokenNames[jjtoken.id], jjtoken.val);
        while (!jjstop && !jjacceptToken(jjtoken))
            ;
        jjtoken.id = -1;
    }
    function jjemit(name, a1, a2, a3) {
        var cbs = jjhandlers[name];
        if (cbs) {
            for (var i = 0; i < cbs.length; i++) {
                cbs[i](a1, a2, a3);
            }
        }
    }
    function on(name, cb) {
        jjhandlers[name] || (jjhandlers[name] = []);
        jjhandlers[name].push(cb);
    }
    function jjdoLexAction0(jjstaten) {
        var jjtk = jjlexTokens0[jjstaten];
        jjtk !== -1 && jjprepareToken(jjtk);
        switch (jjstaten) {
            case 1:
                jjsetImg("");
                break;
            case 3:
                jjsematicVal = nodeFromToken(jjtoken);
                break;
            case 22:
                jjsematicVal = nodeFromTrivalToken(jjtoken);
                break;
            case 24:
                jjsematicVal = nodeFromTrivalToken(jjtoken);
                break;
            case 25:
                jjsematicVal = nodeFromToken(jjtoken);
                break;
            case 27:
                jjsematicVal = nodeFromToken(jjtoken);
                jjsematicVal.val = unescape(jjsematicVal.val.substr(1, jjsematicVal.val.length - 2));
                break;
            case 29:
                jjsematicVal = nodeFromToken(jjtoken);
                break;
            case 30:
                jjsematicVal = nodeFromToken(jjtoken);
                break;
            case 31:
                jjsematicVal = nodeFromToken(jjtoken);
                break;
            case 32:
                jjsematicVal = nodeFromToken(jjtoken);
                break;
            case 45:
                jjsematicVal = nodeFromToken(jjtoken);
                jjsematicVal.val = unescape(jjsematicVal.val.substr(1, jjsematicVal.val.length - 2));
                break;
            case 48:
                jjsetImg("");
                break;
            case 71:
                jjsetImg("");
                break;
            case 91:
                jjsetImg("");
                break;
            default: ;
        }
    }
    function jjdoLexAction1(jjstaten) {
        var jjtk = jjlexTokens1[jjstaten];
        jjtk !== -1 && jjprepareToken(jjtk);
        switch (jjstaten) {
            case 0:
                jjsematicVal = newNode(jjtoken.val);
                break;
            case 1:
                jjsematicVal = newNode(jjtoken.val);
                break;
            case 3:
                jjsematicVal = nodeFromTrivalToken(jjtoken);
                break;
            case 4:
                jjsematicVal = nodeFromTrivalToken(jjtoken);
                break;
            case 6:
                jjsematicVal = newNode(jjtoken.val);
                break;
            case 7:
                jjsematicVal = newNode(jjtoken.val.charAt(1));
                break;
            default: ;
        }
    }
    function jjdoLexAction2(jjstaten) {
        var jjtk = jjlexTokens2[jjstaten];
        jjtk !== -1 && jjprepareToken(jjtk);
        switch (jjstaten) {
            case 1:
                jjsematicVal = nodeFromToken(jjtoken);
                break;
            default: ;
        }
    }
    function jjdoLexAction(lexstate, state) {
        switch (lexstate) {
            case 0:
                jjdoLexAction0(state);
                break;
            case 1:
                jjdoLexAction1(state);
                break;
            case 2:
                jjdoLexAction2(state);
                break;
            default: ;
        }
        jjtoken.id !== -1 && jjreturnToken();
    }
    function jjrollback() {
        var ret = jjmatched.substr(jjmatched.length - jjbackupCount, jjbackupCount);
        jjmatched = jjmatched.substr(0, jjmatched.length - jjbackupCount);
        jjbackupCount = 0;
        jjline = jjmarker.line;
        jjcolumn = jjmarker.column;
        jjstate = jjmarker.state;
        jjmarker.state = -1;
        return ret;
    }
    function jjmark() {
        jjmarker.state = jjstate;
        jjmarker.line = jjline;
        jjmarker.column = jjcolumn;
        jjbackupCount = 0;
    }
    function jjconsume(c) {
        c === '\n' ? (jjline++, jjcolumn = 0) : (jjcolumn += c.charCodeAt(0) > 0xff ? 2 : 1);
        jjmatched += c;
        jjmarker.state !== -1 && (jjbackupCount++);
        return true;
    }
    function jjacceptChar(c) {
        var lexstate = jjlexState[jjlexState.length - 1];
        var retn = { state: jjstate, hasArc: false, isEnd: false };
        jjlexers[lexstate](c.charCodeAt(0), retn);
        if (retn.isEnd) {
            if (retn.hasArc) {
                if (retn.state === -1) {
                    jjdoLexAction(lexstate, jjstate);
                    jjmarker.state = -1;
                    jjbackupCount = 0;
                    jjstate = 0;
                    return false;
                }
                else {
                    jjmark();
                    jjstate = retn.state;
                    return jjconsume(c);
                }
            }
            else {
                jjdoLexAction(lexstate, jjstate);
                jjmarker.state = -1;
                jjbackupCount = 0;
                jjstate = 0;
                return false;
            }
        }
        else {
            if (retn.state === -1) {
                if (jjmarker.state !== -1) {
                    var s = jjrollback();
                    jjdoLexAction(lexstate, jjstate);
                    jjstate = 0;
                    accept(s);
                    return false;
                }
                else {
                    jjemit('lexicalerror', c, jjline, jjcolumn);
                    return true;
                }
            }
            else {
                jjstate = retn.state;
                return jjconsume(c);
            }
        }
    }
    function jjacceptEOF() {
        if (jjstate === 0) {
            jjprepareToken(0);
            jjreturnToken();
            return true;
        }
        else {
            var lexstate = jjlexState[jjlexState.length - 1];
            var retn = { state: jjstate, hasArc: false, isEnd: false };
            jjlexers[lexstate](-1, retn);
            if (retn.isEnd) {
                jjdoLexAction(lexstate, jjstate);
                jjstate = 0;
                jjmarker.state = -1;
                return false;
            }
            else if (jjmarker.state !== -1) {
                var s = jjrollback();
                jjdoLexAction(lexstate, jjstate);
                jjstate = 0;
                accept(s);
                return false;
            }
            else {
                jjemit('lexicalerror', '', jjline, jjcolumn);
                return true;
            }
        }
    }
    function accept(s) {
        for (var i = 0; i < s.length && !jjstop;) {
            jjacceptChar(s.charAt(i)) && i++;
        }
    }
    function end() {
        while (!jjstop && !jjacceptEOF())
            ;
        jjstop = true;
    }
    function halt() {
        jjstop = true;
    }
    function jjdoReduction(jjrulenum) {
        var jjnt = jjlhs[jjrulenum];
        var jjsp = jjsematicS.length;
        var jjtop = jjsematicS[jjsp - jjruleLen[jjrulenum]] || null;
        switch (jjrulenum) {
            case 1:
                jjlexState.push(2);
                break;
            case 5:
                {
                    gb.lexBuilder.prepareLex();
                }
                break;
            case 7:
                {
                    gb.incPr();
                }
                break;
            case 9:
                var b = jjsematicS[jjsp - 1];
                {
                    gb.setHeader(b);
                }
                break;
            case 10:
                var b = jjsematicS[jjsp - 1];
                {
                    gb.setExtraArg(b);
                }
                break;
            case 11:
                var ty = jjsematicS[jjsp - 1];
                {
                    gb.setType(ty);
                }
                break;
            case 12:
                var args = jjsematicS[jjsp - 2];
                var b = jjsematicS[jjsp - 1];
                {
                    gb.setInit(args, b);
                }
                break;
            case 13:
                var op = jjsematicS[jjsp - 1];
                {
                    gb.setOutput(op);
                }
                break;
            case 15:
                var t = jjsematicS[jjsp - 2];
                {
                    gb.defToken(t, null);
                }
                break;
            case 16:
                var t = jjsematicS[jjsp - 2];
                {
                    gb.defToken(t, null);
                }
                break;
            case 18:
                var ep = jjsematicS[jjsp - 1];
                {
                    gb.setEpilogue(ep);
                }
                break;
            case 19:
                {
                    assoc = Assoc.LEFT;
                }
                break;
            case 20:
                {
                    assoc = Assoc.RIGHT;
                }
                break;
            case 21:
                {
                    assoc = Assoc.NON;
                }
                break;
            case 24:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.defineTokenPrec(t, assoc, t.ext);
                }
                break;
            case 25:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.defineTokenPrec(t, assoc, TokenRefType.NAME);
                }
                break;
            case 26:
                var name = jjsematicS[jjsp - 3];
                var val = jjsematicS[jjsp - 1];
                {
                    gb.setOpt(name, val);
                }
                break;
            case 29:
                {
                    gb.lexBuilder.selectState('DEFAULT');
                }
                break;
            case 30:
                var s = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.selectState(s.val);
                }
                break;
            case 31:
                var s = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.selectState(s.val);
                }
                break;
            case 34:
                var v = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.prepareVar(v);
                }
                break;
            case 35:
                var v = jjsematicS[jjsp - 6];
                {
                    gb.lexBuilder.endVar();
                }
                break;
            case 36:
                {
                    gb.lexBuilder.end(lexacts, '(untitled)');
                }
                break;
            case 37:
                var tn = jjsematicS[jjsp - 5];
                {
                    var tdef = gb.defToken(tn, gb.lexBuilder.getPossibleAlias());
                    lexacts.push(returnToken(tdef));
                    gb.lexBuilder.end(lexacts, tn.val);
                }
                break;
            case 38:
                {
                    gb.lexBuilder.newState();
                }
                break;
            case 40:
                {
                    lexacts = [];
                }
                break;
            case 41:
                {
                    lexacts = [];
                }
                break;
            case 43:
                var b = jjsematicS[jjsp - 1];
                {
                    lexacts = [blockAction(b.val, b.startLine)];
                }
                break;
            case 46:
                var vn = jjsematicS[jjsp - 1];
                {
                    gb.addPushStateAction(lexacts, vn);
                }
                break;
            case 47:
                {
                    lexacts.push(popState());
                }
                break;
            case 48:
                var b = jjsematicS[jjsp - 1];
                {
                    lexacts.push(blockAction(b.val, b.startLine));
                }
                break;
            case 49:
                var s = jjsematicS[jjsp - 1];
                {
                    lexacts.push(setImg(s.val));
                }
                break;
            case 50:
                {
                    gb.lexBuilder.enterUnion();
                }
                break;
            case 51:
                {
                    gb.lexBuilder.leaveUnion();
                }
                break;
            case 52:
                {
                    gb.lexBuilder.endUnionItem();
                }
                break;
            case 53:
                {
                    gb.lexBuilder.endUnionItem();
                }
                break;
            case 56:
                {
                    gb.lexBuilder.enterSimple();
                }
                break;
            case 57:
                var suffix = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.simplePostfix(suffix.val);
                }
                break;
            case 58:
                {
                    jjtop = newNode('+');
                }
                break;
            case 59:
                {
                    jjtop = newNode('?');
                }
                break;
            case 60:
                {
                    jjtop = newNode('*');
                }
                break;
            case 61:
                {
                    jjtop = newNode('');
                }
                break;
            case 64:
                var n = jjsematicS[jjsp - 2];
                {
                    gb.lexBuilder.addVar(n);
                }
                break;
            case 65:
                var i = jjsematicS[jjsp - 2];
                {
                    gb.lexBuilder.importVar(i);
                }
                break;
            case 66:
                var s = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.addString(s.val);
                }
                break;
            case 67:
                {
                    gb.lexBuilder.beginSet(true);
                }
                break;
            case 68:
                {
                    gb.lexBuilder.beginSet(false);
                }
                break;
            case 73:
                var s = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.addSetItem(s, s);
                }
                break;
            case 74:
                var from = jjsematicS[jjsp - 3];
                var to = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.addSetItem(from, to);
                }
                break;
            case 78:
                var n = jjsematicS[jjsp - 1];
                {
                    ruleLhs = n;
                }
                break;
            case 84:
                {
                    gb.prepareRule(ruleLhs);
                }
                break;
            case 85:
                {
                    gb.commitRule();
                }
                break;
            case 88:
                var vn = jjsematicS[jjsp - 1];
                {
                    gb.addRuleUseVar(vn);
                }
                break;
            case 89:
                var vn = jjsematicS[jjsp - 1];
                {
                    gb.addRuleUseVar(vn);
                }
                break;
            case 94:
                var itn = jjsematicS[jjsp - 2];
                {
                    gb.addRuleSematicVar(itn);
                }
                break;
            case 96:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.addRuleItem(t, TokenRefType.NAME);
                }
                break;
            case 97:
                var vn = jjsematicS[jjsp - 2];
                {
                    gb.addRuleSematicVar(vn);
                }
                break;
            case 98:
                var vn = jjsematicS[jjsp - 4];
                var t = jjsematicS[jjsp - 1];
                {
                    gb.addRuleItem(t, TokenRefType.NAME);
                }
                break;
            case 99:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.addRuleItem(t, t.ext);
                }
                break;
            case 100:
                {
                    gb.addAction(lexacts);
                }
                break;
            case 101:
                var t = jjsematicS[jjsp - 2];
                {
                    jjtop = t;
                    jjtop.ext = TokenRefType.TOKEN;
                }
                break;
            case 102:
                {
                    jjtop.ext = TokenRefType.STRING;
                }
                break;
            case 105:
                {
                    gb.addAction(lexacts);
                }
                break;
            case 106:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.defineRulePr(t, TokenRefType.NAME);
                }
                break;
            case 107:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.defineRulePr(t, t.ext);
                }
                break;
            case 108:
                jjlexState.push(1);
                break;
            case 109:
                var open = jjsematicS[jjsp - 2];
                var bl = jjsematicS[jjsp - 1];
                jjlexState.pop();
                break;
            case 110:
                var open = jjsematicS[jjsp - 4];
                var bl = jjsematicS[jjsp - 3];
                var close = jjsematicS[jjsp - 1];
                {
                    jjtop = nodeBetween(open, close, bl.val);
                }
                break;
            case 111:
                var b = jjsematicS[jjsp - 1];
                {
                    jjtop.val += b.val;
                }
                break;
            case 112:
                {
                    jjtop = newNode('');
                }
                break;
            case 115:
                jjlexState.push(1);
                break;
            case 116:
                var b = jjsematicS[jjsp - 1];
                jjlexState.pop();
                break;
            case 117:
                var b = jjsematicS[jjsp - 3];
                {
                    jjtop = newNode('');
                    jjtop.val = '{' + b.val + '}';
                }
                break;
        }
        jjlrState.length -= jjruleLen[jjrulenum];
        var jjcstate = jjlrState[jjlrState.length - 1];
        jjlrState.push(jjpgoto[jjdisgoto[jjcstate] + jjnt]);
        jjsematicS.length -= jjruleLen[jjrulenum];
        jjsematicS.push(jjtop);
    }
    function jjacceptToken(t) {
        var cstate = jjlrState[jjlrState.length - 1];
        var ind = jjdisact[cstate] + t.id;
        var act = 0;
        if (ind < 0 || ind >= jjpact.length || jjcheckact[ind] !== cstate) {
            act = -jjdefred[cstate] - 1;
        }
        else {
            act = jjpact[ind];
        }
        if (act === jjactERR) {
            jjsyntaxError(t);
            return true;
        }
        else if (act > 0) {
            if (t.id === 0) {
                jjstop = true;
                jjemit('accept');
                return true;
            }
            else {
                jjlrState.push(act - 1);
                jjsematicS.push(jjsematicVal);
                jjsematicVal = null;
                return true;
            }
        }
        else if (act < 0) {
            jjdoReduction(-act - 1);
            return false;
        }
        else {
            jjsyntaxError(t);
            return true;
        }
    }
    function jjsyntaxError(t) {
        var msg = "unexpected token " + t.toString() + ", expecting one of the following token(s):\n";
        msg += jjexpected(jjlrState[jjlrState.length - 1]);
        jjemit("syntaxerror", msg, t);
    }
    function jjexpected(state) {
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
}
function charPosition(c, line, column) {
    return {
        startLine: line,
        startColumn: column,
        endLine: line,
        endColumn: c.charCodeAt(0) > 0xff ? column + 1 : column
    };
}
function parse(ctx, source) {
    var parser = createParser();
    var err = false;
    parser.on('lexicalerror', function (c, line, column) {
        ctx.requireLines(function (ctx, lines) {
            var msg2 = "unexpected character " + c;
            msg2 += ' ' + markPosition(charPosition(c, line, column), lines);
            ctx.err(new JsccError(msg2, 'Lexical error'));
        });
        parser.halt();
        err = true;
    });
    parser.on('syntaxerror', function (msg, token) {
        ctx.requireLines(function (ctx, lines) {
            var msg2 = markPosition(token, lines) + endl + msg;
            ctx.err(new JsccError(msg2, 'Syntax error'));
        });
        parser.halt();
        err = true;
    });
    var gb = createFileBuilder(ctx);
    parser.init(ctx, gb);
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
    echo("*/");
    for (var _i = 0, _b = input.file.header; _i < _b.length; _i++) {
        var h = _b[_i];
        echoLine("");
        echo(h.val);
    }
    var prefix = input.file.prefix;
    var tab = getOpt('tab', '    ');
    var ists = input.output === 'typescript';
    function ts(s, s2) {
        return ists ? s : (s2 || '');
    }
    function n(t, def) {
        if (def === void 0) { def = ''; }
        return t === null ? def : t.val;
    }
    function getOpt(n, def) {
        var t = input.file.opt[n];
        return t === undefined ? def : t.val.val;
    }
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
        echo("(c");
        echo(ts(": number"));
        echo(", ret");
        echo(ts(": { state: number, hasArc: boolean, isEnd: boolean }"));
        echoLine("){");
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
    printTable('tokenNames', pt.g.tokens, 20, 3, function (t) { return "\"" + t.sym.replace(/"/g, '\\"') + "\""; });
    echoLine("");
    echoLine("/*");
    echoLine("    token alias");
    echo("*/");
    printTable('tokenAlias', pt.g.tokens, 20, 3, function (t) { return t.alias ? "\"" + t.alias.replace(/"/g, '\\"') + "\"" : "null"; });
    var className = getOpt('className', 'Parser');
    echoLine("");
    function printLexActionsFunc(dfa, n) {
        var codegen = {
            addBlock: function (b, line) {
                echoLine("");
                echo("                ");
                echo(b.replace(/\$token/g, prefix + 'token').replace(/\$\$/g, prefix + 'sematicVal'));
            },
            pushLexState: function (n) {
                echoLine("");
                echo("                ");
                echo(prefix);
                echo("lexState.push(");
                echo(n);
                echo(");");
            },
            popLexState: function () {
                echoLine("");
                echo("                ");
                echo(prefix);
                echo("lexState.pop();");
            },
            setImg: function (n) {
                echoLine("");
                echo("                ");
                echo(prefix);
                echo("setImg(\"");
                echo(n);
                echo("\");");
            },
            returnToken: function (t) {
                echoLine("");
                echo("                this.");
                echo(prefix);
                echoLine("token = {");
                echo("                    id: ");
                echo(t.index);
                echoLine(",");
                echo("                    val: this.");
                echo(prefix);
                echoLine("matched.join('')");
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
        echo("    function ");
        echo(prefix);
        echo("doLexAction");
        echo(n);
        echo("(");
        echo(statevn + ts(": number"));
        echoLine("){");
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
        echo("tk !== -1 && ");
        echo(prefix);
        echo("prepareToken(");
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
    if (ists) {
        echoLine("");
        echoLine("function tokenToString(tk: number){");
        echo("    return ");
        echo(prefix);
        echo("tokenAlias[tk] === null ? `<${");
        echo(prefix);
        echo("tokenNames[tk]}>` : `\"${");
        echo(prefix);
        echoLine("tokenAlias[tk]}\"`;");
        echo("}");
    }
    else {
        echoLine("");
        echoLine("function tokenToString(tk){");
        echo("    return ");
        echo(prefix);
        echo("tokenAlias[tk] === null ? \"<\" + ");
        echo(prefix);
        echo("tokenNames[tk] + \">\" : '\"' + ");
        echo(prefix);
        echoLine("tokenAlias[tk] + '\"';");
        echo("}");
    }
    if (ists) {
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
        echo(n(input.file.initArg));
        echoLine(");");
        echoLine("    accept(s: string);");
        echoLine("    end();");
        echoLine("    halt();");
        echoLine("    on(ent: string, cb: (a1?, a2?, a3?) => any);");
        echo("}");
    }
    else {
        echoLine("");
        echoLine("function Token(id, val, startLine, startColumn, endLine, endColumn){");
        echoLine("    this.id = id;");
        echoLine("    this.val = val;");
        echoLine("    this.startLine = startLine;");
        echoLine("    this.startColumn = startColumn;");
        echoLine("    this.endLine = endLine;");
        echoLine("    this.endColumn = endColumn;");
        echoLine("}");
        echoLine("Token.prototype.clone = function(){");
        echoLine("    return new Token(");
        echoLine("        this.id,");
        echoLine("        this.val,");
        echoLine("        this.startLine,");
        echoLine("        this.startColumn,");
        echoLine("        this.endLine,");
        echoLine("        this.endColumn");
        echoLine("    );");
        echoLine("}");
        echoLine("Token.prototype.toString = function(){");
        echo("    return (");
        echo(prefix);
        echoLine("tokenAlias[this.id] === null ? ");
        echo("        '<' + ");
        echo(prefix);
        echoLine("tokenNames[this.id] + '>' :");
        echo("        '\"' + ");
        echo(prefix);
        echoLine("tokenAlias[this.id] + '\"') + \"(\" + this.val + \")\";");
        echo("}");
    }
    var stype = n(input.file.sematicType, 'any');
    echoLine("");
    echo("function create");
    echo(className);
    echo("()");
    echo(ts(': ' + className));
    echoLine(" {");
    echoLine("    // members for lexer");
    echo("    var ");
    echo(prefix);
    echo("lexState");
    echo(ts(": number[]"));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("state");
    echo(ts(": number"));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("matched");
    echo(ts(": string"));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("token");
    echo(ts(": Token"));
    echoLine(";");
    echoLine("    ");
    echo("    var ");
    echo(prefix);
    echo("marker");
    echo(ts(": { state: number, line: number, column: number }"));
    echoLine(" = { state: -1, line: 0, column: 0 };");
    echo("    var ");
    echo(prefix);
    echo("backupCount");
    echo(ts(": number"));
    echoLine(";");
    echoLine("");
    echo("    var ");
    echo(prefix);
    echo("line");
    echo(ts(": number"));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("column");
    echo(ts(": number"));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("tline");
    echo(ts(": number"));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("tcolumn");
    echo(ts(": number"));
    echoLine(";");
    echoLine("");
    echoLine("    // members for parser");
    echo("    var ");
    echo(prefix);
    echo("lrState");
    echo(ts(": number[]"));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("sematicS");
    echo(ts(': ' + stype + '[]'));
    echoLine(" = [];");
    echo("    var ");
    echo(prefix);
    echo("sematicVal");
    echo(ts(': ' + stype));
    echoLine(";");
    echoLine("");
    echo("    var ");
    echo(prefix);
    echoLine("stop;");
    echoLine("");
    echo("    var ");
    echo(prefix);
    echo("handlers");
    echo(ts(": {[s: string]: ((a1?, a2?, a3?) => any)[]}"));
    echoLine(" = {};");
    echoLine("");
    echoLine("    // extra members, defined by %extra_arg");
    echo("    ");
    echo(n(input.file.extraArgs));
    echoLine("");
    if (ists) {
        echoLine("");
        echoLine("    return {");
        echoLine("        init,");
        echoLine("        on,");
        echoLine("        accept,");
        echoLine("        end,");
        echoLine("        halt");
        echo("    };");
    }
    else {
        echoLine("");
        echoLine("    return {");
        echoLine("        init: init,");
        echoLine("        on: on,");
        echoLine("        accept: accept,");
        echoLine("        end: end,");
        echoLine("        halt: halt");
        echo("    };");
    }
    echoLine("");
    echo("    function init(");
    echo(n(input.file.initArg));
    echoLine("){");
    echo("        ");
    echo(prefix);
    echoLine("lexState = [ 0 ];// DEFAULT");
    echo("        ");
    echo(prefix);
    echoLine("state = 0;");
    echo("        ");
    echo(prefix);
    echoLine("matched = '';");
    echo("        ");
    echo(prefix);
    echoLine("token = new Token(-1, null, 0, 0, 0, 0);");
    echo("        ");
    echo(prefix);
    echoLine("marker.state = -1;");
    echo("        ");
    echo(prefix);
    echoLine("backupCount = 0;");
    echo("        ");
    echo(prefix);
    echo("line = ");
    echo(prefix);
    echoLine("tline = 0;");
    echo("        ");
    echo(prefix);
    echo("column = ");
    echo(prefix);
    echoLine("tcolumn = 0;");
    echoLine("        ");
    echo("        ");
    echo(prefix);
    echoLine("lrState = [ 0 ];");
    echo("        ");
    echo(prefix);
    echoLine("sematicS = [];");
    echo("        ");
    echo(prefix);
    echoLine("sematicVal = null;");
    echoLine("");
    echo("        ");
    echo(prefix);
    echoLine("stop = false;");
    echo("        ");
    echo(n(input.file.initBody));
    echoLine("");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  set ");
    echoLine("     */");
    echo("    function ");
    echo(prefix);
    echo("setImg(s");
    echo(ts(": string"));
    echoLine("){");
    echo("        ");
    echo(prefix);
    echoLine("matched = s;");
    echo("        ");
    echo(prefix);
    echo("tline = ");
    echo(prefix);
    echoLine("line;");
    echo("        ");
    echo(prefix);
    echo("tcolumn = ");
    echo(prefix);
    echoLine("column;");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echo("prepareToken(tid");
    echo(ts(": number"));
    echoLine("){");
    echo("        ");
    echo(prefix);
    echoLine("token.id = tid;");
    echo("        ");
    echo(prefix);
    echo("token.val = ");
    echo(prefix);
    echoLine("matched;");
    echo("        ");
    echo(prefix);
    echo("token.startLine = ");
    echo(prefix);
    echoLine("tline;");
    echo("        ");
    echo(prefix);
    echo("token.startColumn = ");
    echo(prefix);
    echoLine("tcolumn;");
    echo("        ");
    echo(prefix);
    echo("token.endLine = ");
    echo(prefix);
    echoLine("line;");
    echo("        ");
    echo(prefix);
    echo("token.endColumn = ");
    echo(prefix);
    echoLine("column - 1;");
    echoLine("");
    echo("        ");
    echo(prefix);
    echoLine("matched = '';");
    echo("        ");
    echo(prefix);
    echo("tline = ");
    echo(prefix);
    echoLine("line;");
    echo("        ");
    echo(prefix);
    echo("tcolumn = ");
    echo(prefix);
    echoLine("column;");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echoLine("returnToken(){");
    echo("        ");
    echo(prefix);
    echo("emit('token', ");
    echo(prefix);
    echo("tokenNames[");
    echo(prefix);
    echo("token.id], ");
    echo(prefix);
    echoLine("token.val);");
    echo("        while(!");
    echo(prefix);
    echo("stop && !");
    echo(prefix);
    echo("acceptToken(");
    echo(prefix);
    echoLine("token));");
    echo("        ");
    echo(prefix);
    echoLine("token.id = -1;");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echo("emit(name");
    echo(ts(": string") + ts(", a1?, a2?, a3?", ", a1, a2, a3"));
    echoLine("){");
    echo("        var cbs = ");
    echo(prefix);
    echoLine("handlers[name];");
    echoLine("        if(cbs){");
    echoLine("            for(var i = 0; i < cbs.length; i++){");
    echoLine("                cbs[i](a1, a2, a3);");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echo("    function on(name");
    echo(ts(": string"));
    echo(", cb");
    echo(ts(": (a1?, a2?, a3?) => any"));
    echoLine("){");
    echo("        ");
    echo(prefix);
    echo("handlers[name] || (");
    echo(prefix);
    echoLine("handlers[name] = []);");
    echo("        ");
    echo(prefix);
    echoLine("handlers[name].push(cb);");
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
    echo("    function ");
    echo(prefix);
    echo("doLexAction(lexstate");
    echo(ts(": number"));
    echo(", state");
    echo(ts(": number"));
    echoLine("){");
    echo("        switch(lexstate){");
    for (var i = 0; i < dfas.length; i++) {
        echoLine("");
        echo("            case ");
        echo(i);
        echoLine(":");
        echo("                ");
        echo(prefix);
        echo("doLexAction");
        echo(i);
        echoLine("(state);");
        echo("                break;");
    }
    echoLine("");
    echoLine("            default:;");
    echoLine("        }");
    echo("        ");
    echo(prefix);
    echo("token.id !== -1 && ");
    echo(prefix);
    echoLine("returnToken();");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echo("rollback()");
    echo(ts(": string"));
    echoLine("{");
    echo("        let ret = ");
    echo(prefix);
    echo("matched.substr(");
    echo(prefix);
    echo("matched.length - ");
    echo(prefix);
    echo("backupCount, ");
    echo(prefix);
    echoLine("backupCount);");
    echo("        ");
    echo(prefix);
    echo("matched = ");
    echo(prefix);
    echo("matched.substr(0, ");
    echo(prefix);
    echo("matched.length - ");
    echo(prefix);
    echoLine("backupCount);");
    echo("        ");
    echo(prefix);
    echoLine("backupCount = 0;");
    echo("        ");
    echo(prefix);
    echo("line = ");
    echo(prefix);
    echoLine("marker.line;");
    echo("        ");
    echo(prefix);
    echo("column = ");
    echo(prefix);
    echoLine("marker.column;");
    echo("        ");
    echo(prefix);
    echo("state = ");
    echo(prefix);
    echoLine("marker.state;");
    echo("        ");
    echo(prefix);
    echoLine("marker.state = -1;");
    echoLine("        return ret;");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echoLine("mark(){");
    echo("        ");
    echo(prefix);
    echo("marker.state = ");
    echo(prefix);
    echoLine("state;");
    echo("        ");
    echo(prefix);
    echo("marker.line = ");
    echo(prefix);
    echoLine("line;");
    echo("        ");
    echo(prefix);
    echo("marker.column = ");
    echo(prefix);
    echoLine("column;");
    echo("        ");
    echo(prefix);
    echoLine("backupCount = 0;");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echo("consume(c");
    echo(ts(": string"));
    echoLine("){");
    echo("        c === '\\n' ? (");
    echo(prefix);
    echo("line++, ");
    echo(prefix);
    echo("column = 0) : (");
    echo(prefix);
    echoLine("column += c.charCodeAt(0) > 0xff ? 2 : 1);");
    echo("        ");
    echo(prefix);
    echoLine("matched += c;");
    echo("        ");
    echo(prefix);
    echo("marker.state !== -1 && (");
    echo(prefix);
    echoLine("backupCount++);");
    echoLine("        return true;");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  accept a character");
    echoLine("     *  @return - true if the character is consumed, false if not consumed");
    echoLine("     *  @api private");
    echoLine("     *  @internal");
    echoLine("     */");
    echo("    function ");
    echo(prefix);
    echo("acceptChar(c");
    echo(ts(": string"));
    echoLine("){");
    echo("        var lexstate = ");
    echo(prefix);
    echo("lexState[");
    echo(prefix);
    echoLine("lexState.length - 1];");
    echo("        var retn = { state: ");
    echo(prefix);
    echoLine("state, hasArc: false, isEnd: false };");
    echo("        ");
    echo(prefix);
    echoLine("lexers[lexstate](c.charCodeAt(0), retn);");
    echoLine("        if(retn.isEnd){");
    echoLine("            // if current state is a terminate state, be careful");
    echoLine("            if(retn.hasArc){");
    echoLine("                if(retn.state === -1){");
    echoLine("                    // nowhere to go, stay where we are");
    echo("                    ");
    echo(prefix);
    echo("doLexAction(lexstate, ");
    echo(prefix);
    echoLine("state);");
    echoLine("                    // recover");
    echo("                    ");
    echo(prefix);
    echoLine("marker.state = -1;");
    echo("                    ");
    echo(prefix);
    echoLine("backupCount = 0;");
    echo("                    ");
    echo(prefix);
    echoLine("state = 0;                    ");
    echoLine("                    // character not consumed");
    echoLine("                    return false;");
    echoLine("                }");
    echoLine("                else {");
    echoLine("                    // now we can either go to that new state, or stay where we are");
    echoLine("                    // it is prefered to move forward, but that could lead to errors,");
    echoLine("                    // so we need to memorize this state before move on, in case if ");
    echoLine("                    // an error occurs later, we could just return to this state.");
    echo("                    ");
    echo(prefix);
    echoLine("mark();");
    echo("                    ");
    echo(prefix);
    echoLine("state = retn.state;");
    echo("                    return ");
    echo(prefix);
    echoLine("consume(c);");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                // current state doesn't lead to any state, just stay here.");
    echo("                ");
    echo(prefix);
    echo("doLexAction(lexstate, ");
    echo(prefix);
    echoLine("state);");
    echoLine("                // recover");
    echo("                ");
    echo(prefix);
    echoLine("marker.state = -1;");
    echo("                ");
    echo(prefix);
    echoLine("backupCount = 0;");
    echo("                ");
    echo(prefix);
    echoLine("state = 0;");
    echoLine("                // character not consumed");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            if(retn.state === -1){");
    echoLine("                // nowhere to go at current state, error may have occured.");
    echoLine("                // check marker to verify that");
    echo("                if(");
    echo(prefix);
    echoLine("marker.state !== -1){");
    echoLine("                    // we have a previously marked state, which is a terminate state.");
    echo("                    var s = ");
    echo(prefix);
    echoLine("rollback();");
    echo("                    ");
    echo(prefix);
    echo("doLexAction(lexstate, ");
    echo(prefix);
    echoLine("state);");
    echo("                    ");
    echo(prefix);
    echoLine("state = 0;");
    echoLine("                    accept(s);");
    echoLine("                    // character not consumed");
    echoLine("                    return false;");
    echoLine("                }");
    echoLine("                else {");
    echoLine("                    // error occurs");
    echo("                    ");
    echo(prefix);
    echo("emit('lexicalerror', c, ");
    echo(prefix);
    echo("line, ");
    echo(prefix);
    echoLine("column);");
    echoLine("                    // force consume");
    echoLine("                    return true;");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echo("                ");
    echo(prefix);
    echoLine("state = retn.state;");
    echoLine("                // character consumed");
    echo("                return ");
    echo(prefix);
    echoLine("consume(c);");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echoLine("acceptEOF(){");
    echo("        if(");
    echo(prefix);
    echoLine("state === 0){");
    echoLine("            // recover");
    echo("            ");
    echo(prefix);
    echoLine("prepareToken(0);");
    echo("            ");
    echo(prefix);
    echoLine("returnToken();");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("        else {");
    echo("            let lexstate = ");
    echo(prefix);
    echo("lexState[");
    echo(prefix);
    echoLine("lexState.length - 1];");
    echo("            let retn = { state: ");
    echo(prefix);
    echoLine("state, hasArc: false, isEnd: false };");
    echo("            ");
    echo(prefix);
    echoLine("lexers[lexstate](-1, retn);");
    echoLine("            if(retn.isEnd){");
    echo("                ");
    echo(prefix);
    echo("doLexAction(lexstate, ");
    echo(prefix);
    echoLine("state);");
    echo("                ");
    echo(prefix);
    echoLine("state = 0;");
    echo("                ");
    echo(prefix);
    echoLine("marker.state = -1;");
    echoLine("                return false;");
    echoLine("            }");
    echo("            else if(");
    echo(prefix);
    echoLine("marker.state !== -1){");
    echo("                let s = ");
    echo(prefix);
    echoLine("rollback();");
    echo("                ");
    echo(prefix);
    echo("doLexAction(lexstate, ");
    echo(prefix);
    echoLine("state);");
    echo("                ");
    echo(prefix);
    echoLine("state = 0;");
    echoLine("                accept(s);");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("            else {");
    echo("                ");
    echo(prefix);
    echo("emit('lexicalerror', '', ");
    echo(prefix);
    echo("line, ");
    echo(prefix);
    echoLine("column);");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  input a string");
    echoLine("     *  @api public");
    echoLine("     */");
    echo("    function accept(s");
    echo(ts(": string"));
    echoLine("){");
    echo("        for(let i = 0; i < s.length && !");
    echo(prefix);
    echoLine("stop;){");
    echo("            ");
    echo(prefix);
    echoLine("acceptChar(s.charAt(i)) && i++;");
    echoLine("        }");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  tell the compiler that end of file is reached");
    echoLine("     *  @api public");
    echoLine("     */");
    echoLine("    function end(){");
    echo("        while(!");
    echo(prefix);
    echo("stop && !");
    echo(prefix);
    echoLine("acceptEOF());");
    echo("        ");
    echo(prefix);
    echoLine("stop = true;");
    echoLine("    }");
    echoLine("    function halt(){");
    echo("        ");
    echo(prefix);
    echoLine("stop = true;");
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
                echo("                ");
                echo(prefix);
                echo("lexState.push(");
                echo(n);
                echo(");");
            },
            popLexState: function () {
                echoLine("");
                echo("                ");
                echo(prefix);
                echo("lexState.pop();");
            },
            setImg: function (n) {
                echoLine("");
                echo("                ");
                echo(prefix);
                echo("setImg(\"");
                echo(n);
                echo("\");");
            },
            returnToken: function (t) {
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
                    echo(" = ");
                    echo(prefix);
                    echo("sematicS[");
                    echo(prefix);
                    echo("sp - ");
                    echo(rule.rhs.length - rule.vars[uvar].val);
                    echo("];");
                }
                for (var uvar2 in rule.usedVars) {
                    echoLine("");
                    echo("                var ");
                    echo(uvar2);
                    echo(" = ");
                    echo(prefix);
                    echo("sematicS[");
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
    echo("    function ");
    echo(prefix);
    echo("doReduction(");
    echo(prefix);
    echo("rulenum");
    echo(ts(": number"));
    echoLine("){");
    echo("        var ");
    echo(prefix);
    echo("nt = ");
    echo(prefix);
    echo("lhs[");
    echo(prefix);
    echoLine("rulenum];");
    echo("        var ");
    echo(prefix);
    echo("sp = ");
    echo(prefix);
    echoLine("sematicS.length;");
    echo("        var ");
    echo(prefix);
    echo("top = ");
    echo(prefix);
    echo("sematicS[");
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
    echo("        ");
    echo(prefix);
    echo("lrState.length -= ");
    echo(prefix);
    echo("ruleLen[");
    echo(prefix);
    echoLine("rulenum];");
    echo("        var ");
    echo(prefix);
    echo("cstate = ");
    echo(prefix);
    echo("lrState[");
    echo(prefix);
    echoLine("lrState.length - 1];");
    echo("        ");
    echo(prefix);
    echo("lrState.push(");
    echo(prefix);
    echo("pgoto[");
    echo(prefix);
    echo("disgoto[");
    echo(prefix);
    echo("cstate] + ");
    echo(prefix);
    echoLine("nt]);");
    echoLine("");
    echo("        ");
    echo(prefix);
    echo("sematicS.length -= ");
    echo(prefix);
    echo("ruleLen[");
    echo(prefix);
    echoLine("rulenum];");
    echo("        ");
    echo(prefix);
    echo("sematicS.push(");
    echo(prefix);
    echoLine("top);");
    echoLine("    }");
    echoLine("");
    echo("    function ");
    echo(prefix);
    echo("acceptToken(t");
    echo(ts(": Token"));
    echoLine("){");
    echoLine("        // look up action table");
    echo("        var cstate = ");
    echo(prefix);
    echo("lrState[");
    echo(prefix);
    echoLine("lrState.length - 1];");
    echo("        var ind = ");
    echo(prefix);
    echoLine("disact[cstate] + t.id;");
    echoLine("        var act = 0;");
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
    echo("            ");
    echo(prefix);
    echoLine("syntaxError(t);");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("        else if(act > 0){");
    echoLine("            // shift");
    echoLine("            if(t.id === 0){");
    echoLine("                // end of file");
    echo("                ");
    echo(prefix);
    echoLine("stop = true;");
    echo("                ");
    echo(prefix);
    echoLine("emit('accept');");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("            else {");
    echo("                ");
    echo(prefix);
    echoLine("lrState.push(act - 1);");
    echo("                ");
    echo(prefix);
    echo("sematicS.push(");
    echo(prefix);
    echoLine("sematicVal);");
    echo("                ");
    echo(prefix);
    echoLine("sematicVal = null;");
    echoLine("                // token consumed");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echoLine("        else if(act < 0){");
    echo("            ");
    echo(prefix);
    echoLine("doReduction(-act - 1);");
    echoLine("            return false;");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            // error");
    echo("            ");
    echo(prefix);
    echoLine("syntaxError(t);");
    echoLine("            // force consume");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echo("syntaxError(t");
    echo(ts(": Token"));
    echoLine("){");
    echoLine("        var msg = \"unexpected token \" + t.toString() + \", expecting one of the following token(s):\\n\"");
    echo("        msg += ");
    echo(prefix);
    echo("expected(");
    echo(prefix);
    echo("lrState[");
    echo(prefix);
    echoLine("lrState.length - 1]);");
    echo("        ");
    echo(prefix);
    echoLine("emit(\"syntaxerror\", msg, t);");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echo("expected(state");
    echo(ts(": number"));
    echoLine("){");
    echo("        var dis = ");
    echo(prefix);
    echoLine("disact[state];");
    echoLine("        var ret = '';");
    echo("        function expect(tk");
    echo(ts(": number"));
    echoLine("){");
    echoLine("            var ind = dis + tk;");
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
    echo("        for(var tk = 0; tk < ");
    echo(prefix);
    echoLine("tokenCount; tk++){");
    echoLine("            expect(tk) && (ret += \"    \" + tokenToString(tk) + \" ...\" + '\\n');");
    echoLine("        }");
    echoLine("        return ret;");
    echoLine("    }");
    echoLine("}");
    echo(n(input.file.epilogue));
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
function listTemplates() {
    return Object.keys(templates);
}
defineTemplate('typescript', function (input, fc) {
    tsRenderer(input, fc);
    fc.save(input.file.name + ".ts");
});
defineTemplate('javascript', function (input, fc) {
    tsRenderer(input, fc);
    fc.save(input.file.name + ".js");
});

function genResult(source, fname) {
    var file;
    var itemSets;
    var iterationCount;
    var parseTable;
    var errors = [];
    var warnings = [];
    var needLinecbs = [];
    var terminated = false;
    var ret = {
        warn: warn,
        err: err,
        printItemSets: printItemSets,
        printTable: printTable,
        printDFA: printDFA,
        testParse: testParse$$1,
        printError: printError,
        printWarning: printWarning,
        hasWarning: hasWarning,
        hasError: hasError,
        warningSummary: warningSummary,
        getTemplateInput: getTemplateInput,
        requireLines: function (cb) { return needLinecbs.push(cb); },
        isTerminated: function () { return terminated; }
    };
    var f = parse(ret, source);
    var lines = source.split('\n');
    for (var _i = 0, needLinecbs_1 = needLinecbs; _i < needLinecbs_1.length; _i++) {
        var cb = needLinecbs_1[_i];
        cb(ret, lines);
    }
    if (hasError()) {
        terminated = true;
        return ret;
    }
    f.name = fname;
    var g = f.grammar;
    file = f;
    for (var _a = 0, _b = g.tokens; _a < _b.length; _a++) {
        var s = _b[_a];
        if (!s.used) {
            var msg = "token <" + s.sym + "> is never used, definations are(is):" + endl;
            for (var _c = 0, _d = s.appears; _c < _d.length; _c++) {
                var pos = _d[_c];
                msg += markPosition(pos, lines);
            }
            warn(new JsccWarning(msg));
        }
    }
    for (var _e = 0, _f = g.nts; _e < _f.length; _e++) {
        var s2 = _f[_e];
        if (!s2.used) {
            warn(new JsccWarning("non terminal \"" + s2.sym + "\" is unreachable"));
        }
    }
    if (f.output !== null && !templateExists(f.output.val)) {
        var msg = "template for '" + f.output.val + "' is not implemented yet " + markPosition(f.output, lines) + endl;
        msg += 'available templates are: ' + listTemplates().join(', ');
        err(new JsccError(msg));
    }
    if (hasError()) {
        terminated = true;
        return ret;
    }
    g.genFirstSets();
    var temp = genItemSets(g);
    itemSets = temp.result;
    iterationCount = temp.iterations;
    var temp2 = genParseTable(g, itemSets);
    temp2.result.findDefAct();
    parseTable = new CompressedPTable(temp2.result);
    for (var _g = 0, _h = temp2.conflicts; _g < _h.length; _g++) {
        var cf = _h[_g];
        warn(new JsccWarning(cf.toString()));
    }
    return ret;
    function warn(w) {
        warnings.push(w);
    }
    function err(e) {
        errors.push(e);
    }
    function printItemSets(stream) {
        stream.writeln(itemSets.size + ' state(s) in total,finished in ' + iterationCount + ' iteration(s).');
        itemSets.forEach(function (s) {
            stream.writeln(s.toString({ showTrailer: true }));
        });
    }
    function printTable(os) {
        printParseTable(os, parseTable, itemSets);
    }
    function printDFA(os) {
        for (var _i = 0, _a = file.lexDFA; _i < _a.length; _i++) {
            var s_1 = _a[_i];
            s_1.print(os);
            os.writeln();
            os.writeln();
        }
    }
    function testParse$$1(tokens) {
        return testParse(file.grammar, parseTable, tokens);
    }
    function printError(os, opt) {
        for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
            var e = errors_1[_i];
            os.writeln(e.toString(opt));
        }
        os.writeln();
    }
    function printWarning(os, opt) {
        for (var _i = 0, warnings_1 = warnings; _i < warnings_1.length; _i++) {
            var w = warnings_1[_i];
            os.writeln(w.toString(opt));
        }
        os.writeln();
    }
    function hasWarning() {
        return warnings.length > 0;
    }
    function hasError() {
        return errors.length > 0;
    }
    function warningSummary() {
        return warnings.length + " warning(s), " + errors.length + " error(s)";
    }
    function getTemplateInput() {
        return {
            endl: '\n',
            output: f.output === null ? 'typescript' : f.output.val,
            pt: parseTable,
            file: file
        };
    }
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
exports.defineTemplate = defineTemplate;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=tscc.js.map
