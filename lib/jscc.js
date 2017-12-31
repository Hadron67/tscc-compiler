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
                var to_1 = _c[_b];
                if (!to_1.marker) {
                    queue.push(to_1);
                    states.push(to_1);
                    to_1.marker = true;
                }
            }
        }
        for (var _d = 0, states_1 = states; _d < states_1.length; _d++) {
            var state = states_1[_d];
            state.marker = false;
        }
    };
    State.prototype.number = function () {
        var i = 0;
        this.forEach(function (state) {
            state.index = i++;
        });
    };
    State.prototype.toString = function (recursive) {
        recursive = !!recursive;
        function single() {
            var ret = 'state ' + this.index;
            if (this.isStart) {
                ret += '(start)';
            }
            if (this.endAction) {
                ret += '(end: ' + this.endAction.id + ')';
            }
            ret += '\n';
            for (var i = 0; i < this.arcs.length; i++) {
                var arc = this.arcs[i];
                ret += YYTAB + arc.chars.toString() + ' -> state ' + arc.to.index + '\n';
            }
            if (this.epsilons.length > 0) {
                ret += YYTAB + 'epsilon: ';
                for (var i = 0; i < this.epsilons.length; i++) {
                    if (i > 0) {
                        ret += ',';
                    }
                    ret += this.epsilons[i].index;
                }
                ret += '\n';
            }
            return ret;
        }
        if (!recursive) {
            return single.call(this);
        }
        else {
            var ret = '';
            this.forEach(function (state) {
                ret += single.call(state) + '\n';
            });
            return ret;
        }
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

var DFA = (function () {
    function DFA(states, actions) {
        this.states = states;
        this.actions = actions;
        this.start = states[0];
    }
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
            var ret = new DFA(dhead.states, actions);
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

var Rule = (function () {
    function Rule(g, lhs, action, rhs, index, line) {
        this.g = g;
        this.lhs = lhs;
        this.action = action;
        this.rhs = rhs;
        this.index = index;
        this.line = line;
        this.pr = -1;
        this.vars = null;
        this.parent = null;
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
    Rule.prototype.toString = function (marker) {
        var ret = this.index + ': ' + this.g.nts[this.lhs].sym + ' =>';
        for (var i = 0; i < this.rhs.length; i++) {
            var r = this.rhs[i];
            if (marker === i) {
                ret += ' .';
            }
            if (r >= 0) {
                ret += ' "' + this.g.tokens[r].sym + '"';
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
        var endl = opt.endl || '\n';
        var escape = opt.escape || false;
        var ret = '';
        this.forEachRule(function (lhs, rule) {
            var s = rule.toString();
            ret += s + '\n';
        });
        if (opt.firstSets) {
            for (var i = 0; i < this.nts.length; i++) {
                var s = this.nts[i];
                ret += 'First(' + s.sym + ') = { ' + s.firstSet.toString(this) + ' }';
                ret += '\n';
            }
        }
        if (escape) {
            ret = ret.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        return ret.replace(/\n/g, endl);
    };
    Grammar.prototype.findToken = function (t) {
        for (var i = 0; i < this.tokenCount; i++) {
            if (this.tokens[i].sym === t) {
                return i;
            }
        }
        return -1;
    };
    return Grammar;
}());

var File = (function () {
    function File() {
        this.grammar = null;
        this.lexAct = [];
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

var RuleItemType;
(function (RuleItemType) {
    RuleItemType[RuleItemType["TOKEN"] = 0] = "TOKEN";
    RuleItemType[RuleItemType["STRING"] = 1] = "STRING";
    RuleItemType[RuleItemType["NAME"] = 2] = "NAME";
})(RuleItemType || (RuleItemType = {}));

var GBuilder = (function () {
    function GBuilder(ctx) {
        this.ctx = null;
        this.f = new File();
        this.g = new Grammar();
        this.tokenNameTable = {};
        this.tokenAliasTable = {};
        this.ruleStack = [];
        this.ruleCount = 0;
        this.ntTable = {};
        this.ntPlaceHolders = {};
        this.genIndex = 0;
        this.first = true;
        this.pr = 1;
        this.states = { DEFAULT: 0 };
        this.stateCount = 1;
        this.stateNum = 0;
        this.selectedStates = [];
        this.pseudoTokens = {};
        this.errors = [];
        this.f.grammar = this.g;
        this.ctx = ctx;
        this.defToken('eof', '', 0);
    }
    GBuilder.prototype._top = function () {
        return this.ruleStack[this.ruleStack.length - 1];
    };
    GBuilder.prototype._splitAction = function (line) {
        var t = this._top();
        var s = '@' + this.genIndex++;
        this.prepareRule(s, line);
        this.addAction(t.action);
        this.commitRule();
        t.action = null;
        this.addRuleItem(s, RuleItemType.NAME, line);
    };
    GBuilder.prototype.err = function (msg, line) {
        this.ctx.err(new CompilationError(msg, line));
    };
    GBuilder.prototype.defToken = function (name, alias, line) {
        var tkIndex = this.tokenNameTable[name];
        if (tkIndex !== undefined) {
            this.err("token \"" + name + "\" was already defined at line " + this.g.tokens[tkIndex].line, line);
            return this;
        }
        else {
            var tk = {
                sym: name,
                alias: alias,
                line: line,
                pr: 0,
                assoc: Assoc.UNDEFINED,
                used: false
            };
            this.tokenNameTable[name] = this.g.tokens.length;
            this.g.tokens.push(tk);
        }
        return this;
    };
    GBuilder.prototype.addRegExp = function () {
    };
    GBuilder.prototype.defineTokenPrec = function (tid, assoc, pseudo, line) {
        if (!pseudo) {
            var t = this.tokenNameTable[tid];
            if (t === undefined) {
                this.err("use of undefined token \"" + tid + "\" in associativity defination", line);
                return this;
            }
            var tk = this.g.tokens[t];
            tk.assoc = assoc;
            tk.pr = this.pr;
        }
        else {
            var t2 = this.pseudoTokens[tid] = this.pseudoTokens[tid] || {
                assoc: assoc,
                pr: this.pr,
                line: line
            };
        }
        return this;
    };
    GBuilder.prototype.setOpt = function (name, value) {
        this.f.opt[name] = value;
        return this;
    };
    GBuilder.prototype.incPr = function () {
        this.pr++;
        return this;
    };
    GBuilder.prototype.changeState = function (s) {
        var sn = this.states[s];
        if (!sn) {
            sn = this.states[s] = this.stateCount++;
        }
        this.stateNum = sn;
        return this;
    };
    GBuilder.prototype.prepareRule = function (lhs, line) {
        if (this.first) {
            this.first = false;
            this.prepareRule('(accept)', line);
            this.addRuleItem(lhs, RuleItemType.NAME, line);
            this.commitRule();
        }
        var lhsn = this.ntTable[lhs];
        if (lhsn === undefined) {
            lhsn = this.ntTable[lhs] = this.g.nts.length;
            this.g.nts.push({
                sym: lhs,
                firstSet: null,
                used: false,
                rules: []
            });
            var holders = this.ntPlaceHolders[lhs];
            if (holders) {
                for (var _i = 0, holders_1 = holders; _i < holders_1.length; _i++) {
                    var holder = holders_1[_i];
                    holder.rule.rhs[holder.pos] = -lhsn - 1;
                }
                delete this.ntPlaceHolders[lhs];
                this.g.nts[lhsn].used = true;
            }
        }
        var nr = new Rule(this.g, lhsn, null, [], this.ruleCount++, line);
        this.ruleStack.push(nr);
        return this;
    };
    GBuilder.prototype.addRuleItem = function (id, type, line) {
        var t = this._top();
        if (t.action !== null) {
            this._splitAction(line);
        }
        if (type === RuleItemType.NAME) {
            var ntsIndex = this.ntTable[id];
            if (ntsIndex !== undefined) {
                t.rhs.push(-ntsIndex - 1);
                this.g.nts[ntsIndex].used = true;
            }
            else {
                this.ntPlaceHolders[id] || (this.ntPlaceHolders[id] = []);
                this.ntPlaceHolders[id].push({
                    rule: t,
                    pos: t.rhs.length,
                    line: line
                });
                t.rhs.push(0);
            }
        }
        else if (type === RuleItemType.STRING) {
            var tl = this.tokenNameTable[id];
            if (tl === undefined) {
                this.err("cannot recognize \"" + id + "\" as a token", line);
                return this;
            }
            t.rhs.push(tl);
            this.g.tokens[tl].used = true;
        }
        return this;
    };
    GBuilder.prototype.addAction = function (b) {
        var t = this._top();
        if (t.action !== null) {
            this._splitAction(t.line);
        }
        t.action = b;
        return this;
    };
    GBuilder.prototype.defineRulePr = function (token, pseudo, line) {
        if (!pseudo) {
            var t = this.tokenNameTable[token];
            if (!t) {
                this.err("use of undefined token \"" + token + "\" in rule priority defination", line);
                return this;
            }
            var tk = this.g.tokens[t];
            if (tk.assoc === Assoc.UNDEFINED) {
                this.err("precedence of token \"" + token + "\" has not been defined", line);
                return this;
            }
            this._top().pr = tk.pr;
        }
        else {
            var pt = this.pseudoTokens[token];
            if (!pt) {
                this.err("pseudo token \"" + token + "\" is not defined", line);
                return this;
            }
            this._top().pr = pt.pr;
        }
        return this;
    };
    GBuilder.prototype.commitRule = function () {
        var t = this.ruleStack.pop();
        this.g.nts[t.lhs].rules.push(t);
        return this;
    };
    GBuilder.prototype.build = function () {
        this.g.tokenCount = this.g.tokens.length;
        this.g.tokens[0].used = true;
        this.g.nts[0].used = true;
        for (var _i = 0, _a = this.g.nts; _i < _a.length; _i++) {
            var nt = _a[_i];
            nt.firstSet = new TokenSet(this.g.tokenCount);
            for (var _b = 0, _c = nt.rules; _b < _c.length; _b++) {
                var rule = _c[_b];
                rule.calcPr();
            }
        }
        for (var nnt in this.ntPlaceHolders) {
            var holders = this.ntPlaceHolders[nnt];
            for (var _d = 0, holders_2 = holders; _d < holders_2.length; _d++) {
                var holder = holders_2[_d];
                this.err("use of undefined non terminal \"" + nnt + "\"", holder.line);
            }
        }
        return this.f;
    };
    GBuilder.prototype.hasError = function () {
        return this.errors.length > 0;
    };
    return GBuilder;
}());

var T;
(function (T) {
    T[T["EOF"] = 0] = "EOF";
    T[T["NAME"] = 1] = "NAME";
    T[T["STRING"] = 2] = "STRING";
    T[T["TOKEN_DIR"] = 3] = "TOKEN_DIR";
    T[T["OPT"] = 4] = "OPT";
    T[T["BLOCK"] = 5] = "BLOCK";
    T[T["ARROW"] = 6] = "ARROW";
    T[T["EOL"] = 7] = "EOL";
    T[T["OR"] = 8] = "OR";
    T[T["SEPERATOR"] = 9] = "SEPERATOR";
    T[T["LEFT_DIR"] = 10] = "LEFT_DIR";
    T[T["RIGHT_DIR"] = 11] = "RIGHT_DIR";
    T[T["NONASSOC_DIR"] = 12] = "NONASSOC_DIR";
    T[T["PREC_DIR"] = 13] = "PREC_DIR";
    T[T["REGEXP"] = 14] = "REGEXP";
    T[T["STATE_DIR"] = 15] = "STATE_DIR";
    T[T["LINE_COMMENT"] = 16] = "LINE_COMMENT";
    T[T["BLOCK_COMMENT"] = 17] = "BLOCK_COMMENT";
    T[T["GT"] = 18] = "GT";
    T[T["LT"] = 19] = "LT";
    T[T["DASH"] = 20] = "DASH";
    T[T["CBRA"] = 21] = "CBRA";
    T[T["CKET"] = 22] = "CKET";
    T[T["COMMA"] = 23] = "COMMA";
    T[T["PLUS"] = 24] = "PLUS";
    T[T["OPEN_CURLY_BRA"] = 25] = "OPEN_CURLY_BRA";
    T[T["CLOSE_CURLY_BRA"] = 26] = "CLOSE_CURLY_BRA";
})(T || (T = {}));

var tokenNames = [];
for (var tname in T) {
    tokenNames[T[tname]] = tname;
}
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
            s1 = 'unexpected character "' + c + '"';
        }
        if (c1) {
            throw new CompilationError(s1 + ' after "' + c1 + '"', line);
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
        't': '\t'
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
    function handleRegExp() {
        var ret = '';
        while (c !== '/') {
            if (eof()) {
                throw new CompilationError('unterminated regular expression literal', line);
            }
            else if (c === '\\') {
                nc();
                ret += escapeChar(true);
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
                if (iss('token')) {
                    token.id = T.TOKEN_DIR;
                    break lex;
                }
                else if (iss('opt')) {
                    token.id = T.OPT;
                    break lex;
                }
                else if (iss('left')) {
                    token.id = T.LEFT_DIR;
                    break lex;
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
                else if (iss('state')) {
                    token.id = T.STATE_DIR;
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
                else {
                    token.id = T.REGEXP;
                    token.val = handleRegExp();
                    break lex;
                }
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
            throw new CompilationError('unexpected token "' + tokenNames[token.id] + '",expecting "' + tokenNames[id] + '"', token.line);
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
                gb.defineTokenPrec(token.val, assoc, false, token.line);
            }
            else if (token.id === T.NAME) {
                gb.defineTokenPrec(token.val, assoc, true, token.line);
            }
            else {
                throw new CompilationError('unexpected token "' + tokenNames[token.id] + '",expecting string or name', token.line);
            }
            nt();
        } while (token.id === T.STRING || token.id === T.NAME);
        gb.incPr();
    }
    function options() {
        while (1) {
            switch (token.id) {
                case T.TOKEN_DIR:
                    nt();
                    do {
                        tokenDef();
                    } while (token.id === T.STRING);
                    break;
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
                case T.STATE_DIR:
                    nt();
                    var n = token.val;
                    expect(T.NAME);
                    gb.changeState(n);
                    break;
                default: return;
            }
        }
    }
    function tokenDef() {
        var name = token.val;
        var alias = '';
        var tline = token.line;
        expect(T.STRING);
        if (token.id === T.NAME) {
            alias = token.val;
            nt();
        }
        gb.defToken(name, alias, tline);
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
        while (token.id === T.NAME || token.id === T.LT || token.id === T.STRING || token.id === T.BLOCK) {
            var t = token.clone();
            if (token.id === T.NAME) {
                nt();
                gb.addRuleItem(t.val, RuleItemType.NAME, t.line);
            }
            else if (token.id === T.STRING) {
                nt();
                gb.addRuleItem(t.val, RuleItemType.STRING, t.line);
            }
            else if (token.id === T.LT) {
                nt();
                t = token.clone();
                expect(T.NAME);
                expect(T.GT);
                gb.addRuleItem(t.val, RuleItemType.TOKEN, t.line);
            }
            if (token.id === T.BLOCK) {
                gb.addAction(token.val);
                nt();
            }
        }
        if (token.id === T.PREC_DIR) {
            nt();
            var t = token.val;
            var line = token.line;
            if (token.id === T.STRING) {
                gb.defineRulePr(t, false, line);
                nt();
            }
            else if (token.id === T.NAME) {
                gb.defineRulePr(t, true, line);
                nt();
            }
            else {
                throw new CompilationError('unexpected token "' + tokenNames[token.id] + '",expecting string or name', token.line);
            }
            if (token.id === T.BLOCK) {
                gb.addAction(token.val);
                nt();
            }
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
        ret += ')\n';
        for (var hash in this.it) {
            ret += this.it[hash].toString(opt2) + '\n';
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
    return List;
}());

var ParseTable = (function () {
    function ParseTable(g, stateCount) {
        this.defact = null;
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
    ParseTable.prototype.lookupShift = function (state, token) {
        return this.shift[this.g.tokenCount * state + token];
    };
    ParseTable.prototype.lookupGoto = function (state, nt) {
        return this.gotot[this.g.nts.length * state + nt];
    };
    ParseTable.prototype.getDefAct = function (state) {
        for (var tk = 0; tk < this.g.tokenCount; tk++) {
            var item = this.lookupShift(state, tk);
            
        }
        return null;
    };
    ParseTable.prototype.findDefAct = function () {
        this.defact = new Array(this.stateCount);
        for (var i = 0; i < this.stateCount; i++) {
            for (var j = 0; j < this.g.tokenCount; j++) {
                var item = this.lookupShift(i, j);
                
            }
        }
    };
    ParseTable.prototype.summary = function (doneList, os) {
        var g = this.g;
        var tokenCount = g.tokenCount;
        var ntCount = g.nts.length;
        var cela = this;
        doneList.forEach(function (set) {
            var i = set.stateIndex;
            var shift = '';
            var reduce = '';
            var gotot = '';
            os.writeln('state ' + i);
            set.forEach(function (item) {
                os.writeln(YYTAB + item.toString({ showTrailer: false }));
            });
            for (var j = 0; j < tokenCount; j++) {
                var item = cela.lookupShift(i, j);
                if (item !== null) {
                    if (item.actionType === Action$1.SHIFT) {
                        shift += YYTAB + '"' + g.tokens[j].sym + '" : ' + 'shift,and goto state ' + item.shift.stateIndex + endl;
                    }
                    else {
                        reduce += YYTAB + '"' + g.tokens[j].sym + '" : ' + 'reduce with rule ' + item.rule.index + endl;
                    }
                }
            }
            for (var j = 0; j < ntCount; j++) {
                var item = cela.lookupGoto(i, j);
                if (item !== null) {
                    gotot += YYTAB + '' + g.nts[j].sym + ' : ' + 'goto state ' + item.shift.stateIndex + endl;
                }
            }
            os.writeln(shift + reduce + gotot);
            os.writeln();
        });
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
        var ret = 'state ' + this.set.stateIndex + ',' + Conflict.cNames[this.type] + ' conflict:\n';
        ret += YYTAB + 'token: "' + this.token.sym + '"\n';
        ret += YYTAB + 'used rule: ' + this.used.toString() + '\n';
        ret += YYTAB + 'discarded rule: ' + this.discarded.toString() + '\n';
        return ret;
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
        token = g.tokens[token];
        var used = r1.rule.index > r2.rule.index ? r2 : r1;
        var discarded = r1.rule.index > r2.rule.index ? r1 : r2;
        var cf = new Conflict();
        cf.type = ConflictType.RR;
        cf.set = set;
        cf.token = token;
        cf.used = used;
        cf.discarded = discarded;
        conflicts.push(cf);
        return used;
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
    for (var i = 0; i < tokens.length; i++) {
        var tid = g.findToken(tokens[i]);
        if (tid === -1) {
            throw new JsccError('cannot recognize "' + tokens[i] + '" as a token');
        }
        tk.push(tid);
    }
    var state = [0];
    var stack = [];
    var ret = [];
    function s() {
        return state[state.length - 1];
    }
    function shift(ns) {
        state.push(ns);
        stack.push(g.tokens[tk.shift()].sym);
    }
    function dump() {
        var ret = '';
        for (var i = 0; i < stack.length; i++) {
            ret += stack[i] + ' ';
        }
        ret += '| ';
        for (var i = 0; i < tk.length; i++) {
            ret += g.tokens[tk[i]].sym + ' ';
        }
        return ret;
    }
    ret.push(dump());
    do {
        var item = pt.lookupShift(s(), tk[0] || 0);
        if (item !== null) {
            if (item.actionType === Action$1.SHIFT) {
                shift(item.shift.stateIndex);
            }
            else if (item.actionType === Action$1.REDUCE) {
                var rule = item.rule;
                var rlen = rule.rhs.length;
                while (rlen-- > 0) {
                    state.pop();
                    stack.pop();
                }
                stack.push(g.nts[rule.lhs].sym);
                if (item.rule.index === 0) {
                    ret.push('accepted!');
                    break;
                }
                else {
                    var gotot = pt.lookupGoto(s(), rule.lhs).shift.stateIndex;
                    state.push(gotot);
                }
            }
            else {
                console.assert(false);
            }
        }
        else {
            ret.push('syntax error!');
            break;
        }
        ret.push(dump());
    } while (true);
    return ret;
}

var Result = (function () {
    function Result() {
        this.errors = [];
        this.warnings = [];
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
    Result.prototype.printTable = function (stream) {
        this.parseTable.summary(this.itemSets, stream);
    };
    Result.prototype.testParse = function (tokens) {
        return testParse(this.file.grammar, this.parseTable, tokens);
    };
    Result.prototype.printError = function (os, opt) {
        for (var _i = 0, _a = this.errors; _i < _a.length; _i++) {
            var e = _a[_i];
            os.writeln(e.toString(opt));
        }
    };
    Result.prototype.printWarning = function (os, opt) {
        for (var _i = 0, _a = this.warnings; _i < _a.length; _i++) {
            var w = _a[_i];
            os.writeln(w.toString(opt));
        }
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
    return Result;
}());
function genResult(stream) {
    var result = new Result();
    try {
        var f = parseSource(stream, result);
    }
    catch (e) {
        result.err(e);
    }
    if (result.hasError()) {
        return result;
    }
    var g = f.grammar;
    g.genFirstSets();
    result.file = f;
    var temp = genItemSets(g);
    result.itemSets = temp.result;
    result.iterationCount = temp.iterations;
    var temp2 = genParseTable(g, result.itemSets);
    result.parseTable = temp2.result;
    for (var _i = 0, _a = temp2.conflicts; _i < _a.length; _i++) {
        var cf = _a[_i];
        result.warn(new JsccWarning(cf.toString()));
    }
    for (var _b = 0, _c = g.tokens; _b < _c.length; _b++) {
        var s = _c[_b];
        if (!s.used) {
            result.warn(new JsccWarning("unused token \"" + s.sym + "\" (defined at line " + s.line + ")"));
        }
    }
    for (var _d = 0, _e = g.nts; _d < _e.length; _d++) {
        var s2 = _e[_d];
        if (!s2.used) {
            result.warn(new JsccWarning("unused non terminal \"" + s2.sym + "\""));
        }
    }
    return result;
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
        while (source.isEmpty(sorted[i].row, -dp)) {
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
    dps[sorted[0].row] = sorted[0].dp = 0;
    for (var i = 1; i < sorted.length; i++) {
        var row = sorted[i].row;
        var dp = getFitdp(i);
        dps[row] = sorted[i].dp = dp;
        dp > maxdp && (maxdp = dp);
        dp < mindp && (mindp = dp);
    }
    for (var i = 0; i < dps.length; i++) {
        dps[i] -= mindp;
    }
    return {
        dps: dps,
        len: maxdp + source.columns - mindp
    };
}



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

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=jscc.js.map
