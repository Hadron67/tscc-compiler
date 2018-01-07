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
    BitSet.prototype.union = function (set) {
        var changed = false;
        for (var i = 0; i < this._s.length; i++) {
            var orig = this._s[i];
            this._s[i] |= set._s[i];
            changed = changed || (this._s[i] !== orig);
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
        while (changed) {
            changed = false;
            for (var i = 0; i < this.nts.length; i++) {
                var rules = this.nts[i].rules;
                var firstSet = this.nts[i].firstSet;
                for (var j = 0; j < rules.length; j++) {
                    var rule = rules[j];
                    if (rule.rhs.length === 0) {
                        changed = firstSet.add(0) || changed;
                    }
                    else {
                        for (var k = 0; k < rule.rhs.length; k++) {
                            var ritem = rule.rhs[k];
                            if (this.isToken(ritem)) {
                                changed = firstSet.add(ritem + 1) || changed;
                                break;
                            }
                            else {
                                if (i !== ritem) {
                                    changed = firstSet.union(this.nts[-ritem - 1].firstSet) || changed;
                                }
                                if (!firstSet.contains(0)) {
                                    break;
                                }
                            }
                        }
                    }
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
    }
    return File;
}());

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
            gen.usedVars[vname] = { line: 0, val: 0 };
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

var T;
(function (T) {
    T[T["EOF"] = 0] = "EOF";
    T[T["NAME"] = 1] = "NAME";
    T[T["STRING"] = 2] = "STRING";
    T[T["OPT"] = 3] = "OPT";
    T[T["BLOCK"] = 4] = "BLOCK";
    T[T["ARROW"] = 5] = "ARROW";
    T[T["EOL"] = 6] = "EOL";
    T[T["OR"] = 7] = "OR";
    T[T["SEPERATOR"] = 8] = "SEPERATOR";
    T[T["LEFT_DIR"] = 9] = "LEFT_DIR";
    T[T["RIGHT_DIR"] = 10] = "RIGHT_DIR";
    T[T["NONASSOC_DIR"] = 11] = "NONASSOC_DIR";
    T[T["LEX_DIR"] = 12] = "LEX_DIR";
    T[T["PREC_DIR"] = 13] = "PREC_DIR";
    T[T["USE_DIR"] = 14] = "USE_DIR";
    T[T["LINE_COMMENT"] = 15] = "LINE_COMMENT";
    T[T["BLOCK_COMMENT"] = 16] = "BLOCK_COMMENT";
    T[T["GT"] = 17] = "GT";
    T[T["LT"] = 18] = "LT";
    T[T["DASH"] = 19] = "DASH";
    T[T["BRA"] = 20] = "BRA";
    T[T["KET"] = 21] = "KET";
    T[T["CBRA"] = 22] = "CBRA";
    T[T["CKET"] = 23] = "CKET";
    T[T["COMMA"] = 24] = "COMMA";
    T[T["PLUS"] = 25] = "PLUS";
    T[T["EQU"] = 26] = "EQU";
    T[T["STAR"] = 27] = "STAR";
    T[T["QUESTION"] = 28] = "QUESTION";
    T[T["WEDGE"] = 29] = "WEDGE";
    T[T["OPEN_CURLY_BRA"] = 30] = "OPEN_CURLY_BRA";
    T[T["CLOSE_CURLY_BRA"] = 31] = "CLOSE_CURLY_BRA";
})(T || (T = {}));

var Token = (function () {
    function Token() {
        this.val = null;
    }
    Token.prototype.clone = function () {
        var t = new Token();
        t.id = this.id;
        t.line = this.line;
        t.val = this.val;
        return t;
    };
    return Token;
}());
function scan(opt) {
    if (opt === void 0) { opt = {}; }
    var highlight = !!opt.isHighlight;
    var line = 1;
    var stream = null;
    var c = null;
    function eof() {
        return c === null;
    }
    function isBlank(c) {
        return c == ' ' || c == '\n' || c == '\t';
    }
    function nc() {
        if (c === '\n') {
            line++;
        }
        stream.next();
        c = stream.peek();
    }
    function err(c1) {
        var s1 = '';
        if (eof()) {
            s1 = 'unexpected end of file';
        }
        else {
            s1 = "unexpected character \"" + c + "\"";
        }
        if (c1) {
            throw new CompilationError(s1 + " after \"" + c1 + "\"", line);
        }
        else {
            throw new CompilationError(s1, line);
        }
    }
    function iss(s) {
        var ii = 0;
        while (ii < s.length) {
            if (s.charAt(ii++) !== c) {
                return false;
            }
            nc();
        }
        return true;
    }
    var escapes = {
        'n': '\n',
        't': '\t',
        'r': '\r'
    };
    function escapeChar(regexp) {
        var tc = c;
        if (eof()) {
            return '';
        }
        nc();
        var ret = escapes[tc];
        if (ret !== undefined) {
            return ret;
        }
        else {
            if (regexp) {
                return '\\' + tc;
            }
            else {
                if (tc === '\\') {
                    return '\\';
                }
                else {
                    return '\\' + tc;
                }
            }
        }
    }
    function handleString() {
        var eos = c;
        var ret = '';
        nc();
        while (c != eos) {
            if (eof()) {
                throw new CompilationError('unterminated string literal', line);
            }
            else if (c === '\\') {
                nc();
                ret += escapeChar(false);
            }
            else {
                ret += c;
                nc();
            }
        }
        nc();
        return ret;
    }
    function next(token) {
        token.val = null;
        while (isBlank(c) && !eof()) {
            nc();
        }
        token.line = line;
        if (eof()) {
            token.id = T.EOF;
            return token;
        }
        lex: switch (c) {
            case '%':
                nc();
                if (iss('opt')) {
                    token.id = T.OPT;
                    break lex;
                }
                else if (iss('le')) {
                    if (iss('ft')) {
                        token.id = T.LEFT_DIR;
                        break lex;
                    }
                    else if (iss('x')) {
                        token.id = T.LEX_DIR;
                        break lex;
                    }
                }
                else if (iss('right')) {
                    token.id = T.RIGHT_DIR;
                    break lex;
                }
                else if (iss('nonassoc')) {
                    token.id = T.NONASSOC_DIR;
                    break lex;
                }
                else if (iss('prec')) {
                    token.id = T.PREC_DIR;
                    break lex;
                }
                else if (iss('use')) {
                    token.id = T.USE_DIR;
                    break lex;
                }
                else if (c == '%') {
                    nc();
                    token.id = T.SEPERATOR;
                    break lex;
                }
                err('%');
            case '{':
                nc();
                if (highlight) {
                    token.id = T.OPEN_CURLY_BRA;
                    break lex;
                }
                else {
                    token.id = T.BLOCK;
                    token.val = '';
                    var st = 1;
                    while (st > 0) {
                        c += '';
                        if (eof()) {
                            throw new CompilationError('unclosed block', line);
                        }
                        if (c == '{') {
                            st++;
                        }
                        else if (c == '}') {
                            st--;
                        }
                        token.val += c;
                        nc();
                    }
                    break lex;
                }
            case '/':
                nc();
                if (c === '/') {
                    nc();
                    token.val = '//';
                    while (c !== '\n' && !eof()) {
                        token.val += c;
                        nc();
                    }
                    token.id = T.LINE_COMMENT;
                    break lex;
                }
                else if (c === '*') {
                    nc();
                    token.val = '/*';
                    while (!eof()) {
                        if (c === '*') {
                            nc();
                            if (c === '/') {
                                nc();
                                break;
                            }
                            else if (eof()) {
                                break;
                            }
                            else {
                                token.val += '*';
                            }
                        }
                        else {
                            token.val += c;
                            nc();
                        }
                    }
                    token.id = T.BLOCK_COMMENT;
                    break lex;
                }
                err('/');
            case '|':
                nc();
                token.id = T.OR;
                break lex;
            case ';':
                nc();
                token.id = T.EOL;
                break lex;
            case ':':
                nc();
                token.id = T.ARROW;
                break lex;
            case '=':
                nc();
                token.id = T.EQU;
                break lex;
            case '-':
                nc();
                if (c == '>') {
                    nc();
                    token.id = T.ARROW;
                    break lex;
                }
                else {
                    token.id = T.DASH;
                    break lex;
                }
            case '\'':
            case '"':
                token.id = T.STRING;
                token.val = handleString();
                break lex;
            case '<':
                nc();
                token.id = T.LT;
                break lex;
            case '>':
                nc();
                token.id = T.GT;
                break lex;
            case ',':
                nc();
                token.id = T.COMMA;
                break lex;
            case '+':
                nc();
                token.id = T.PLUS;
                break lex;
            case '?':
                nc();
                token.id = T.QUESTION;
                break lex;
            case '*':
                nc();
                token.id = T.STAR;
                break lex;
            case '[':
                nc();
                token.id = T.CBRA;
                break lex;
            case ']':
                nc();
                token.id = T.CKET;
                break lex;
            case '(':
                nc();
                token.id = T.BRA;
                break lex;
            case ')':
                nc();
                token.id = T.KET;
                break lex;
            case '^':
                nc();
                token.id = T.WEDGE;
                break lex;
            default:
                if (/[A-Za-z_$]/.test(c)) {
                    token.id = T.NAME;
                    token.val = c;
                    nc();
                    while (/[A-Za-z0-9_$]/.test(c) && !eof()) {
                        token.val += c;
                        nc();
                    }
                    break lex;
                }
                nc();
                err();
        }
        
    }
    
    return {
        next: next,
        init: function (s) {
            stream = s;
            c = s.peek();
        }
    };
}
function parse(scanner, ctx) {
    var token = new Token();
    var gb = new GBuilder(ctx);
    function nt() {
        scanner.next(token);
    }
    function expect(id) {
        if (token.id !== id) {
            throw new CompilationError("unexpected token \"" + T[token.id] + "\", expecting \"" + T[id] + "\"", token.line);
        }
        nt();
    }
    function file() {
        options();
        expect(T.SEPERATOR);
        rules();
        expect(T.EOF);
    }
    function prTokens(assoc) {
        do {
            if (token.id === T.STRING) {
                gb.defineTokenPrec(token.val, assoc, TokenRefType.STRING, token.line);
            }
            else if (token.id === T.NAME) {
                gb.defineTokenPrec(token.val, assoc, TokenRefType.NAME, token.line);
            }
            else if (token.id === T.LT) {
                nt();
                var tname = token.val;
                var tline = token.line;
                expect(T.NAME);
                expect(T.GT);
                gb.defineTokenPrec(tname, assoc, TokenRefType.TOKEN, tline);
            }
            else {
                throw new CompilationError("unexpected token \"" + T[token.id] + "\", expecting string or name or \"<\"", token.line);
            }
            nt();
        } while (token.id === T.STRING || token.id === T.NAME || token.id === T.LT);
        gb.incPr();
    }
    function options() {
        while (1) {
            switch (token.id) {
                case T.LEFT_DIR:
                    nt();
                    prTokens(Assoc.LEFT);
                    break;
                case T.RIGHT_DIR:
                    nt();
                    prTokens(Assoc.RIGHT);
                    break;
                case T.NONASSOC_DIR:
                    nt();
                    prTokens(Assoc.NON);
                    break;
                case T.OPT:
                    nt();
                    var name = token.val;
                    expect(T.NAME);
                    var s = token.val;
                    expect(T.STRING);
                    gb.setOpt(name, s);
                    break;
                case T.LEX_DIR:
                    nt();
                    lexRule();
                    break;
                default: return;
            }
        }
    }
    function lexRule() {
        gb.lexBuilder.prepareLex();
        if (token.id === T.LT) {
            nt();
            states();
            expect(T.GT);
        }
        else {
            gb.lexBuilder.selectState('DEFAULT');
        }
        expect(T.CBRA);
        while (token.id !== T.CKET) {
            lexItem();
        }
        expect(T.CKET);
    }
    function lexItem() {
        if (token.id + 0 === T.NAME) {
            var vname = token.val;
            var line = token.line;
            nt();
            expect(T.EQU);
            expect(T.LT);
            gb.lexBuilder.prepareVar(vname, line);
            regexp();
            gb.lexBuilder.endVar();
            expect(T.GT);
        }
        else if (token.id + 0 === T.LT) {
            nt();
            gb.lexBuilder.newState();
            var label = 'untitled';
            var acts = [];
            if (token.id === T.NAME) {
                var tname = token.val;
                var tline = token.line;
                label = tname;
                nt();
                expect(T.ARROW);
                regexp();
                var tdef = gb.defToken(tname, gb.lexBuilder.possibleAlias, tline);
                acts.push(returnToken(tdef));
            }
            else {
                regexp();
            }
            expect(T.GT);
            if (token.id === T.ARROW) {
                nt();
                lexActions(acts);
            }
            gb.lexBuilder.end(acts, label);
        }
    }
    function lexActions(acts) {
        if (token.id === T.CBRA) {
            token.id += 0;
            nt();
            lexAction(acts);
            while (token.id === T.COMMA) {
                nt();
                lexAction(acts);
            }
            expect(T.CKET);
        }
        else if (token.id === T.BLOCK) {
            acts.push(blockAction(token.val, token.line));
            nt();
        }
        else {
            throw new CompilationError("unexpected token \"" + T[token.id] + "\"", token.line);
        }
    }
    function lexAction(acts) {
        if (token.id === T.PLUS) {
            nt();
            var vn_1 = token.val;
            var line_1 = token.line;
            expect(T.NAME);
            gb.lexBuilder.requiringState.wait(vn_1, function (su, sn) {
                if (su) {
                    acts.push(pushState(sn));
                }
                else {
                    ctx.err(new CompilationError("state \"" + vn_1 + "\" is undefined", line_1));
                }
            });
        }
        else if (token.id === T.DASH) {
            nt();
            acts.push(popState());
        }
        else if (token.id === T.BLOCK) {
            nt();
            acts.push(blockAction(token.val, token.line));
        }
        else if (token.id === T.EQU) {
            nt();
            var s = token.val;
            expect(T.STRING);
            acts.push(setImg(s));
        }
        else {
            throw new CompilationError("unexpected token \"" + T[token.id] + "\"", token.line);
        }
    }
    function states() {
        var tname = token.val;
        expect(T.NAME);
        gb.lexBuilder.selectState(tname);
        while (token.id === T.COMMA) {
            nt();
            tname = token.val;
            expect(T.NAME);
            gb.lexBuilder.selectState(tname);
        }
    }
    function regexp() {
        gb.lexBuilder.enterUnion();
        simpleRE();
        gb.lexBuilder.endUnionItem();
        while (token.id === T.OR) {
            nt();
            simpleRE();
            gb.lexBuilder.endUnionItem();
        }
        gb.lexBuilder.leaveUnion();
    }
    function simpleRE() {
        do {
            basicRE();
        } while (token.id !== T.GT && token.id !== T.OR && token.id !== T.KET);
    }
    function basicRE() {
        gb.lexBuilder.enterSimple();
        primitiveRE();
        switch (token.id) {
            case T.PLUS:
                nt();
                gb.lexBuilder.simplePostfix('+');
                break;
            case T.STAR:
                nt();
                gb.lexBuilder.simplePostfix('*');
                break;
            case T.QUESTION:
                nt();
                gb.lexBuilder.simplePostfix('?');
                break;
            default:
                gb.lexBuilder.simplePostfix('');
        }
    }
    function primitiveRE() {
        if (token.id === T.BRA) {
            nt();
            regexp();
            expect(T.KET);
        }
        else if (token.id === T.CBRA) {
            nt();
            setRE();
            expect(T.CKET);
        }
        else if (token.id === T.STRING) {
            var s = token.val;
            nt();
            gb.lexBuilder.addString(s);
        }
        else if (token.id === T.LT) {
            nt();
            var vname = token.val;
            var line = token.line;
            expect(T.NAME);
            expect(T.GT);
            gb.lexBuilder.addVar(vname, line);
        }
        else {
            throw new CompilationError("unexpected token \"" + T[token.id] + "\"", token.line);
        }
    }
    function setRE() {
        if (token.id === T.WEDGE) {
            nt();
            gb.lexBuilder.beginSet(true);
        }
        else {
            gb.lexBuilder.beginSet(false);
        }
        if (token.id !== T.CKET) {
            setREItem();
            while (token.id === T.COMMA) {
                nt();
                setREItem();
            }
        }
    }
    function setREItem() {
        var from = token.val;
        var line1 = token.line;
        var to = from;
        var line2 = line1;
        expect(T.STRING);
        if (token.id === T.DASH) {
            nt();
            to = token.val;
            line2 = token.line;
            expect(T.STRING);
        }
        gb.lexBuilder.addSetItem(from, to, line1, line2);
    }
    function rules() {
        rule();
        while (token.id !== T.SEPERATOR) {
            rule();
        }
        nt();
    }
    function rule() {
        var lhs = token.clone();
        expect(T.NAME);
        expect(T.ARROW);
        gb.prepareRule(lhs.val, lhs.line);
        ruleItems();
        gb.commitRule();
        while (token.id === T.OR) {
            nt();
            gb.prepareRule(lhs.val, lhs.line);
            ruleItems();
            gb.commitRule();
        }
        expect(T.EOL);
    }
    function ruleItems() {
        if (token.id === T.USE_DIR) {
            nt();
            expect(T.BRA);
            useList();
            expect(T.KET);
        }
        while (token.id === T.NAME
            || token.id === T.LT
            || token.id === T.STRING
            || token.id === T.BLOCK
            || token.id === T.CBRA) {
            ruleItem();
        }
        if (token.id === T.PREC_DIR) {
            nt();
            var t = token.val;
            var line = token.line;
            if (token.id === T.STRING) {
                gb.defineRulePr(t, TokenRefType.STRING, line);
                nt();
            }
            else if (token.id === T.LT) {
                nt();
                t = token.val;
                line = token.line;
                expect(T.NAME);
                expect(T.GT);
                gb.defineRulePr(t, TokenRefType.TOKEN, line);
            }
            else if (token.id === T.NAME) {
                gb.defineRulePr(t, TokenRefType.NAME, line);
                nt();
            }
            else {
                throw new CompilationError("unexpected token \"" + T[token.id] + "\",expecting string or name", token.line);
            }
            if (token.id === T.BLOCK || token.id === T.CBRA) {
                var acts = [];
                lexActions(acts);
                gb.addAction(acts);
            }
        }
    }
    function useList() {
        var tname = token.val;
        var tline = token.line;
        expect(T.NAME);
        gb.addRuleUseVar(tname, tline);
        while (token.id === T.COMMA) {
            nt();
            tname = token.val;
            tline = token.line;
            expect(T.NAME);
            gb.addRuleUseVar(tname, tline);
        }
    }
    function ruleItem() {
        var t = token.clone();
        if (token.id === T.NAME) {
            nt();
            if (token.id === T.EQU) {
                nt();
                gb.addRuleSematicVar(t.val, t.line);
                t = token.clone();
            }
            else {
                gb.addRuleItem(t.val, TokenRefType.NAME, t.line);
                return;
            }
        }
        if (token.id === T.NAME) {
            nt();
            gb.addRuleItem(t.val, TokenRefType.NAME, t.line);
        }
        else if (token.id === T.STRING) {
            nt();
            gb.addRuleItem(t.val, TokenRefType.STRING, t.line);
        }
        else if (token.id === T.LT) {
            nt();
            t = token.clone();
            expect(T.NAME);
            expect(T.GT);
            gb.addRuleItem(t.val, TokenRefType.TOKEN, t.line);
        }
        if (token.id === T.BLOCK || token.id === T.CBRA) {
            var acts = [];
            lexActions(acts);
            gb.addAction(acts);
        }
    }
    nt();
    file();
    return gb.build();
}
function commentFilter(scanner) {
    return {
        next: function (token) {
            do {
                scanner.next(token);
            } while (token.id === T.BLOCK_COMMENT || token.id === T.LINE_COMMENT);
        },
        init: function (s) {
            scanner.init(s);
        }
    };
}
var highlightUtil = {
    T: T,
    Token: Token,
    scanner: scan
};
function parseSource(source, ctx) {
    var scanner = scan();
    scanner.init(source);
    return parse(commentFilter(scanner), ctx);
}

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
            g: this.file.grammar,
            pt: this.parseTable,
            sematicType: 'any',
            dfas: this.file.lexDFA
        };
    };
    return Result;
}());
function genResult(stream) {
    var result = new Result();
    try {
        var f = parseSource(stream, result);
    }
    catch (e) {
        result.terminated = true;
        result.err(e);
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
    echoLine("    generated by jscc, an LALR(1) parser generator made by hadroncfy");
    echo("*/");
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
                else if (from === Inf._oo && to !== Inf.oo) {
                    ret.push("c <= " + to);
                }
                else if (from !== Inf._oo && to === Inf.oo) {
                    ret.push("c >= " + from);
                }
                else if (from !== Inf._oo && to !== Inf.oo) {
                    ret.push("c >= " + from + " && c <= " + to);
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
        echo(state.index.toString());
        echoLine(":");
        echo("            ret.nfa = ");
        echo(state.arcs.length > 0 && state.endAction !== null ? 'true' : 'false');
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
                echo(arc.to.index.toString());
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
                echo(arc.to.index.toString());
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
        echo(n.toString());
        echoLine("(c: number, ret: { state: number, nfa: boolean, isEnd: boolean }){");
        echo("    switch(ret.state){");
        for (var _i = 0, _b = dfa.states; _i < _b.length; _i++) {
            var state = _b[_i];
            printState(state);
        }
        echoLine("");
        echoLine("        default:");
        echoLine("            ret.state = -1;");
        echoLine("            ret.nfa = false;");
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
        echo(i.toString());
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
    echo(pt.stateCount.toString());
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
        if (t === null || t === Item.NULL) {
            return '0';
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
    printTable('tokenAlias', pt.g.tokens, 20, 3, function (t) { return "\"" + t.alias + "\"" || '""'; });
    var className = input.opt.className || 'Parser';
    echoLine("");
    function printLexActionsFunc(dfa, n) {
        var codegen = {
            addBlock: function (b, line) {
                echoLine("");
                echo("                ");
                echo(b);
            },
            pushLexState: function (n) {
                echoLine("");
                echo("                this._lexState.push(");
                echo(n.toString());
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
                echo(t.index.toString());
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
        echo(n.toString());
        echo("(");
        echo(statevn);
        echoLine(": number){");
        echo("        let ");
        echo(prefix);
        echo("tk = ");
        echo(prefix);
        echo("lexTokens");
        echo(n.toString());
        echo("[");
        echo(statevn);
        echoLine("];");
        echo("        switch(");
        echo(statevn);
        echo("){");
        for (var i = 0, _a = dfa.states; i < _a.length; i++) {
            if (_a[i].endAction !== null && hasNormalAction(_a[i].endAction.data)) {
                echoLine("");
                echo("            case ");
                echo(i.toString());
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
        echo("        if(");
        echo(prefix);
        echoLine("tk !== -1){");
        echoLine("            this._token = {");
        echo("                id: ");
        echo(prefix);
        echoLine("tk,");
        echoLine("                val: this._matched.join('')");
        echoLine("            }");
        echoLine("            this._matched.length = 0;");
        echoLine("        }");
        echo("    }");
    }
    echoLine("");
    echoLine("");
    echoLine("interface Token{");
    echoLine("    id: number;");
    echoLine("    val: string;");
    echoLine("};");
    echoLine("");
    echo("export class ");
    echo(className);
    echoLine(" {");
    echoLine("    // members for lexer");
    echoLine("    private _lexState: number[] = [];");
    echoLine("    private _state: number = 0;");
    echoLine("    private _matched: string[] = [];");
    echoLine("    private _token: Token = null;");
    echoLine("    private _marker: number = -1;");
    echoLine("    private _backup: string[] = [];");
    echoLine("");
    echoLine("    // members for parser");
    echoLine("    private _lrState: number[] = [];");
    echo("    private _sematicS: ");
    echo(input.sematicType);
    echoLine("[] = [];");
    echoLine("");
    echoLine("    /**");
    echoLine("     *  set ");
    echoLine("     */");
    echoLine("    private _setImg(s: string){");
    echoLine("        this._matched.length = 0;");
    echoLine("        for(let i = 0;i < s.length;i++){");
    echoLine("            this._matched.push(s.charAt(i));");
    echoLine("        }");
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
        echo(i.toString());
        echoLine(":");
        echo("                this._doLexAction");
        echo(i.toString());
        echoLine("(state);");
        echo("                break;");
    }
    echoLine("");
    echoLine("            default:;");
    echoLine("        }");
    echoLine("    }");
    echoLine("    private _acceptChar(c: number){");
    echoLine("        let lexstate = this._lexState[this._lexState.length - 1];");
    echoLine("        this._marker && this._backup.push(String.fromCharCode(c));");
    echoLine("        let retn = { state: this._state, nfa: false, isEnd: false };");
    echo("        ");
    echo(prefix);
    echoLine("lexers[lexstate](c, retn);");
    echoLine("        if(retn.isEnd){");
    echoLine("");
    echoLine("        }");
    echoLine("    }");
    echoLine("");
    echoLine("    private _acceptToken(t: Token){");
    echoLine("        ");
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
exports.highlightUtil = highlightUtil;
exports.setDebugger = setDebugger;
exports.setTab = setTab;
exports.genResult = genResult;
exports.generateCode = generateCode;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=jscc.js.map
