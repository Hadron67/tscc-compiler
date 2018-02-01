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

var oo = Number.POSITIVE_INFINITY;
var _oo = Number.NEGATIVE_INFINITY;
var Interval = (function () {
    function Interval(a, b) {
        this.data = null;
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
        return this.a <= a && this.b >= a;
    };
    Interval.prototype.overlaps = function (a, b) {
        return !(a > this.b || b < this.a);
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
        if (a > this.a) {
            var ret = this.insertBefore(this.a, a - 1, this.data);
            this.a = a;
            return ret;
        }
        return this;
    };
    Interval.prototype.splitRight = function (b) {
        if (b < this.b) {
            var ret = this.insertAfter(b + 1, this.b, this.data);
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
        if (this.a !== _oo && this.prev.a !== null && this.a === this.prev.b + 1) {
            this.a = this.prev.a;
            this.prev.remove();
        }
        if (this.b !== oo && this.next.a !== null && this.b === this.next.a - 1) {
            this.b = this.next.b;
            this.next.remove();
        }
        return this;
    };
    Interval.prototype.toString = function (mapper) {
        var ret = '';
        function dfmapper(c) {
            return c === oo ? '+oo' : c === _oo ? '-oo' : c.toString();
        }
        var a = (mapper || dfmapper)(this.a);
        var b = (mapper || dfmapper)(this.b);
        if (this.a === this.b) {
            ret += a;
        }
        else {
            ret += this.a === _oo ? '(' + a : '[' + a;
            ret += ',';
            ret += this.b === oo ? b + ')' : b + ']';
        }
        this.data && (ret += this.parent.dataOp.stringify(this.data));
        return ret;
    };
    return Interval;
}());
function checkArg(a, b) {
    if (a > b) {
        throw new Error("illegal argument: \"a\"(" + a + ") must be no more than \"b\"(" + b + ")");
    }
}
var IntervalSet = (function () {
    function IntervalSet(dataOp) {
        this.head = new Interval(0, 0);
        this.head.parent = this;
        this.tail = new Interval(null, null);
        this.tail.parent = this;
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.noMerge = typeof dataOp !== 'undefined';
        this.dataOp = dataOp || null;
    }
    IntervalSet.prototype.isValid = function (it) {
        return it !== this.head && it !== this.tail;
    };
    IntervalSet.prototype.createInterval = function (a, b, data) {
        if (data === void 0) { data = null; }
        var ret = new Interval(a, b);
        ret.parent = this;
        this.dataOp && (ret.data = this.dataOp.createData(), data !== null && this.dataOp.union(ret.data, data));
        return ret;
    };
    IntervalSet.prototype.fitPoint = function (a, b) {
        for (var it = this.head; it !== this.tail; it = it.next) {
            if ((it === this.head || a > it.b) && (it.next === this.tail || b < it.next.a)) {
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
                var a1 = a < overlap[0].a ? a : overlap[0].a;
                var b1 = b > overlap[1].b ? b : overlap[1].b;
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
                    this.dataOp.union(it.data, data);
                    if (it.b + 1 < it.next.a) {
                        it.insertAfter(it.b + 1, it.next.a - 1, data);
                        it = it.next;
                    }
                }
                this.dataOp.union(overlap[1].data, data);
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

var CharSet = (function (_super) {
    __extends(CharSet, _super);
    function CharSet(datac) {
        return _super.call(this, datac) || this;
    }
    CharSet.prototype.addAll = function () {
        _super.prototype.add.call(this, 0, oo);
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
        this.least = false;
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
                set.add(a, b, [arc.to]);
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
        var set = new CharSet({
            createData: function () { return []; },
            union: function (dest, src) {
                for (var _i = 0, src_1 = src; _i < src_1.length; _i++) {
                    var s_1 = src_1[_i];
                    var dup = false;
                    for (var _a = 0, dest_1 = dest; _a < dest_1.length; _a++) {
                        var destt = dest_1[_a];
                        if (s_1 === destt) {
                            dup = true;
                            break;
                        }
                    }
                    !dup && dest.push(s_1);
                }
            },
            stringify: function (d) { return ''; }
        });
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
                var cpState = new CompoundState(stateCount, it.data);
                var cphash = cpState.hash();
                if (dfaStates[cphash]) {
                    cpState = dfaStates[cphash];
                }
                else {
                    dfaStates[cphash] = cpState;
                    (cpState.endAction === null || !cpState.endAction.least) && queue.push(cpState);
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
    DFA.prototype.forEachArc = function (cb) {
        for (var _i = 0, _a = this.states; _i < _a.length; _i++) {
            var from = _a[_i];
            for (var _b = 0, _c = from.arcs; _b < _c.length; _b++) {
                var arc = _c[_b];
                cb(arc, from, arc.to);
            }
        }
    };
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

var InternalError = (function () {
    function InternalError(msg) {
        this.msg = msg;
    }
    InternalError.prototype.toString = function () {
        return this.msg;
    };
    return InternalError;
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

function initArray(len, cb) {
    var ret = new Array(len);
    for (var i = 0; i < len; i++) {
        ret[i] = cb(i);
    }
    return ret;
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
        this._trim();
    }
    CompressedPTable.prototype._trim = function () {
        while (this.pact[this.pact.length - 1] === null) {
            this.pact.pop();
            this.checkact.pop();
        }
        while (this.pgoto[this.pgoto.length - 1] === null) {
            this.pgoto.pop();
            this.checkgoto.pop();
        }
    };
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
        this.dfaTables = [];
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
    function end(action, least, label) {
        if (label === void 0) { label = '(untitled)'; }
        for (var _i = 0, _selectedStates_2 = _selectedStates; _i < _selectedStates_2.length; _i++) {
            var sn = _selectedStates_2[_i];
            sn.label = "<" + label + ">";
        }
        _emit(function () {
            var ac = new EndAction();
            ac.id = ac.priority = _scount++;
            ac.data = action;
            ac.least = least;
            _currentState.endAction = ac;
        });
    }
    function enterUnion() {
        _emit(function () {
            var nhead = new State();
            _currentState.epsilonTo(nhead);
            _currentState = new State();
            nhead.epsilonTo(_currentState);
            _unionStack.push({
                head: nhead,
                tail: new State()
            });
        });
    }
    function endUnionItem() {
        _emit(function () {
            var top = _unionStack[_unionStack.length - 1];
            _currentState.epsilonTo(top.tail);
            _currentState = new State();
            top.head.epsilonTo(_currentState);
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
        if (arcs.length % 2 !== 0) {
            throw new Error('invalid character set array');
        }
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

function pushStateAction(sn) {
    return function (c) {
        c.pushLexState(sn);
    };
}
function switchToStateAction(sn) {
    return function (c) {
        c.switchToLexState(sn);
    };
}
var LexAction = (function () {
    function LexAction() {
        this.token = null;
        this.actions = [];
    }
    LexAction.prototype.toCode = function (c) {
        for (var _i = 0, _a = this.actions; _i < _a.length; _i++) {
            var act = _a[_i];
            act !== null && act(c);
        }
    };
    LexAction.prototype.returnToken = function (tk) {
        this.token = tk;
    };
    LexAction.prototype.raw = function (s) {
        this.actions.push(function (c) { return c.raw(s); });
    };
    LexAction.prototype.pushState = function (n) {
        this.actions.push(pushStateAction(n));
    };
    LexAction.prototype.placeHolder = function () {
        var ret = this.actions.length;
        this.actions.push(null);
        return ret;
    };
    LexAction.prototype.set = function (n, cb) {
        this.actions[n] = cb;
    };
    LexAction.prototype.popState = function () {
        this.actions.push(function (c) { return c.popLexState(); });
    };
    LexAction.prototype.beginBlock = function (pos) {
        this.actions.push(function (c) { return c.beginBlock(pos); });
    };
    LexAction.prototype.setImg = function (s) {
        this.actions.push(function (c) { return c.setImg(s); });
    };
    LexAction.prototype.endBlock = function (pos) {
        this.actions.push(function (c) { return c.endBlock(pos); });
    };
    LexAction.prototype.lhs = function () {
        this.actions.push(function (c) { return c.lhs(); });
    };
    LexAction.prototype.tokenObj = function () {
        this.actions.push(function (c) { return c.tokenObj(); });
    };
    LexAction.prototype.matched = function () {
        this.actions.push(function (c) { return c.matched(); });
    };
    return LexAction;
}());

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
    var _requiringToken = null;
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
    _requiringToken = new CoroutineMgr(function (s) { return _tokenNameTable[s]; });
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
        addSwitchToStateAction: addSwitchToStateAction,
        addEmitTokenAction: addEmitTokenAction,
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
            _splitAction();
            t.vars[_sematicVar.val] = { val: t.rhs.length - 1, pos: _sematicVar };
            _sematicVar = null;
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
    function addPushStateAction(act, vn) {
        var n = act.placeHolder();
        lexBuilder.requiringState.wait(vn.val, function (su, sn) {
            if (su) {
                act.set(n, pushStateAction(sn));
            }
            else {
                singlePosErr("state \"" + vn.val + "\" is undefined", vn);
            }
        });
    }
    function addSwitchToStateAction(act, vn) {
        var n = act.placeHolder();
        lexBuilder.requiringState.wait(vn.val, function (su, sn) {
            if (su) {
                act.set(n, switchToStateAction(sn));
            }
            else {
                singlePosErr("state \"" + vn.val + "\" is undefined", vn);
            }
        });
    }
    function addEmitTokenAction(act, tn) {
        var n = act.placeHolder();
        _requiringToken.wait(tn.val, function (success, tdef) {
            if (success) {
                act.set(n, function (c) {
                    c.emitToken(tdef.index);
                });
            }
            else {
                singlePosErr("use of undefined token <" + tn.val + ">", tn);
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
        _requiringToken.fail();
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
var jjeol = '\n'.charCodeAt(0);

var jjlexpnext0 = [
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    71, 70, 70, 70, 72, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 71, 70, 70, 70, 72, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 71, 70,
    70, 70, 91, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 92, 92, 92, 92, 92, 92, 92, 92,
    92, 92, 92, 92, 92, 92, 93, 92, 92, 92,
    92, 92, 92, 92, 92, 92, 92, 92, 92, 92,
    92, 92, 92, 92, 92, 92, 92, 92, 92, 92,
    92, 92, 92, 92, 92, 92, 92, 92, 92, 92,
    92, 92, 92, 92, 92, 92, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 71, 70, 70, 70,
    91, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    71, 70, 70, 70, 72, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 46, 46, 131, 46, 46, 46,
    46, 47, 46, 46, 46, 46, 46, 46, 46, 110,
    46, 46, 46, 46, 46, 46, 110, 46, 48, 46,
    46, 46, 110, 110, 110, 110, 110, 110, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 27, 27,
    130, 28, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 95, 27, 27, 27, 27, 27, 27,
    95, 27, 29, 27, 27, 27, 95, 95, 95, 95,
    95, 95, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 46, 46, 129, 46, 46, 46, 46, 47,
    46, 46, 46, 46, 46, 46, 46, 110, 46, 46,
    46, 46, 46, 46, 110, 46, 48, 46, 46, 46,
    110, 110, 110, 110, 110, 110, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 27, 27, 128, 28,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 95, 27, 27, 27, 27, 27, 27, 95, 27,
    29, 27, 27, 27, 95, 95, 95, 95, 95, 95,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    46, 46, 127, 46, 46, 46, 46, 47, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 48, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 27, 27, 126, 28, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 29, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 30, 30,
    125, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 46, 46, 124, 46, 46, 46, 46, 47,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 48, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 30, 30, 123, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    27, 27, 122, 28, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 29, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 46, 46, 121, 46, 46, 46,
    46, 47, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 48, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 30, 30,
    120, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 27, 27, 119, 28, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 29, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 1, 1, 2, 3,
    4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    118, 14, 15, 16, 17, 18, 19, 4, 20, 117,
    21, 22, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 23, 24, 25, 26, 31, 79,
    65, 61, 57, 58, 80, 62, 54, 66, 32, 49,
    1, 1, 116, 50, 55, 31, 115, 114, 81, 113,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 112, 111, 33, 34, 109, 108, 107,
    106, 105, 32, 104, 103, 102, 101, 100, 99, 31,
    98, 97, 96, 94, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 89, 88, 33,
    34, 87, 86, 85, 84, 83, 32, 82, 78, 77,
    76, 75, 74, 31, 67, 64, 63, 60, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 59, 56, 33, 34, 51, -1, -1, -1, -1,
    32, -1, -1, -1, -1, -1, -1, 31, -1, -1,
    -1, -1, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, -1, -1, 33, 34, -1,
    -1, -1, -1, -1, 32, -1, -1, -1, -1, -1,
    -1, 31, -1, -1, -1, -1, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, -1,
    -1, 33, 34, -1, -1, -1, -1, -1, 32, -1,
    -1, -1, -1, -1, -1, 31, -1, -1, 35, -1,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, -1, -1, 36, 33, 34, 37, 38, -1,
    39, -1, 40, 41, 42, 43, 68, 44, 45, -1,
    68, -1, -1, -1, 52, -1, -1, -1, 52, -1,
    -1, -1, -1, -1, -1, -1, -1, 68, -1, -1,
    -1, -1, 68, -1, -1, 52, 68, -1, -1, -1,
    52, -1, -1, 68, 52, -1, 68, -1, 68, 69,
    69, 52, 90, -1, 52, -1, 52, 53, 53, 90,
    -1, -1, -1, -1, 73, 90, 90, 90, 90, 90,
    90, 73, -1, -1, -1, -1, -1, 73, 73, 73,
    73, 73, 73,
];
var jjlexdisnext0 = [
    1025, 1089, 972, 918, 1293, 1312, 864, -54, -54, -54,
    -54, -54, -54, 1079, -54, -54, -54, 1195, -54, -54,
    -54, -54, -54, -54, -54, -54, 1249, 810, -54, 1361,
    756, 1205, 1161, 1117, 1073, -54, 1047, 1180, 1043, 1179,
    1146, 1039, 1143, 1149, 1039, 1140, 702, -54, 1353, 270,
    648, -54, 594, 1399, 1140, 1136, 1152, 1137, 1142, 1051,
    1137, 1130, 1129, 1141, 1138, 1134, 1126, 1135, 540, 1387,
    216, 162, 1129, 486, 1097, 1098, 1109, 1097, 1092, 1092,
    1090, -54, 1106, 1097, 1089, 1100, 1094, 1096, 1095, -54,
    432, 108, 54, -54, 0, 378, 1076, 1095, 1067, 1054,
    -54, 1051, -54, 1048, 1008, 994, -54, 929, 880, -54,
    324, -54, 839, 769, 713, -54, 660, 610, 551, -54,
    -54, 514, -54, -54, 447, -54, -54, 391, 350, 292,
    -54, -54,
];
var jjlexchecknext0 = [
    94, 94, 94, 94, 94, 94, 94, 94, 94, 94,
    94, 94, 94, 94, 94, 94, 94, 94, 94, 94,
    94, 94, 94, 94, 94, 94, 94, 94, 94, 94,
    94, 94, 94, 94, 94, 94, 94, 94, 94, 94,
    94, 94, 94, 94, 94, 94, 94, 94, 94, 94,
    94, 94, 94, 94, 92, 92, 92, 92, 92, 92,
    92, 92, 92, 92, 92, 92, 92, 92, 92, 92,
    92, 92, 92, 92, 92, 92, 92, 92, 92, 92,
    92, 92, 92, 92, 92, 92, 92, 92, 92, 92,
    92, 92, 92, 92, 92, 92, 92, 92, 92, 92,
    92, 92, 92, 92, 92, 92, 92, 92, 91, 91,
    91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
    91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
    91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
    91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
    91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
    91, 91, 71, 71, 71, 71, 71, 71, 71, 71,
    71, 71, 71, 71, 71, 71, 71, 71, 71, 71,
    71, 71, 71, 71, 71, 71, 71, 71, 71, 71,
    71, 71, 71, 71, 71, 71, 71, 71, 71, 71,
    71, 71, 71, 71, 71, 71, 71, 71, 71, 71,
    71, 71, 71, 71, 71, 71, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    49, 49, 49, 49, 49, 49, 49, 49, 49, 49,
    49, 49, 49, 49, 49, 49, 49, 49, 49, 49,
    49, 49, 49, 49, 49, 49, 49, 49, 49, 49,
    49, 49, 49, 49, 49, 49, 49, 49, 49, 49,
    49, 49, 49, 49, 49, 49, 49, 49, 49, 49,
    49, 49, 49, 49, 110, 110, 129, 110, 110, 110,
    110, 110, 110, 110, 110, 110, 110, 110, 110, 110,
    110, 110, 110, 110, 110, 110, 110, 110, 110, 110,
    110, 110, 110, 110, 110, 110, 110, 110, 110, 110,
    110, 110, 110, 110, 110, 110, 110, 110, 110, 110,
    110, 110, 110, 110, 110, 110, 110, 110, 95, 95,
    128, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 90, 90, 127, 90, 90, 90, 90, 90,
    90, 90, 90, 90, 90, 90, 90, 90, 90, 90,
    90, 90, 90, 90, 90, 90, 90, 90, 90, 90,
    90, 90, 90, 90, 90, 90, 90, 90, 90, 90,
    90, 90, 90, 90, 90, 90, 90, 90, 90, 90,
    90, 90, 90, 90, 90, 90, 73, 73, 124, 73,
    73, 73, 73, 73, 73, 73, 73, 73, 73, 73,
    73, 73, 73, 73, 73, 73, 73, 73, 73, 73,
    73, 73, 73, 73, 73, 73, 73, 73, 73, 73,
    73, 73, 73, 73, 73, 73, 73, 73, 73, 73,
    73, 73, 73, 73, 73, 73, 73, 73, 73, 73,
    68, 68, 121, 68, 68, 68, 68, 68, 68, 68,
    68, 68, 68, 68, 68, 68, 68, 68, 68, 68,
    68, 68, 68, 68, 68, 68, 68, 68, 68, 68,
    68, 68, 68, 68, 68, 68, 68, 68, 68, 68,
    68, 68, 68, 68, 68, 68, 68, 68, 68, 68,
    68, 68, 68, 68, 52, 52, 118, 52, 52, 52,
    52, 52, 52, 52, 52, 52, 52, 52, 52, 52,
    52, 52, 52, 52, 52, 52, 52, 52, 52, 52,
    52, 52, 52, 52, 52, 52, 52, 52, 52, 52,
    52, 52, 52, 52, 52, 52, 52, 52, 52, 52,
    52, 52, 52, 52, 52, 52, 52, 52, 50, 50,
    117, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 46, 46, 116, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 46, 46, 46, 46,
    46, 46, 46, 46, 46, 46, 30, 30, 114, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    27, 27, 113, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 6, 6, 112, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 3, 3,
    108, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 2, 2, 107, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    105, 0, 0, 0, 0, 0, 0, 0, 0, 104,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 34, 59,
    44, 41, 38, 38, 59, 41, 36, 44, 34, 13,
    1, 1, 103, 13, 36, 34, 101, 99, 59, 98,
    34, 34, 34, 34, 34, 34, 34, 34, 34, 34,
    34, 34, 34, 34, 34, 34, 34, 34, 34, 34,
    34, 34, 33, 97, 96, 34, 34, 88, 87, 86,
    85, 84, 33, 83, 82, 80, 79, 78, 77, 33,
    76, 75, 74, 72, 33, 33, 33, 33, 33, 33,
    33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
    33, 33, 33, 33, 33, 33, 32, 67, 66, 33,
    33, 65, 64, 63, 62, 61, 32, 60, 58, 57,
    56, 55, 54, 32, 45, 43, 42, 40, 32, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    31, 39, 37, 32, 32, 17, -1, -1, -1, -1,
    31, -1, -1, -1, -1, -1, -1, 31, -1, -1,
    -1, -1, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 26, -1, -1, 31, 31, -1,
    -1, -1, -1, -1, 26, -1, -1, -1, -1, -1,
    -1, 26, -1, -1, -1, -1, 26, 26, 26, 26,
    26, 26, 26, 26, 26, 26, 26, 26, 26, 26,
    26, 26, 26, 26, 26, 26, 26, 26, 4, -1,
    -1, 26, 26, -1, -1, -1, -1, -1, 4, -1,
    -1, -1, -1, -1, -1, 4, -1, -1, 5, -1,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, -1, -1, 5, 4, 4, 5, 5, -1,
    5, -1, 5, 5, 5, 5, 48, 5, 5, -1,
    48, -1, -1, -1, 29, -1, -1, -1, 29, -1,
    -1, -1, -1, -1, -1, -1, -1, 48, -1, -1,
    -1, -1, 48, -1, -1, 29, 48, -1, -1, -1,
    29, -1, -1, 48, 29, -1, 48, -1, 48, 48,
    48, 29, 69, -1, 29, -1, 29, 29, 29, 69,
    -1, -1, -1, -1, 53, 69, 69, 69, 69, 69,
    69, 53, -1, -1, -1, -1, -1, 53, 53, 53,
    53, 53, 53,
];
var jjlexclassTable0 = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    2, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 3, 4, 5, 6, 0, 7,
    8, 9, 10, 11, 12, 13, 0, 14, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 16, 17,
    18, 19, 20, 21, 0, 22, 22, 22, 22, 22,
    22, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    5, 23, 24, 25, 26, 27, 0, 28, 29, 30,
    31, 32, 33, 34, 35, 36, 5, 37, 38, 39,
    40, 41, 42, 5, 43, 44, 45, 46, 5, 5,
    47, 48, 5, 49, 50, 51, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    52, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 52, 0, 0, 0, 0, 52, 0, 0, 0,
    0, 0, 52, 52, 52, 52, 52, 52, 52, 52,
    52, 52, 52, 52, 52, 52, 52, 52, 52, 52,
    52, 52, 52, 52, 52, 0, 52, 52, 52, 52,
    52, 52, 52, 52, 52, 52, 52, 52, 52, 52,
    52, 52, 52, 52, 52, 52, 52, 52, 52, 52,
    52, 52, 52, 52, 52, 52, 52, 0, 52, 52,
    52, 52, 52, 52, 52, 52,
];
var jjlexunicodeClassTable0 = [
    52, 256, 705, 0, 706, 709, 52, 710, 721, 0,
    722, 735, 52, 736, 740, 0, 741, 747, 52, 748,
    748, 0, 749, 749, 52, 750, 750, 0, 751, 767,
    53, 768, 879, 52, 880, 884, 0, 885, 885, 52,
    886, 887, 0, 888, 889, 52, 890, 893, 0, 894,
    901, 52, 902, 902, 0, 903, 903, 52, 904, 906,
    0, 907, 907, 52, 908, 908, 0, 909, 909, 52,
    910, 929, 0, 930, 930, 52, 931, 1013, 0, 1014,
    1014, 52, 1015, 1153, 0, 1154, 1154, 53, 1155, 1159,
    0, 1160, 1161, 52, 1162, 1319, 0, 1320, 1328, 52,
    1329, 1366, 0, 1367, 1368, 52, 1369, 1369, 0, 1370,
    1376, 52, 1377, 1415, 0, 1416, 1424, 53, 1425, 1469,
    0, 1470, 1470, 53, 1471, 1471, 0, 1472, 1472, 53,
    1473, 1474, 0, 1475, 1475, 53, 1476, 1477, 0, 1478,
    1478, 53, 1479, 1479, 0, 1480, 1487, 52, 1488, 1514,
    0, 1515, 1519, 52, 1520, 1522, 0, 1523, 1551, 53,
    1552, 1562, 0, 1563, 1567, 52, 1568, 1610, 53, 1611,
    1641, 0, 1642, 1645, 52, 1646, 1647, 53, 1648, 1648,
    52, 1649, 1747, 0, 1748, 1748, 52, 1749, 1749, 53,
    1750, 1756, 0, 1757, 1758, 53, 1759, 1764, 52, 1765,
    1766, 53, 1767, 1768, 0, 1769, 1769, 53, 1770, 1773,
    52, 1774, 1775, 53, 1776, 1785, 52, 1786, 1788, 0,
    1789, 1790, 52, 1791, 1791, 0, 1792, 1807, 52, 1808,
    1808, 53, 1809, 1809, 52, 1810, 1839, 53, 1840, 1866,
    0, 1867, 1868, 52, 1869, 1957, 53, 1958, 1968, 52,
    1969, 1969, 0, 1970, 1983, 53, 1984, 1993, 52, 1994,
    2026, 53, 2027, 2035, 52, 2036, 2037, 0, 2038, 2041,
    52, 2042, 2042, 0, 2043, 2047, 52, 2048, 2069, 53,
    2070, 2073, 52, 2074, 2074, 53, 2075, 2083, 52, 2084,
    2084, 53, 2085, 2087, 52, 2088, 2088, 53, 2089, 2093,
    0, 2094, 2111, 52, 2112, 2136, 53, 2137, 2139, 0,
    2140, 2207, 52, 2208, 2208, 0, 2209, 2209, 52, 2210,
    2220, 0, 2221, 2275, 53, 2276, 2302, 0, 2303, 2303,
    53, 2304, 2307, 52, 2308, 2361, 53, 2362, 2364, 52,
    2365, 2365, 53, 2366, 2383, 52, 2384, 2384, 53, 2385,
    2391, 52, 2392, 2401, 53, 2402, 2403, 0, 2404, 2405,
    53, 2406, 2415, 0, 2416, 2416, 52, 2417, 2423, 0,
    2424, 2424, 52, 2425, 2431, 0, 2432, 2432, 53, 2433,
    2435, 0, 2436, 2436, 52, 2437, 2444, 0, 2445, 2446,
    52, 2447, 2448, 0, 2449, 2450, 52, 2451, 2472, 0,
    2473, 2473, 52, 2474, 2480, 0, 2481, 2481, 52, 2482,
    2482, 0, 2483, 2485, 52, 2486, 2489, 0, 2490, 2491,
    53, 2492, 2492, 52, 2493, 2493, 53, 2494, 2500, 0,
    2501, 2502, 53, 2503, 2504, 0, 2505, 2506, 53, 2507,
    2509, 52, 2510, 2510, 0, 2511, 2518, 53, 2519, 2519,
    0, 2520, 2523, 52, 2524, 2525, 0, 2526, 2526, 52,
    2527, 2529, 53, 2530, 2531, 0, 2532, 2533, 53, 2534,
    2543, 52, 2544, 2545, 0, 2546, 2560, 53, 2561, 2563,
    0, 2564, 2564, 52, 2565, 2570, 0, 2571, 2574, 52,
    2575, 2576, 0, 2577, 2578, 52, 2579, 2600, 0, 2601,
    2601, 52, 2602, 2608, 0, 2609, 2609, 52, 2610, 2611,
    0, 2612, 2612, 52, 2613, 2614, 0, 2615, 2615, 52,
    2616, 2617, 0, 2618, 2619, 53, 2620, 2620, 0, 2621,
    2621, 53, 2622, 2626, 0, 2627, 2630, 53, 2631, 2632,
    0, 2633, 2634, 53, 2635, 2637, 0, 2638, 2640, 53,
    2641, 2641, 0, 2642, 2648, 52, 2649, 2652, 0, 2653,
    2653, 52, 2654, 2654, 0, 2655, 2661, 53, 2662, 2673,
    52, 2674, 2676, 53, 2677, 2677, 0, 2678, 2688, 53,
    2689, 2691, 0, 2692, 2692, 52, 2693, 2701, 0, 2702,
    2702, 52, 2703, 2705, 0, 2706, 2706, 52, 2707, 2728,
    0, 2729, 2729, 52, 2730, 2736, 0, 2737, 2737, 52,
    2738, 2739, 0, 2740, 2740, 52, 2741, 2745, 0, 2746,
    2747, 53, 2748, 2748, 52, 2749, 2749, 53, 2750, 2757,
    0, 2758, 2758, 53, 2759, 2761, 0, 2762, 2762, 53,
    2763, 2765, 0, 2766, 2767, 52, 2768, 2768, 0, 2769,
    2783, 52, 2784, 2785, 53, 2786, 2787, 0, 2788, 2789,
    53, 2790, 2799, 0, 2800, 2816, 53, 2817, 2819, 0,
    2820, 2820, 52, 2821, 2828, 0, 2829, 2830, 52, 2831,
    2832, 0, 2833, 2834, 52, 2835, 2856, 0, 2857, 2857,
    52, 2858, 2864, 0, 2865, 2865, 52, 2866, 2867, 0,
    2868, 2868, 52, 2869, 2873, 0, 2874, 2875, 53, 2876,
    2876, 52, 2877, 2877, 53, 2878, 2884, 0, 2885, 2886,
    53, 2887, 2888, 0, 2889, 2890, 53, 2891, 2893, 0,
    2894, 2901, 53, 2902, 2903, 0, 2904, 2907, 52, 2908,
    2909, 0, 2910, 2910, 52, 2911, 2913, 53, 2914, 2915,
    0, 2916, 2917, 53, 2918, 2927, 0, 2928, 2928, 52,
    2929, 2929, 0, 2930, 2945, 53, 2946, 2946, 52, 2947,
    2947, 0, 2948, 2948, 52, 2949, 2954, 0, 2955, 2957,
    52, 2958, 2960, 0, 2961, 2961, 52, 2962, 2965, 0,
    2966, 2968, 52, 2969, 2970, 0, 2971, 2971, 52, 2972,
    2972, 0, 2973, 2973, 52, 2974, 2975, 0, 2976, 2978,
    52, 2979, 2980, 0, 2981, 2983, 52, 2984, 2986, 0,
    2987, 2989, 52, 2990, 3001, 0, 3002, 3005, 53, 3006,
    3010, 0, 3011, 3013, 53, 3014, 3016, 0, 3017, 3017,
    53, 3018, 3021, 0, 3022, 3023, 52, 3024, 3024, 0,
    3025, 3030, 53, 3031, 3031, 0, 3032, 3045, 53, 3046,
    3055, 0, 3056, 3072, 53, 3073, 3075, 0, 3076, 3076,
    52, 3077, 3084, 0, 3085, 3085, 52, 3086, 3088, 0,
    3089, 3089, 52, 3090, 3112, 0, 3113, 3113, 52, 3114,
    3123, 0, 3124, 3124, 52, 3125, 3129, 0, 3130, 3132,
    52, 3133, 3133, 53, 3134, 3140, 0, 3141, 3141, 53,
    3142, 3144, 0, 3145, 3145, 53, 3146, 3149, 0, 3150,
    3156, 53, 3157, 3158, 0, 3159, 3159, 52, 3160, 3161,
    0, 3162, 3167, 52, 3168, 3169, 53, 3170, 3171, 0,
    3172, 3173, 53, 3174, 3183, 0, 3184, 3201, 53, 3202,
    3203, 0, 3204, 3204, 52, 3205, 3212, 0, 3213, 3213,
    52, 3214, 3216, 0, 3217, 3217, 52, 3218, 3240, 0,
    3241, 3241, 52, 3242, 3251, 0, 3252, 3252, 52, 3253,
    3257, 0, 3258, 3259, 53, 3260, 3260, 52, 3261, 3261,
    53, 3262, 3268, 0, 3269, 3269, 53, 3270, 3272, 0,
    3273, 3273, 53, 3274, 3277, 0, 3278, 3284, 53, 3285,
    3286, 0, 3287, 3293, 52, 3294, 3294, 0, 3295, 3295,
    52, 3296, 3297, 53, 3298, 3299, 0, 3300, 3301, 53,
    3302, 3311, 0, 3312, 3312, 52, 3313, 3314, 0, 3315,
    3329, 53, 3330, 3331, 0, 3332, 3332, 52, 3333, 3340,
    0, 3341, 3341, 52, 3342, 3344, 0, 3345, 3345, 52,
    3346, 3386, 0, 3387, 3388, 52, 3389, 3389, 53, 3390,
    3396, 0, 3397, 3397, 53, 3398, 3400, 0, 3401, 3401,
    53, 3402, 3405, 52, 3406, 3406, 0, 3407, 3414, 53,
    3415, 3415, 0, 3416, 3423, 52, 3424, 3425, 53, 3426,
    3427, 0, 3428, 3429, 53, 3430, 3439, 0, 3440, 3449,
    52, 3450, 3455, 0, 3456, 3457, 53, 3458, 3459, 0,
    3460, 3460, 52, 3461, 3478, 0, 3479, 3481, 52, 3482,
    3505, 0, 3506, 3506, 52, 3507, 3515, 0, 3516, 3516,
    52, 3517, 3517, 0, 3518, 3519, 52, 3520, 3526, 0,
    3527, 3529, 53, 3530, 3530, 0, 3531, 3534, 53, 3535,
    3540, 0, 3541, 3541, 53, 3542, 3542, 0, 3543, 3543,
    53, 3544, 3551, 0, 3552, 3569, 53, 3570, 3571, 0,
    3572, 3584, 52, 3585, 3632, 53, 3633, 3633, 52, 3634,
    3635, 53, 3636, 3642, 0, 3643, 3647, 52, 3648, 3654,
    53, 3655, 3662, 0, 3663, 3663, 53, 3664, 3673, 0,
    3674, 3712, 52, 3713, 3714, 0, 3715, 3715, 52, 3716,
    3716, 0, 3717, 3718, 52, 3719, 3720, 0, 3721, 3721,
    52, 3722, 3722, 0, 3723, 3724, 52, 3725, 3725, 0,
    3726, 3731, 52, 3732, 3735, 0, 3736, 3736, 52, 3737,
    3743, 0, 3744, 3744, 52, 3745, 3747, 0, 3748, 3748,
    52, 3749, 3749, 0, 3750, 3750, 52, 3751, 3751, 0,
    3752, 3753, 52, 3754, 3755, 0, 3756, 3756, 52, 3757,
    3760, 53, 3761, 3761, 52, 3762, 3763, 53, 3764, 3769,
    0, 3770, 3770, 53, 3771, 3772, 52, 3773, 3773, 0,
    3774, 3775, 52, 3776, 3780, 0, 3781, 3781, 52, 3782,
    3782, 0, 3783, 3783, 53, 3784, 3789, 0, 3790, 3791,
    53, 3792, 3801, 0, 3802, 3803, 52, 3804, 3807, 0,
    3808, 3839, 52, 3840, 3840, 0, 3841, 3863, 53, 3864,
    3865, 0, 3866, 3871, 53, 3872, 3881, 0, 3882, 3892,
    53, 3893, 3893, 0, 3894, 3894, 53, 3895, 3895, 0,
    3896, 3896, 53, 3897, 3897, 0, 3898, 3901, 53, 3902,
    3903, 52, 3904, 3911, 0, 3912, 3912, 52, 3913, 3948,
    0, 3949, 3952, 53, 3953, 3972, 0, 3973, 3973, 53,
    3974, 3975, 52, 3976, 3980, 53, 3981, 3991, 0, 3992,
    3992, 53, 3993, 4028, 0, 4029, 4037, 53, 4038, 4038,
    0, 4039, 4095, 52, 4096, 4138, 53, 4139, 4158, 52,
    4159, 4159, 53, 4160, 4169, 0, 4170, 4175, 52, 4176,
    4181, 53, 4182, 4185, 52, 4186, 4189, 53, 4190, 4192,
    52, 4193, 4193, 53, 4194, 4196, 52, 4197, 4198, 53,
    4199, 4205, 52, 4206, 4208, 53, 4209, 4212, 52, 4213,
    4225, 53, 4226, 4237, 52, 4238, 4238, 53, 4239, 4253,
    0, 4254, 4255, 52, 4256, 4293, 0, 4294, 4294, 52,
    4295, 4295, 0, 4296, 4300, 52, 4301, 4301, 0, 4302,
    4303, 52, 4304, 4346, 0, 4347, 4347, 52, 4348, 4680,
    0, 4681, 4681, 52, 4682, 4685, 0, 4686, 4687, 52,
    4688, 4694, 0, 4695, 4695, 52, 4696, 4696, 0, 4697,
    4697, 52, 4698, 4701, 0, 4702, 4703, 52, 4704, 4744,
    0, 4745, 4745, 52, 4746, 4749, 0, 4750, 4751, 52,
    4752, 4784, 0, 4785, 4785, 52, 4786, 4789, 0, 4790,
    4791, 52, 4792, 4798, 0, 4799, 4799, 52, 4800, 4800,
    0, 4801, 4801, 52, 4802, 4805, 0, 4806, 4807, 52,
    4808, 4822, 0, 4823, 4823, 52, 4824, 4880, 0, 4881,
    4881, 52, 4882, 4885, 0, 4886, 4887, 52, 4888, 4954,
    0, 4955, 4956, 53, 4957, 4959, 0, 4960, 4991, 52,
    4992, 5007, 0, 5008, 5023, 52, 5024, 5108, 0, 5109,
    5120, 52, 5121, 5740, 0, 5741, 5742, 52, 5743, 5759,
    0, 5760, 5760, 52, 5761, 5786, 0, 5787, 5791, 52,
    5792, 5866, 0, 5867, 5869, 52, 5870, 5872, 0, 5873,
    5887, 52, 5888, 5900, 0, 5901, 5901, 52, 5902, 5905,
    53, 5906, 5908, 0, 5909, 5919, 52, 5920, 5937, 53,
    5938, 5940, 0, 5941, 5951, 52, 5952, 5969, 53, 5970,
    5971, 0, 5972, 5983, 52, 5984, 5996, 0, 5997, 5997,
    52, 5998, 6000, 0, 6001, 6001, 53, 6002, 6003, 0,
    6004, 6015, 52, 6016, 6067, 53, 6068, 6099, 0, 6100,
    6102, 52, 6103, 6103, 0, 6104, 6107, 52, 6108, 6108,
    53, 6109, 6109, 0, 6110, 6111, 53, 6112, 6121, 0,
    6122, 6154, 53, 6155, 6157, 0, 6158, 6159, 53, 6160,
    6169, 0, 6170, 6175, 52, 6176, 6263, 0, 6264, 6271,
    52, 6272, 6312, 53, 6313, 6313, 52, 6314, 6314, 0,
    6315, 6319, 52, 6320, 6389, 0, 6390, 6399, 52, 6400,
    6428, 0, 6429, 6431, 53, 6432, 6443, 0, 6444, 6447,
    53, 6448, 6459, 0, 6460, 6469, 53, 6470, 6479, 52,
    6480, 6509, 0, 6510, 6511, 52, 6512, 6516, 0, 6517,
    6527, 52, 6528, 6571, 0, 6572, 6575, 53, 6576, 6592,
    52, 6593, 6599, 53, 6600, 6601, 0, 6602, 6607, 53,
    6608, 6617, 0, 6618, 6655, 52, 6656, 6678, 53, 6679,
    6683, 0, 6684, 6687, 52, 6688, 6740, 53, 6741, 6750,
    0, 6751, 6751, 53, 6752, 6780, 0, 6781, 6782, 53,
    6783, 6793, 0, 6794, 6799, 53, 6800, 6809, 0, 6810,
    6822, 52, 6823, 6823, 0, 6824, 6911, 53, 6912, 6916,
    52, 6917, 6963, 53, 6964, 6980, 52, 6981, 6987, 0,
    6988, 6991, 53, 6992, 7001, 0, 7002, 7018, 53, 7019,
    7027, 0, 7028, 7039, 53, 7040, 7042, 52, 7043, 7072,
    53, 7073, 7085, 52, 7086, 7087, 53, 7088, 7097, 52,
    7098, 7141, 53, 7142, 7155, 0, 7156, 7167, 52, 7168,
    7203, 53, 7204, 7223, 0, 7224, 7231, 53, 7232, 7241,
    0, 7242, 7244, 52, 7245, 7247, 53, 7248, 7257, 52,
    7258, 7293, 0, 7294, 7375, 53, 7376, 7378, 0, 7379,
    7379, 53, 7380, 7400, 52, 7401, 7404, 53, 7405, 7405,
    52, 7406, 7409, 53, 7410, 7412, 52, 7413, 7414, 0,
    7415, 7423, 52, 7424, 7615, 53, 7616, 7654, 0, 7655,
    7675, 53, 7676, 7679, 52, 7680, 7957, 0, 7958, 7959,
    52, 7960, 7965, 0, 7966, 7967, 52, 7968, 8005, 0,
    8006, 8007, 52, 8008, 8013, 0, 8014, 8015, 52, 8016,
    8023, 0, 8024, 8024, 52, 8025, 8025, 0, 8026, 8026,
    52, 8027, 8027, 0, 8028, 8028, 52, 8029, 8029, 0,
    8030, 8030, 52, 8031, 8061, 0, 8062, 8063, 52, 8064,
    8116, 0, 8117, 8117, 52, 8118, 8124, 0, 8125, 8125,
    52, 8126, 8126, 0, 8127, 8129, 52, 8130, 8132, 0,
    8133, 8133, 52, 8134, 8140, 0, 8141, 8143, 52, 8144,
    8147, 0, 8148, 8149, 52, 8150, 8155, 0, 8156, 8159,
    52, 8160, 8172, 0, 8173, 8177, 52, 8178, 8180, 0,
    8181, 8181, 52, 8182, 8188, 0, 8189, 8203, 53, 8204,
    8205, 0, 8206, 8254, 53, 8255, 8256, 0, 8257, 8275,
    53, 8276, 8276, 0, 8277, 8304, 52, 8305, 8305, 0,
    8306, 8318, 52, 8319, 8319, 0, 8320, 8335, 52, 8336,
    8348, 0, 8349, 8399, 53, 8400, 8412, 0, 8413, 8416,
    53, 8417, 8417, 0, 8418, 8420, 53, 8421, 8432, 0,
    8433, 8449, 52, 8450, 8450, 0, 8451, 8454, 52, 8455,
    8455, 0, 8456, 8457, 52, 8458, 8467, 0, 8468, 8468,
    52, 8469, 8469, 0, 8470, 8472, 52, 8473, 8477, 0,
    8478, 8483, 52, 8484, 8484, 0, 8485, 8485, 52, 8486,
    8486, 0, 8487, 8487, 52, 8488, 8488, 0, 8489, 8489,
    52, 8490, 8493, 0, 8494, 8494, 52, 8495, 8505, 0,
    8506, 8507, 52, 8508, 8511, 0, 8512, 8516, 52, 8517,
    8521, 0, 8522, 8525, 52, 8526, 8526, 0, 8527, 8543,
    52, 8544, 8584, 0, 8585, 11263, 52, 11264, 11310, 0,
    11311, 11311, 52, 11312, 11358, 0, 11359, 11359, 52, 11360,
    11492, 0, 11493, 11498, 52, 11499, 11502, 53, 11503, 11505,
    52, 11506, 11507, 0, 11508, 11519, 52, 11520, 11557, 0,
    11558, 11558, 52, 11559, 11559, 0, 11560, 11564, 52, 11565,
    11565, 0, 11566, 11567, 52, 11568, 11623, 0, 11624, 11630,
    52, 11631, 11631, 0, 11632, 11646, 53, 11647, 11647, 52,
    11648, 11670, 0, 11671, 11679, 52, 11680, 11686, 0, 11687,
    11687, 52, 11688, 11694, 0, 11695, 11695, 52, 11696, 11702,
    0, 11703, 11703, 52, 11704, 11710, 0, 11711, 11711, 52,
    11712, 11718, 0, 11719, 11719, 52, 11720, 11726, 0, 11727,
    11727, 52, 11728, 11734, 0, 11735, 11735, 52, 11736, 11742,
    0, 11743, 11743, 53, 11744, 11775, 0, 11776, 11822, 52,
    11823, 11823, 0, 11824, 12292, 52, 12293, 12295, 0, 12296,
    12320, 52, 12321, 12329, 53, 12330, 12335, 0, 12336, 12336,
    52, 12337, 12341, 0, 12342, 12343, 52, 12344, 12348, 0,
    12349, 12352, 52, 12353, 12438, 0, 12439, 12440, 53, 12441,
    12442, 0, 12443, 12444, 52, 12445, 12447, 0, 12448, 12448,
    52, 12449, 12538, 0, 12539, 12539, 52, 12540, 12543, 0,
    12544, 12548, 52, 12549, 12589, 0, 12590, 12592, 52, 12593,
    12686, 0, 12687, 12703, 52, 12704, 12730, 0, 12731, 12783,
    52, 12784, 12799, 0, 12800, 13311, 52, 13312, 19893, 0,
    19894, 19967, 52, 19968, 40908, 0, 40909, 40959, 52, 40960,
    42124, 0, 42125, 42191, 52, 42192, 42237, 0, 42238, 42239,
    52, 42240, 42508, 0, 42509, 42511, 52, 42512, 42527, 53,
    42528, 42537, 52, 42538, 42539, 0, 42540, 42559, 52, 42560,
    42606, 53, 42607, 42607, 0, 42608, 42611, 53, 42612, 42621,
    0, 42622, 42622, 52, 42623, 42647, 0, 42648, 42654, 53,
    42655, 42655, 52, 42656, 42735, 53, 42736, 42737, 0, 42738,
    42774, 52, 42775, 42783, 0, 42784, 42785, 52, 42786, 42888,
    0, 42889, 42890, 52, 42891, 42894, 0, 42895, 42895, 52,
    42896, 42899, 0, 42900, 42911, 52, 42912, 42922, 0, 42923,
    42999, 52, 43000, 43009, 53, 43010, 43010, 52, 43011, 43013,
    53, 43014, 43014, 52, 43015, 43018, 53, 43019, 43019, 52,
    43020, 43042, 53, 43043, 43047, 0, 43048, 43071, 52, 43072,
    43123, 0, 43124, 43135, 53, 43136, 43137, 52, 43138, 43187,
    53, 43188, 43204, 0, 43205, 43215, 53, 43216, 43225, 0,
    43226, 43231, 53, 43232, 43249, 52, 43250, 43255, 0, 43256,
    43258, 52, 43259, 43259, 0, 43260, 43263, 53, 43264, 43273,
    52, 43274, 43301, 53, 43302, 43309, 0, 43310, 43311, 52,
    43312, 43334, 53, 43335, 43347, 0, 43348, 43359, 52, 43360,
    43388, 0, 43389, 43391, 53, 43392, 43395, 52, 43396, 43442,
    53, 43443, 43456, 0, 43457, 43470, 52, 43471, 43471, 53,
    43472, 43481, 0, 43482, 43519, 52, 43520, 43560, 53, 43561,
    43574, 0, 43575, 43583, 52, 43584, 43586, 53, 43587, 43587,
    52, 43588, 43595, 53, 43596, 43597, 0, 43598, 43599, 53,
    43600, 43609, 0, 43610, 43615, 52, 43616, 43638, 0, 43639,
    43641, 52, 43642, 43642, 53, 43643, 43643, 0, 43644, 43647,
    52, 43648, 43695, 53, 43696, 43696, 52, 43697, 43697, 53,
    43698, 43700, 52, 43701, 43702, 53, 43703, 43704, 52, 43705,
    43709, 53, 43710, 43711, 52, 43712, 43712, 53, 43713, 43713,
    52, 43714, 43714, 0, 43715, 43738, 52, 43739, 43741, 0,
    43742, 43743, 52, 43744, 43754, 53, 43755, 43759, 0, 43760,
    43761, 52, 43762, 43764, 53, 43765, 43766, 0, 43767, 43776,
    52, 43777, 43782, 0, 43783, 43784, 52, 43785, 43790, 0,
    43791, 43792, 52, 43793, 43798, 0, 43799, 43807, 52, 43808,
    43814, 0, 43815, 43815, 52, 43816, 43822, 0, 43823, 43967,
    52, 43968, 44002, 53, 44003, 44010, 0, 44011, 44011, 53,
    44012, 44013, 0, 44014, 44015, 53, 44016, 44025, 0, 44026,
    44031, 52, 44032, 55203, 0, 55204, 55215, 52, 55216, 55238,
    0, 55239, 55242, 52, 55243, 55291, 0, 55292, 63743, 52,
    63744, 64109, 0, 64110, 64111, 52, 64112, 64217, 0, 64218,
    64255, 52, 64256, 64262, 0, 64263, 64274, 52, 64275, 64279,
    0, 64280, 64284, 52, 64285, 64285, 53, 64286, 64286, 52,
    64287, 64296, 0, 64297, 64297, 52, 64298, 64310, 0, 64311,
    64311, 52, 64312, 64316, 0, 64317, 64317, 52, 64318, 64318,
    0, 64319, 64319, 52, 64320, 64321, 0, 64322, 64322, 52,
    64323, 64324, 0, 64325, 64325, 52, 64326, 64433, 0, 64434,
    64466, 52, 64467, 64829, 0, 64830, 64847, 52, 64848, 64911,
    0, 64912, 64913, 52, 64914, 64967, 0, 64968, 65007, 52,
    65008, 65019, 0, 65020, 65023, 53, 65024, 65039, 0, 65040,
    65055, 53, 65056, 65062, 0, 65063, 65074, 53, 65075, 65076,
    0, 65077, 65100, 53, 65101, 65103, 0, 65104, 65135, 52,
    65136, 65140, 0, 65141, 65141, 52, 65142, 65276, 0, 65277,
    65295, 53, 65296, 65305, 0, 65306, 65312, 52, 65313, 65338,
    0, 65339, 65342, 53, 65343, 65343, 0, 65344, 65344, 52,
    65345, 65370, 0, 65371, 65381, 52, 65382, 65470, 0, 65471,
    65473, 52, 65474, 65479, 0, 65480, 65481, 52, 65482, 65487,
    0, 65488, 65489, 52, 65490, 65495, 0, 65496, 65497, 52,
    65498, 65500, 0, 65501, Infinity,
];
var jjlexisEnd0 = [
    0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0,
    1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1,
    0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0,
    0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1,
    1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1,
];
var jjlexhasArc0 = [
    1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1,
    1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
    1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1,
    1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0,
];
var jjlextable0 = {
    pnext: jjlexpnext0,
    disnext: jjlexdisnext0,
    checknext: jjlexchecknext0,
    maxAsicii: 255,
    classTable: jjlexclassTable0,
    unicodeClassTable: jjlexunicodeClassTable0,
    isEnd: jjlexisEnd0,
    hasArc: jjlexhasArc0
};
var jjlexpnext1 = [
    6, 6, 7, 7, 1, 2, 3, 4, 1, 5,
    6, 6, 1, 5,
];
var jjlexdisnext1 = [
    4, 12, 0, -4, -4, 10, 8, -4,
];
var jjlexchecknext1 = [
    2, 2, 2, 2, 0, 0, 0, 0, 6, 6,
    5, 5, 1, 1,
];
var jjlexclassTable1 = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 2, 0, 3, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
];
var jjlexunicodeClassTable1 = [
    0, 256, Infinity,
];
var jjlexisEnd1 = [
    0, 1, 0, 1, 1, 0, 1, 1,
];
var jjlexhasArc1 = [
    1, 1, 1, 0, 0, 1, 1, 0,
];
var jjlextable1 = {
    pnext: jjlexpnext1,
    disnext: jjlexdisnext1,
    checknext: jjlexchecknext1,
    maxAsicii: 255,
    classTable: jjlexclassTable1,
    unicodeClassTable: jjlexunicodeClassTable1,
    isEnd: jjlexisEnd1,
    hasArc: jjlexhasArc1
};
var jjlexpnext2 = [
    13, 14, 13, 13, 13, 13, 13, 13, 13, 13,
    13, 13, 13, 13, 13, 13, 13, 13, 14, 14,
    13, 13, 1, 2, 1, 1, 1, 1, 3, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    4, 5, 1, 1, 7, 31, 32, 7, 33, 31,
    9, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, -1, -1, 34, 35, 7, 31, 32, 7,
    33, 31, 9, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, -1, -1, 34, 35, 7, 31,
    32, 7, 33, 31, 9, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, -1, -1, 34, 35,
    7, 31, 32, 7, 33, 31, 9, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, -1, -1,
    34, 35, 7, 7, 7, 7, 7, 7, 9, 7,
    7, 36, 7, 7, 7, 7, 7, 7, 7, 7,
    -1, -1, 7, 7, 7, 31, 32, 7, 33, 31,
    9, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, -1, -1, 34, 35, 7, 31, 32, 7,
    33, 31, 9, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, -1, -1, 34, 35, 7, 7,
    7, 7, 7, 7, 9, 7, 7, 7, 30, 7,
    7, 7, 7, 7, 7, 7, -1, -1, 7, 7,
    7, 28, 7, 7, 7, 28, 9, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, -1, -1,
    29, 7, 7, 7, 7, 7, 7, 7, 9, 7,
    7, 7, 7, 7, 7, 7, 7, 27, 7, 7,
    -1, -1, 7, 7, 7, 7, 7, 7, 7, 7,
    9, 7, 7, 7, 7, 26, 7, 7, 7, 7,
    7, 7, -1, -1, 7, 7, 7, 7, 7, 25,
    7, 7, 9, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, -1, -1, 7, 7, 7, 7,
    7, 7, 7, 7, 9, 7, 7, 7, 24, 7,
    7, 7, 7, 7, 7, 7, -1, -1, 7, 7,
    7, 7, 7, 7, 7, 7, 9, 7, 23, 7,
    7, 7, 7, 7, 7, 7, 7, 7, -1, -1,
    7, 7, 7, 7, 7, 7, 7, 7, 9, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 22,
    -1, -1, 7, 7, 7, 7, 7, 7, 7, 7,
    9, 7, 7, 7, 7, 7, 7, 21, 7, 7,
    7, 7, -1, -1, 7, 7, 7, 7, 7, 7,
    7, 7, 9, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 20, -1, -1, 7, 7, 7, 7,
    7, 7, 7, 7, 9, 7, 7, 7, 7, 7,
    19, 7, 7, 7, 7, 7, -1, -1, 7, 7,
    7, 7, 7, 7, 7, 7, 9, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, -1, -1,
    7, 7, 7, 7, 7, 7, 7, 7, 9, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 18, 7,
    -1, -1, 7, 7, 7, 7, 7, 7, 7, 7,
    9, 17, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, -1, -1, 7, 7, 7, 7, 7, 7,
    7, 7, 9, 7, 7, 7, 7, 7, 7, 7,
    16, 7, 7, 7, -1, -1, 7, 7, 7, 7,
    7, 7, 7, 7, 9, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, -1, -1, 7, 7,
    7, 8, 7, 7, 7, 7, 9, 7, 7, 7,
    10, 7, 7, 7, 11, 7, 7, 12, -1, -1,
    7, 7, 1, -1, 1, 1, 1, 1, 6, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    -1, -1, 1, 1, 15, -1, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, -1, -1, 15, 15, 13, -1, 13, 13,
    13, 13, 13, 13, 13, 13, 13, 13, 13, 13,
    13, 13, 13, 13, -1, -1, 13, 13, 1, -1,
    1, 1, 1, 1, 6, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, -1, -1, 1, 1,
];
var jjlexdisnext2 = [
    22, 638, 550, 0, -22, -22, 616, 528, -22, 594,
    506, 484, 462, 572, -22, 440, 418, 396, 374, 352,
    330, 308, 286, 264, 242, 220, 198, -22, 176, 154,
    132, 110, 88, -22, 66, 44, -22,
];
var jjlexchecknext2 = [
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 35, 35, 35, 35, 35, 35,
    35, 35, 35, 35, 35, 35, 35, 35, 35, 35,
    35, 35, -1, -1, 35, 35, 34, 34, 34, 34,
    34, 34, 34, 34, 34, 34, 34, 34, 34, 34,
    34, 34, 34, 34, -1, -1, 34, 34, 32, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    32, 32, 32, 32, 32, 32, -1, -1, 32, 32,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, -1, -1,
    31, 31, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    -1, -1, 30, 30, 29, 29, 29, 29, 29, 29,
    29, 29, 29, 29, 29, 29, 29, 29, 29, 29,
    29, 29, -1, -1, 29, 29, 28, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    28, 28, 28, 28, -1, -1, 28, 28, 26, 26,
    26, 26, 26, 26, 26, 26, 26, 26, 26, 26,
    26, 26, 26, 26, 26, 26, -1, -1, 26, 26,
    25, 25, 25, 25, 25, 25, 25, 25, 25, 25,
    25, 25, 25, 25, 25, 25, 25, 25, -1, -1,
    25, 25, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    -1, -1, 24, 24, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, -1, -1, 23, 23, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, -1, -1, 22, 22, 21, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
    21, 21, 21, 21, 21, 21, -1, -1, 21, 21,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, -1, -1,
    20, 20, 19, 19, 19, 19, 19, 19, 19, 19,
    19, 19, 19, 19, 19, 19, 19, 19, 19, 19,
    -1, -1, 19, 19, 18, 18, 18, 18, 18, 18,
    18, 18, 18, 18, 18, 18, 18, 18, 18, 18,
    18, 18, -1, -1, 18, 18, 17, 17, 17, 17,
    17, 17, 17, 17, 17, 17, 17, 17, 17, 17,
    17, 17, 17, 17, -1, -1, 17, 17, 16, 16,
    16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
    16, 16, 16, 16, 16, 16, -1, -1, 16, 16,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, -1, -1,
    15, 15, 12, 12, 12, 12, 12, 12, 12, 12,
    12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
    -1, -1, 12, 12, 11, 11, 11, 11, 11, 11,
    11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
    11, 11, -1, -1, 11, 11, 10, 10, 10, 10,
    10, 10, 10, 10, 10, 10, 10, 10, 10, 10,
    10, 10, 10, 10, -1, -1, 10, 10, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, -1, -1, 7, 7,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, -1, -1,
    2, 2, 13, -1, 13, 13, 13, 13, 13, 13,
    13, 13, 13, 13, 13, 13, 13, 13, 13, 13,
    -1, -1, 13, 13, 9, -1, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
    9, 9, -1, -1, 9, 9, 6, -1, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, -1, -1, 6, 6, 1, -1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, -1, -1, 1, 1,
];
var jjlexclassTable2 = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 0, 0,
    3, 0, 4, 0, 0, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    5, 0, 6, 0, 0, 5, 0, 7, 5, 8,
    9, 10, 5, 5, 11, 12, 5, 13, 5, 14,
    15, 16, 5, 5, 5, 5, 17, 5, 5, 5,
    5, 5, 5, 18, 0, 19, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    20, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 20, 0, 0, 0, 0, 20, 0, 0, 0,
    0, 0, 20, 20, 20, 20, 20, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
    20, 20, 20, 20, 20, 0, 20, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 0, 20, 20,
    20, 20, 20, 20, 20, 20,
];
var jjlexunicodeClassTable2 = [
    20, 256, 705, 0, 706, 709, 20, 710, 721, 0,
    722, 735, 20, 736, 740, 0, 741, 747, 20, 748,
    748, 0, 749, 749, 20, 750, 750, 0, 751, 767,
    21, 768, 879, 20, 880, 884, 0, 885, 885, 20,
    886, 887, 0, 888, 889, 20, 890, 893, 0, 894,
    901, 20, 902, 902, 0, 903, 903, 20, 904, 906,
    0, 907, 907, 20, 908, 908, 0, 909, 909, 20,
    910, 929, 0, 930, 930, 20, 931, 1013, 0, 1014,
    1014, 20, 1015, 1153, 0, 1154, 1154, 21, 1155, 1159,
    0, 1160, 1161, 20, 1162, 1319, 0, 1320, 1328, 20,
    1329, 1366, 0, 1367, 1368, 20, 1369, 1369, 0, 1370,
    1376, 20, 1377, 1415, 0, 1416, 1424, 21, 1425, 1469,
    0, 1470, 1470, 21, 1471, 1471, 0, 1472, 1472, 21,
    1473, 1474, 0, 1475, 1475, 21, 1476, 1477, 0, 1478,
    1478, 21, 1479, 1479, 0, 1480, 1487, 20, 1488, 1514,
    0, 1515, 1519, 20, 1520, 1522, 0, 1523, 1551, 21,
    1552, 1562, 0, 1563, 1567, 20, 1568, 1610, 21, 1611,
    1641, 0, 1642, 1645, 20, 1646, 1647, 21, 1648, 1648,
    20, 1649, 1747, 0, 1748, 1748, 20, 1749, 1749, 21,
    1750, 1756, 0, 1757, 1758, 21, 1759, 1764, 20, 1765,
    1766, 21, 1767, 1768, 0, 1769, 1769, 21, 1770, 1773,
    20, 1774, 1775, 21, 1776, 1785, 20, 1786, 1788, 0,
    1789, 1790, 20, 1791, 1791, 0, 1792, 1807, 20, 1808,
    1808, 21, 1809, 1809, 20, 1810, 1839, 21, 1840, 1866,
    0, 1867, 1868, 20, 1869, 1957, 21, 1958, 1968, 20,
    1969, 1969, 0, 1970, 1983, 21, 1984, 1993, 20, 1994,
    2026, 21, 2027, 2035, 20, 2036, 2037, 0, 2038, 2041,
    20, 2042, 2042, 0, 2043, 2047, 20, 2048, 2069, 21,
    2070, 2073, 20, 2074, 2074, 21, 2075, 2083, 20, 2084,
    2084, 21, 2085, 2087, 20, 2088, 2088, 21, 2089, 2093,
    0, 2094, 2111, 20, 2112, 2136, 21, 2137, 2139, 0,
    2140, 2207, 20, 2208, 2208, 0, 2209, 2209, 20, 2210,
    2220, 0, 2221, 2275, 21, 2276, 2302, 0, 2303, 2303,
    21, 2304, 2307, 20, 2308, 2361, 21, 2362, 2364, 20,
    2365, 2365, 21, 2366, 2383, 20, 2384, 2384, 21, 2385,
    2391, 20, 2392, 2401, 21, 2402, 2403, 0, 2404, 2405,
    21, 2406, 2415, 0, 2416, 2416, 20, 2417, 2423, 0,
    2424, 2424, 20, 2425, 2431, 0, 2432, 2432, 21, 2433,
    2435, 0, 2436, 2436, 20, 2437, 2444, 0, 2445, 2446,
    20, 2447, 2448, 0, 2449, 2450, 20, 2451, 2472, 0,
    2473, 2473, 20, 2474, 2480, 0, 2481, 2481, 20, 2482,
    2482, 0, 2483, 2485, 20, 2486, 2489, 0, 2490, 2491,
    21, 2492, 2492, 20, 2493, 2493, 21, 2494, 2500, 0,
    2501, 2502, 21, 2503, 2504, 0, 2505, 2506, 21, 2507,
    2509, 20, 2510, 2510, 0, 2511, 2518, 21, 2519, 2519,
    0, 2520, 2523, 20, 2524, 2525, 0, 2526, 2526, 20,
    2527, 2529, 21, 2530, 2531, 0, 2532, 2533, 21, 2534,
    2543, 20, 2544, 2545, 0, 2546, 2560, 21, 2561, 2563,
    0, 2564, 2564, 20, 2565, 2570, 0, 2571, 2574, 20,
    2575, 2576, 0, 2577, 2578, 20, 2579, 2600, 0, 2601,
    2601, 20, 2602, 2608, 0, 2609, 2609, 20, 2610, 2611,
    0, 2612, 2612, 20, 2613, 2614, 0, 2615, 2615, 20,
    2616, 2617, 0, 2618, 2619, 21, 2620, 2620, 0, 2621,
    2621, 21, 2622, 2626, 0, 2627, 2630, 21, 2631, 2632,
    0, 2633, 2634, 21, 2635, 2637, 0, 2638, 2640, 21,
    2641, 2641, 0, 2642, 2648, 20, 2649, 2652, 0, 2653,
    2653, 20, 2654, 2654, 0, 2655, 2661, 21, 2662, 2673,
    20, 2674, 2676, 21, 2677, 2677, 0, 2678, 2688, 21,
    2689, 2691, 0, 2692, 2692, 20, 2693, 2701, 0, 2702,
    2702, 20, 2703, 2705, 0, 2706, 2706, 20, 2707, 2728,
    0, 2729, 2729, 20, 2730, 2736, 0, 2737, 2737, 20,
    2738, 2739, 0, 2740, 2740, 20, 2741, 2745, 0, 2746,
    2747, 21, 2748, 2748, 20, 2749, 2749, 21, 2750, 2757,
    0, 2758, 2758, 21, 2759, 2761, 0, 2762, 2762, 21,
    2763, 2765, 0, 2766, 2767, 20, 2768, 2768, 0, 2769,
    2783, 20, 2784, 2785, 21, 2786, 2787, 0, 2788, 2789,
    21, 2790, 2799, 0, 2800, 2816, 21, 2817, 2819, 0,
    2820, 2820, 20, 2821, 2828, 0, 2829, 2830, 20, 2831,
    2832, 0, 2833, 2834, 20, 2835, 2856, 0, 2857, 2857,
    20, 2858, 2864, 0, 2865, 2865, 20, 2866, 2867, 0,
    2868, 2868, 20, 2869, 2873, 0, 2874, 2875, 21, 2876,
    2876, 20, 2877, 2877, 21, 2878, 2884, 0, 2885, 2886,
    21, 2887, 2888, 0, 2889, 2890, 21, 2891, 2893, 0,
    2894, 2901, 21, 2902, 2903, 0, 2904, 2907, 20, 2908,
    2909, 0, 2910, 2910, 20, 2911, 2913, 21, 2914, 2915,
    0, 2916, 2917, 21, 2918, 2927, 0, 2928, 2928, 20,
    2929, 2929, 0, 2930, 2945, 21, 2946, 2946, 20, 2947,
    2947, 0, 2948, 2948, 20, 2949, 2954, 0, 2955, 2957,
    20, 2958, 2960, 0, 2961, 2961, 20, 2962, 2965, 0,
    2966, 2968, 20, 2969, 2970, 0, 2971, 2971, 20, 2972,
    2972, 0, 2973, 2973, 20, 2974, 2975, 0, 2976, 2978,
    20, 2979, 2980, 0, 2981, 2983, 20, 2984, 2986, 0,
    2987, 2989, 20, 2990, 3001, 0, 3002, 3005, 21, 3006,
    3010, 0, 3011, 3013, 21, 3014, 3016, 0, 3017, 3017,
    21, 3018, 3021, 0, 3022, 3023, 20, 3024, 3024, 0,
    3025, 3030, 21, 3031, 3031, 0, 3032, 3045, 21, 3046,
    3055, 0, 3056, 3072, 21, 3073, 3075, 0, 3076, 3076,
    20, 3077, 3084, 0, 3085, 3085, 20, 3086, 3088, 0,
    3089, 3089, 20, 3090, 3112, 0, 3113, 3113, 20, 3114,
    3123, 0, 3124, 3124, 20, 3125, 3129, 0, 3130, 3132,
    20, 3133, 3133, 21, 3134, 3140, 0, 3141, 3141, 21,
    3142, 3144, 0, 3145, 3145, 21, 3146, 3149, 0, 3150,
    3156, 21, 3157, 3158, 0, 3159, 3159, 20, 3160, 3161,
    0, 3162, 3167, 20, 3168, 3169, 21, 3170, 3171, 0,
    3172, 3173, 21, 3174, 3183, 0, 3184, 3201, 21, 3202,
    3203, 0, 3204, 3204, 20, 3205, 3212, 0, 3213, 3213,
    20, 3214, 3216, 0, 3217, 3217, 20, 3218, 3240, 0,
    3241, 3241, 20, 3242, 3251, 0, 3252, 3252, 20, 3253,
    3257, 0, 3258, 3259, 21, 3260, 3260, 20, 3261, 3261,
    21, 3262, 3268, 0, 3269, 3269, 21, 3270, 3272, 0,
    3273, 3273, 21, 3274, 3277, 0, 3278, 3284, 21, 3285,
    3286, 0, 3287, 3293, 20, 3294, 3294, 0, 3295, 3295,
    20, 3296, 3297, 21, 3298, 3299, 0, 3300, 3301, 21,
    3302, 3311, 0, 3312, 3312, 20, 3313, 3314, 0, 3315,
    3329, 21, 3330, 3331, 0, 3332, 3332, 20, 3333, 3340,
    0, 3341, 3341, 20, 3342, 3344, 0, 3345, 3345, 20,
    3346, 3386, 0, 3387, 3388, 20, 3389, 3389, 21, 3390,
    3396, 0, 3397, 3397, 21, 3398, 3400, 0, 3401, 3401,
    21, 3402, 3405, 20, 3406, 3406, 0, 3407, 3414, 21,
    3415, 3415, 0, 3416, 3423, 20, 3424, 3425, 21, 3426,
    3427, 0, 3428, 3429, 21, 3430, 3439, 0, 3440, 3449,
    20, 3450, 3455, 0, 3456, 3457, 21, 3458, 3459, 0,
    3460, 3460, 20, 3461, 3478, 0, 3479, 3481, 20, 3482,
    3505, 0, 3506, 3506, 20, 3507, 3515, 0, 3516, 3516,
    20, 3517, 3517, 0, 3518, 3519, 20, 3520, 3526, 0,
    3527, 3529, 21, 3530, 3530, 0, 3531, 3534, 21, 3535,
    3540, 0, 3541, 3541, 21, 3542, 3542, 0, 3543, 3543,
    21, 3544, 3551, 0, 3552, 3569, 21, 3570, 3571, 0,
    3572, 3584, 20, 3585, 3632, 21, 3633, 3633, 20, 3634,
    3635, 21, 3636, 3642, 0, 3643, 3647, 20, 3648, 3654,
    21, 3655, 3662, 0, 3663, 3663, 21, 3664, 3673, 0,
    3674, 3712, 20, 3713, 3714, 0, 3715, 3715, 20, 3716,
    3716, 0, 3717, 3718, 20, 3719, 3720, 0, 3721, 3721,
    20, 3722, 3722, 0, 3723, 3724, 20, 3725, 3725, 0,
    3726, 3731, 20, 3732, 3735, 0, 3736, 3736, 20, 3737,
    3743, 0, 3744, 3744, 20, 3745, 3747, 0, 3748, 3748,
    20, 3749, 3749, 0, 3750, 3750, 20, 3751, 3751, 0,
    3752, 3753, 20, 3754, 3755, 0, 3756, 3756, 20, 3757,
    3760, 21, 3761, 3761, 20, 3762, 3763, 21, 3764, 3769,
    0, 3770, 3770, 21, 3771, 3772, 20, 3773, 3773, 0,
    3774, 3775, 20, 3776, 3780, 0, 3781, 3781, 20, 3782,
    3782, 0, 3783, 3783, 21, 3784, 3789, 0, 3790, 3791,
    21, 3792, 3801, 0, 3802, 3803, 20, 3804, 3807, 0,
    3808, 3839, 20, 3840, 3840, 0, 3841, 3863, 21, 3864,
    3865, 0, 3866, 3871, 21, 3872, 3881, 0, 3882, 3892,
    21, 3893, 3893, 0, 3894, 3894, 21, 3895, 3895, 0,
    3896, 3896, 21, 3897, 3897, 0, 3898, 3901, 21, 3902,
    3903, 20, 3904, 3911, 0, 3912, 3912, 20, 3913, 3948,
    0, 3949, 3952, 21, 3953, 3972, 0, 3973, 3973, 21,
    3974, 3975, 20, 3976, 3980, 21, 3981, 3991, 0, 3992,
    3992, 21, 3993, 4028, 0, 4029, 4037, 21, 4038, 4038,
    0, 4039, 4095, 20, 4096, 4138, 21, 4139, 4158, 20,
    4159, 4159, 21, 4160, 4169, 0, 4170, 4175, 20, 4176,
    4181, 21, 4182, 4185, 20, 4186, 4189, 21, 4190, 4192,
    20, 4193, 4193, 21, 4194, 4196, 20, 4197, 4198, 21,
    4199, 4205, 20, 4206, 4208, 21, 4209, 4212, 20, 4213,
    4225, 21, 4226, 4237, 20, 4238, 4238, 21, 4239, 4253,
    0, 4254, 4255, 20, 4256, 4293, 0, 4294, 4294, 20,
    4295, 4295, 0, 4296, 4300, 20, 4301, 4301, 0, 4302,
    4303, 20, 4304, 4346, 0, 4347, 4347, 20, 4348, 4680,
    0, 4681, 4681, 20, 4682, 4685, 0, 4686, 4687, 20,
    4688, 4694, 0, 4695, 4695, 20, 4696, 4696, 0, 4697,
    4697, 20, 4698, 4701, 0, 4702, 4703, 20, 4704, 4744,
    0, 4745, 4745, 20, 4746, 4749, 0, 4750, 4751, 20,
    4752, 4784, 0, 4785, 4785, 20, 4786, 4789, 0, 4790,
    4791, 20, 4792, 4798, 0, 4799, 4799, 20, 4800, 4800,
    0, 4801, 4801, 20, 4802, 4805, 0, 4806, 4807, 20,
    4808, 4822, 0, 4823, 4823, 20, 4824, 4880, 0, 4881,
    4881, 20, 4882, 4885, 0, 4886, 4887, 20, 4888, 4954,
    0, 4955, 4956, 21, 4957, 4959, 0, 4960, 4991, 20,
    4992, 5007, 0, 5008, 5023, 20, 5024, 5108, 0, 5109,
    5120, 20, 5121, 5740, 0, 5741, 5742, 20, 5743, 5759,
    0, 5760, 5760, 20, 5761, 5786, 0, 5787, 5791, 20,
    5792, 5866, 0, 5867, 5869, 20, 5870, 5872, 0, 5873,
    5887, 20, 5888, 5900, 0, 5901, 5901, 20, 5902, 5905,
    21, 5906, 5908, 0, 5909, 5919, 20, 5920, 5937, 21,
    5938, 5940, 0, 5941, 5951, 20, 5952, 5969, 21, 5970,
    5971, 0, 5972, 5983, 20, 5984, 5996, 0, 5997, 5997,
    20, 5998, 6000, 0, 6001, 6001, 21, 6002, 6003, 0,
    6004, 6015, 20, 6016, 6067, 21, 6068, 6099, 0, 6100,
    6102, 20, 6103, 6103, 0, 6104, 6107, 20, 6108, 6108,
    21, 6109, 6109, 0, 6110, 6111, 21, 6112, 6121, 0,
    6122, 6154, 21, 6155, 6157, 0, 6158, 6159, 21, 6160,
    6169, 0, 6170, 6175, 20, 6176, 6263, 0, 6264, 6271,
    20, 6272, 6312, 21, 6313, 6313, 20, 6314, 6314, 0,
    6315, 6319, 20, 6320, 6389, 0, 6390, 6399, 20, 6400,
    6428, 0, 6429, 6431, 21, 6432, 6443, 0, 6444, 6447,
    21, 6448, 6459, 0, 6460, 6469, 21, 6470, 6479, 20,
    6480, 6509, 0, 6510, 6511, 20, 6512, 6516, 0, 6517,
    6527, 20, 6528, 6571, 0, 6572, 6575, 21, 6576, 6592,
    20, 6593, 6599, 21, 6600, 6601, 0, 6602, 6607, 21,
    6608, 6617, 0, 6618, 6655, 20, 6656, 6678, 21, 6679,
    6683, 0, 6684, 6687, 20, 6688, 6740, 21, 6741, 6750,
    0, 6751, 6751, 21, 6752, 6780, 0, 6781, 6782, 21,
    6783, 6793, 0, 6794, 6799, 21, 6800, 6809, 0, 6810,
    6822, 20, 6823, 6823, 0, 6824, 6911, 21, 6912, 6916,
    20, 6917, 6963, 21, 6964, 6980, 20, 6981, 6987, 0,
    6988, 6991, 21, 6992, 7001, 0, 7002, 7018, 21, 7019,
    7027, 0, 7028, 7039, 21, 7040, 7042, 20, 7043, 7072,
    21, 7073, 7085, 20, 7086, 7087, 21, 7088, 7097, 20,
    7098, 7141, 21, 7142, 7155, 0, 7156, 7167, 20, 7168,
    7203, 21, 7204, 7223, 0, 7224, 7231, 21, 7232, 7241,
    0, 7242, 7244, 20, 7245, 7247, 21, 7248, 7257, 20,
    7258, 7293, 0, 7294, 7375, 21, 7376, 7378, 0, 7379,
    7379, 21, 7380, 7400, 20, 7401, 7404, 21, 7405, 7405,
    20, 7406, 7409, 21, 7410, 7412, 20, 7413, 7414, 0,
    7415, 7423, 20, 7424, 7615, 21, 7616, 7654, 0, 7655,
    7675, 21, 7676, 7679, 20, 7680, 7957, 0, 7958, 7959,
    20, 7960, 7965, 0, 7966, 7967, 20, 7968, 8005, 0,
    8006, 8007, 20, 8008, 8013, 0, 8014, 8015, 20, 8016,
    8023, 0, 8024, 8024, 20, 8025, 8025, 0, 8026, 8026,
    20, 8027, 8027, 0, 8028, 8028, 20, 8029, 8029, 0,
    8030, 8030, 20, 8031, 8061, 0, 8062, 8063, 20, 8064,
    8116, 0, 8117, 8117, 20, 8118, 8124, 0, 8125, 8125,
    20, 8126, 8126, 0, 8127, 8129, 20, 8130, 8132, 0,
    8133, 8133, 20, 8134, 8140, 0, 8141, 8143, 20, 8144,
    8147, 0, 8148, 8149, 20, 8150, 8155, 0, 8156, 8159,
    20, 8160, 8172, 0, 8173, 8177, 20, 8178, 8180, 0,
    8181, 8181, 20, 8182, 8188, 0, 8189, 8203, 21, 8204,
    8205, 0, 8206, 8254, 21, 8255, 8256, 0, 8257, 8275,
    21, 8276, 8276, 0, 8277, 8304, 20, 8305, 8305, 0,
    8306, 8318, 20, 8319, 8319, 0, 8320, 8335, 20, 8336,
    8348, 0, 8349, 8399, 21, 8400, 8412, 0, 8413, 8416,
    21, 8417, 8417, 0, 8418, 8420, 21, 8421, 8432, 0,
    8433, 8449, 20, 8450, 8450, 0, 8451, 8454, 20, 8455,
    8455, 0, 8456, 8457, 20, 8458, 8467, 0, 8468, 8468,
    20, 8469, 8469, 0, 8470, 8472, 20, 8473, 8477, 0,
    8478, 8483, 20, 8484, 8484, 0, 8485, 8485, 20, 8486,
    8486, 0, 8487, 8487, 20, 8488, 8488, 0, 8489, 8489,
    20, 8490, 8493, 0, 8494, 8494, 20, 8495, 8505, 0,
    8506, 8507, 20, 8508, 8511, 0, 8512, 8516, 20, 8517,
    8521, 0, 8522, 8525, 20, 8526, 8526, 0, 8527, 8543,
    20, 8544, 8584, 0, 8585, 11263, 20, 11264, 11310, 0,
    11311, 11311, 20, 11312, 11358, 0, 11359, 11359, 20, 11360,
    11492, 0, 11493, 11498, 20, 11499, 11502, 21, 11503, 11505,
    20, 11506, 11507, 0, 11508, 11519, 20, 11520, 11557, 0,
    11558, 11558, 20, 11559, 11559, 0, 11560, 11564, 20, 11565,
    11565, 0, 11566, 11567, 20, 11568, 11623, 0, 11624, 11630,
    20, 11631, 11631, 0, 11632, 11646, 21, 11647, 11647, 20,
    11648, 11670, 0, 11671, 11679, 20, 11680, 11686, 0, 11687,
    11687, 20, 11688, 11694, 0, 11695, 11695, 20, 11696, 11702,
    0, 11703, 11703, 20, 11704, 11710, 0, 11711, 11711, 20,
    11712, 11718, 0, 11719, 11719, 20, 11720, 11726, 0, 11727,
    11727, 20, 11728, 11734, 0, 11735, 11735, 20, 11736, 11742,
    0, 11743, 11743, 21, 11744, 11775, 0, 11776, 11822, 20,
    11823, 11823, 0, 11824, 12292, 20, 12293, 12295, 0, 12296,
    12320, 20, 12321, 12329, 21, 12330, 12335, 0, 12336, 12336,
    20, 12337, 12341, 0, 12342, 12343, 20, 12344, 12348, 0,
    12349, 12352, 20, 12353, 12438, 0, 12439, 12440, 21, 12441,
    12442, 0, 12443, 12444, 20, 12445, 12447, 0, 12448, 12448,
    20, 12449, 12538, 0, 12539, 12539, 20, 12540, 12543, 0,
    12544, 12548, 20, 12549, 12589, 0, 12590, 12592, 20, 12593,
    12686, 0, 12687, 12703, 20, 12704, 12730, 0, 12731, 12783,
    20, 12784, 12799, 0, 12800, 13311, 20, 13312, 19893, 0,
    19894, 19967, 20, 19968, 40908, 0, 40909, 40959, 20, 40960,
    42124, 0, 42125, 42191, 20, 42192, 42237, 0, 42238, 42239,
    20, 42240, 42508, 0, 42509, 42511, 20, 42512, 42527, 21,
    42528, 42537, 20, 42538, 42539, 0, 42540, 42559, 20, 42560,
    42606, 21, 42607, 42607, 0, 42608, 42611, 21, 42612, 42621,
    0, 42622, 42622, 20, 42623, 42647, 0, 42648, 42654, 21,
    42655, 42655, 20, 42656, 42735, 21, 42736, 42737, 0, 42738,
    42774, 20, 42775, 42783, 0, 42784, 42785, 20, 42786, 42888,
    0, 42889, 42890, 20, 42891, 42894, 0, 42895, 42895, 20,
    42896, 42899, 0, 42900, 42911, 20, 42912, 42922, 0, 42923,
    42999, 20, 43000, 43009, 21, 43010, 43010, 20, 43011, 43013,
    21, 43014, 43014, 20, 43015, 43018, 21, 43019, 43019, 20,
    43020, 43042, 21, 43043, 43047, 0, 43048, 43071, 20, 43072,
    43123, 0, 43124, 43135, 21, 43136, 43137, 20, 43138, 43187,
    21, 43188, 43204, 0, 43205, 43215, 21, 43216, 43225, 0,
    43226, 43231, 21, 43232, 43249, 20, 43250, 43255, 0, 43256,
    43258, 20, 43259, 43259, 0, 43260, 43263, 21, 43264, 43273,
    20, 43274, 43301, 21, 43302, 43309, 0, 43310, 43311, 20,
    43312, 43334, 21, 43335, 43347, 0, 43348, 43359, 20, 43360,
    43388, 0, 43389, 43391, 21, 43392, 43395, 20, 43396, 43442,
    21, 43443, 43456, 0, 43457, 43470, 20, 43471, 43471, 21,
    43472, 43481, 0, 43482, 43519, 20, 43520, 43560, 21, 43561,
    43574, 0, 43575, 43583, 20, 43584, 43586, 21, 43587, 43587,
    20, 43588, 43595, 21, 43596, 43597, 0, 43598, 43599, 21,
    43600, 43609, 0, 43610, 43615, 20, 43616, 43638, 0, 43639,
    43641, 20, 43642, 43642, 21, 43643, 43643, 0, 43644, 43647,
    20, 43648, 43695, 21, 43696, 43696, 20, 43697, 43697, 21,
    43698, 43700, 20, 43701, 43702, 21, 43703, 43704, 20, 43705,
    43709, 21, 43710, 43711, 20, 43712, 43712, 21, 43713, 43713,
    20, 43714, 43714, 0, 43715, 43738, 20, 43739, 43741, 0,
    43742, 43743, 20, 43744, 43754, 21, 43755, 43759, 0, 43760,
    43761, 20, 43762, 43764, 21, 43765, 43766, 0, 43767, 43776,
    20, 43777, 43782, 0, 43783, 43784, 20, 43785, 43790, 0,
    43791, 43792, 20, 43793, 43798, 0, 43799, 43807, 20, 43808,
    43814, 0, 43815, 43815, 20, 43816, 43822, 0, 43823, 43967,
    20, 43968, 44002, 21, 44003, 44010, 0, 44011, 44011, 21,
    44012, 44013, 0, 44014, 44015, 21, 44016, 44025, 0, 44026,
    44031, 20, 44032, 55203, 0, 55204, 55215, 20, 55216, 55238,
    0, 55239, 55242, 20, 55243, 55291, 0, 55292, 63743, 20,
    63744, 64109, 0, 64110, 64111, 20, 64112, 64217, 0, 64218,
    64255, 20, 64256, 64262, 0, 64263, 64274, 20, 64275, 64279,
    0, 64280, 64284, 20, 64285, 64285, 21, 64286, 64286, 20,
    64287, 64296, 0, 64297, 64297, 20, 64298, 64310, 0, 64311,
    64311, 20, 64312, 64316, 0, 64317, 64317, 20, 64318, 64318,
    0, 64319, 64319, 20, 64320, 64321, 0, 64322, 64322, 20,
    64323, 64324, 0, 64325, 64325, 20, 64326, 64433, 0, 64434,
    64466, 20, 64467, 64829, 0, 64830, 64847, 20, 64848, 64911,
    0, 64912, 64913, 20, 64914, 64967, 0, 64968, 65007, 20,
    65008, 65019, 0, 65020, 65023, 21, 65024, 65039, 0, 65040,
    65055, 21, 65056, 65062, 0, 65063, 65074, 21, 65075, 65076,
    0, 65077, 65100, 21, 65101, 65103, 0, 65104, 65135, 20,
    65136, 65140, 0, 65141, 65141, 20, 65142, 65276, 0, 65277,
    65295, 21, 65296, 65305, 0, 65306, 65312, 20, 65313, 65338,
    0, 65339, 65342, 21, 65343, 65343, 0, 65344, 65344, 20,
    65345, 65370, 0, 65371, 65381, 20, 65382, 65470, 0, 65471,
    65473, 20, 65474, 65479, 0, 65480, 65481, 20, 65482, 65487,
    0, 65488, 65489, 20, 65490, 65495, 0, 65496, 65497, 20,
    65498, 65500, 0, 65501, Infinity,
];
var jjlexisEnd2 = [
    0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1,
];
var jjlexhasArc2 = [
    1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1,
    1, 1, 1, 0, 1, 1, 0,
];
var jjlextable2 = {
    pnext: jjlexpnext2,
    disnext: jjlexdisnext2,
    checknext: jjlexchecknext2,
    maxAsicii: 255,
    classTable: jjlexclassTable2,
    unicodeClassTable: jjlexunicodeClassTable2,
    isEnd: jjlexisEnd2,
    hasArc: jjlexhasArc2
};
var jjlexpnext3 = [
    1, 1,
];
var jjlexdisnext3 = [
    1, 0,
];
var jjlexchecknext3 = [
    1, 0,
];
var jjlexclassTable3 = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
];
var jjlexunicodeClassTable3 = [
    0, 256, Infinity,
];
var jjlexisEnd3 = [
    0, 1,
];
var jjlexhasArc3 = [
    1, 1,
];
var jjlextable3 = {
    pnext: jjlexpnext3,
    disnext: jjlexdisnext3,
    checknext: jjlexchecknext3,
    maxAsicii: 255,
    classTable: jjlexclassTable3,
    unicodeClassTable: jjlexunicodeClassTable3,
    isEnd: jjlexisEnd3,
    hasArc: jjlexhasArc3
};
var jjdfaTables = [
    jjlextable0,
    jjlextable1,
    jjlextable2,
    jjlextable3,
];
function jjfindUnicodeClass(uc, c) {
    for (var i = 0; i < uc.length; i += 3) {
        if (c >= uc[i + 1] && c <= uc[i + 2]) {
            return uc[i];
        }
        else if (c < uc[i + 1]) {
            return -1;
        }
    }
    return -1;
}
var jjlexTokens0 = [
    -1, -1, -1, -1, 1, -1, -1, 23, 24, 29,
    30, 38, 31, -1, 32, 34, 22, 25, 21, 28,
    26, 27, 37, 3, 36, 4, 1, -1, 2, -1,
    -1, 1, 1, 1, 1, 35, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, 2, -1, -1,
    -1, 33, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, 6, -1, -1, -1, -1, -1, -1, -1, 11,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    17, -1, 8, -1, -1, -1, 16, -1, -1, 15,
    -1, 14, -1, -1, -1, 20, -1, -1, -1, 9,
    7, -1, 12, 19, -1, 5, 18, -1, -1, -1,
    10, 13,
];
var jjlexTokens1 = [
    -1, 39, -1, 3, 4, -1, 39, 40,
];
var jjlexTokens2 = [
    -1, 39, 39, -1, 3, 4, -1, 39, 41, -1,
    39, 39, 39, 39, 40, 39, 39, 39, 39, 39,
    39, 39, 39, 39, 39, 39, 39, 42, 39, 39,
    39, 39, 39, 44, 39, 39, 43,
];
var jjlexTokens3 = [
    -1, 45,
];
var jjtokenCount = 46;
var jjactERR = 209;
var jjpact = [
    9, 7, 15, 16, 17, 18, -137, 10, 11, -44,
    12, -135, 13, 14, 171, 135, 187, 188, 186, 135,
    132, 133, 99, 134, 132, 133, 75, 134, 76, -121,
    5, 170, -42, -120, 169, 167, 208, -95, 168, 113,
    -44, 175, 176, 177, 178, 179, 180, 175, 176, 177,
    178, 179, 180, -57, 206, -95, -57, -95, -58, 112,
    105, -58, 110, 113, 71, 72, 27, 113, -57, 71,
    72, 27, 113, -58, 182, 117, 66, 81, 56, 107,
    79, 55, 204, 112, 203, 146, 200, 112, 199, 118,
    50, 51, 112, 67, 160, 197, 195, 194, 160, 192,
    191, 145, 173, 172, 164, 163, 129, 150, 149, 148,
    147, 143, -44, 139, 138, 137, 107, 129, 107, 126,
    -102, 124, 123, 121, 120, 119, 114, 103, 102, 97,
    93, 91, 90, 86, 85, 84, 83, 78, 74, 68,
    61, 59, 58, 54, 52, 48, 47, 46, 44, 41,
    22, 36, 34, 28, 22, 4,
];
var jjdisact = [
    -46, 155, -5, -46, 153, -46, -46, 70, 150, -46,
    -46, -46, -46, 150, 129, -46, -46, -46, 149, -46,
    -46, -46, 127, 65, -46, -46, -46, -46, -46, 145,
    -46, -46, -46, -46, 125, 145, 110, -46, 58, 141,
    142, -46, 77, -46, -46, 141, 120, 95, -46, -46,
    -46, -46, 55, -46, -46, 114, 30, 117, -46, -46,
    -46, -8, -46, 126, 76, -46, 135, 133, 130, -46,
    -46, -46, 130, -46, -46, -46, 118, 108, -46, -46,
    -46, 108, -46, -46, -46, -46, -46, 113, 21, -46,
    127, 102, 59, 25, -46, 6, 61, -46, 101, 37,
    51, -46, 103, 103, 91, -46, -46, 118, -46, -46,
    -46, 120, -46, 119, -46, -46, -46, 118, 98, 85,
    96, -46, -46, 94, 113, -46, 92, -46, 109, 90,
    -46, 109, -46, 108, 106, -46, -46, -46, -46, -46,
    81, -46, 74, -46, -46, -6, -46, -46, -46, -10,
    -46, 102, -46, 68, 37, -46, 12, 65, -46, 71,
    -46, 47, -46, -46, -46, -12, -46, 64, 99, 76,
    -46, 96, 95, -46, -46, -46, -46, -46, -46, -46,
    93, -46, -46, 32, -46, -46, -46, -46, 71, 92,
    67, 84, -46, -46, -46, 8, -46, 57, -46, 58,
    -46, 50, -46, -46, 2, -46, 32, -46,
];
var jjcheckact = [
    2, 2, 2, 2, 2, 2, 204, 2, 2, 95,
    2, 195, 2, 2, 156, 149, 165, 165, 165, 145,
    149, 149, 88, 149, 145, 145, 61, 145, 61, 93,
    2, 156, 95, 56, 156, 156, 206, 88, 156, 99,
    99, 204, 204, 204, 204, 204, 204, 195, 195, 195,
    195, 195, 195, 183, 201, 88, 183, 88, 154, 99,
    92, 154, 96, 96, 93, 93, 23, 23, 183, 56,
    56, 7, 7, 154, 161, 100, 52, 64, 42, 92,
    64, 42, 199, 96, 197, 161, 191, 23, 190, 100,
    38, 38, 7, 52, 189, 188, 180, 172, 171, 169,
    168, 167, 159, 157, 153, 151, 142, 140, 134, 133,
    131, 129, 128, 126, 124, 123, 120, 119, 118, 117,
    113, 111, 107, 104, 103, 102, 98, 91, 90, 87,
    81, 77, 76, 72, 68, 67, 66, 63, 57, 55,
    47, 46, 45, 40, 39, 36, 35, 34, 29, 22,
    18, 14, 13, 8, 4, 1,
];
var jjdefred = [
    4, -1, -1, 0, -1, 3, 5, -1, -1, 112,
    112, 112, 112, -1, -1, 19, 20, 21, 1, 80,
    81, 82, 29, 7, 23, 24, 25, 27, 9, -1,
    10, 11, 112, 13, 14, -1, -1, 79, -1, -1,
    -1, 22, -1, 116, 12, -1, -1, 17, 88, 84,
    85, 33, -1, 30, 8, -1, 113, -1, 16, 2,
    18, -1, 87, 91, 38, 28, -1, -1, -1, 115,
    117, 118, -1, 15, 83, 88, 97, -1, 6, 32,
    34, -1, 31, 26, 114, 116, 86, 107, 99, 95,
    -1, -1, 54, 119, 89, 108, -1, 96, 100, 41,
    -1, 93, -1, -1, -1, 52, 54, -1, 109, 110,
    111, -1, 106, 98, 103, 104, 90, -1, 54, 40,
    54, 53, 121, -1, -1, 92, -1, 36, 41, -1,
    46, -1, 48, -1, -1, 51, 105, 102, 35, 39,
    -1, 122, 40, 60, 71, 122, 47, 49, 50, 122,
    44, -1, 37, 55, 60, 59, -1, 73, 76, 77,
    45, -1, 123, 60, 58, 65, 54, 72, -1, -1,
    70, -1, -1, 126, 128, 129, 130, 131, 132, 133,
    -1, 42, 127, 60, 61, 62, 63, 64, -1, 74,
    -1, -1, 75, 78, 135, 124, 66, -1, 68, -1,
    127, -1, 67, 69, 134, 125, -1, 137,
];
var jjpgoto = [
    5, 165, 173, 180, 7, 206, 201, 160, 173, 180,
    108, 140, 141, 161, 130, 115, 140, 141, 99, 97,
    68, 39, 69, 72, 23, 24, 164, 156, 184, 164,
    156, 110, 69, 72, 107, 103, 105, 143, 94, 95,
    76, 48, 41, 22, 195, 192, 135, 151, 114, 197,
    157, 158, 189, 135, 151, 139, 140, 141, 127, 87,
    88, 79, 204, 81, 200, 152, 124, 25, 129, 105,
    143, 126, 105, 143, 121, 143, 100, 91, 86, 63,
    64, 59, 52, 38, 25, 36, 34, 32, 29, 18,
    19, 20, 1, 182, 2, 188, 143, 183, 155, 156,
    153, 154, 155, 156, 150, 151, 93, 61, 62, 63,
    56, 44, 29, 42, 31, 29, 30, 29, 28, 29,
    -1, 37, 20,
];
var jjdisgoto = [
    91, -71, -4, -71, 52, -71, 38, 15, -71, 63,
    61, 59, 32, -71, 80, -71, -71, -71, 83, -71,
    -71, 43, 9, 32, -71, -71, -71, 102, -71, -71,
    -71, -71, 56, -71, -71, -71, -71, -71, 0, -71,
    69, -71, -71, 52, -71, -71, -71, 74, 65, -71,
    -71, 66, -71, -71, -71, -71, -37, -71, -71, -71,
    -71, -71, -71, -5, 46, -71, -71, -71, -71, -71,
    -71, -71, -71, -71, -71, 35, 12, -71, -71, -71,
    61, -71, -71, -71, -71, 48, -71, -15, -31, -71,
    30, -71, 11, -27, -71, -9, -21, -71, -71, -4,
    -71, -71, -71, -71, -71, -71, 49, -71, -71, -71,
    -71, -71, -71, 15, -71, -71, -71, -71, 47, 40,
    44, -71, -71, -71, -71, -71, -71, -71, 36, -71,
    -71, -71, -71, -71, -71, -71, -71, -71, -71, -71,
    -71, 42, 47, 73, -71, -16, -71, -71, -71, -9,
    -71, -71, -71, -71, 0, -71, -31, -71, -71, -71,
    -71, -71, 29, 69, -71, -3, 70, 19, -71, -71,
    -71, 9, -71, -71, -71, -71, -71, -71, -71, -71,
    -71, -71, -22, -3, -71, -71, -71, -71, -71, 15,
    -71, -71, -71, -71, -5, -59, -71, -71, -71, -71,
    -4, -71, -71, -71, -65, -71, -71, -71,
];
var jjruleLen = [
    2, 0, 6, 2, 0, 0, 6, 2, 4, 2,
    2, 2, 3, 2, 2, 4, 3, 0, 1, 1,
    1, 1, 2, 1, 1, 1, 4, 0, 3, 0,
    1, 3, 2, 0, 0, 6, 5, 7, 0, 2,
    0, 0, 4, 0, 2, 3, 1, 2, 1, 2,
    2, 1, 1, 2, 0, 2, 3, 1, 2, 1,
    0, 3, 1, 1, 1, 0, 3, 4, 3, 4,
    1, 1, 0, 1, 0, 3, 1, 1, 3, 2,
    1, 1, 0, 5, 1, 1, 3, 1, 0, 4,
    4, 0, 3, 1, 1, 1, 2, 0, 2, 0,
    1, 0, 4, 2, 2, 3, 1, 0, 1, 2,
    2, 2, 0, 0, 5, 2, 0, 1, 1, 0,
    0, 5, 0, 0, 0, 6, 2, 0, 1, 1,
    1, 1, 1, 1, 0, 0, 0, 6,
];
var jjlhs = [
    0, 2, 1, 3, 3, 5, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 6, 6, 7, 7, 8,
    8, 8, 9, 9, 10, 10, 11, 11, 12, 12,
    13, 13, 14, 14, 16, 15, 15, 15, 17, 18,
    18, 20, 19, 21, 19, 22, 22, 23, 23, 23,
    23, 23, 24, 24, 26, 25, 27, 27, 28, 28,
    30, 29, 31, 31, 31, 31, 32, 32, 32, 32,
    32, 33, 33, 34, 34, 35, 35, 36, 36, 37,
    37, 38, 40, 39, 41, 41, 42, 42, 44, 43,
    45, 45, 46, 46, 47, 47, 48, 48, 49, 49,
    50, 51, 50, 50, 50, 52, 52, 53, 53, 53,
    54, 54, 56, 57, 55, 58, 58, 59, 59, 60,
    61, 59, 63, 64, 65, 62, 66, 66, 67, 67,
    67, 67, 67, 67, 68, 69, 70, 67,
];
var jjtokenNames = [
    "EOF", "NAME", "STRING",
    "OPEN_BLOCK", "CLOSE_BLOCK", "OPT_DIR",
    "LEX_DIR", "TOKEN_DIR", "LEFT_DIR",
    "RIGHT_DIR", "NONASSOC_DIR", "USE_DIR",
    "HEADER_DIR", "EXTRA_ARG_DIR", "EMPTY",
    "TYPE_DIR", "PREC_DIR", "INIT_DIR",
    "OUTPUT_DIR", "IMPORT_DIR", "LEAST_DIR",
    "GT", "LT", "BRA",
    "KET", "EQU", "CBRA",
    "CKET", "QUESTION", "STAR",
    "PLUS", "DASH", "COLON",
    "ARROW", "EOL", "SEPERATOR",
    "OR", "WEDGE", "COMMA",
    "ANY_CODE", "ESCAPED_CHAR_IN_BLOCK", "LHS_REF",
    "TOKEN_REF", "MATCHED", "EMIT_TOKEN",
    "ANY_EPLOGUE_CODE",
];
var jjtokenAlias = [
    null, null, null,
    "{", "}", "%option",
    "%lex", "%token", "%left",
    "%right", "%nonassoc", "%use",
    "%header", "%extra_arg", "%empty",
    "%type", "%prec", "%init",
    "%output", "%import", "%least",
    ">", "<", "(",
    ")", "=", "[",
    "]", "?", "*",
    "+", "-", ":",
    "=>", ";", "%%",
    "|", "^", ",",
    null, null, "$$",
    "$token", "$matched", null,
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
    var jjsematicS;
    var jjsematicVal;
    var jjemittedTokens;
    var jjstop;
    var jjhandlers = {};
    var gb;
    var assoc;
    var lexact;
    var ruleLhs;
    var least;
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
        jjemittedTokens = [];
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
        jjemit('token', jjtoken);
        jjconsumeTokens(jjtoken);
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
                jjsetImg("");
                break;
            case 4:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 23:
                {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 25:
                {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 26:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 28:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                    jjsematicVal.val = unescape(jjsematicVal.val.substr(1, jjsematicVal.val.length - 2));
                }
                break;
            case 30:
                jjsetImg("");
                break;
            case 31:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 32:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 33:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 34:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 47:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                    jjsematicVal.val = unescape(jjsematicVal.val.substr(1, jjsematicVal.val.length - 2));
                }
                break;
            case 50:
                jjsetImg("");
                break;
            case 93:
                jjsetImg("");
                break;
            default: ;
        }
    }
    function jjdoLexAction1(jjstaten) {
        var jjtk = jjlexTokens1[jjstaten];
        jjtk !== -1 && jjprepareToken(jjtk);
        switch (jjstaten) {
            case 1:
                {
                    jjsematicVal = newNode(jjtoken.val);
                }
                break;
            case 3:
                {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 4:
                {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 6:
                {
                    jjsematicVal = newNode(jjtoken.val);
                }
                break;
            case 7:
                {
                    jjsematicVal = newNode(jjtoken.val.charAt(1));
                }
                break;
            default: ;
        }
    }
    function jjdoLexAction2(jjstaten) {
        var jjtk = jjlexTokens2[jjstaten];
        jjtk !== -1 && jjprepareToken(jjtk);
        switch (jjstaten) {
            case 1:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 2:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 4:
                {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 5:
                {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 7:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 10:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 11:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 12:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 13:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 14:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                    jjsematicVal.val = jjsematicVal.val.charAt(1);
                }
                break;
            case 15:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 16:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 17:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 18:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 19:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 20:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 21:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 22:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 23:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 24:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 25:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 26:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 28:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 29:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 30:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 31:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 32:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 33:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                    jjsematicVal.val = jjsematicVal.val.substr(6, jjsematicVal.val.length - 7);
                }
                break;
            case 34:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 35:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            default: ;
        }
    }
    function jjdoLexAction3(jjstaten) {
        var jjtk = jjlexTokens3[jjstaten];
        jjtk !== -1 && jjprepareToken(jjtk);
        switch (jjstaten) {
            case 1:
                {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
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
            case 3:
                jjdoLexAction3(state);
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
        c === jjeol ? (jjline++, jjcolumn = 0) : (jjcolumn += c > 0xff ? 2 : 1);
        jjmatched += String.fromCharCode(c);
        jjmarker.state !== -1 && (jjbackupCount++);
        return true;
    }
    function jjacceptChar(ccode) {
        var lexstate = jjlexState[jjlexState.length - 1];
        var ltable = jjdfaTables[lexstate];
        var isEnd = ltable.isEnd[jjstate] === 1;
        var hasArc = ltable.hasArc[jjstate] === 1;
        var cl = ccode < ltable.maxAsicii ? ltable.classTable[ccode] : jjfindUnicodeClass(ltable.unicodeClassTable, ccode);
        var nstate = -1;
        if (cl !== -1) {
            var ind = ltable.disnext[jjstate] + cl;
            if (ind >= 0 && ind < ltable.pnext.length && ltable.checknext[ind] === jjstate) {
                nstate = ltable.pnext[ind];
            }
        }
        if (isEnd) {
            if (hasArc) {
                if (nstate === -1) {
                    jjdoLexAction(lexstate, jjstate);
                    jjmarker.state = -1;
                    jjbackupCount = 0;
                    jjstate = 0;
                    return false;
                }
                else {
                    jjmark();
                    jjstate = nstate;
                    return jjconsume(ccode);
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
            if (nstate === -1) {
                if (jjmarker.state !== -1) {
                    var s = jjrollback();
                    jjdoLexAction(lexstate, jjstate);
                    jjstate = 0;
                    accept(s);
                    return false;
                }
                else {
                    jjemit('lexicalerror', String.fromCharCode(ccode), jjline, jjcolumn);
                    return true;
                }
            }
            else {
                jjstate = nstate;
                return jjconsume(ccode);
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
            var ltable = jjdfaTables[lexstate];
            var isEnd = ltable.isEnd[jjstate];
            if (isEnd) {
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
            jjacceptChar(s.charCodeAt(i)) && i++;
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
                jjlexState.push(3);
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
                    gb.lexBuilder.end(lexact, least, '(untitled)');
                }
                break;
            case 37:
                var tn = jjsematicS[jjsp - 5];
                {
                    var tdef = gb.defToken(tn, gb.lexBuilder.getPossibleAlias());
                    lexact.returnToken(tdef);
                    gb.lexBuilder.end(lexact, least, tn.val);
                }
                break;
            case 38:
                {
                    gb.lexBuilder.newState();
                }
                break;
            case 40:
                {
                    lexact = new LexAction();
                }
                break;
            case 41:
                {
                    lexact = new LexAction();
                }
                break;
            case 43:
                {
                    lexact = new LexAction();
                }
                break;
            case 47:
                var vn = jjsematicS[jjsp - 1];
                {
                    gb.addPushStateAction(lexact, vn);
                    lexact.raw('; ');
                }
                break;
            case 48:
                {
                    lexact.popState();
                    lexact.raw('; ');
                }
                break;
            case 49:
                var sn = jjsematicS[jjsp - 1];
                {
                    gb.addSwitchToStateAction(lexact, sn);
                    lexact.raw('; ');
                }
                break;
            case 50:
                var s = jjsematicS[jjsp - 1];
                {
                    lexact.setImg(s.val);
                    lexact.raw('; ');
                }
                break;
            case 52:
                {
                    least = false;
                }
                break;
            case 53:
                {
                    least = true;
                }
                break;
            case 54:
                {
                    gb.lexBuilder.enterUnion();
                }
                break;
            case 55:
                {
                    gb.lexBuilder.leaveUnion();
                }
                break;
            case 56:
                {
                    gb.lexBuilder.endUnionItem();
                }
                break;
            case 57:
                {
                    gb.lexBuilder.endUnionItem();
                }
                break;
            case 60:
                {
                    gb.lexBuilder.enterSimple();
                }
                break;
            case 61:
                var suffix = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.simplePostfix(suffix.val);
                }
                break;
            case 62:
                {
                    jjtop = newNode('+');
                }
                break;
            case 63:
                {
                    jjtop = newNode('?');
                }
                break;
            case 64:
                {
                    jjtop = newNode('*');
                }
                break;
            case 65:
                {
                    jjtop = newNode('');
                }
                break;
            case 68:
                var n = jjsematicS[jjsp - 2];
                {
                    gb.lexBuilder.addVar(n);
                }
                break;
            case 69:
                var i = jjsematicS[jjsp - 2];
                {
                    gb.lexBuilder.importVar(i);
                }
                break;
            case 70:
                var s = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.addString(s.val);
                }
                break;
            case 71:
                {
                    gb.lexBuilder.beginSet(true);
                }
                break;
            case 72:
                {
                    gb.lexBuilder.beginSet(false);
                }
                break;
            case 77:
                var s = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.addSetItem(s, s);
                }
                break;
            case 78:
                var from = jjsematicS[jjsp - 3];
                var to = jjsematicS[jjsp - 1];
                {
                    gb.lexBuilder.addSetItem(from, to);
                }
                break;
            case 82:
                var n = jjsematicS[jjsp - 1];
                {
                    ruleLhs = n;
                }
                break;
            case 88:
                {
                    gb.prepareRule(ruleLhs);
                }
                break;
            case 89:
                {
                    gb.commitRule();
                }
                break;
            case 92:
                var vn = jjsematicS[jjsp - 1];
                {
                    gb.addRuleUseVar(vn);
                }
                break;
            case 93:
                var vn = jjsematicS[jjsp - 1];
                {
                    gb.addRuleUseVar(vn);
                }
                break;
            case 98:
                var itn = jjsematicS[jjsp - 2];
                {
                    gb.addRuleSematicVar(itn);
                }
                break;
            case 100:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.addRuleItem(t, TokenRefType.NAME);
                }
                break;
            case 101:
                var vn = jjsematicS[jjsp - 2];
                {
                    gb.addRuleSematicVar(vn);
                }
                break;
            case 102:
                var vn = jjsematicS[jjsp - 4];
                var t = jjsematicS[jjsp - 1];
                {
                    gb.addRuleItem(t, TokenRefType.NAME);
                }
                break;
            case 103:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.addRuleItem(t, t.ext);
                }
                break;
            case 104:
                {
                    gb.addAction(lexact);
                }
                break;
            case 105:
                var t = jjsematicS[jjsp - 2];
                {
                    jjtop = t;
                    jjtop.ext = TokenRefType.TOKEN;
                }
                break;
            case 106:
                {
                    jjtop.ext = TokenRefType.STRING;
                }
                break;
            case 109:
                {
                    gb.addAction(lexact);
                }
                break;
            case 110:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.defineRulePr(t, TokenRefType.NAME);
                }
                break;
            case 111:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.defineRulePr(t, t.ext);
                }
                break;
            case 112:
                jjlexState.push(1);
                break;
            case 113:
                var open = jjsematicS[jjsp - 2];
                var bl = jjsematicS[jjsp - 1];
                jjlexState.pop();
                break;
            case 114:
                var open = jjsematicS[jjsp - 4];
                var bl = jjsematicS[jjsp - 3];
                var close = jjsematicS[jjsp - 1];
                {
                    jjtop = nodeBetween(open, close, bl.val);
                }
                break;
            case 115:
                var b = jjsematicS[jjsp - 1];
                {
                    jjtop.val += b.val;
                }
                break;
            case 116:
                {
                    jjtop = newNode('');
                }
                break;
            case 119:
                jjlexState.push(1);
                break;
            case 120:
                var b = jjsematicS[jjsp - 1];
                jjlexState.pop();
                break;
            case 121:
                var b = jjsematicS[jjsp - 3];
                {
                    jjtop = newNode('');
                    jjtop.val = '{' + b.val + '}';
                }
                break;
            case 122:
                jjlexState.push(2);
                break;
            case 123:
                var open = jjsematicS[jjsp - 1];
                {
                    lexact.beginBlock(open);
                }
                break;
            case 124:
                var open = jjsematicS[jjsp - 3];
                var t = jjsematicS[jjsp - 2];
                jjlexState.pop();
                break;
            case 125:
                var open = jjsematicS[jjsp - 5];
                var t = jjsematicS[jjsp - 4];
                var close = jjsematicS[jjsp - 1];
                {
                    lexact.endBlock(close);
                }
                break;
            case 128:
                var c = jjsematicS[jjsp - 1];
                {
                    lexact.raw(c.val);
                }
                break;
            case 129:
                var c = jjsematicS[jjsp - 1];
                {
                    lexact.raw(c.val);
                }
                break;
            case 130:
                {
                    lexact.lhs();
                }
                break;
            case 131:
                {
                    lexact.tokenObj();
                }
                break;
            case 132:
                {
                    lexact.matched();
                }
                break;
            case 133:
                var t = jjsematicS[jjsp - 1];
                {
                    gb.addEmitTokenAction(lexact, t);
                }
                break;
            case 134:
                jjlexState.push(2);
                break;
            case 135:
                {
                    lexact.raw('{');
                }
                break;
            case 136:
                jjlexState.pop();
                break;
            case 137:
                {
                    lexact.raw('}');
                }
                break;
        }
        jjlrState.length -= jjruleLen[jjrulenum];
        var jjcstate = jjlrState[jjlrState.length - 1];
        jjlrState.push(jjpgoto[jjdisgoto[jjcstate] + jjnt]);
        jjsematicS.length -= jjruleLen[jjrulenum];
        jjsematicS.push(jjtop);
    }
    function jjconsumeTokens(t) {
        if (t !== null) {
            while (!jjstop && !jjacceptToken(jjtoken))
                ;
        }
        while (!jjstop && jjemittedTokens.length > 0) {
            jjacceptToken(new Token(jjemittedTokens[0], null, 0, 0, 0, 0)) && jjemittedTokens.shift();
        }
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
    function printTable(tname, type, t, align, lc, mapper) {
        var count = 1;
        echoLine("");
        echo("var ");
        echo(prefix + tname + ts(': ' + type + '[]'));
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
    echoLine("");
    echoLine("/*");
    echoLine("    constants");
    echoLine("*/");
    echo("var ");
    echo(prefix);
    echo("eol = '\\n'.charCodeAt(0);");
    if (ists) {
        echoLine("");
        echoLine("interface DFATable{");
        echoLine("    pnext: number[];");
        echoLine("    disnext: number[];");
        echoLine("    checknext: number[];");
        echoLine("    maxAsicii: number;");
        echoLine("    classTable: number[];");
        echoLine("    unicodeClassTable: number[];");
        echoLine("    isEnd: number[];");
        echoLine("    hasArc: number[];");
        echo("};");
    }
    var dfaTables = input.file.dfaTables;
    function printDFATable(t, n) {
        function tn(s) {
            return prefix + s + String(n);
        }
        printTable('lexpnext' + n, 'number', t.pnext, 6, 10, function (a) { return a === null ? '-1' : String(a.to.index); });
        printTable('lexdisnext' + n, 'number', t.disnext, 6, 10, function (a) { return String(a); });
        printTable('lexchecknext' + n, 'number', t.checknext, 6, 10, function (a) { return String(a); });
        printTable('lexclassTable' + n, 'number', t.classTable, 6, 10, function (a) { return String(a); });
        printTable('lexunicodeClassTable' + n, 'number', t.unicodeClassTable, 6, 10, function (a) { return String(a); });
        printTable('lexisEnd' + n, 'number', t.states, 1, 15, function (a) { return a.endAction === null ? '0' : '1'; });
        printTable('lexhasArc' + n, 'number', t.states, 1, 15, function (a) { return a.arcs.length === 0 ? '0' : '1'; });
        echoLine("");
        echo("var ");
        echo(prefix);
        echo("lextable");
        echo(String(n) + ts(': DFATable'));
        echoLine(" = {");
        echo("    pnext: ");
        echo(tn('lexpnext'));
        echoLine(",");
        echo("    disnext: ");
        echo(tn('lexdisnext'));
        echoLine(",");
        echo("    checknext: ");
        echo(tn('lexchecknext'));
        echoLine(",");
        echo("    maxAsicii: ");
        echo(t.maxAsicii);
        echoLine(",");
        echo("    classTable: ");
        echo(tn('lexclassTable'));
        echoLine(",");
        echo("    unicodeClassTable: ");
        echo(tn('lexunicodeClassTable'));
        echoLine(",");
        echo("    isEnd: ");
        echo(tn('lexisEnd'));
        echoLine(",");
        echo("    hasArc: ");
        echo(tn('lexhasArc'));
        echoLine("");
        echo("};");
    }
    echoLine("");
    echoLine("/*");
    echoLine("    dfa table definations");
    echo("*/");
    for (var i = 0, _a = dfaTables; i < _a.length; i++) {
        printDFATable(_a[i], i);
    }
    echoLine("");
    echoLine("/*");
    echoLine("    dfa tables");
    echoLine("*/");
    echo("var ");
    echo(prefix);
    echo("dfaTables");
    echo(ts(': DFATable[]'));
    echo(" = [");
    for (var i = 0; i < dfaTables.length; i++) {
        echoLine("");
        echo("    ");
        echo(prefix);
        echo("lextable");
        echo(i);
        echo(",");
    }
    echoLine("");
    echoLine("];");
    echoLine("/*");
    echoLine("    find unicode class");
    echoLine("*/");
    echo("function ");
    echo(prefix);
    echo("findUnicodeClass(uc");
    echo(ts(": number[]"));
    echo(", c");
    echo(ts(": number"));
    echoLine("){");
    echoLine("    for(var i = 0; i < uc.length; i += 3){");
    echoLine("        if(c >= uc[i + 1] && c <= uc[i + 2]){");
    echoLine("            return uc[i];");
    echoLine("        }");
    echoLine("        else if(c < uc[i + 1]){");
    echoLine("            return -1;");
    echoLine("        }");
    echoLine("    }");
    echoLine("    return -1;");
    echoLine("}");
    echoLine("/*");
    echoLine("    tokens that a lexical dfa state can return");
    echo("*/");
    for (var i = 0, _a = dfaTables; i < _a.length; i++) {
        printTable('lexTokens' + i, 'number', _a[i].states, 6, 10, function (s) {
            return s.endAction === null || s.endAction.data.token === null ? '-1' : String(s.endAction.data.token.index);
        });
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
    printTable('pact', 'number', pt.pact, 6, 10, function (t) {
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
    printTable('disact', 'number', pt.disact, 6, 10, function (t) { return t.toString(); });
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
    printTable('checkact', 'number', pt.checkact, 6, 10, function (t) { return t === undefined ? '0' : t.toString(); });
    echoLine("");
    echoLine("/*");
    echo("    default action table. action = ");
    echo(prefix);
    echoLine("defred[STATE-NUM],");
    echoLine("    where action is the number of the rule to reduce with.");
    echo("*/");
    printTable('defred', 'number', pt.defred, 6, 10, function (t) { return t.toString(); });
    echoLine("");
    echoLine("/*");
    echo("    compressed goto table: goto = ");
    echo(prefix);
    echo("pgoto[");
    echo(prefix);
    echoLine("disgoto[STATE-NUM] + NON_TERMINAL]");
    echo("*/");
    printTable('pgoto', 'number', pt.pgoto, 6, 10, function (t) {
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
    printTable('disgoto', 'number', pt.disgoto, 6, 10, function (t) { return t.toString(); });
    echoLine("");
    echoLine("/*");
    echo("    length of each rule: rule length = ");
    echo(prefix);
    echoLine("ruleLen[RULE-NUM]");
    echo("*/");
    printTable('ruleLen', 'number', pt.g.rules, 6, 10, function (r) { return r.rhs.length.toString(); });
    echoLine("");
    echoLine("/*");
    echoLine("    index of the LHS of each rule");
    echo("*/");
    printTable('lhs', 'number', pt.g.rules, 6, 10, function (r) { return r.lhs.index.toString(); });
    echoLine("");
    echoLine("/*");
    echoLine("    token names");
    echo("*/");
    printTable('tokenNames', 'string', pt.g.tokens, 20, 3, function (t) { return "\"" + t.sym.replace(/"/g, '\\"') + "\""; });
    echoLine("");
    echoLine("/*");
    echoLine("    token alias");
    echo("*/");
    printTable('tokenAlias', 'string', pt.g.tokens, 20, 3, function (t) { return t.alias ? "\"" + t.alias.replace(/"/g, '\\"') + "\"" : "null"; });
    var className = getOpt('className', 'Parser');
    echoLine("");
    function printLexActionsFunc(dfa, n) {
        var codegen = {
            raw: function (s) {
                echo(s);
            },
            beginBlock: function (pos) {
                echo('{');
            },
            endBlock: function (pos) {
                echo('}');
            },
            pushLexState: function (n) {
                echo(prefix + "lexState.push(" + n + ")");
            },
            switchToLexState: function (n) {
                echo(prefix + "lexState[" + prefix + "lexState.length - 1] = " + n);
            },
            popLexState: function () {
                echo(prefix + "lexState.pop()");
            },
            setImg: function (n) {
                echo(prefix + "setImg(\"" + n + "\")");
            },
            tokenObj: function () {
                echo(prefix + 'token');
            },
            matched: function () {
                echo(prefix + 'matched');
            },
            lhs: function () {
                echo(prefix + "sematicVal");
            },
            emitToken: function (tid) {
                echo(prefix + "emittedTokens.push(" + tid + ")");
            }
        };
        var statevn = prefix + 'staten';
        echoLine("");
        echo("    function ");
        echo(prefix);
        echo("doLexAction");
        echo(n);
        echo("(");
        echo(statevn + ts(": number"));
        echoLine("){");
        echo("        var ");
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
            if (_a[i].endAction !== null && _a[i].endAction.data.actions.length > 0) {
                echoLine("");
                echo("            case ");
                echo(i);
                echo(":");
                echoLine('');
                echo('                ');
                _a[i].endAction.data.toCode(codegen);
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
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("sematicVal");
    echo(ts(': ' + stype));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("emittedTokens");
    echo(ts(": number[]"));
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
    echo("        ");
    echo(prefix);
    echoLine("emittedTokens = [];");
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
    echoLine("token);");
    echo("        ");
    echo(prefix);
    echo("consumeTokens(");
    echo(prefix);
    echoLine("token);");
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
    for (var i = 0, _a = dfaTables; i < _a.length; i++) {
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
    for (var i = 0; i < dfaTables.length; i++) {
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
    echo("        var ret = ");
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
    echo(ts(": number"));
    echoLine("){");
    echo("        c === ");
    echo(prefix);
    echo("eol ? (");
    echo(prefix);
    echo("line++, ");
    echo(prefix);
    echo("column = 0) : (");
    echo(prefix);
    echoLine("column += c > 0xff ? 2 : 1);");
    echo("        ");
    echo(prefix);
    echoLine("matched += String.fromCharCode(c);");
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
    echo("acceptChar(ccode");
    echo(ts(": number"));
    echoLine("){");
    echo("        var lexstate = ");
    echo(prefix);
    echo("lexState[");
    echo(prefix);
    echoLine("lexState.length - 1];");
    echo("        var ltable = ");
    echo(prefix);
    echoLine("dfaTables[lexstate];");
    echo("        var isEnd = ltable.isEnd[");
    echo(prefix);
    echoLine("state] === 1;");
    echo("        var hasArc = ltable.hasArc[");
    echo(prefix);
    echoLine("state] === 1;");
    echoLine("        // get the class of the given character");
    echo("        var cl = ccode < ltable.maxAsicii ? ltable.classTable[ccode] : ");
    echo(prefix);
    echoLine("findUnicodeClass(ltable.unicodeClassTable, ccode);");
    echoLine("        // find the next state to go");
    echoLine("        var nstate = -1;");
    echoLine("        if(cl !== -1){");
    echo("            var ind = ltable.disnext[");
    echo(prefix);
    echoLine("state] + cl;");
    echo("            if(ind >= 0 && ind < ltable.pnext.length && ltable.checknext[ind] === ");
    echo(prefix);
    echoLine("state){");
    echoLine("                nstate = ltable.pnext[ind];");
    echoLine("            }");
    echoLine("        }");
    echoLine("        if(isEnd){");
    echoLine("            // if current state is a terminate state, be careful");
    echoLine("            if(hasArc){");
    echoLine("                if(nstate === -1){");
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
    echoLine("state = nstate;");
    echo("                    return ");
    echo(prefix);
    echoLine("consume(ccode);");
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
    echoLine("            if(nstate === -1){");
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
    echo("emit('lexicalerror', String.fromCharCode(ccode), ");
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
    echoLine("state = nstate;");
    echoLine("                // character consumed");
    echo("                return ");
    echo(prefix);
    echoLine("consume(ccode);");
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
    echo("            var lexstate = ");
    echo(prefix);
    echo("lexState[");
    echo(prefix);
    echoLine("lexState.length - 1];");
    echo("            var ltable = ");
    echo(prefix);
    echoLine("dfaTables[lexstate];");
    echo("            var isEnd = ltable.isEnd[");
    echo(prefix);
    echoLine("state];");
    echoLine("            if(isEnd){");
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
    echo("                var s = ");
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
    echo("        for(var i = 0; i < s.length && !");
    echo(prefix);
    echoLine("stop;){");
    echo("            ");
    echo(prefix);
    echoLine("acceptChar(s.charCodeAt(i)) && i++;");
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
            raw: function (s) {
                echo(s);
            },
            beginBlock: function (pos) {
                echo('{');
            },
            endBlock: function (pos) {
                echo('} ');
            },
            pushLexState: function (n) {
                echo(prefix + "lexState.push(" + n + ")");
            },
            switchToLexState: function (n) {
                echo(prefix + "lexState[" + prefix + "lexState.length - 1] = " + n);
            },
            popLexState: function () {
                echo(prefix + "lexState.pop()");
            },
            setImg: function (n) {
                echo(prefix + "setImg(\"" + n + "\")");
            },
            tokenObj: function () {
                echo(prefix + 'token');
            },
            matched: function () {
                echo(prefix + 'matched');
            },
            lhs: function () {
                echo(prefix + "top");
            },
            emitToken: function (tid) {
                echo(prefix + "emittedTokens.push(" + tid + ")");
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
                echoLine('');
                echo('                ');
                rule.action.toCode(codegen);
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
    echo("    function ");
    echo(prefix);
    echo("consumeTokens(t");
    echo(ts(': Token'));
    echoLine("){");
    echoLine("        if(t !== null){");
    echo("            while(!");
    echo(prefix);
    echo("stop && !");
    echo(prefix);
    echo("acceptToken(");
    echo(prefix);
    echoLine("token));");
    echoLine("        }");
    echo("        while(!");
    echo(prefix);
    echo("stop && ");
    echo(prefix);
    echoLine("emittedTokens.length > 0){");
    echo("            ");
    echo(prefix);
    echo("acceptToken(new Token(");
    echo(prefix);
    echo("emittedTokens[0], null, 0, 0, 0, 0)) && ");
    echo(prefix);
    echoLine("emittedTokens.shift();");
    echoLine("        }");
    echoLine("    }");
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

function createClassFinder() {
    var classCount = 0;
    var lastClassCount = 0;
    var classMap = [];
    var classSet = new IntervalSet({
        createData: function () { return ({ id: -1, data: [] }); },
        stringify: function (n) { return "(" + n.id + ")"; },
        union: function (dest, src) {
            if (dest.id === -1) {
                dest.id = src.id;
            }
            else if (dest.id < lastClassCount) {
                dest.id = classMap[dest.id] !== undefined ? classMap[dest.id] : (classMap[dest.id] = classCount++);
            }
            for (var _i = 0, _a = src.data; _i < _a.length; _i++) {
                var d = _a[_i];
                dest.data.push(d);
            }
        }
    });
    return {
        addClass: addClass,
        done: done
    };
    function addClass(set, data) {
        var cid = classCount;
        lastClassCount = classCount++;
        classMap.length = 0;
        set.forEach(function (a, b, it) {
            classSet.add(a, b, { id: cid, data: [data] });
        });
    }
    function done() {
        classMap.length = 0;
        classCount = 0;
        classSet.forEach(function (a, b, it) {
            it.data.id = classMap[it.data.id] !== undefined ? classMap[it.data.id] : (classMap[it.data.id] = classCount++);
        });
        return { classCount: classCount, classSet: classSet };
    }
}

function arrayWrapper(stateCount, classCount, rawTable) {
    var emCount = [];
    for (var state = 0; state < stateCount; state++) {
        emCount.push(0);
        for (var t = 0; t < classCount; t++) {
            rawTable[state * classCount + t] === null && (emCount[state]++);
        }
    }
    return {
        rows: stateCount,
        columns: classCount,
        isEmpty: function (state, c) {
            return rawTable[state * classCount + c] === null;
        },
        emptyCount: function (c) {
            return emCount[c];
        }
    };
}
var DFATable = (function () {
    function DFATable(dfa, maxAsicii) {
        if (maxAsicii === void 0) { maxAsicii = 255; }
        this.maxAsicii = maxAsicii;
        function emitClassInterval(a, b, cl) {
            for (; a <= b; a++) {
                classTable[a] = cl;
            }
        }
        var cf = createClassFinder();
        dfa.forEachArc(function (arc, from, to) {
            cf.addClass(arc.chars, arc);
        });
        var r = cf.done();
        this.classCount = r.classCount;
        this.states = dfa.states;
        var classTable = this.classTable = initArray(maxAsicii + 1, function (i) { return -1; });
        var unicodeClassTable = this.unicodeClassTable = [];
        var rawTable = initArray(r.classCount * dfa.states.length, function (i) { return null; });
        r.classSet.forEach(function (a, b, it) {
            if (a > maxAsicii) {
                unicodeClassTable.push(it.data.id, a, b);
            }
            else if (b <= maxAsicii) {
                emitClassInterval(a, b, it.data.id);
            }
            else {
                emitClassInterval(a, maxAsicii, it.data.id);
                maxAsicii < b && unicodeClassTable.push(it.data.id, maxAsicii + 1, b);
            }
            for (var _i = 0, _b = it.data.data; _i < _b.length; _i++) {
                var arc = _b[_i];
                rawTable[arc.from.index * r.classCount + it.data.id] = arc;
            }
        });
        var compressed = compress(arrayWrapper(this.states.length, r.classCount, rawTable));
        this.disnext = compressed.dps;
        this.pnext = initArray(compressed.len, function (i) { return null; });
        this.checknext = initArray(compressed.len, function (i) { return -1; });
        for (var s = 0; s < this.states.length; s++) {
            for (var c = 0; c < this.classCount; c++) {
                var arc = rawTable[s * this.classCount + c];
                if (arc !== null) {
                    this.pnext[this.disnext[s] + c] = arc;
                    this.checknext[this.disnext[s] + c] = s;
                }
            }
        }
        this._trim();
    }
    DFATable.prototype._trim = function () {
        while (this.pnext[this.pnext.length - 1] === null) {
            this.pnext.pop();
            this.checknext.pop();
        }
    };
    DFATable.prototype.lookup = function (s, c) {
        var ind = this.disnext[s] + c;
        if (ind >= 0 && ind < this.pnext.length && this.checknext[ind] === s) {
            return this.pnext[ind];
        }
        else {
            return null;
        }
    };
    DFATable.prototype.print = function (os) {
        function char(c) {
            if (c >= 0x20 && c <= 0x7e) {
                return "'" + String.fromCharCode(c) + "'";
            }
            else {
                return "\\x" + c.toString(16);
            }
        }
        var tl = 0;
        for (var c = 0; c < this.classTable.length; c++) {
            if (this.classTable[c] !== -1) {
                os.write(char(c) + " -> c" + this.classTable[c] + ", ");
                tl++ > 9 && (os.writeln(), tl = 0);
            }
        }
        os.writeln();
        tl = 0;
        for (var c = 0, _a = this.unicodeClassTable; c < _a.length; c += 3) {
            os.write("\\x" + _a[c + 1] + "-\\x" + _a[c + 2] + " -> c" + _a[c] + ", ");
            tl++ > 4 && (os.writeln(), tl = 0);
        }
        os.writeln();
        for (var s = 0; s < this.states.length; s++) {
            os.writeln("state " + s + ":");
            var state = this.states[s];
            state.endAction !== null && os.writeln("    end = " + state.endAction.id);
            for (var c = 0; c < this.classCount; c++) {
                var arc = this.lookup(s, c);
                arc !== null && os.writeln("    c" + c + ": state " + arc.to.index);
            }
        }
    };
    return DFATable;
}());

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
                msg += markPosition(pos, lines) + endl;
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
    for (var _j = 0, _k = file.lexDFA; _j < _k.length; _j++) {
        var dfa = _k[_j];
        file.dfaTables.push(new DFATable(dfa));
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
        for (var _i = 0, _a = file.dfaTables; _i < _a.length; _i++) {
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
	IntervalSet: IntervalSet,
	createClassFinder: createClassFinder
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
