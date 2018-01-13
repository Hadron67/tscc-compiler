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
                    shift += "" + YYTAB + convertTokenToString(g.tokens[j]) + " : shift, and goto state " + item.shift.stateIndex + endl;
                }
                else {
                    reduce += "" + YYTAB + convertTokenToString(g.tokens[j]) + " : reduce with rule " + item.rule.index + endl;
                }
            }
        }
        for (var j = 0; j < ntCount; j++) {
            var item = cela.lookupGoto(i, j);
            if (item !== null) {
                gotot += "" + YYTAB + g.nts[j].sym + " : goto state " + item.shift.stateIndex + endl;
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
        this.header = '';
        this.extraArgs = '';
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

var StateBuilder = (function () {
    function StateBuilder(ctx) {
        this.ctx = ctx;
        this._head = new State();
        this._currentState = null;
        this._unionStack = [];
        this._simpleStack = [];
        this._currentArc = null;
        this._isInverse = false;
        this.possibleAlias = null;
        this._first = false;
        this._scount = 0;
        this._regexpVars = {};
        this._states = [new CmdArray('')];
        this._stateMap = { DEFAULT: 0 };
        this._selectedStates = [];
        this._selectedVar = null;
        this._ar = [];
        var cela = this;
        this.requiringState = new CoroutineMgr(function (s) {
            return cela._stateMap[s];
        });
    }
    StateBuilder.prototype._emit = function (func) {
        if (this._selectedVar !== null) {
            this._selectedVar.opcodes.push(func);
        }
        else {
            for (var _i = 0, _a = this._selectedStates; _i < _a.length; _i++) {
                var sn = _a[_i];
                sn.opcodes.push(func);
            }
        }
    };
    StateBuilder.prototype._exec = function (a) {
        this._head = this._currentState = new State();
        this._head.isStart = true;
        this._unionStack.length = 0;
        this._simpleStack.length = 0;
        this._currentArc = null;
        this._isInverse = false;
        this._ar.length = 0;
        this._ar.push({
            pc: 0,
            cmds: a
        });
        while (this._ar.length > 0) {
            var top_1 = this._ar[this._ar.length - 1];
            top_1.cmds.opcodes[top_1.pc++](this);
            top_1 = this._ar[this._ar.length - 1];
            top_1.pc >= top_1.cmds.opcodes.length && this._ar.pop();
        }
        this._head.removeEpsilons();
        var dhead = this._head.toDFA();
        var ret = new DFA(dhead.states);
        return ret;
    };
    StateBuilder.prototype.prepareVar = function (vname, line) {
        var vdef = this._regexpVars[vname];
        if (vdef !== undefined) {
            this.ctx.err(new CompilationError("variable \"" + vname + "\" was already defined at line " + vdef.line, line));
        }
        vdef = this._regexpVars[vname] = {
            line: line,
            cmds: new CmdArray(vname)
        };
        this._selectedVar = vdef.cmds;
    };
    StateBuilder.prototype.endVar = function () {
        this._selectedVar = null;
    };
    StateBuilder.prototype.prepareLex = function () {
        this._selectedStates.length = 0;
    };
    StateBuilder.prototype.selectState = function (s) {
        var sn = this._stateMap[s];
        if (sn === undefined) {
            sn = this._stateMap[s] = this._states.length;
            this._states.push(new CmdArray(''));
            this.requiringState.signal(s, sn);
        }
        this._selectedStates.push(this._states[this._stateMap[s]]);
    };
    StateBuilder.prototype.newState = function () {
        this._first = true;
        this.possibleAlias = null;
        this._emit(function (cela) {
            cela._currentState = new State();
            cela._head.epsilonTo(cela._currentState);
        });
    };
    StateBuilder.prototype.end = function (action, label) {
        if (label === void 0) { label = '(untitled)'; }
        for (var _i = 0, _a = this._selectedStates; _i < _a.length; _i++) {
            var sn = _a[_i];
            sn.label = "<" + label + ">";
        }
        this._emit(function (cela) {
            var ac = new EndAction();
            ac.id = ac.priority = cela._scount++;
            ac.data = action;
            cela._currentState.endAction = ac;
        });
    };
    StateBuilder.prototype.enterUnion = function () {
        this._emit(function (s) {
            s._unionStack.push({
                head: s._currentState,
                tail: new State()
            });
        });
    };
    StateBuilder.prototype.endUnionItem = function () {
        this._emit(function (s) {
            var top = s._unionStack[s._unionStack.length - 1];
            s._currentState.epsilonTo(top.tail);
            s._currentState = top.head;
        });
    };
    StateBuilder.prototype.leaveUnion = function () {
        this._emit(function (s) {
            s._currentState = s._unionStack.pop().tail;
        });
    };
    StateBuilder.prototype.enterSimple = function () {
        this._emit(function (s) {
            s._simpleStack.push(s._currentState);
        });
    };
    StateBuilder.prototype.simplePostfix = function (postfix) {
        postfix === '' || (this.possibleAlias = null, this._first = false);
        this._emit(function (s) {
            var top = s._simpleStack.pop();
            if (postfix === '?') {
                top.epsilonTo(s._currentState);
            }
            else if (postfix === '+') {
                s._currentState.epsilonTo(top);
            }
            else if (postfix === '*') {
                s._currentState.epsilonTo(top);
                s._currentState = top;
            }
        });
    };
    StateBuilder.prototype.addString = function (s) {
        if (this._first) {
            this.possibleAlias = s;
            this._first = false;
        }
        else {
            this.possibleAlias = null;
        }
        this._emit(function (cela) {
            for (var i = 0; i < s.length; i++) {
                var ns = new State();
                cela._currentState.to(ns).chars.add(s.charCodeAt(i));
                cela._currentState = ns;
            }
        });
    };
    StateBuilder.prototype.addVar = function (vname, line) {
        this._first = false;
        this.possibleAlias = null;
        this._emit(function (cela) {
            var vdef = cela._regexpVars[vname];
            if (vdef === undefined) {
                cela.ctx.err(new CompilationError("use of undefined variable \"" + vname + "\"", line));
            }
            var cmds = vdef.cmds;
            for (var i = 0; i < cela._ar.length; i++) {
                var aitem = cela._ar[i];
                if (aitem.cmds === cmds) {
                    var msg = "circular dependence in lexical variable detected: " + cmds.label;
                    for (i++; i < cela._ar.length; i++) {
                        msg += " -> " + cela._ar[i].cmds.label;
                    }
                    msg += " -> " + cmds.label;
                    cela.ctx.err(new CompilationError(msg, line));
                    return;
                }
            }
            cela._ar.push({
                pc: 0,
                cmds: cmds
            });
        });
    };
    StateBuilder.prototype.beginSet = function (inverse) {
        this._first = false;
        this.possibleAlias = null;
        this._emit(function (cela) {
            cela._isInverse = inverse;
            var ns = new State();
            cela._currentArc = cela._currentState.to(ns);
            cela._currentState = ns;
            inverse && cela._currentArc.chars.addAll();
        });
    };
    StateBuilder.prototype.addSetItem = function (from, to, line1, line2) {
        if (from.length !== 1) {
            this.ctx.err(new CompilationError("character expected in union, got \"" + from + "\"", line1));
            return;
        }
        if (to.length !== 1) {
            this.ctx.err(new CompilationError("character expected in union, got \"" + to + "\"", line2));
            return;
        }
        if (from.charCodeAt(0) > to.charCodeAt(0)) {
            this.ctx.err(new CompilationError("left hand side must be larger than right hand side in wild card character (got '" + from + "' > '" + to + "')", line1));
        }
        this._emit(function (cela) {
            cela._isInverse ?
                cela._currentArc.chars.remove(from.charCodeAt(0), to.charCodeAt(0)) :
                cela._currentArc.chars.add(from.charCodeAt(0), to.charCodeAt(0));
        });
    };
    StateBuilder.prototype.endSet = function () {
        this._emit(function (cela) {
            cela._currentArc = null;
        });
    };
    StateBuilder.prototype.build = function () {
        var dfas = [];
        for (var _i = 0, _a = this._states; _i < _a.length; _i++) {
            var state = _a[_i];
            dfas.push(this._exec(state));
        }
        this.requiringState.fail();
        return dfas;
    };
    return StateBuilder;
}());

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

var GBuilder = (function () {
    function GBuilder(ctx) {
        this._ctx = null;
        this._f = new File();
        this._g = new Grammar();
        this._tokenNameTable = {};
        this._tokenAliasTable = {};
        this._ruleStack = [];
        this._sematicVar = null;
        this._ntTable = {};
        this._requiringNt = null;
        this._genIndex = 0;
        this._first = true;
        this._pr = 1;
        this._onCommit = [];
        this._onDone = [];
        this._pseudoTokens = {};
        var cela = this;
        this._f.grammar = this._g;
        this._ctx = ctx;
        this.lexBuilder = new StateBuilder(ctx);
        this._requiringNt = new CoroutineMgr(function (s) {
            return cela._ntTable[s];
        });
        this.defToken('EOF', null, 0);
    }
    GBuilder.prototype._top = function () {
        return this._ruleStack[this._ruleStack.length - 1];
    };
    GBuilder.prototype._splitAction = function (line) {
        var saved = this._sematicVar;
        this._sematicVar = null;
        var t = this._top();
        var s = '@' + this._genIndex++;
        this.prepareRule(s, line);
        var gen = this._top();
        this.addAction(t.action);
        this.commitRule();
        t.action = null;
        this.addRuleItem(s, TokenRefType.NAME, line);
        this._sematicVar = saved;
        for (var vname in t.vars) {
            var v = t.vars[vname];
            gen.usedVars[vname] = { val: v.val, line: v.line };
        }
        for (var vname in t.usedVars) {
            var v = t.usedVars[vname];
            gen.usedVars[vname] = { val: v.val, line: v.line };
        }
    };
    GBuilder.prototype.err = function (msg, line) {
        this._ctx.err(new CompilationError(msg, line));
    };
    GBuilder.prototype.defToken = function (name, alias, line) {
        var tkdef = this._tokenNameTable[name];
        if (tkdef !== undefined) {
            return tkdef;
        }
        else {
            tkdef = {
                index: this._g.tokens.length,
                sym: name,
                alias: alias,
                line: line,
                pr: 0,
                assoc: Assoc.UNDEFINED,
                used: false
            };
            if (alias !== null) {
                this._tokenAliasTable[alias] || (this._tokenAliasTable[alias] = []);
                this._tokenAliasTable[alias].push(tkdef);
            }
            this._tokenNameTable[name] = tkdef;
            this._g.tokens.push(tkdef);
            return tkdef;
        }
    };
    GBuilder.prototype.getTokenByAlias = function (a, line) {
        var aa = this._tokenAliasTable[a];
        if (aa === undefined) {
            this.err("cannot identify \"" + a + "\" as a token", line);
            return null;
        }
        else if (aa.length > 1) {
            var ret = '';
            for (var i = 0; i < aa.length; i++) {
                i > 0 && (ret += ',');
                ret += "<" + aa[i].sym + ">";
            }
            this.err("cannot identify " + a + " as a token, since it could be " + ret, line);
            return null;
        }
        return aa[0];
    };
    GBuilder.prototype.getTokenByName = function (t, line) {
        var ret = this._tokenNameTable[t];
        if (ret === undefined) {
            this.err("cannot identify <" + t + "> as a token", line);
            return null;
        }
        return ret;
    };
    GBuilder.prototype.defineTokenPrec = function (tid, assoc, type, line) {
        if (type === TokenRefType.TOKEN) {
            var tk = this.getTokenByName(tid, line);
            if (tk !== null) {
                tk.assoc = assoc;
                tk.pr = this._pr;
            }
        }
        else if (type === TokenRefType.STRING) {
            var tk = this.getTokenByAlias(tid, line);
            if (tk !== null) {
                tk.assoc = assoc;
                tk.pr = this._pr;
            }
        }
        else if (type === TokenRefType.NAME) {
            var t2 = this._pseudoTokens[tid] = this._pseudoTokens[tid] || {
                assoc: assoc,
                pr: this._pr,
                line: line
            };
        }
    };
    GBuilder.prototype.setOpt = function (name, value) {
        this._f.opt[name] = value;
        return this;
    };
    GBuilder.prototype.setHeader = function (h) {
        this._f.header = h;
    };
    GBuilder.prototype.setExtraArg = function (a) {
        this._f.extraArgs = a;
    };
    GBuilder.prototype.setType = function (t) {
        this._f.sematicType = t;
    };
    GBuilder.prototype.incPr = function () {
        this._pr++;
        return this;
    };
    GBuilder.prototype.prepareRule = function (lhs, line) {
        if (this._first) {
            this._first = false;
            this.prepareRule('(accept)', line);
            this.addRuleItem(lhs, TokenRefType.NAME, line);
            this.addRuleItem('EOF', TokenRefType.TOKEN, line);
            this.commitRule();
        }
        var nt = this._ntTable[lhs];
        if (nt === undefined) {
            nt = this._ntTable[lhs] = {
                index: this._g.nts.length,
                sym: lhs,
                firstSet: null,
                used: false,
                rules: [],
                parents: []
            };
            this._g.nts.push(nt);
            this._requiringNt.signal(lhs, nt);
        }
        var nr = new Rule(this._g, nt, line);
        this._ruleStack.push(nr);
        return this;
    };
    GBuilder.prototype.addRuleUseVar = function (vname, line) {
        var t = this._top();
        if (t.usedVars[vname] !== undefined) {
            this.err("re-use of sematic variable \"" + vname + "\"", line);
        }
        else {
            t.usedVars[vname] = { line: line, val: 0 };
        }
    };
    GBuilder.prototype.addRuleSematicVar = function (vname, line) {
        var t = this._top();
        if (t.usedVars[vname] !== undefined) {
            this.err("variable \"" + vname + "\" conflicts with imported variable defined at line " + t.usedVars[vname].line, line);
        }
        else if (t.vars[vname] !== undefined) {
            this.err("sematic variable \"" + vname + "\" is already defined at line " + t.vars[vname].line, line);
        }
        else {
            this._sematicVar = { line: line, val: vname };
        }
    };
    GBuilder.prototype.addRuleItem = function (id, type, line) {
        var t = this._top();
        if (t.action !== null) {
            this._splitAction(line);
        }
        if (this._sematicVar !== null) {
            t.vars[this._sematicVar.val] = { val: t.rhs.length, line: this._sematicVar.line };
            this._sematicVar = null;
        }
        if (type === TokenRefType.NAME) {
            var cela_1 = this;
            var pos_1 = t.rhs.length;
            t.rhs.push(0);
            this._requiringNt.wait(id, function (su, nt) {
                if (su) {
                    t.rhs[pos_1] = -nt.index - 1;
                    nt.parents.push({
                        rule: t,
                        pos: pos_1
                    });
                    nt.used = true;
                }
                else {
                    cela_1.err("use of undefined non terminal " + id, line);
                }
            });
        }
        else if (type === TokenRefType.TOKEN) {
            var tl = this._tokenNameTable[id];
            if (tl === undefined) {
                this.err("cannot recognize <" + id + "> as a token", line);
                return;
            }
            t.rhs.push(tl.index);
            tl.used = true;
        }
        else if (type === TokenRefType.STRING) {
            var td = this.getTokenByAlias(id, line);
            if (td !== null) {
                t.rhs.push(td.index);
                td.used = true;
            }
        }
    };
    GBuilder.prototype.addAction = function (b) {
        var t = this._top();
        if (t.action !== null) {
            this._splitAction(t.line);
        }
        t.action = b;
        if (this._sematicVar !== null) {
            t.vars[this._sematicVar.val] = { val: t.rhs.length, line: this._sematicVar.line };
            this._sematicVar = null;
            this._splitAction(t.line);
        }
        return this;
    };
    GBuilder.prototype.defineRulePr = function (token, type, line) {
        if (type === TokenRefType.STRING || type === TokenRefType.TOKEN) {
            var tk = type === TokenRefType.STRING ?
                this.getTokenByAlias(token, line) :
                this.getTokenByName(token, line);
            if (tk !== null) {
                if (tk.assoc === Assoc.UNDEFINED) {
                    this.err("precedence of token \"" + token + "\" has not been defined", line);
                    return;
                }
                this._top().pr = tk.pr;
            }
        }
        else {
            var pt = this._pseudoTokens[token];
            if (!pt) {
                this.err("pseudo token \"" + token + "\" is not defined", line);
            }
            this._top().pr = pt.pr;
        }
    };
    GBuilder.prototype.commitRule = function () {
        var t = this._ruleStack.pop();
        t.index = this._g.rules.length;
        t.lhs.rules.push(t);
        this._g.rules.push(t);
        for (var _i = 0, _a = this._onCommit; _i < _a.length; _i++) {
            var cb = _a[_i];
            cb();
        }
        this._onCommit.length = 0;
        return this;
    };
    GBuilder.prototype.addPushStateAction = function (acts, vn, line) {
        var _this = this;
        this.lexBuilder.requiringState.wait(vn, function (su, sn) {
            if (su) {
                acts.push(pushState(sn));
            }
            else {
                _this._ctx.err(new CompilationError("state \"" + vn + "\" is undefined", line));
            }
        });
    };
    GBuilder.prototype.build = function () {
        this._g.tokenCount = this._g.tokens.length;
        this._g.tokens[0].used = true;
        this._g.nts[0].used = true;
        var cela = this;
        for (var _i = 0, _a = this._g.nts; _i < _a.length; _i++) {
            var nt = _a[_i];
            nt.firstSet = new TokenSet(this._g.tokenCount);
            for (var _b = 0, _c = nt.rules; _b < _c.length; _b++) {
                var rule = _c[_b];
                rule.calcPr();
                var _loop_1 = function (vname) {
                    var v = rule.usedVars[vname];
                    v.val = rule.getVarSp(vname, function (msg) {
                        cela.err("cannot find variable \"" + vname + "\": " + msg, v.line);
                    });
                };
                for (var vname in rule.usedVars) {
                    _loop_1(vname);
                }
            }
        }
        this._f.lexDFA = this.lexBuilder.build();
        for (var _d = 0, _e = this._onDone; _d < _e.length; _d++) {
            var cb = _e[_d];
            cb();
        }
        this._requiringNt.fail();
        return this._f;
    };
    return GBuilder;
}());

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
            else if (c === 108) {
                ret.state = 33;
            }
            else if (c === 110) {
                ret.state = 34;
            }
            else if (c === 111) {
                ret.state = 35;
            }
            else if (c === 112) {
                ret.state = 36;
            }
            else if (c === 114) {
                ret.state = 37;
            }
            else if (c === 116) {
                ret.state = 38;
            }
            else if (c === 117) {
                ret.state = 39;
            }
            else {
                ret.state = -1;
            }
            break;
        case 5:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 91) || c >= 93) {
                ret.state = 40;
            }
            else if (c === 39) {
                ret.state = 41;
            }
            else if (c === 92) {
                ret.state = 42;
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
                ret.state = 43;
            }
            else if (c === 47) {
                ret.state = 44;
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
                ret.state = 45;
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
                ret.state = 46;
            }
            else if (c === 117 || c === 120) {
                ret.state = 47;
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
                ret.state = 48;
            }
            else if (c === 120) {
                ret.state = 49;
            }
            else {
                ret.state = -1;
            }
            break;
        case 32:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 50;
            }
            else {
                ret.state = -1;
            }
            break;
        case 33:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 51;
            }
            else {
                ret.state = -1;
            }
            break;
        case 34:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 52;
            }
            else {
                ret.state = -1;
            }
            break;
        case 35:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 53;
            }
            else {
                ret.state = -1;
            }
            break;
        case 36:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 54;
            }
            else {
                ret.state = -1;
            }
            break;
        case 37:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 105) {
                ret.state = 55;
            }
            else {
                ret.state = -1;
            }
            break;
        case 38:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 121) {
                ret.state = 56;
            }
            else {
                ret.state = -1;
            }
            break;
        case 39:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 115) {
                ret.state = 57;
            }
            else {
                ret.state = -1;
            }
            break;
        case 40:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 91) || c >= 93) {
                ret.state = 40;
            }
            else if (c === 39) {
                ret.state = 41;
            }
            else if (c === 92) {
                ret.state = 42;
            }
            else {
                ret.state = -1;
            }
            break;
        case 41:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 42:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 34 || c === 39 || c === 92 || c === 98 || c === 102 || c === 110 || c === 114 || c === 116) {
                ret.state = 58;
            }
            else if (c === 117 || c === 120) {
                ret.state = 59;
            }
            else {
                ret.state = -1;
            }
            break;
        case 43:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 60;
            }
            else if (c === 42) {
                ret.state = 61;
            }
            else if (c === 47) {
                ret.state = 62;
            }
            else {
                ret.state = -1;
            }
            break;
        case 44:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c <= 9 || c >= 11) {
                ret.state = 63;
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
        case 47:
            ret.hasArc = true;
            ret.isEnd = false;
            if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 64;
            }
            else {
                ret.state = -1;
            }
            break;
        case 48:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 65;
            }
            else {
                ret.state = -1;
            }
            break;
        case 49:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 66;
            }
            else {
                ret.state = -1;
            }
            break;
        case 50:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 67;
            }
            else {
                ret.state = -1;
            }
            break;
        case 51:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 102) {
                ret.state = 68;
            }
            else if (c === 120) {
                ret.state = 69;
            }
            else {
                ret.state = -1;
            }
            break;
        case 52:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 110) {
                ret.state = 70;
            }
            else {
                ret.state = -1;
            }
            break;
        case 53:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 71;
            }
            else {
                ret.state = -1;
            }
            break;
        case 54:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 72;
            }
            else {
                ret.state = -1;
            }
            break;
        case 55:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 103) {
                ret.state = 73;
            }
            else {
                ret.state = -1;
            }
            break;
        case 56:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 112) {
                ret.state = 74;
            }
            else {
                ret.state = -1;
            }
            break;
        case 57:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 75;
            }
            else {
                ret.state = -1;
            }
            break;
        case 58:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 91) || c >= 93) {
                ret.state = 40;
            }
            else if (c === 39) {
                ret.state = 41;
            }
            else if (c === 92) {
                ret.state = 42;
            }
            else {
                ret.state = -1;
            }
            break;
        case 59:
            ret.hasArc = true;
            ret.isEnd = false;
            if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 76;
            }
            else {
                ret.state = -1;
            }
            break;
        case 60:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 60;
            }
            else if (c === 42) {
                ret.state = 61;
            }
            else if (c === 47) {
                ret.state = 77;
            }
            else {
                ret.state = -1;
            }
            break;
        case 61:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 46 || c >= 48) {
                ret.state = 78;
            }
            else if (c === 47) {
                ret.state = 79;
            }
            else {
                ret.state = -1;
            }
            break;
        case 62:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 47) {
                ret.state = 80;
            }
            else {
                ret.state = -1;
            }
            break;
        case 63:
            ret.hasArc = true;
            ret.isEnd = true;
            if (c <= 9 || c >= 11) {
                ret.state = 63;
            }
            else {
                ret.state = -1;
            }
            break;
        case 64:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 25;
            }
            else if (c === 34) {
                ret.state = 26;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 81;
            }
            else if (c === 92) {
                ret.state = 27;
            }
            else {
                ret.state = -1;
            }
            break;
        case 65:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 82;
            }
            else {
                ret.state = -1;
            }
            break;
        case 66:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 83;
            }
            else {
                ret.state = -1;
            }
            break;
        case 67:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 100) {
                ret.state = 84;
            }
            else {
                ret.state = -1;
            }
            break;
        case 68:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 85;
            }
            else {
                ret.state = -1;
            }
            break;
        case 69:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 70:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 86;
            }
            else {
                ret.state = -1;
            }
            break;
        case 71:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 105) {
                ret.state = 87;
            }
            else {
                ret.state = -1;
            }
            break;
        case 72:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 99) {
                ret.state = 88;
            }
            else {
                ret.state = -1;
            }
            break;
        case 73:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 104) {
                ret.state = 89;
            }
            else {
                ret.state = -1;
            }
            break;
        case 74:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 90;
            }
            else {
                ret.state = -1;
            }
            break;
        case 75:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 76:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 40;
            }
            else if (c === 39) {
                ret.state = 41;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 91;
            }
            else if (c === 92) {
                ret.state = 42;
            }
            else {
                ret.state = -1;
            }
            break;
        case 77:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 60;
            }
            else if (c === 42) {
                ret.state = 61;
            }
            else if (c === 47) {
                ret.state = 77;
            }
            else {
                ret.state = -1;
            }
            break;
        case 78:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 60;
            }
            else if (c === 42) {
                ret.state = 61;
            }
            else if (c === 47) {
                ret.state = 62;
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
            if (c <= 41 || (c >= 43 && c <= 46) || c >= 48) {
                ret.state = 60;
            }
            else if (c === 42) {
                ret.state = 61;
            }
            else if (c === 47) {
                ret.state = 62;
            }
            else {
                ret.state = -1;
            }
            break;
        case 81:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 33) || (c >= 35 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 25;
            }
            else if (c === 34) {
                ret.state = 26;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 81;
            }
            else if (c === 92) {
                ret.state = 27;
            }
            else {
                ret.state = -1;
            }
            break;
        case 82:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 121) {
                ret.state = 92;
            }
            else {
                ret.state = -1;
            }
            break;
        case 83:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 93;
            }
            else {
                ret.state = -1;
            }
            break;
        case 84:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 101) {
                ret.state = 94;
            }
            else {
                ret.state = -1;
            }
            break;
        case 85:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 86:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 115) {
                ret.state = 95;
            }
            else {
                ret.state = -1;
            }
            break;
        case 87:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 96;
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
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 116) {
                ret.state = 97;
            }
            else {
                ret.state = -1;
            }
            break;
        case 90:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 91:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c <= 9 || (c >= 11 && c <= 38) || (c >= 40 && c <= 47) || (c >= 58 && c <= 64) || (c >= 71 && c <= 91) || (c >= 93 && c <= 96) || c >= 103) {
                ret.state = 40;
            }
            else if (c === 39) {
                ret.state = 41;
            }
            else if ((c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102)) {
                ret.state = 91;
            }
            else if (c === 92) {
                ret.state = 42;
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
            if (c === 95) {
                ret.state = 98;
            }
            else {
                ret.state = -1;
            }
            break;
        case 94:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 114) {
                ret.state = 99;
            }
            else {
                ret.state = -1;
            }
            break;
        case 95:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 115) {
                ret.state = 100;
            }
            else {
                ret.state = -1;
            }
            break;
        case 96:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 110) {
                ret.state = 101;
            }
            else {
                ret.state = -1;
            }
            break;
        case 97:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 98:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 97) {
                ret.state = 102;
            }
            else {
                ret.state = -1;
            }
            break;
        case 99:
            ret.hasArc = false;
            ret.isEnd = true;
            ret.state = -1;
            break;
        case 100:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 111) {
                ret.state = 103;
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
            if (c === 114) {
                ret.state = 104;
            }
            else {
                ret.state = -1;
            }
            break;
        case 103:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 99) {
                ret.state = 105;
            }
            else {
                ret.state = -1;
            }
            break;
        case 104:
            ret.hasArc = true;
            ret.isEnd = false;
            if (c === 103) {
                ret.state = 106;
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
var jjlexers = [
    moveDFA0,
    moveDFA1,
];
var jjlexTokens0 = [
    -1, -1, -1, 1, -1, -1, 18, 19, 24, 25,
    33, 26, -1, 27, 29, 17, 20, 16, 23, 21,
    22, 32, 3, 31, 4, -1, 2, -1, 1, 1,
    30, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, 2, -1, -1, -1, 28, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, 6,
    -1, -1, -1, -1, -1, 10, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, 7, -1, -1, 15, -1,
    14, -1, 13, -1, -1, -1, -1, 8, -1, 11,
    -1, 5, -1, -1, -1, 9, 12,
];
var jjlexTokens1 = [
    34, 34, 3, 4,
];
var jjtokenCount = 35;
var jjactERR = 163;
var jjpact = [
    9, 7, 13, 14, 15, 143, 10, 11, 77, 12,
    -106, -45, 162, 110, -45, 151, 152, 150, 107, 108,
    142, 140, -82, 110, 141, 5, -45, -46, 107, 108,
    -46, 89, -100, 86, 89, -100, -82, 147, -82, 24,
    89, 52, -46, 24, 89, -107, 88, 93, 121, 88,
    54, 60, 55, -34, 58, 88, 48, 43, 19, 88,
    42, 94, 37, 38, 161, 133, 159, 158, 157, 133,
    155, 120, 145, 49, 144, 52, 137, 104, 125, 124,
    123, 122, 118, -100, 114, 113, 112, 29, 104, 101,
    -89, 99, 98, 97, 96, 95, 90, 83, 81, 80,
    75, 71, 69, 68, 64, 63, 62, 57, 50, 41,
    39, 33, 28, 25, 19, 4, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
var jjdisact = [
    -35, 115, -5, -35, 113, -35, -35, 42, 110, -35,
    -35, 111, -35, -35, -35, 57, -35, -35, -35, 94,
    38, -35, -35, -35, -35, -35, -35, -35, -35, -35,
    35, 107, 108, -35, 56, -35, -35, -35, -35, 40,
    -35, -35, 88, 21, -35, 97, 50, -35, 105, 103,
    -35, -35, 101, -35, -35, 90, 84, -35, -35, -35,
    84, -35, -35, -35, -35, 85, 7, -35, 98, 78,
    96, 41, -35, 32, 32, -35, 76, 29, 28, -35,
    78, 78, 66, 88, -35, -35, -35, 90, -35, 89,
    -35, -35, -35, 88, -35, 61, -35, -35, 70, 84,
    -35, 68, -35, 80, 66, -35, 80, -35, -35, 78,
    76, -35, -35, -35, -35, 57, -35, 50, -35, -35,
    3, -35, -35, -35, -7, -35, 45, 11, -35, 3,
    41, -35, 46, -35, 7, 15, -35, -35, -8, -35,
    39, 69, -35, 67, 66, 63, -35, -5, -35, -35,
    -35, -35, 47, 63, 48, -35, -35, -35, -35, -10,
    -35, -35,
];
var jjcheckact = [
    2, 2, 2, 2, 2, 129, 2, 2, 66, 2,
    134, 147, 159, 124, 147, 138, 138, 138, 124, 124,
    129, 129, 66, 120, 129, 2, 147, 127, 120, 120,
    127, 77, 77, 74, 74, 73, 66, 135, 66, 20,
    20, 134, 127, 7, 7, 71, 77, 78, 135, 74,
    43, 46, 43, 73, 46, 20, 39, 34, 15, 7,
    34, 78, 30, 30, 154, 153, 152, 145, 144, 143,
    141, 140, 132, 39, 130, 71, 126, 117, 115, 110,
    109, 106, 104, 103, 101, 99, 98, 15, 95, 93,
    89, 87, 83, 82, 81, 80, 76, 70, 69, 68,
    65, 60, 56, 55, 52, 49, 48, 45, 42, 32,
    31, 19, 11, 8, 4, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
var jjdefred = [
    3, -1, -1, 0, -1, 2, 4, -1, -1, 99,
    99, -1, 11, 12, 13, -1, 67, 68, 69, 21,
    6, 15, 16, 17, 19, 8, 9, 10, 1, 66,
    -1, -1, -1, 14, -1, 75, 71, 72, 25, -1,
    22, 7, -1, -1, 74, 78, 30, 20, -1, -1,
    102, 104, -1, 70, 75, 84, -1, 5, 24, 26,
    -1, 23, 18, 103, 73, 94, 86, 82, -1, -1,
    42, 105, 76, 95, -1, 83, 87, 33, -1, 80,
    -1, -1, -1, -1, 96, 97, 98, -1, 93, 85,
    90, 91, 77, -1, 42, 32, 42, 107, -1, -1,
    79, -1, 28, 33, -1, 37, -1, 39, 40, -1,
    -1, 92, 89, 27, 31, -1, 35, 32, 48, 58,
    99, 38, 41, 103, 99, 29, 43, 48, 47, -1,
    60, 63, 64, 36, 100, -1, 48, 46, 53, 42,
    59, -1, 57, -1, -1, -1, 34, 48, 49, 50,
    51, 52, -1, 61, -1, 62, 65, 101, 54, -1,
    56, 55,
];
var jjpgoto = [
    5, 138, 7, 84, 115, 91, 115, 77, 75, 31,
    20, 21, 137, 129, 148, 137, 129, 135, 105, 86,
    55, 133, 72, 73, 35, 33, 19, 159, 130, 131,
    155, 153, 145, 78, 50, 52, 90, 116, 110, 116,
    110, 114, 115, 50, 52, 83, 81, 118, 134, 108,
    110, 22, 108, 110, 65, 66, 58, 125, 60, 29,
    17, 102, 99, 69, 46, 22, 64, 45, 39, 30,
    26, 110, 15, 16, 17, 116, 110, 1, 2, 152,
    118, 147, 128, 129, 126, 127, 128, 129, 104, 118,
    101, 118, 71, 43, 44, 45, 34, 25, 110, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1,
];
var jjdisgoto = [
    76, -57, -3, -57, 40, -57, 22, 4, -57, 47,
    20, -57, -57, -57, -57, 26, -57, -57, 34, 0,
    18, -57, -57, -57, 88, -57, -57, -57, -57, -57,
    -12, -57, 58, -57, -57, 56, -57, -57, 53, -57,
    -57, -57, -57, -57, -57, -20, 44, -57, -57, -57,
    -57, -57, -57, -57, 28, 12, -57, -57, -57, 50,
    -57, -57, -57, 39, -57, -26, -37, -57, -8, -57,
    26, -11, -57, -13, -28, -57, -57, -11, -57, -57,
    -57, -57, -57, -57, -57, -57, -57, -57, -57, 16,
    -57, -57, -57, -57, 70, 46, 68, -57, -57, -57,
    -57, -57, -57, 25, -57, -57, -57, -57, -57, -57,
    -57, -57, -57, -57, -57, -57, -57, 42, 62, -57,
    2, -57, -57, -5, -1, -57, -57, -9, -57, -26,
    -57, -57, -57, -57, -20, -57, 58, -57, -12, 59,
    3, -57, -57, -1, -57, -57, -57, -12, -57, -57,
    -57, -57, -57, -2, -57, -57, -57, -57, -57, -57,
    -57, -57,
];
var jjruleLen = [
    2, 4, 2, 0, 0, 6, 2, 4, 2, 2,
    2, 1, 1, 1, 2, 1, 1, 1, 4, 0,
    3, 0, 1, 3, 2, 0, 0, 6, 5, 7,
    0, 2, 0, 0, 4, 1, 3, 1, 2, 1,
    1, 2, 0, 2, 3, 1, 2, 1, 0, 3,
    1, 1, 1, 0, 3, 4, 3, 1, 1, 0,
    1, 0, 3, 1, 1, 3, 2, 1, 1, 0,
    5, 1, 1, 3, 1, 0, 4, 4, 0, 3,
    1, 1, 1, 2, 0, 2, 0, 1, 0, 4,
    2, 2, 3, 1, 0, 1, 2, 2, 2, 0,
    0, 5, 2, 0, 1, 0, 0, 5,
];
var jjlhs = [
    0, 1, 2, 2, 4, 3, 3, 3, 3, 3,
    3, 5, 5, 5, 6, 6, 7, 7, 8, 8,
    9, 9, 10, 10, 11, 11, 13, 12, 12, 12,
    14, 15, 15, 17, 16, 16, 18, 18, 19, 19,
    19, 19, 21, 20, 22, 22, 23, 23, 25, 24,
    26, 26, 26, 26, 27, 27, 27, 27, 28, 28,
    29, 29, 30, 30, 31, 31, 32, 32, 33, 35,
    34, 36, 36, 37, 37, 39, 38, 40, 40, 41,
    41, 42, 42, 43, 43, 44, 44, 45, 46, 45,
    45, 45, 47, 47, 48, 48, 48, 49, 49, 51,
    52, 50, 53, 53, 54, 55, 56, 54,
];
var jjtokenNames = [
    "EOF", "NAME", "STRING",
    "OPEN_BLOCK", "CLOSE_BLOCK", "OPT_DIR",
    "LEX_DIR", "LEFT_DIR", "RIGHT_DIR",
    "NONASSOC_DIR", "USE_DIR", "HEADER_DIR",
    "EXTRA_ARG_DIR", "EMPTY", "TYPE_DIR",
    "PREC_DIR", "GT", "LT",
    "BRA", "KET", "EQU",
    "CBRA", "CKET", "QUESTION",
    "STAR", "PLUS", "DASH",
    "COLON", "ARROW", "EOL",
    "SEPERATOR", "OR", "WEDGE",
    "COMMA", "ANY_CODE",
];
var jjtokenAlias = [
    null, null, null,
    "{", "}", "%option",
    "%lex", "%left", "%right",
    "%nonassoc", "%use", "%header",
    "%extra_arg", "%empty", "%type",
    "%prec", ">", "<",
    "(", ")", "=",
    "[", "]", "?",
    "*", "+", "-",
    ":", "=>", ";",
    "%%", "|", "^",
    ",", null,
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
var Parser = (function () {
    function Parser() {
        this._marker = { state: -1, line: 0, column: 0 };
        this._lrState = [];
        this._sematicS = [];
        this._handlers = {};
        this.init();
    }
    Parser.prototype.init = function () {
        this._lexState = [0];
        this._state = 0;
        this._matched = '';
        this._token = new Token(-1, null, 0, 0, 0, 0);
        this._marker.state = -1;
        this._backupCount = 0;
        this._line = this._tline = 1;
        this._column = this._tcolumn = 1;
        this._lrState = [0];
        this._sematicS = [];
        this._sematicVal = null;
        this._stop = false;
    };
    Parser.prototype._setImg = function (s) {
        this._matched = s;
        this._tline = this._line;
        this._tcolumn = this._column;
    };
    Parser.prototype._prepareToken = function (tid) {
        this._token.id = tid;
        this._token.val = this._matched;
        this._token.startLine = this._tline;
        this._token.startColumn = this._tcolumn;
        this._token.endLine = this._line;
        this._token.endColumn = this._column;
        this._matched = '';
        this._tline = this._line;
        this._tcolumn = this._column;
    };
    Parser.prototype._returnToken = function () {
        this._emit('token', jjtokenNames[this._token.id], this._token.val);
        while (!this._stop && !this._acceptToken(this._token))
            ;
        this._token.id = -1;
    };
    Parser.prototype._emit = function (name, a1, a2, a3) {
        var cbs = this._handlers[name];
        if (cbs) {
            for (var _i = 0, cbs_1 = cbs; _i < cbs_1.length; _i++) {
                var cb = cbs_1[_i];
                cb(a1, a2, a3);
            }
        }
    };
    Parser.prototype.on = function (name, cb) {
        this._handlers[name] || (this._handlers[name] = []);
        this._handlers[name].push(cb);
    };
    Parser.prototype._doLexAction0 = function (jjstaten) {
        var jjtk = jjlexTokens0[jjstaten];
        jjtk !== -1 && this._prepareToken(jjtk);
        switch (jjstaten) {
            case 1:
                this._setImg("");
                break;
            case 3:
                this._sematicVal = nodeFromToken(this._token);
                break;
            case 22:
                this._sematicVal = nodeFromTrivalToken(this._token);
                break;
            case 24:
                this._sematicVal = nodeFromTrivalToken(this._token);
                break;
            case 26:
                this._sematicVal = nodeFromToken(this._token);
                this._sematicVal.val = unescape(this._sematicVal.val.substr(1, this._sematicVal.val.length - 2));
                break;
            case 28:
                this._sematicVal = nodeFromToken(this._token);
                break;
            case 29:
                this._sematicVal = nodeFromToken(this._token);
                break;
            case 41:
                this._sematicVal = nodeFromToken(this._token);
                this._sematicVal.val = unescape(this._sematicVal.val.substr(1, this._sematicVal.val.length - 2));
                break;
            case 44:
                this._setImg("");
                break;
            case 63:
                this._setImg("");
                break;
            case 79:
                this._setImg("");
                break;
            default: ;
        }
    };
    Parser.prototype._doLexAction1 = function (jjstaten) {
        var jjtk = jjlexTokens1[jjstaten];
        jjtk !== -1 && this._prepareToken(jjtk);
        switch (jjstaten) {
            case 0:
                this._sematicVal = newNode(this._token.val);
                break;
            case 1:
                this._sematicVal = newNode(this._token.val);
                break;
            case 2:
                this._sematicVal = nodeFromTrivalToken(this._token);
                break;
            case 3:
                this._sematicVal = nodeFromTrivalToken(this._token);
                break;
            default: ;
        }
    };
    Parser.prototype._doLexAction = function (lexstate, state) {
        switch (lexstate) {
            case 0:
                this._doLexAction0(state);
                break;
            case 1:
                this._doLexAction1(state);
                break;
            default: ;
        }
        this._token.id !== -1 && this._returnToken();
    };
    Parser.prototype._rollback = function () {
        var ret = this._matched.substr(this._matched.length - this._backupCount, this._backupCount);
        this._matched = this._matched.substr(0, this._matched.length - this._backupCount);
        this._backupCount = 0;
        this._line = this._marker.line;
        this._column = this._marker.column;
        this._state = this._marker.state;
        this._marker.state = -1;
        return ret;
    };
    Parser.prototype._mark = function () {
        this._marker.state = this._state;
        this._marker.line = this._line;
        this._marker.column = this._column;
        this._backupCount = 0;
    };
    Parser.prototype._acceptChar = function (c) {
        function consume(cela, c) {
            c === '\n' ? (cela._line++, cela._column = 0) : (cela._column++);
            cela._matched += c;
            cela._marker.state !== -1 && (cela._backupCount++);
            return true;
        }
        var lexstate = this._lexState[this._lexState.length - 1];
        var retn = { state: this._state, hasArc: false, isEnd: false };
        jjlexers[lexstate](c.charCodeAt(0), retn);
        if (retn.isEnd) {
            if (retn.hasArc) {
                if (retn.state === -1) {
                    this._doLexAction(lexstate, this._state);
                    this._marker.state = -1;
                    this._backupCount = 0;
                    this._state = 0;
                    return false;
                }
                else {
                    this._mark();
                    this._state = retn.state;
                    return consume(this, c);
                }
            }
            else {
                this._doLexAction(lexstate, this._state);
                this._marker.state = -1;
                this._backupCount = 0;
                this._state = 0;
                return false;
            }
        }
        else {
            if (retn.state === -1) {
                if (this._marker.state !== -1) {
                    var s = this._rollback();
                    this._doLexAction(lexstate, this._state);
                    this._state = 0;
                    this.accept(s);
                    return false;
                }
                else {
                    this._emit('lexicalerror', "unexpected character \"" + c + "\"", this._line, this._column);
                    return true;
                }
            }
            else {
                this._state = retn.state;
                return consume(this, c);
            }
        }
    };
    Parser.prototype._acceptEOF = function () {
        if (this._state === 0) {
            this._prepareToken(0);
            this._returnToken();
            return true;
        }
        else {
            var lexstate = this._lexState[this._lexState.length - 1];
            var retn = { state: this._state, hasArc: false, isEnd: false };
            jjlexers[lexstate](-1, retn);
            if (retn.isEnd) {
                this._doLexAction(lexstate, this._state);
                this._state = 0;
                this._marker.state = -1;
                return false;
            }
            else if (this._marker.state !== -1) {
                var s = this._rollback();
                this._doLexAction(lexstate, this._state);
                this._state = 0;
                this.accept(s);
                return false;
            }
            else {
                this._emit('lexicalerror', 'unexpected end of file');
                return true;
            }
        }
    };
    Parser.prototype.accept = function (s) {
        for (var i = 0; i < s.length && !this._stop;) {
            this._acceptChar(s.charAt(i)) && i++;
        }
    };
    Parser.prototype.end = function () {
        while (!this._stop && !this._acceptEOF())
            ;
        this._stop = true;
    };
    Parser.prototype.halt = function () {
        this._stop = true;
    };
    Parser.prototype._doReduction = function (jjrulenum) {
        var jjnt = jjlhs[jjrulenum];
        var jjsp = this._sematicS.length;
        var jjtop = this._sematicS[jjsp - jjruleLen[jjrulenum]] || null;
        switch (jjrulenum) {
            case 4:
                {
                    this.gb.lexBuilder.prepareLex();
                }
                break;
            case 8:
                var b = this._sematicS[jjsp - 1];
                {
                    this.gb.setHeader(b.val);
                }
                break;
            case 9:
                var b = this._sematicS[jjsp - 1];
                {
                    this.gb.setExtraArg(b.val);
                }
                break;
            case 10:
                var t = this._sematicS[jjsp - 1];
                {
                    this.gb.setType(t.val);
                }
                break;
            case 11:
                {
                    this.assoc = Assoc.LEFT;
                }
                break;
            case 12:
                {
                    this.assoc = Assoc.RIGHT;
                }
                break;
            case 13:
                {
                    this.assoc = Assoc.NON;
                }
                break;
            case 16:
                var t = this._sematicS[jjsp - 1];
                {
                    this.gb.defineTokenPrec(t.val, this.assoc, t.ext, t.startLine);
                }
                break;
            case 17:
                var t = this._sematicS[jjsp - 1];
                {
                    this.gb.defineTokenPrec(t.val, this.assoc, TokenRefType.NAME, t.startLine);
                }
                break;
            case 18:
                var name = this._sematicS[jjsp - 3];
                var val = this._sematicS[jjsp - 1];
                {
                    this.gb.setOpt(name.val, val.val);
                }
                break;
            case 21:
                {
                    this.gb.lexBuilder.selectState('DEFAULT');
                }
                break;
            case 22:
                var s = this._sematicS[jjsp - 1];
                {
                    this.gb.lexBuilder.selectState(s.val);
                }
                break;
            case 23:
                var s = this._sematicS[jjsp - 1];
                {
                    this.gb.lexBuilder.selectState(s.val);
                }
                break;
            case 26:
                var v = this._sematicS[jjsp - 1];
                {
                    this.gb.lexBuilder.prepareVar(v.val, v.startLine);
                }
                break;
            case 27:
                var v = this._sematicS[jjsp - 6];
                {
                    this.gb.lexBuilder.endVar();
                }
                break;
            case 28:
                {
                    this.gb.lexBuilder.end(this.lexacts, '(untitled)');
                }
                break;
            case 29:
                var tn = this._sematicS[jjsp - 5];
                {
                    var tdef = this.gb.defToken(tn.val, this.gb.lexBuilder.possibleAlias, tn.startLine);
                    this.lexacts.push(returnToken(tdef));
                    this.gb.lexBuilder.end(this.lexacts, tn.val);
                }
                break;
            case 30:
                {
                    this.gb.lexBuilder.newState();
                }
                break;
            case 32:
                {
                    this.lexacts = [];
                }
                break;
            case 33:
                {
                    this.lexacts = [];
                }
                break;
            case 35:
                var b = this._sematicS[jjsp - 1];
                {
                    this.lexacts = [blockAction(b.val, b.startLine)];
                }
                break;
            case 38:
                var vn = this._sematicS[jjsp - 1];
                {
                    this.gb.addPushStateAction(this.lexacts, vn.val, vn.startLine);
                }
                break;
            case 39:
                {
                    this.lexacts.push(popState());
                }
                break;
            case 40:
                var b = this._sematicS[jjsp - 1];
                {
                    this.lexacts.push(blockAction(b.val, b.startLine));
                }
                break;
            case 41:
                var s = this._sematicS[jjsp - 1];
                {
                    this.lexacts.push(setImg(s.val));
                }
                break;
            case 42:
                {
                    this.gb.lexBuilder.enterUnion();
                }
                break;
            case 43:
                {
                    this.gb.lexBuilder.leaveUnion();
                }
                break;
            case 44:
                {
                    this.gb.lexBuilder.endUnionItem();
                }
                break;
            case 45:
                {
                    this.gb.lexBuilder.endUnionItem();
                }
                break;
            case 48:
                {
                    this.gb.lexBuilder.enterSimple();
                }
                break;
            case 49:
                var suffix = this._sematicS[jjsp - 1];
                {
                    this.gb.lexBuilder.simplePostfix(suffix.val);
                }
                break;
            case 50:
                {
                    jjtop = newNode('+');
                }
                break;
            case 51:
                {
                    jjtop = newNode('?');
                }
                break;
            case 52:
                {
                    jjtop = newNode('*');
                }
                break;
            case 53:
                {
                    jjtop = newNode('');
                }
                break;
            case 56:
                var n = this._sematicS[jjsp - 2];
                {
                    this.gb.lexBuilder.addVar(n.val, n.startLine);
                }
                break;
            case 57:
                var s = this._sematicS[jjsp - 1];
                {
                    this.gb.lexBuilder.addString(s.val);
                }
                break;
            case 58:
                {
                    this.gb.lexBuilder.beginSet(true);
                }
                break;
            case 59:
                {
                    this.gb.lexBuilder.beginSet(false);
                }
                break;
            case 64:
                var s = this._sematicS[jjsp - 1];
                {
                    this.gb.lexBuilder.addSetItem(s.val, s.val, s.startLine, s.startLine);
                }
                break;
            case 65:
                var from = this._sematicS[jjsp - 3];
                var to = this._sematicS[jjsp - 1];
                {
                    this.gb.lexBuilder.addSetItem(from.val, to.val, from.startLine, to.startLine);
                }
                break;
            case 69:
                var n = this._sematicS[jjsp - 1];
                {
                    this.ruleLhs = n;
                }
                break;
            case 75:
                {
                    this.gb.prepareRule(this.ruleLhs.val, this.ruleLhs.startLine);
                }
                break;
            case 76:
                {
                    this.gb.commitRule();
                }
                break;
            case 79:
                var vn = this._sematicS[jjsp - 1];
                {
                    this.gb.addRuleUseVar(vn.val, vn.startLine);
                }
                break;
            case 80:
                var vn = this._sematicS[jjsp - 1];
                {
                    this.gb.addRuleUseVar(vn.val, vn.startLine);
                }
                break;
            case 85:
                var itn = this._sematicS[jjsp - 2];
                {
                    this.gb.addRuleSematicVar(itn.val, itn.startLine);
                }
                break;
            case 87:
                var t = this._sematicS[jjsp - 1];
                {
                    this.gb.addRuleItem(t.val, TokenRefType.NAME, t.startLine);
                }
                break;
            case 88:
                var vn = this._sematicS[jjsp - 2];
                {
                    this.gb.addRuleSematicVar(vn.val, vn.startLine);
                }
                break;
            case 89:
                var vn = this._sematicS[jjsp - 4];
                var t = this._sematicS[jjsp - 1];
                {
                    this.gb.addRuleItem(t.val, TokenRefType.NAME, t.startLine);
                }
                break;
            case 90:
                var t = this._sematicS[jjsp - 1];
                {
                    this.gb.addRuleItem(t.val, t.ext, t.startLine);
                }
                break;
            case 91:
                {
                    this.gb.addAction(this.lexacts);
                }
                break;
            case 92:
                var t = this._sematicS[jjsp - 2];
                {
                    jjtop = t;
                    jjtop.ext = TokenRefType.TOKEN;
                }
                break;
            case 93:
                {
                    jjtop.ext = TokenRefType.STRING;
                }
                break;
            case 96:
                {
                    this.gb.addAction(this.lexacts);
                }
                break;
            case 97:
                var t = this._sematicS[jjsp - 1];
                {
                    this.gb.defineRulePr(t.val, TokenRefType.NAME, t.startLine);
                }
                break;
            case 98:
                var t = this._sematicS[jjsp - 1];
                {
                    this.gb.defineRulePr(t.val, t.ext, t.startLine);
                }
                break;
            case 99:
                this._lexState.push(1);
                break;
            case 100:
                var open = this._sematicS[jjsp - 2];
                var bl = this._sematicS[jjsp - 1];
                this._lexState.pop();
                break;
            case 101:
                var open = this._sematicS[jjsp - 4];
                var bl = this._sematicS[jjsp - 3];
                var close = this._sematicS[jjsp - 1];
                {
                    jjtop = newNode('');
                    jjtop.val = bl.val;
                    jjtop.startLine = open.startLine;
                    jjtop.startColumn = open.startColumn;
                    jjtop.endLine = close.endLine;
                    jjtop.endColumn = close.endColumn;
                }
                break;
            case 102:
                var b = this._sematicS[jjsp - 1];
                {
                    jjtop.val += b.val;
                }
                break;
            case 103:
                {
                    jjtop = newNode('');
                }
                break;
            case 105:
                this._lexState.push(1);
                break;
            case 106:
                var b = this._sematicS[jjsp - 1];
                this._lexState.pop();
                break;
            case 107:
                var b = this._sematicS[jjsp - 3];
                {
                    jjtop = newNode('');
                    jjtop.val = '{' + b.val + '}';
                }
                break;
        }
        this._lrState.length -= jjruleLen[jjrulenum];
        var jjcstate = this._lrState[this._lrState.length - 1];
        this._lrState.push(jjpgoto[jjdisgoto[jjcstate] + jjnt]);
        this._sematicS.length -= jjruleLen[jjrulenum];
        this._sematicS.push(jjtop);
    };
    Parser.prototype._acceptToken = function (t) {
        var cstate = this._lrState[this._lrState.length - 1];
        var ind = jjdisact[cstate] + t.id;
        var act = 0;
        if (ind < 0 || ind >= jjpact.length || jjcheckact[ind] !== cstate) {
            act = -jjdefred[cstate] - 1;
        }
        else {
            act = jjpact[ind];
        }
        if (act === jjactERR) {
            this._syntaxError(t);
            return true;
        }
        else if (act > 0) {
            if (t.id === 0) {
                this._stop = true;
                this._emit('accept');
                return true;
            }
            else {
                this._lrState.push(act - 1);
                this._sematicS.push(this._sematicVal);
                this._sematicVal = null;
                return true;
            }
        }
        else if (act < 0) {
            this._doReduction(-act - 1);
            return false;
        }
        else {
            this._syntaxError(t);
            return true;
        }
    };
    Parser.prototype._syntaxError = function (t) {
        var msg = "unexpected token " + t.toString() + ", expecting one of the following token(s):\n";
        msg += this._expected(this._lrState[this._lrState.length - 1]);
        this._emit("syntaxerror", msg, t);
    };
    Parser.prototype._expected = function (state) {
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
    };
    return Parser;
}());

function parse(ctx, source) {
    var parser = new Parser();
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
    parser.gb = new GBuilder(ctx);
    parser.accept(source);
    parser.end();
    if (err) {
        return null;
    }
    else {
        return parser.gb.build();
    }
}

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
            prefix: 'jj',
            endl: '\n',
            opt: this.file.opt,
            header: this.file.header,
            extraArg: this.file.extraArgs,
            g: this.file.grammar,
            pt: this.parseTable,
            sematicType: this.file.sematicType,
            dfas: this.file.lexDFA
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

var tsRenderer = function (input, output) {
    echoLine("/*");
    echoLine("    generated by jscc, an LALR(1) parser generator made by hadroncfy.");
    echoLine("    template for typescript, written by hadroncfy, aussi.");
    echoLine("*/");
    echo(input.header);
    var prefix = input.prefix;
    var tab = input.opt.tab || '    ';
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
        echo("let ");
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
        for (var _i = 0, _b = state.arcs; _i < _b.length; _i++) {
            var arc = _b[_i];
            if (first) {
                echoLine("");
                echo("            if(");
                echo(arcToString(arc));
                echoLine("){");
                echo("                ret.state = ");
                echo(arc.to.index);
                echoLine(";");
                echo("            }");
                first = false;
            }
            else {
                echoLine("");
                echo("            else if(");
                echo(arcToString(arc));
                echoLine("){");
                echo("                ret.state = ");
                echo(arc.to.index);
                echoLine(";");
                echo("            }");
            }
        }
        if (state.arcs.length === 0) {
            echoLine("");
            echo("            ret.state = -1;");
        }
        else {
            echoLine("");
            echoLine("            else {");
            echoLine("                ret.state = -1;");
            echo("            }");
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
    echoLine("");
    echoLine("");
    echoLine("/*");
    echoLine("    find the next state to go in the dfa");
    echo("*/");
    for (var i = 0, _a = input.dfas; i < _a.length; i++) {
        printDFA(_a[i], i);
    }
    echoLine("");
    echoLine("");
    echoLine("/*");
    echoLine("    all the lexer data goes here.");
    echoLine("*/");
    echo("let ");
    echo(prefix);
    echo("lexers = [");
    for (var i = 0; i < input.dfas.length; i++) {
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
    for (var i = 0, _a = input.dfas; i < _a.length; i++) {
        printLexTokens(_a[i], i);
    }
    echoLine("");
    var pt = input.pt;
    echoLine("");
    echo("let ");
    echo(prefix);
    echo("stateCount = ");
    echo(pt.stateCount);
    echoLine(";");
    echo("let ");
    echo(prefix);
    echo("tokenCount = ");
    echo(input.g.tokens.length);
    echoLine(";");
    echo("let ");
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
    var className = input.opt.className || 'Parser';
    echoLine("");
    function printLexActionsFunc(dfa, n) {
        var codegen = {
            addBlock: function (b, line) {
                echoLine("");
                echo("                ");
                echo(b.replace(/\$token/g, 'this._token').replace(/\$\$/g, 'this._sematicVal'));
            },
            pushLexState: function (n) {
                echoLine("");
                echo("                this._lexState.push(");
                echo(n);
                echo(");");
            },
            popLexState: function () {
                echoLine("");
                echo("                this._lexState.pop();");
            },
            setImg: function (n) {
                echoLine("");
                echo("                this._setImg(\"");
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
        echo("    private _doLexAction");
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
        echo("tk !== -1 && this._prepareToken(");
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
    echoLine("export function tokenToString(tk: number){");
    echo("    return ");
    echo(prefix);
    echo("tokenAlias[tk] === null ? `<${");
    echo(prefix);
    echo("tokenNames[tk]}>` : `\"${");
    echo(prefix);
    echoLine("tokenAlias[tk]}\"`;");
    echoLine("}");
    echoLine("");
    echoLine("export class Token {");
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
    echo("}");
    var stype = input.sematicType || 'any';
    echoLine("");
    echo("export class ");
    echo(className);
    echoLine(" {");
    echoLine("    // members for lexer");
    echoLine("    private _lexState: number[];");
    echoLine("    private _state: number;");
    echoLine("    private _matched: string;");
    echoLine("    private _token: Token;");
    echoLine("    ");
    echoLine("    private _marker: { state: number, line: number, column: number } = { state: -1, line: 0, column: 0 };");
    echoLine("    private _backupCount: number;");
    echoLine("");
    echoLine("    private _line: number;");
    echoLine("    private _column: number;");
    echoLine("    private _tline: number;");
    echoLine("    private _tcolumn: number;");
    echoLine("");
    echoLine("    // members for parser");
    echoLine("    private _lrState: number[] = [];");
    echo("    private _sematicS: ");
    echo(stype);
    echoLine("[] = [];");
    echo("    private _sematicVal: ");
    echo(stype);
    echoLine(";");
    echoLine("");
    echoLine("    private _stop;");
    echoLine("");
    echoLine("    private _handlers: {[s: string]: ((a1?, a2?, a3?) => any)[]} = {};");
    echoLine("");
    echoLine("    // extra members, defined by %extra_arg");
    echo("    ");
    echo(input.extraArg);
    echoLine("");
    echoLine("");
    echoLine("    constructor(){");
    echoLine("        this.init();");
    echoLine("    }");
    echoLine("    init(){");
    echoLine("        this._lexState = [ 0 ];// DEFAULT");
    echoLine("        this._state = 0;");
    echoLine("        this._matched = '';");
    echoLine("        this._token = new Token(-1, null, 0, 0, 0, 0);");
    echoLine("        this._marker.state = -1;");
    echoLine("        this._backupCount = 0;");
    echoLine("        this._line = this._tline = 1;");
    echoLine("        this._column = this._tcolumn = 1;");
    echoLine("        ");
    echoLine("        this._lrState = [ 0 ];");
    echoLine("        this._sematicS = [];");
    echoLine("        this._sematicVal = null;");
    echoLine("");
    echoLine("        this._stop = false;");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  set ");
    echoLine("     */");
    echoLine("    private _setImg(s: string){");
    echoLine("        this._matched = s;");
    echoLine("        this._tline = this._line;");
    echoLine("        this._tcolumn = this._column;");
    echoLine("    }");
    echoLine("    private _prepareToken(tid: number){");
    echoLine("        this._token.id = tid;");
    echoLine("        this._token.val = this._matched;");
    echoLine("        this._token.startLine = this._tline;");
    echoLine("        this._token.startColumn = this._tcolumn;");
    echoLine("        this._token.endLine = this._line;");
    echoLine("        this._token.endColumn = this._column;");
    echoLine("");
    echoLine("        this._matched = '';");
    echoLine("        this._tline = this._line;");
    echoLine("        this._tcolumn = this._column;");
    echoLine("    }");
    echoLine("    private _returnToken(){");
    echo("        this._emit('token', ");
    echo(prefix);
    echoLine("tokenNames[this._token.id], this._token.val);");
    echoLine("        while(!this._stop && !this._acceptToken(this._token));");
    echoLine("        this._token.id = -1;");
    echoLine("    }");
    echoLine("    private _emit(name: string, a1?, a2?, a3?){");
    echoLine("        let cbs = this._handlers[name];");
    echoLine("        if(cbs){");
    echoLine("            for(let cb of cbs){");
    echoLine("                cb(a1, a2, a3);");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    on(name: string, cb: (a1?, a2?, a3?) => any){");
    echoLine("        this._handlers[name] || (this._handlers[name] = []);");
    echoLine("        this._handlers[name].push(cb);");
    echo("    }");
    for (var i = 0, _a = input.dfas; i < _a.length; i++) {
        printLexActionsFunc(_a[i], i);
    }
    echoLine("");
    echoLine("    /**");
    echoLine("     *  do a lexical action");
    echoLine("     *  @api private");
    echoLine("     *  @internal");
    echoLine("     */");
    echoLine("    private _doLexAction(lexstate: number, state: number){");
    echo("        switch(lexstate){");
    for (var i = 0; i < input.dfas.length; i++) {
        echoLine("");
        echo("            case ");
        echo(i);
        echoLine(":");
        echo("                this._doLexAction");
        echo(i);
        echoLine("(state);");
        echo("                break;");
    }
    echoLine("");
    echoLine("            default:;");
    echoLine("        }");
    echoLine("        this._token.id !== -1 && this._returnToken();");
    echoLine("    }");
    echoLine("    private _rollback(){");
    echoLine("        let ret = this._matched.substr(this._matched.length - this._backupCount, this._backupCount);");
    echoLine("        this._matched = this._matched.substr(0, this._matched.length - this._backupCount);");
    echoLine("        this._backupCount = 0;");
    echoLine("        this._line = this._marker.line;");
    echoLine("        this._column = this._marker.column;");
    echoLine("        this._state = this._marker.state;");
    echoLine("        this._marker.state = -1;");
    echoLine("        return ret;");
    echoLine("    }");
    echoLine("    private _mark(){");
    echoLine("        this._marker.state = this._state;");
    echoLine("        this._marker.line = this._line;");
    echoLine("        this._marker.column = this._column;");
    echoLine("        this._backupCount = 0;");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  accept a character");
    echoLine("     *  @return - true if the character is consumed, false if not consumed");
    echoLine("     *  @api private");
    echoLine("     *  @internal");
    echoLine("     */");
    echoLine("    private _acceptChar(c: string){");
    echo("        function consume(cela: ");
    echo(className);
    echoLine(", c: string){");
    echoLine("            c === '\\n' ? (cela._line++, cela._column = 0) : (cela._column++);");
    echoLine("            cela._matched += c;");
    echoLine("            cela._marker.state !== -1 && (cela._backupCount++);");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("        let lexstate = this._lexState[this._lexState.length - 1];");
    echoLine("        let retn = { state: this._state, hasArc: false, isEnd: false };");
    echo("        ");
    echo(prefix);
    echoLine("lexers[lexstate](c.charCodeAt(0), retn);");
    echoLine("        if(retn.isEnd){");
    echoLine("            // if current state is a terminate state, be careful");
    echoLine("            if(retn.hasArc){");
    echoLine("                if(retn.state === -1){");
    echoLine("                    // nowhere to go, stay where we are");
    echoLine("                    this._doLexAction(lexstate, this._state);");
    echoLine("                    // recover");
    echoLine("                    this._marker.state = -1;");
    echoLine("                    this._backupCount = 0;");
    echoLine("                    this._state = 0;                    ");
    echoLine("                    // character not consumed");
    echoLine("                    return false;");
    echoLine("                }");
    echoLine("                else {");
    echoLine("                    // now we can either go to that new state, or stay where we are");
    echoLine("                    // it is prefered to move forward, but that could lead to errors,");
    echoLine("                    // so we need to memorize this state before move on, in case if ");
    echoLine("                    // an error occurs later, we could just return to this state.");
    echoLine("                    this._mark();");
    echoLine("                    this._state = retn.state;");
    echoLine("                    return consume(this, c);");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                // current state doesn't lead to any state, just stay here.");
    echoLine("                this._doLexAction(lexstate, this._state);");
    echoLine("                // recover");
    echoLine("                this._marker.state = -1;");
    echoLine("                this._backupCount = 0;");
    echoLine("                this._state = 0;");
    echoLine("                // character not consumed");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            if(retn.state === -1){");
    echoLine("                // nowhere to go at current state, error may have occured.");
    echoLine("                // check marker to verify that");
    echoLine("                if(this._marker.state !== -1){");
    echoLine("                    // we have a previously marked state, which is a terminate state.");
    echoLine("                    let s = this._rollback();");
    echoLine("                    this._doLexAction(lexstate, this._state);");
    echoLine("                    this._state = 0;");
    echoLine("                    this.accept(s);");
    echoLine("                    // character not consumed");
    echoLine("                    return false;");
    echoLine("                }");
    echoLine("                else {");
    echoLine("                    // error occurs");
    echoLine("                    this._emit('lexicalerror', `unexpected character \"${c}\"`, this._line, this._column);");
    echoLine("                    // force consume");
    echoLine("                    return true;");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                this._state = retn.state;");
    echoLine("                // character consumed");
    echoLine("                return consume(this, c);");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    private _acceptEOF(){");
    echoLine("        if(this._state === 0){");
    echoLine("            // recover");
    echoLine("            this._prepareToken(0);");
    echoLine("            this._returnToken();");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            let lexstate = this._lexState[this._lexState.length - 1];");
    echoLine("            let retn = { state: this._state, hasArc: false, isEnd: false };");
    echo("            ");
    echo(prefix);
    echoLine("lexers[lexstate](-1, retn);");
    echoLine("            if(retn.isEnd){");
    echoLine("                this._doLexAction(lexstate, this._state);");
    echoLine("                this._state = 0;");
    echoLine("                this._marker.state = -1;");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("            else if(this._marker.state !== -1){");
    echoLine("                let s = this._rollback();");
    echoLine("                this._doLexAction(lexstate, this._state);");
    echoLine("                this._state = 0;");
    echoLine("                this.accept(s);");
    echoLine("                return false;");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                this._emit('lexicalerror', 'unexpected end of file');");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  input a string");
    echoLine("     *  @api public");
    echoLine("     */");
    echoLine("    accept(s: string){");
    echoLine("        for(let i = 0; i < s.length && !this._stop;){");
    echoLine("            this._acceptChar(s.charAt(i)) && i++;");
    echoLine("        }");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  tell the compiler that end of file is reached");
    echoLine("     *  @api public");
    echoLine("     */");
    echoLine("    end(){");
    echoLine("        while(!this._stop && !this._acceptEOF());");
    echoLine("        this._stop = true;");
    echoLine("    }");
    echoLine("    halt(){");
    echoLine("        this._stop = true;");
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
                echo("                this._lexState.push(");
                echo(n);
                echo(");");
            },
            popLexState: function () {
                echoLine("");
                echo("                this._lexState.pop();");
            },
            setImg: function (n) {
                echoLine("");
                echo("                this._setImg(\"");
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
        for (var _i = 0, _b = input.g.rules; _i < _b.length; _i++) {
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
                    echo(" = this._sematicS[");
                    echo(prefix);
                    echo("sp - ");
                    echo(rule.rhs.length - rule.vars[uvar].val);
                    echo("];");
                }
                for (var uvar2 in rule.usedVars) {
                    echoLine("");
                    echo("                var ");
                    echo(uvar2);
                    echo(" = this._sematicS[");
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
    echo("    private _doReduction(");
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
    echoLine("sp = this._sematicS.length;");
    echo("        let ");
    echo(prefix);
    echo("top = this._sematicS[");
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
    echo("        this._lrState.length -= ");
    echo(prefix);
    echo("ruleLen[");
    echo(prefix);
    echoLine("rulenum];");
    echo("        let ");
    echo(prefix);
    echoLine("cstate = this._lrState[this._lrState.length - 1];");
    echo("        this._lrState.push(");
    echo(prefix);
    echo("pgoto[");
    echo(prefix);
    echo("disgoto[");
    echo(prefix);
    echo("cstate] + ");
    echo(prefix);
    echoLine("nt]);");
    echoLine("");
    echo("        this._sematicS.length -= ");
    echo(prefix);
    echo("ruleLen[");
    echo(prefix);
    echoLine("rulenum];");
    echo("        this._sematicS.push(");
    echo(prefix);
    echoLine("top);");
    echoLine("    }");
    echoLine("");
    echoLine("    private _acceptToken(t: Token){");
    echoLine("        // look up action table");
    echoLine("        let cstate = this._lrState[this._lrState.length - 1];");
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
    echoLine("            this._syntaxError(t);");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("        else if(act > 0){");
    echoLine("            // shift");
    echoLine("            if(t.id === 0){");
    echoLine("                // end of file");
    echoLine("                this._stop = true;");
    echoLine("                this._emit('accept');");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                this._lrState.push(act - 1);");
    echoLine("                this._sematicS.push(this._sematicVal);");
    echoLine("                this._sematicVal = null;");
    echoLine("                // token consumed");
    echoLine("                return true;");
    echoLine("            }");
    echoLine("        }");
    echoLine("        else if(act < 0){");
    echoLine("            this._doReduction(-act - 1);");
    echoLine("            return false;");
    echoLine("        }");
    echoLine("        else {");
    echoLine("            // error");
    echoLine("            this._syntaxError(t);");
    echoLine("            // force consume");
    echoLine("            return true;");
    echoLine("        }");
    echoLine("    }");
    echoLine("    private _syntaxError(t: Token){");
    echoLine("        let msg = `unexpected token ${t.toString()}, expecting one of the following token(s):\\n`");
    echoLine("        msg += this._expected(this._lrState[this._lrState.length - 1]);");
    echoLine("        this._emit(\"syntaxerror\", msg, t);");
    echoLine("    }");
    echoLine("    private _expected(state: number){");
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
    echo("}");
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
defineTemplate('typescript', function (input, fc) {
    tsRenderer(input, fc);
    fc.save('.ts');
});



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
