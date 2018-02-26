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

var OutputStream = (function () {
    function OutputStream() {
        this.endl = '\n';
    }
    OutputStream.prototype.writeln = function (s) {
        s && this.write(s);
        this.write(this.endl);
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
	OutputStream: OutputStream,
	StringOS: StringOS,
	StringIS: StringIS,
	biss: biss
});

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
                    ret += ', ';
                }
                var tdef = g.tokens[i];
                ret += tdef.alias === null ? "<" + tdef.sym + ">" : "\"" + tdef.alias + "\"";
                first = false;
            }
        }
        return ret;
    };
    return TokenSet;
}(BitSet));

var Action;
(function (Action) {
    Action[Action["NONE"] = 1] = "NONE";
    Action[Action["SHIFT"] = 2] = "SHIFT";
    Action[Action["REDUCE"] = 3] = "REDUCE";
})(Action || (Action = {}));
var Item = (function () {
    function Item(rule, ik) {
        this.marker = 0;
        this.shift = null;
        this.actionType = Action.NONE;
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
        var showlah = (opt && opt.showlah) || false;
        var showTrailer = (opt && opt.showTrailer) || false;
        var ret = '[ ' + this.rule.toString(this.marker) + (showlah ? ', { ' + this.lah.toString(this.rule.g) + ' }' : '') + ' ]';
        this.isKernel && (ret += '*');
        if (showTrailer) {
            switch (this.actionType) {
                case Action.NONE:
                    ret += '(-)';
                    break;
                case Action.SHIFT:
                    ret += '(s' + this.shift.stateIndex + ')';
                    break;
                case Action.REDUCE:
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
        return this.actionType === Action.REDUCE && i.actionType === Action.REDUCE && this.rule.index !== i.rule.index && this.lah.hasIntersection(i.lah);
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
        this.items = [];
        this.itemTable = [];
        this.reduces = [];
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
        var entry = this.itemTable[rule.index] = this.itemTable[rule.index] || [];
        var it = entry[marker];
        if (it === undefined) {
            var n = new Item(rule, ik);
            n.marker = marker;
            if (lah) {
                n.lah.union(lah);
            }
            entry[marker] = n;
            this.items.push(n);
            marker === rule.rhs.length && this.reduces.push(n);
            return true;
        }
        else if (lah) {
            var ret = it.lah.union(lah);
            if (reset && ret && it.canShift()) {
                it.actionType = Action.NONE;
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
            for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
                var item = _a[_i];
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
        var ret = 's' + this.stateIndex + '';
        if (this.index !== null) {
            ret += '(i' + this.index;
        }
        else {
            ret += '(i?';
        }
        if (this.merges.length > 0) {
            ret += ', merged from ';
            for (var i = 0; i < this.merges.length; i++) {
                if (i > 0) {
                    ret += ', ';
                }
                ret += 'i' + this.merges[i];
            }
        }
        ret += ')\n';
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            ret += item.toString(opt) + '\n';
        }
        return ret;
    };
    ItemSet.prototype.kernelHash = function () {
        var ret = 0;
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.isKernel) {
                ret += item.rule.index << 5 + item.rule.index + item.marker;
            }
        }
        return String(ret);
    };
    ItemSet.prototype.forEach = function (cb) {
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            cb(item);
        }
    };
    ItemSet.prototype.canMergeTo = function (s) {
        var dup = true;
        for (var i = 0; i < this.g.rules.length; i++) {
            var t1 = this.itemTable[i], t2 = s.itemTable[i];
            dup = dup && !!(t1 && t2 || !t1 && !t2);
            if (t1 || t2) {
                var rhs = this.g.rules[i].rhs;
                for (var j = 0; j <= rhs.length; j++) {
                    if (t1 && t1[j] && t1[j].isKernel && (!t2 || !t2[j] || !t2[j].isKernel)
                        || t2 && t2[j] && t2[j].isKernel && (!t1 || !t1[j] || !t1[j].isKernel)) {
                        return false;
                    }
                    else {
                        dup = dup && (!t1 && !t1 && !t1[j] && !t2[j] || t1 && t2 && t1[j] && t2[j] && t1[j].lah.equals(t2[j].lah));
                    }
                }
            }
        }
        if (!dup) {
            for (var _i = 0, _a = this.reduces; _i < _a.length; _i++) {
                var rit = _a[_i];
                for (var _b = 0, _c = s.reduces; _b < _c.length; _b++) {
                    var rit2 = _c[_b];
                    if (rit.rule !== rit2.rule && rit.lah.hasIntersection(rit2.lah)) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
    ItemSet.prototype.mergeTo = function (s) {
        var ret = false;
        for (var _i = 0, _a = s.items; _i < _a.length; _i++) {
            var it = _a[_i];
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

(function (Assoc) {
    Assoc[Assoc["UNDEFINED"] = 0] = "UNDEFINED";
    Assoc[Assoc["LEFT"] = 1] = "LEFT";
    Assoc[Assoc["RIGHT"] = 2] = "RIGHT";
    Assoc[Assoc["NON"] = 3] = "NON";
})(exports.Assoc || (exports.Assoc = {}));

function convertTokenToString(t) {
    return t.alias === null ? "<" + t.sym + ">" : "\"" + t.alias + "\"";
}

function printParseTable(os, cela, doneList, showlah, showFullItemsets, escapes) {
    var g = cela.g;
    var tokenCount = g.tokenCount;
    var ntCount = g.nts.length;
    var tab = '    ';
    doneList.forEach(function (set) {
        var i = set.stateIndex;
        var shift = '';
        var reduce = '';
        var gotot = '';
        os.writeln("state " + i);
        set.forEach(function (item) {
            (showFullItemsets || item.isKernel) && os.writeln(tab + item.toString({ showlah: showlah }));
        });
        if (cela.defred[i] !== -1) {
            os.writeln(tab + "default action: reduce with rule " + cela.defred[i]);
        }
        else {
            os.writeln(tab + 'no default action');
        }
        for (var j = 0; j < tokenCount; j++) {
            var item = cela.lookupShift(i, j);
            if (item !== null && item !== Item.NULL) {
                if (item.actionType === Action.SHIFT) {
                    shift += "" + tab + convertTokenToString(g.tokens[j]) + " : shift, and go to state " + item.shift.stateIndex + "\n";
                }
                else {
                    reduce += "" + tab + convertTokenToString(g.tokens[j]) + " : reduce with rule " + item.rule.index + "\n";
                }
            }
        }
        for (var j = 0; j < ntCount; j++) {
            var item = cela.lookupGoto(i, j);
            if (item !== null) {
                gotot += "" + tab + g.nts[j].sym + " : go to state " + item.shift.stateIndex + "\n";
            }
        }
        var line = shift + reduce + gotot;
        for (var _i = 0, escapes_1 = escapes; _i < escapes_1.length; _i++) {
            var es = escapes_1[_i];
            line = line.replace(es.from, es.to);
        }
        os.writeln(line);
        os.writeln();
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
            item && item.actionType === Action.REDUCE && apool[item.rule.index]++;
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
                    item && item.actionType === Action.REDUCE && item.rule.index === def &&
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
        return "state " + this.set.stateIndex + ", " + Conflict.cNames[this.type] + " conflict:\n" +
            ("    token: " + convertTokenToString(this.token) + "\n") +
            ("    used rule: " + this.used.toString() + "\n") +
            ("    discarded rule: " + this.discarded.toString());
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
                if (item.actionType === Action.NONE) {
                    console$1.assert(item.canShift());
                    var shift = item.getShift();
                    var newSet = new ItemSet(g);
                    newSet.index = index++;
                    todoList.append(newSet);
                    set.forEach(function (item1) {
                        if (item1.canShift()) {
                            var rItem = item1.getShift();
                            if (rItem === shift) {
                                item1.actionType = Action.SHIFT;
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
                    item.actionType = Action.REDUCE;
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
                            if (sItem.actionType === Action.SHIFT && sItem.shift === set) {
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
        if (token.assoc !== exports.Assoc.UNDEFINED) {
            var ruleP = reduce.rule.pr;
            if (ruleP !== -1) {
                if (ruleP > token.pr) {
                    return reduce;
                }
                else if (ruleP < token.pr) {
                    return shift;
                }
                else {
                    if (token.assoc === exports.Assoc.LEFT) {
                        return reduce;
                    }
                    else if (token.assoc === exports.Assoc.RIGHT) {
                        return shift;
                    }
                    else if (token.assoc === exports.Assoc.NON) {
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
            if (item.actionType === Action.SHIFT) {
                var sItem = item.getShift();
                if (g.isToken(sItem)) {
                    var tindex = set.stateIndex * g.tokenCount + sItem;
                    var cItem = ptable.shift[tindex];
                    if (cItem !== null) {
                        if (cItem.actionType === Action.REDUCE) {
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
            else if (item.actionType === Action.REDUCE) {
                for (var i = 0; i < g.tokenCount; i++) {
                    if (item.lah.contains(i + 1)) {
                        var index = set.stateIndex * g.tokenCount + i;
                        var cItem = ptable.shift[index];
                        if (cItem !== null) {
                            if (cItem.actionType === Action.REDUCE) {
                                ptable.shift[index] = resolveRRConflict(set, cItem, item, i);
                            }
                            else if (cItem.actionType === Action.SHIFT) {
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

function testParse(g, pt, tokens, onErr) {
    var tk = [];
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var tname = tokens_1[_i];
        var tdef = void 0;
        if (/<[^>]+>/.test(tname)) {
            tdef = g.findTokenByName(tname.substr(1, tname.length - 2));
            if (tdef === null) {
                onErr("cannot recognize " + tname + " as a token");
                return [];
            }
        }
        else {
            var defs = g.findTokensByAlias(tname);
            if (defs.length === 0) {
                onErr("cannot recognize \"" + tname + "\" as a token");
                return [];
            }
            if (defs.length > 1) {
                var msg = '';
                for (var _a = 0, defs_1 = defs; _a < defs_1.length; _a++) {
                    var def = defs_1[_a];
                    msg += "<" + def.sym + "> ";
                }
                onErr("cannot recognize \"" + tname + "\" as a token, since it can be " + msg);
                return [];
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
            else if (item.actionType === Action.SHIFT) {
                if (tk.length === 0) {
                    ret.push('accepted!');
                    break;
                }
                shift(item.shift.stateIndex);
            }
            else if (item.actionType === Action.REDUCE) {
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

var Span = (function () {
    function Span() {
        this._s = [];
    }
    Span.prototype.append = function (content, escape) {
        if (escape === void 0) { escape = true; }
        if (this._s.length > 0 && this._s[this._s.length - 1].escape === escape) {
            this._s[this._s.length - 1].content += content;
        }
        else {
            this._s.push({ content: content, escape: escape });
        }
        return this;
    };
    Span.prototype.toString = function (escapes) {
        var ret = '';
        for (var _i = 0, _a = this._s; _i < _a.length; _i++) {
            var it = _a[_i];
            var s = it.content;
            if (escapes && it.escape) {
                for (var _b = 0, escapes_1 = escapes; _b < escapes_1.length; _b++) {
                    var escape = escapes_1[_b];
                    s = s.replace(escape.from, escape.to);
                }
            }
            ret += s;
        }
        return ret;
    };
    return Span;
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
        var ret = new Span();
        if (opt.typeClass) {
            ret.append("<span class=\"" + opt.typeClass + "\">" + ret + "</span>", false);
        }
        else {
            ret.append(this.type);
        }
        ret.append(': ');
        ret.append(this.msg);
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
        return _super.prototype.toString.call(this).append("(at line " + this.line + ")");
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
                    this.g.tokens[item].assoc !== exports.Assoc.UNDEFINED &&
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
        this.eol = '\n';
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

var Action$1;
(function (Action) {
    Action[Action["START"] = 0] = "START";
    Action[Action["END"] = 1] = "END";
    Action[Action["NONE"] = 2] = "NONE";
})(Action$1 || (Action$1 = {}));
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
    State.prototype.print = function (os, escapes, recursive) {
        if (recursive === void 0) { recursive = true; }
        var endl = '\n';
        var tab = '    ';
        function echo(s) {
            for (var _i = 0, escapes_1 = escapes; _i < escapes_1.length; _i++) {
                var es = escapes_1[_i];
                s = s.replace(es.from, es.to);
            }
            os.writeln(s);
        }
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
                ret += ("" + tab + arc.chars.toString() + " -> state " + arc.to.index + endl);
            }
            if (cela.epsilons.length > 0) {
                ret += tab + "epsilon: ";
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
            echo(single(this));
        }
        else {
            this.forEach(function (state) {
                echo(single(state));
            });
        }
    };
    State.prototype.toString = function (escapes, recursive) {
        if (recursive === void 0) { recursive = true; }
        var ss = new StringOS();
        this.print(ss, escapes, recursive);
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
    DFA.prototype.print = function (os, escapes) {
        for (var _i = 0, _a = this.states; _i < _a.length; _i++) {
            var s = _a[_i];
            s.print(os, escapes, false);
            os.writeln();
        }
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
        var ret = "(line " + (pos.startLine + 1) + ", column " + (pos.startColumn + 1) + "):\n";
        var line = pos.startLine, col = pos.startColumn;
        ret += lines[line] + '\n';
        ret += repeat(' ', col);
        var length_1 = width(lines[line]);
        while (line <= pos.endLine && col <= pos.endColumn) {
            ret += marker;
            if (col++ >= length_1) {
                col = 0;
                line++;
                ret += '\n' + lines[line] + '\n';
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
        if (a.opcodes.length > 0) {
            while (_ar.length > 0) {
                var top_1 = _ar[_ar.length - 1];
                top_1.cmds.opcodes[top_1.pc++]();
                top_1 = _ar[_ar.length - 1];
                top_1.pc >= top_1.cmds.opcodes.length && _ar.pop();
            }
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
            var msg = what + ' ' + markPosition(current, lines) + '\n';
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
    LexAction.prototype.beginBlock = function (pos, always) {
        this.actions.push(function (c) { return c.beginBlock(pos, always); });
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
        setLineTerminator: setLineTerminator,
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
            var msg = what + ' ' + markPosition(current, lines) + '\n';
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
                assoc: exports.Assoc.UNDEFINED,
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
    function setLineTerminator(eol) {
        file.eol = eol;
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
                if (tk.assoc === exports.Assoc.UNDEFINED) {
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
        ctx.beginTime('build grammar');
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
        ctx.endTime();
        ctx.beginTime('build lexical DFAs');
        file.lexDFA = lexBuilder.build();
        ctx.endTime();
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
            else if (c === 'u' || c === 'x' || c === 'U' || c === 'X') {
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
var jjlf = '\n'.charCodeAt(0);
var jjcr = '\r'.charCodeAt(0);

var jjlexpnext0 = [
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    73, 72, 72, 72, 74, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 73, 72, 72, 72,
    74, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 73, 72, 72, 72, 94, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 96, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 73, 72, 72, 72, 94, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    73, 72, 72, 72, 74, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 47, 47, 137, 47,
    47, 47, 47, 48, 47, 47, 47, 47, 47, 47,
    47, 114, 47, 47, 47, 47, 47, 47, 114, 47,
    47, 49, 47, 47, 47, 114, 114, 114, 114, 114,
    114, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 27, 27, 136, 28, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 98, 27, 27,
    27, 27, 27, 27, 98, 27, 27, 29, 27, 27,
    27, 98, 98, 98, 98, 98, 98, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 47, 47,
    135, 47, 47, 47, 47, 48, 47, 47, 47, 47,
    47, 47, 47, 114, 47, 47, 47, 47, 47, 47,
    114, 47, 47, 49, 47, 47, 47, 114, 114, 114,
    114, 114, 114, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 27, 27, 134, 28, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 98,
    27, 27, 27, 27, 27, 27, 98, 27, 27, 29,
    27, 27, 27, 98, 98, 98, 98, 98, 98, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    47, 47, 133, 47, 47, 47, 47, 48, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 49, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 27, 27, 132, 28,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 29, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 30, 30, 131, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 47, 47,
    130, 47, 47, 47, 47, 48, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 49, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 30, 30, 129, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    27, 27, 128, 28, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 29, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 47, 47, 127, 47,
    47, 47, 47, 48, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 49, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 30, 30, 126, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 27, 27,
    125, 28, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 29, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 1, 1, 2, 3, 4, 5,
    6, 7, 8, 9, 10, 11, 12, 13, 124, 14,
    15, 16, 17, 18, 19, 4, 4, 20, 123, 21,
    22, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 23, 24, 25, 26, 31, 82,
    122, 67, 63, 56, 83, 121, 64, 120, 32, 68,
    59, 60, 57, 50, 119, 31, 31, 51, 118, 84,
    117, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 1, 1, 33, 34, 116,
    115, 113, 112, 111, 32, 110, 109, 108, 107, 106,
    105, 31, 31, 104, 103, 102, 101, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 100, 99, 33, 34, 97, 92, 91, 90, 89,
    32, 88, 87, 86, 85, 81, 80, 31, 31, 79,
    78, 77, 76, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 69, 66, 33,
    34, 65, 62, 61, 58, 55, 32, 52, -1, -1,
    -1, -1, -1, 31, 31, -1, -1, -1, -1, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, -1, -1, 33, 34, -1, -1, -1,
    -1, -1, 32, -1, -1, -1, -1, -1, -1, 31,
    31, -1, -1, -1, -1, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, -1,
    -1, 33, 34, -1, -1, -1, -1, -1, 32, -1,
    -1, -1, -1, -1, -1, 31, 31, -1, -1, -1,
    -1, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 35, -1, -1, 33, 34, -1,
    -1, -1, -1, -1, -1, -1, 70, -1, -1, -1,
    70, -1, -1, -1, -1, -1, -1, 36, -1, -1,
    -1, 37, -1, -1, 38, 39, 71, 40, 70, 41,
    42, 43, 44, 70, 45, 46, 53, 70, -1, -1,
    53, -1, -1, -1, 70, -1, -1, 70, -1, 70,
    71, -1, 71, -1, 93, -1, 54, -1, 53, -1,
    -1, 93, -1, 53, -1, -1, -1, 53, 93, 93,
    93, 93, 93, 93, 53, -1, 75, 53, -1, 53,
    54, -1, 54, 75, -1, -1, -1, -1, -1, -1,
    75, 75, 75, 75, 75, 75,
];
var jjlexdisnext0 = [
    1063, 1164, 1008, 952, 1343, 1388, 896, -56, -56, -56,
    -56, -56, -56, 1123, -56, -56, -56, 1247, -56, -56,
    -56, -56, -56, -56, -56, -56, 1297, 840, -56, 1433,
    784, 1251, 1205, 1159, 1113, -56, 1226, 1083, 1231, 1090,
    1230, 1220, 1079, 1217, 1221, 1079, 1212, 728, -56, 1403,
    280, 672, -56, 616, 1461, 1184, 1188, 1184, 1200, 1183,
    1188, 1090, 1183, 1177, 1176, 1188, 1184, 1180, 1174, 1183,
    560, 1439, 224, 168, 1201, 504, 1183, 1165, 1142, 1153,
    1142, 1137, 1135, 1133, -56, 1149, 1140, 1133, 1144, 1137,
    1139, 1138, -56, 448, 112, 56, -56, 0, 392, 1120,
    1119, 1111, 1105, 1090, -56, 1081, -56, 1080, 1078, 1041,
    -56, 1032, 969, -56, 336, 909, -56, 870, 798, 740,
    -56, 685, 633, 572, -56, -56, -56, 533, -56, -56,
    464, -56, -56, 406, 363, 303, -56, -56,
];
var jjlexchecknext0 = [
    97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
    97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
    97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
    97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
    97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
    97, 97, 97, 97, 97, 97, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
    95, 95, 94, 94, 94, 94, 94, 94, 94, 94,
    94, 94, 94, 94, 94, 94, 94, 94, 94, 94,
    94, 94, 94, 94, 94, 94, 94, 94, 94, 94,
    94, 94, 94, 94, 94, 94, 94, 94, 94, 94,
    94, 94, 94, 94, 94, 94, 94, 94, 94, 94,
    94, 94, 94, 94, 94, 94, 94, 94, 73, 73,
    73, 73, 73, 73, 73, 73, 73, 73, 73, 73,
    73, 73, 73, 73, 73, 73, 73, 73, 73, 73,
    73, 73, 73, 73, 73, 73, 73, 73, 73, 73,
    73, 73, 73, 73, 73, 73, 73, 73, 73, 73,
    73, 73, 73, 73, 73, 73, 73, 73, 73, 73,
    73, 73, 73, 73, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    72, 72, 72, 72, 72, 72, 72, 72, 72, 72,
    50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 50, 50, 50, 50, 50, 50, 50, 50,
    50, 50, 50, 50, 50, 50, 114, 114, 135, 114,
    114, 114, 114, 114, 114, 114, 114, 114, 114, 114,
    114, 114, 114, 114, 114, 114, 114, 114, 114, 114,
    114, 114, 114, 114, 114, 114, 114, 114, 114, 114,
    114, 114, 114, 114, 114, 114, 114, 114, 114, 114,
    114, 114, 114, 114, 114, 114, 114, 114, 114, 114,
    114, 114, 98, 98, 134, 98, 98, 98, 98, 98,
    98, 98, 98, 98, 98, 98, 98, 98, 98, 98,
    98, 98, 98, 98, 98, 98, 98, 98, 98, 98,
    98, 98, 98, 98, 98, 98, 98, 98, 98, 98,
    98, 98, 98, 98, 98, 98, 98, 98, 98, 98,
    98, 98, 98, 98, 98, 98, 98, 98, 93, 93,
    133, 93, 93, 93, 93, 93, 93, 93, 93, 93,
    93, 93, 93, 93, 93, 93, 93, 93, 93, 93,
    93, 93, 93, 93, 93, 93, 93, 93, 93, 93,
    93, 93, 93, 93, 93, 93, 93, 93, 93, 93,
    93, 93, 93, 93, 93, 93, 93, 93, 93, 93,
    93, 93, 93, 93, 75, 75, 130, 75, 75, 75,
    75, 75, 75, 75, 75, 75, 75, 75, 75, 75,
    75, 75, 75, 75, 75, 75, 75, 75, 75, 75,
    75, 75, 75, 75, 75, 75, 75, 75, 75, 75,
    75, 75, 75, 75, 75, 75, 75, 75, 75, 75,
    75, 75, 75, 75, 75, 75, 75, 75, 75, 75,
    70, 70, 127, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 70, 70, 70, 70,
    70, 70, 70, 70, 70, 70, 53, 53, 123, 53,
    53, 53, 53, 53, 53, 53, 53, 53, 53, 53,
    53, 53, 53, 53, 53, 53, 53, 53, 53, 53,
    53, 53, 53, 53, 53, 53, 53, 53, 53, 53,
    53, 53, 53, 53, 53, 53, 53, 53, 53, 53,
    53, 53, 53, 53, 53, 53, 53, 53, 53, 53,
    53, 53, 51, 51, 122, 51, 51, 51, 51, 51,
    51, 51, 51, 51, 51, 51, 51, 51, 51, 51,
    51, 51, 51, 51, 51, 51, 51, 51, 51, 51,
    51, 51, 51, 51, 51, 51, 51, 51, 51, 51,
    51, 51, 51, 51, 51, 51, 51, 51, 51, 51,
    51, 51, 51, 51, 51, 51, 51, 51, 47, 47,
    121, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 47, 47, 47, 47, 47, 47,
    47, 47, 47, 47, 30, 30, 119, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    27, 27, 118, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 27, 27, 27, 27,
    27, 27, 27, 27, 27, 27, 6, 6, 117, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 3, 3, 115, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 2, 2,
    112, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 111, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 109, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 34, 61,
    108, 45, 42, 37, 61, 107, 42, 105, 34, 45,
    39, 39, 37, 13, 103, 34, 34, 13, 102, 61,
    101, 34, 34, 34, 34, 34, 34, 34, 34, 34,
    34, 34, 34, 34, 34, 34, 34, 34, 34, 34,
    34, 34, 34, 34, 33, 1, 1, 34, 34, 100,
    99, 91, 90, 89, 33, 88, 87, 86, 85, 83,
    82, 33, 33, 81, 80, 79, 78, 33, 33, 33,
    33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
    33, 33, 33, 33, 33, 33, 33, 33, 33, 33,
    32, 77, 76, 33, 33, 74, 69, 68, 67, 66,
    32, 65, 64, 63, 62, 60, 59, 32, 32, 58,
    57, 56, 55, 32, 32, 32, 32, 32, 32, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    32, 32, 32, 32, 32, 32, 31, 46, 44, 32,
    32, 43, 41, 40, 38, 36, 31, 17, -1, -1,
    -1, -1, -1, 31, 31, -1, -1, -1, -1, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 26, -1, -1, 31, 31, -1, -1, -1,
    -1, -1, 26, -1, -1, -1, -1, -1, -1, 26,
    26, -1, -1, -1, -1, 26, 26, 26, 26, 26,
    26, 26, 26, 26, 26, 26, 26, 26, 26, 26,
    26, 26, 26, 26, 26, 26, 26, 26, 4, -1,
    -1, 26, 26, -1, -1, -1, -1, -1, 4, -1,
    -1, -1, -1, -1, -1, 4, 4, -1, -1, -1,
    -1, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 4, 4, 5, -1, -1, 4, 4, -1,
    -1, -1, -1, -1, -1, -1, 49, -1, -1, -1,
    49, -1, -1, -1, -1, -1, -1, 5, -1, -1,
    -1, 5, -1, -1, 5, 5, 49, 5, 49, 5,
    5, 5, 5, 49, 5, 5, 29, 49, -1, -1,
    29, -1, -1, -1, 49, -1, -1, 49, -1, 49,
    49, -1, 49, -1, 71, -1, 29, -1, 29, -1,
    -1, 71, -1, 29, -1, -1, -1, 29, 71, 71,
    71, 71, 71, 71, 29, -1, 54, 29, -1, 29,
    29, -1, 29, 54, -1, -1, -1, -1, -1, -1,
    54, 54, 54, 54, 54, 54,
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
    5, 5, 5, 5, 5, 23, 5, 5, 23, 5,
    5, 24, 25, 26, 27, 28, 0, 29, 30, 31,
    32, 33, 34, 35, 36, 37, 5, 38, 39, 40,
    41, 42, 43, 5, 44, 45, 46, 47, 5, 48,
    49, 50, 5, 51, 52, 53, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    54, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 54, 0, 0, 0, 0, 54, 0, 0, 0,
    0, 0, 54, 54, 54, 54, 54, 54, 54, 54,
    54, 54, 54, 54, 54, 54, 54, 54, 54, 54,
    54, 54, 54, 54, 54, 0, 54, 54, 54, 54,
    54, 54, 54, 54, 54, 54, 54, 54, 54, 54,
    54, 54, 54, 54, 54, 54, 54, 54, 54, 54,
    54, 54, 54, 54, 54, 54, 54, 0, 54, 54,
    54, 54, 54, 54, 54, 54,
];
var jjlexunicodeClassTable0 = [
    54, 256, 705, 0, 706, 709, 54, 710, 721, 0,
    722, 735, 54, 736, 740, 0, 741, 747, 54, 748,
    748, 0, 749, 749, 54, 750, 750, 0, 751, 767,
    55, 768, 879, 54, 880, 884, 0, 885, 885, 54,
    886, 887, 0, 888, 889, 54, 890, 893, 0, 894,
    901, 54, 902, 902, 0, 903, 903, 54, 904, 906,
    0, 907, 907, 54, 908, 908, 0, 909, 909, 54,
    910, 929, 0, 930, 930, 54, 931, 1013, 0, 1014,
    1014, 54, 1015, 1153, 0, 1154, 1154, 55, 1155, 1159,
    0, 1160, 1161, 54, 1162, 1319, 0, 1320, 1328, 54,
    1329, 1366, 0, 1367, 1368, 54, 1369, 1369, 0, 1370,
    1376, 54, 1377, 1415, 0, 1416, 1424, 55, 1425, 1469,
    0, 1470, 1470, 55, 1471, 1471, 0, 1472, 1472, 55,
    1473, 1474, 0, 1475, 1475, 55, 1476, 1477, 0, 1478,
    1478, 55, 1479, 1479, 0, 1480, 1487, 54, 1488, 1514,
    0, 1515, 1519, 54, 1520, 1522, 0, 1523, 1551, 55,
    1552, 1562, 0, 1563, 1567, 54, 1568, 1610, 55, 1611,
    1641, 0, 1642, 1645, 54, 1646, 1647, 55, 1648, 1648,
    54, 1649, 1747, 0, 1748, 1748, 54, 1749, 1749, 55,
    1750, 1756, 0, 1757, 1758, 55, 1759, 1764, 54, 1765,
    1766, 55, 1767, 1768, 0, 1769, 1769, 55, 1770, 1773,
    54, 1774, 1775, 55, 1776, 1785, 54, 1786, 1788, 0,
    1789, 1790, 54, 1791, 1791, 0, 1792, 1807, 54, 1808,
    1808, 55, 1809, 1809, 54, 1810, 1839, 55, 1840, 1866,
    0, 1867, 1868, 54, 1869, 1957, 55, 1958, 1968, 54,
    1969, 1969, 0, 1970, 1983, 55, 1984, 1993, 54, 1994,
    2026, 55, 2027, 2035, 54, 2036, 2037, 0, 2038, 2041,
    54, 2042, 2042, 0, 2043, 2047, 54, 2048, 2069, 55,
    2070, 2073, 54, 2074, 2074, 55, 2075, 2083, 54, 2084,
    2084, 55, 2085, 2087, 54, 2088, 2088, 55, 2089, 2093,
    0, 2094, 2111, 54, 2112, 2136, 55, 2137, 2139, 0,
    2140, 2207, 54, 2208, 2208, 0, 2209, 2209, 54, 2210,
    2220, 0, 2221, 2275, 55, 2276, 2302, 0, 2303, 2303,
    55, 2304, 2307, 54, 2308, 2361, 55, 2362, 2364, 54,
    2365, 2365, 55, 2366, 2383, 54, 2384, 2384, 55, 2385,
    2391, 54, 2392, 2401, 55, 2402, 2403, 0, 2404, 2405,
    55, 2406, 2415, 0, 2416, 2416, 54, 2417, 2423, 0,
    2424, 2424, 54, 2425, 2431, 0, 2432, 2432, 55, 2433,
    2435, 0, 2436, 2436, 54, 2437, 2444, 0, 2445, 2446,
    54, 2447, 2448, 0, 2449, 2450, 54, 2451, 2472, 0,
    2473, 2473, 54, 2474, 2480, 0, 2481, 2481, 54, 2482,
    2482, 0, 2483, 2485, 54, 2486, 2489, 0, 2490, 2491,
    55, 2492, 2492, 54, 2493, 2493, 55, 2494, 2500, 0,
    2501, 2502, 55, 2503, 2504, 0, 2505, 2506, 55, 2507,
    2509, 54, 2510, 2510, 0, 2511, 2518, 55, 2519, 2519,
    0, 2520, 2523, 54, 2524, 2525, 0, 2526, 2526, 54,
    2527, 2529, 55, 2530, 2531, 0, 2532, 2533, 55, 2534,
    2543, 54, 2544, 2545, 0, 2546, 2560, 55, 2561, 2563,
    0, 2564, 2564, 54, 2565, 2570, 0, 2571, 2574, 54,
    2575, 2576, 0, 2577, 2578, 54, 2579, 2600, 0, 2601,
    2601, 54, 2602, 2608, 0, 2609, 2609, 54, 2610, 2611,
    0, 2612, 2612, 54, 2613, 2614, 0, 2615, 2615, 54,
    2616, 2617, 0, 2618, 2619, 55, 2620, 2620, 0, 2621,
    2621, 55, 2622, 2626, 0, 2627, 2630, 55, 2631, 2632,
    0, 2633, 2634, 55, 2635, 2637, 0, 2638, 2640, 55,
    2641, 2641, 0, 2642, 2648, 54, 2649, 2652, 0, 2653,
    2653, 54, 2654, 2654, 0, 2655, 2661, 55, 2662, 2673,
    54, 2674, 2676, 55, 2677, 2677, 0, 2678, 2688, 55,
    2689, 2691, 0, 2692, 2692, 54, 2693, 2701, 0, 2702,
    2702, 54, 2703, 2705, 0, 2706, 2706, 54, 2707, 2728,
    0, 2729, 2729, 54, 2730, 2736, 0, 2737, 2737, 54,
    2738, 2739, 0, 2740, 2740, 54, 2741, 2745, 0, 2746,
    2747, 55, 2748, 2748, 54, 2749, 2749, 55, 2750, 2757,
    0, 2758, 2758, 55, 2759, 2761, 0, 2762, 2762, 55,
    2763, 2765, 0, 2766, 2767, 54, 2768, 2768, 0, 2769,
    2783, 54, 2784, 2785, 55, 2786, 2787, 0, 2788, 2789,
    55, 2790, 2799, 0, 2800, 2816, 55, 2817, 2819, 0,
    2820, 2820, 54, 2821, 2828, 0, 2829, 2830, 54, 2831,
    2832, 0, 2833, 2834, 54, 2835, 2856, 0, 2857, 2857,
    54, 2858, 2864, 0, 2865, 2865, 54, 2866, 2867, 0,
    2868, 2868, 54, 2869, 2873, 0, 2874, 2875, 55, 2876,
    2876, 54, 2877, 2877, 55, 2878, 2884, 0, 2885, 2886,
    55, 2887, 2888, 0, 2889, 2890, 55, 2891, 2893, 0,
    2894, 2901, 55, 2902, 2903, 0, 2904, 2907, 54, 2908,
    2909, 0, 2910, 2910, 54, 2911, 2913, 55, 2914, 2915,
    0, 2916, 2917, 55, 2918, 2927, 0, 2928, 2928, 54,
    2929, 2929, 0, 2930, 2945, 55, 2946, 2946, 54, 2947,
    2947, 0, 2948, 2948, 54, 2949, 2954, 0, 2955, 2957,
    54, 2958, 2960, 0, 2961, 2961, 54, 2962, 2965, 0,
    2966, 2968, 54, 2969, 2970, 0, 2971, 2971, 54, 2972,
    2972, 0, 2973, 2973, 54, 2974, 2975, 0, 2976, 2978,
    54, 2979, 2980, 0, 2981, 2983, 54, 2984, 2986, 0,
    2987, 2989, 54, 2990, 3001, 0, 3002, 3005, 55, 3006,
    3010, 0, 3011, 3013, 55, 3014, 3016, 0, 3017, 3017,
    55, 3018, 3021, 0, 3022, 3023, 54, 3024, 3024, 0,
    3025, 3030, 55, 3031, 3031, 0, 3032, 3045, 55, 3046,
    3055, 0, 3056, 3072, 55, 3073, 3075, 0, 3076, 3076,
    54, 3077, 3084, 0, 3085, 3085, 54, 3086, 3088, 0,
    3089, 3089, 54, 3090, 3112, 0, 3113, 3113, 54, 3114,
    3123, 0, 3124, 3124, 54, 3125, 3129, 0, 3130, 3132,
    54, 3133, 3133, 55, 3134, 3140, 0, 3141, 3141, 55,
    3142, 3144, 0, 3145, 3145, 55, 3146, 3149, 0, 3150,
    3156, 55, 3157, 3158, 0, 3159, 3159, 54, 3160, 3161,
    0, 3162, 3167, 54, 3168, 3169, 55, 3170, 3171, 0,
    3172, 3173, 55, 3174, 3183, 0, 3184, 3201, 55, 3202,
    3203, 0, 3204, 3204, 54, 3205, 3212, 0, 3213, 3213,
    54, 3214, 3216, 0, 3217, 3217, 54, 3218, 3240, 0,
    3241, 3241, 54, 3242, 3251, 0, 3252, 3252, 54, 3253,
    3257, 0, 3258, 3259, 55, 3260, 3260, 54, 3261, 3261,
    55, 3262, 3268, 0, 3269, 3269, 55, 3270, 3272, 0,
    3273, 3273, 55, 3274, 3277, 0, 3278, 3284, 55, 3285,
    3286, 0, 3287, 3293, 54, 3294, 3294, 0, 3295, 3295,
    54, 3296, 3297, 55, 3298, 3299, 0, 3300, 3301, 55,
    3302, 3311, 0, 3312, 3312, 54, 3313, 3314, 0, 3315,
    3329, 55, 3330, 3331, 0, 3332, 3332, 54, 3333, 3340,
    0, 3341, 3341, 54, 3342, 3344, 0, 3345, 3345, 54,
    3346, 3386, 0, 3387, 3388, 54, 3389, 3389, 55, 3390,
    3396, 0, 3397, 3397, 55, 3398, 3400, 0, 3401, 3401,
    55, 3402, 3405, 54, 3406, 3406, 0, 3407, 3414, 55,
    3415, 3415, 0, 3416, 3423, 54, 3424, 3425, 55, 3426,
    3427, 0, 3428, 3429, 55, 3430, 3439, 0, 3440, 3449,
    54, 3450, 3455, 0, 3456, 3457, 55, 3458, 3459, 0,
    3460, 3460, 54, 3461, 3478, 0, 3479, 3481, 54, 3482,
    3505, 0, 3506, 3506, 54, 3507, 3515, 0, 3516, 3516,
    54, 3517, 3517, 0, 3518, 3519, 54, 3520, 3526, 0,
    3527, 3529, 55, 3530, 3530, 0, 3531, 3534, 55, 3535,
    3540, 0, 3541, 3541, 55, 3542, 3542, 0, 3543, 3543,
    55, 3544, 3551, 0, 3552, 3569, 55, 3570, 3571, 0,
    3572, 3584, 54, 3585, 3632, 55, 3633, 3633, 54, 3634,
    3635, 55, 3636, 3642, 0, 3643, 3647, 54, 3648, 3654,
    55, 3655, 3662, 0, 3663, 3663, 55, 3664, 3673, 0,
    3674, 3712, 54, 3713, 3714, 0, 3715, 3715, 54, 3716,
    3716, 0, 3717, 3718, 54, 3719, 3720, 0, 3721, 3721,
    54, 3722, 3722, 0, 3723, 3724, 54, 3725, 3725, 0,
    3726, 3731, 54, 3732, 3735, 0, 3736, 3736, 54, 3737,
    3743, 0, 3744, 3744, 54, 3745, 3747, 0, 3748, 3748,
    54, 3749, 3749, 0, 3750, 3750, 54, 3751, 3751, 0,
    3752, 3753, 54, 3754, 3755, 0, 3756, 3756, 54, 3757,
    3760, 55, 3761, 3761, 54, 3762, 3763, 55, 3764, 3769,
    0, 3770, 3770, 55, 3771, 3772, 54, 3773, 3773, 0,
    3774, 3775, 54, 3776, 3780, 0, 3781, 3781, 54, 3782,
    3782, 0, 3783, 3783, 55, 3784, 3789, 0, 3790, 3791,
    55, 3792, 3801, 0, 3802, 3803, 54, 3804, 3807, 0,
    3808, 3839, 54, 3840, 3840, 0, 3841, 3863, 55, 3864,
    3865, 0, 3866, 3871, 55, 3872, 3881, 0, 3882, 3892,
    55, 3893, 3893, 0, 3894, 3894, 55, 3895, 3895, 0,
    3896, 3896, 55, 3897, 3897, 0, 3898, 3901, 55, 3902,
    3903, 54, 3904, 3911, 0, 3912, 3912, 54, 3913, 3948,
    0, 3949, 3952, 55, 3953, 3972, 0, 3973, 3973, 55,
    3974, 3975, 54, 3976, 3980, 55, 3981, 3991, 0, 3992,
    3992, 55, 3993, 4028, 0, 4029, 4037, 55, 4038, 4038,
    0, 4039, 4095, 54, 4096, 4138, 55, 4139, 4158, 54,
    4159, 4159, 55, 4160, 4169, 0, 4170, 4175, 54, 4176,
    4181, 55, 4182, 4185, 54, 4186, 4189, 55, 4190, 4192,
    54, 4193, 4193, 55, 4194, 4196, 54, 4197, 4198, 55,
    4199, 4205, 54, 4206, 4208, 55, 4209, 4212, 54, 4213,
    4225, 55, 4226, 4237, 54, 4238, 4238, 55, 4239, 4253,
    0, 4254, 4255, 54, 4256, 4293, 0, 4294, 4294, 54,
    4295, 4295, 0, 4296, 4300, 54, 4301, 4301, 0, 4302,
    4303, 54, 4304, 4346, 0, 4347, 4347, 54, 4348, 4680,
    0, 4681, 4681, 54, 4682, 4685, 0, 4686, 4687, 54,
    4688, 4694, 0, 4695, 4695, 54, 4696, 4696, 0, 4697,
    4697, 54, 4698, 4701, 0, 4702, 4703, 54, 4704, 4744,
    0, 4745, 4745, 54, 4746, 4749, 0, 4750, 4751, 54,
    4752, 4784, 0, 4785, 4785, 54, 4786, 4789, 0, 4790,
    4791, 54, 4792, 4798, 0, 4799, 4799, 54, 4800, 4800,
    0, 4801, 4801, 54, 4802, 4805, 0, 4806, 4807, 54,
    4808, 4822, 0, 4823, 4823, 54, 4824, 4880, 0, 4881,
    4881, 54, 4882, 4885, 0, 4886, 4887, 54, 4888, 4954,
    0, 4955, 4956, 55, 4957, 4959, 0, 4960, 4991, 54,
    4992, 5007, 0, 5008, 5023, 54, 5024, 5108, 0, 5109,
    5120, 54, 5121, 5740, 0, 5741, 5742, 54, 5743, 5759,
    0, 5760, 5760, 54, 5761, 5786, 0, 5787, 5791, 54,
    5792, 5866, 0, 5867, 5869, 54, 5870, 5872, 0, 5873,
    5887, 54, 5888, 5900, 0, 5901, 5901, 54, 5902, 5905,
    55, 5906, 5908, 0, 5909, 5919, 54, 5920, 5937, 55,
    5938, 5940, 0, 5941, 5951, 54, 5952, 5969, 55, 5970,
    5971, 0, 5972, 5983, 54, 5984, 5996, 0, 5997, 5997,
    54, 5998, 6000, 0, 6001, 6001, 55, 6002, 6003, 0,
    6004, 6015, 54, 6016, 6067, 55, 6068, 6099, 0, 6100,
    6102, 54, 6103, 6103, 0, 6104, 6107, 54, 6108, 6108,
    55, 6109, 6109, 0, 6110, 6111, 55, 6112, 6121, 0,
    6122, 6154, 55, 6155, 6157, 0, 6158, 6159, 55, 6160,
    6169, 0, 6170, 6175, 54, 6176, 6263, 0, 6264, 6271,
    54, 6272, 6312, 55, 6313, 6313, 54, 6314, 6314, 0,
    6315, 6319, 54, 6320, 6389, 0, 6390, 6399, 54, 6400,
    6428, 0, 6429, 6431, 55, 6432, 6443, 0, 6444, 6447,
    55, 6448, 6459, 0, 6460, 6469, 55, 6470, 6479, 54,
    6480, 6509, 0, 6510, 6511, 54, 6512, 6516, 0, 6517,
    6527, 54, 6528, 6571, 0, 6572, 6575, 55, 6576, 6592,
    54, 6593, 6599, 55, 6600, 6601, 0, 6602, 6607, 55,
    6608, 6617, 0, 6618, 6655, 54, 6656, 6678, 55, 6679,
    6683, 0, 6684, 6687, 54, 6688, 6740, 55, 6741, 6750,
    0, 6751, 6751, 55, 6752, 6780, 0, 6781, 6782, 55,
    6783, 6793, 0, 6794, 6799, 55, 6800, 6809, 0, 6810,
    6822, 54, 6823, 6823, 0, 6824, 6911, 55, 6912, 6916,
    54, 6917, 6963, 55, 6964, 6980, 54, 6981, 6987, 0,
    6988, 6991, 55, 6992, 7001, 0, 7002, 7018, 55, 7019,
    7027, 0, 7028, 7039, 55, 7040, 7042, 54, 7043, 7072,
    55, 7073, 7085, 54, 7086, 7087, 55, 7088, 7097, 54,
    7098, 7141, 55, 7142, 7155, 0, 7156, 7167, 54, 7168,
    7203, 55, 7204, 7223, 0, 7224, 7231, 55, 7232, 7241,
    0, 7242, 7244, 54, 7245, 7247, 55, 7248, 7257, 54,
    7258, 7293, 0, 7294, 7375, 55, 7376, 7378, 0, 7379,
    7379, 55, 7380, 7400, 54, 7401, 7404, 55, 7405, 7405,
    54, 7406, 7409, 55, 7410, 7412, 54, 7413, 7414, 0,
    7415, 7423, 54, 7424, 7615, 55, 7616, 7654, 0, 7655,
    7675, 55, 7676, 7679, 54, 7680, 7957, 0, 7958, 7959,
    54, 7960, 7965, 0, 7966, 7967, 54, 7968, 8005, 0,
    8006, 8007, 54, 8008, 8013, 0, 8014, 8015, 54, 8016,
    8023, 0, 8024, 8024, 54, 8025, 8025, 0, 8026, 8026,
    54, 8027, 8027, 0, 8028, 8028, 54, 8029, 8029, 0,
    8030, 8030, 54, 8031, 8061, 0, 8062, 8063, 54, 8064,
    8116, 0, 8117, 8117, 54, 8118, 8124, 0, 8125, 8125,
    54, 8126, 8126, 0, 8127, 8129, 54, 8130, 8132, 0,
    8133, 8133, 54, 8134, 8140, 0, 8141, 8143, 54, 8144,
    8147, 0, 8148, 8149, 54, 8150, 8155, 0, 8156, 8159,
    54, 8160, 8172, 0, 8173, 8177, 54, 8178, 8180, 0,
    8181, 8181, 54, 8182, 8188, 0, 8189, 8203, 55, 8204,
    8205, 0, 8206, 8254, 55, 8255, 8256, 0, 8257, 8275,
    55, 8276, 8276, 0, 8277, 8304, 54, 8305, 8305, 0,
    8306, 8318, 54, 8319, 8319, 0, 8320, 8335, 54, 8336,
    8348, 0, 8349, 8399, 55, 8400, 8412, 0, 8413, 8416,
    55, 8417, 8417, 0, 8418, 8420, 55, 8421, 8432, 0,
    8433, 8449, 54, 8450, 8450, 0, 8451, 8454, 54, 8455,
    8455, 0, 8456, 8457, 54, 8458, 8467, 0, 8468, 8468,
    54, 8469, 8469, 0, 8470, 8472, 54, 8473, 8477, 0,
    8478, 8483, 54, 8484, 8484, 0, 8485, 8485, 54, 8486,
    8486, 0, 8487, 8487, 54, 8488, 8488, 0, 8489, 8489,
    54, 8490, 8493, 0, 8494, 8494, 54, 8495, 8505, 0,
    8506, 8507, 54, 8508, 8511, 0, 8512, 8516, 54, 8517,
    8521, 0, 8522, 8525, 54, 8526, 8526, 0, 8527, 8543,
    54, 8544, 8584, 0, 8585, 11263, 54, 11264, 11310, 0,
    11311, 11311, 54, 11312, 11358, 0, 11359, 11359, 54, 11360,
    11492, 0, 11493, 11498, 54, 11499, 11502, 55, 11503, 11505,
    54, 11506, 11507, 0, 11508, 11519, 54, 11520, 11557, 0,
    11558, 11558, 54, 11559, 11559, 0, 11560, 11564, 54, 11565,
    11565, 0, 11566, 11567, 54, 11568, 11623, 0, 11624, 11630,
    54, 11631, 11631, 0, 11632, 11646, 55, 11647, 11647, 54,
    11648, 11670, 0, 11671, 11679, 54, 11680, 11686, 0, 11687,
    11687, 54, 11688, 11694, 0, 11695, 11695, 54, 11696, 11702,
    0, 11703, 11703, 54, 11704, 11710, 0, 11711, 11711, 54,
    11712, 11718, 0, 11719, 11719, 54, 11720, 11726, 0, 11727,
    11727, 54, 11728, 11734, 0, 11735, 11735, 54, 11736, 11742,
    0, 11743, 11743, 55, 11744, 11775, 0, 11776, 11822, 54,
    11823, 11823, 0, 11824, 12292, 54, 12293, 12295, 0, 12296,
    12320, 54, 12321, 12329, 55, 12330, 12335, 0, 12336, 12336,
    54, 12337, 12341, 0, 12342, 12343, 54, 12344, 12348, 0,
    12349, 12352, 54, 12353, 12438, 0, 12439, 12440, 55, 12441,
    12442, 0, 12443, 12444, 54, 12445, 12447, 0, 12448, 12448,
    54, 12449, 12538, 0, 12539, 12539, 54, 12540, 12543, 0,
    12544, 12548, 54, 12549, 12589, 0, 12590, 12592, 54, 12593,
    12686, 0, 12687, 12703, 54, 12704, 12730, 0, 12731, 12783,
    54, 12784, 12799, 0, 12800, 13311, 54, 13312, 19893, 0,
    19894, 19967, 54, 19968, 40908, 0, 40909, 40959, 54, 40960,
    42124, 0, 42125, 42191, 54, 42192, 42237, 0, 42238, 42239,
    54, 42240, 42508, 0, 42509, 42511, 54, 42512, 42527, 55,
    42528, 42537, 54, 42538, 42539, 0, 42540, 42559, 54, 42560,
    42606, 55, 42607, 42607, 0, 42608, 42611, 55, 42612, 42621,
    0, 42622, 42622, 54, 42623, 42647, 0, 42648, 42654, 55,
    42655, 42655, 54, 42656, 42735, 55, 42736, 42737, 0, 42738,
    42774, 54, 42775, 42783, 0, 42784, 42785, 54, 42786, 42888,
    0, 42889, 42890, 54, 42891, 42894, 0, 42895, 42895, 54,
    42896, 42899, 0, 42900, 42911, 54, 42912, 42922, 0, 42923,
    42999, 54, 43000, 43009, 55, 43010, 43010, 54, 43011, 43013,
    55, 43014, 43014, 54, 43015, 43018, 55, 43019, 43019, 54,
    43020, 43042, 55, 43043, 43047, 0, 43048, 43071, 54, 43072,
    43123, 0, 43124, 43135, 55, 43136, 43137, 54, 43138, 43187,
    55, 43188, 43204, 0, 43205, 43215, 55, 43216, 43225, 0,
    43226, 43231, 55, 43232, 43249, 54, 43250, 43255, 0, 43256,
    43258, 54, 43259, 43259, 0, 43260, 43263, 55, 43264, 43273,
    54, 43274, 43301, 55, 43302, 43309, 0, 43310, 43311, 54,
    43312, 43334, 55, 43335, 43347, 0, 43348, 43359, 54, 43360,
    43388, 0, 43389, 43391, 55, 43392, 43395, 54, 43396, 43442,
    55, 43443, 43456, 0, 43457, 43470, 54, 43471, 43471, 55,
    43472, 43481, 0, 43482, 43519, 54, 43520, 43560, 55, 43561,
    43574, 0, 43575, 43583, 54, 43584, 43586, 55, 43587, 43587,
    54, 43588, 43595, 55, 43596, 43597, 0, 43598, 43599, 55,
    43600, 43609, 0, 43610, 43615, 54, 43616, 43638, 0, 43639,
    43641, 54, 43642, 43642, 55, 43643, 43643, 0, 43644, 43647,
    54, 43648, 43695, 55, 43696, 43696, 54, 43697, 43697, 55,
    43698, 43700, 54, 43701, 43702, 55, 43703, 43704, 54, 43705,
    43709, 55, 43710, 43711, 54, 43712, 43712, 55, 43713, 43713,
    54, 43714, 43714, 0, 43715, 43738, 54, 43739, 43741, 0,
    43742, 43743, 54, 43744, 43754, 55, 43755, 43759, 0, 43760,
    43761, 54, 43762, 43764, 55, 43765, 43766, 0, 43767, 43776,
    54, 43777, 43782, 0, 43783, 43784, 54, 43785, 43790, 0,
    43791, 43792, 54, 43793, 43798, 0, 43799, 43807, 54, 43808,
    43814, 0, 43815, 43815, 54, 43816, 43822, 0, 43823, 43967,
    54, 43968, 44002, 55, 44003, 44010, 0, 44011, 44011, 55,
    44012, 44013, 0, 44014, 44015, 55, 44016, 44025, 0, 44026,
    44031, 54, 44032, 55203, 0, 55204, 55215, 54, 55216, 55238,
    0, 55239, 55242, 54, 55243, 55291, 0, 55292, 63743, 54,
    63744, 64109, 0, 64110, 64111, 54, 64112, 64217, 0, 64218,
    64255, 54, 64256, 64262, 0, 64263, 64274, 54, 64275, 64279,
    0, 64280, 64284, 54, 64285, 64285, 55, 64286, 64286, 54,
    64287, 64296, 0, 64297, 64297, 54, 64298, 64310, 0, 64311,
    64311, 54, 64312, 64316, 0, 64317, 64317, 54, 64318, 64318,
    0, 64319, 64319, 54, 64320, 64321, 0, 64322, 64322, 54,
    64323, 64324, 0, 64325, 64325, 54, 64326, 64433, 0, 64434,
    64466, 54, 64467, 64829, 0, 64830, 64847, 54, 64848, 64911,
    0, 64912, 64913, 54, 64914, 64967, 0, 64968, 65007, 54,
    65008, 65019, 0, 65020, 65023, 55, 65024, 65039, 0, 65040,
    65055, 55, 65056, 65062, 0, 65063, 65074, 55, 65075, 65076,
    0, 65077, 65100, 55, 65101, 65103, 0, 65104, 65135, 54,
    65136, 65140, 0, 65141, 65141, 54, 65142, 65276, 0, 65277,
    65295, 55, 65296, 65305, 0, 65306, 65312, 54, 65313, 65338,
    0, 65339, 65342, 55, 65343, 65343, 0, 65344, 65344, 54,
    65345, 65370, 0, 65371, 65381, 54, 65382, 65470, 0, 65471,
    65473, 54, 65474, 65479, 0, 65480, 65481, 54, 65482, 65487,
    0, 65488, 65489, 54, 65490, 65495, 0, 65496, 65497, 54,
    65498, 65500, 0, 65501, Infinity,
];
var jjlexisEnd0 = [
    0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0,
    1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1,
    0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0,
    1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0,
    0, 1, 1,
];
var jjlexhasArc0 = [
    1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1,
    1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
    1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
    1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1,
    0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1,
    1, 0, 0,
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
    4, 5, 1, 1, 7, 32, 37, 7, 38, 39,
    9, 39, 39, 39, 39, 39, 39, 39, 39, 39,
    39, 39, -1, -1, 40, 41, 7, 32, 37, 7,
    38, 39, 9, 39, 39, 39, 39, 39, 39, 39,
    39, 39, 39, 39, -1, -1, 40, 41, 7, 32,
    37, 7, 38, 39, 9, 39, 39, 39, 39, 39,
    39, 39, 39, 39, 39, 39, -1, -1, 40, 41,
    7, 32, 37, 7, 38, 39, 9, 39, 39, 39,
    39, 39, 39, 39, 39, 39, 39, 39, -1, -1,
    40, 41, 7, 32, 37, 7, 38, 39, 9, 39,
    39, 39, 39, 39, 39, 39, 39, 39, 39, 39,
    -1, -1, 40, 41, 7, 32, 37, 7, 38, 39,
    9, 39, 39, 39, 39, 39, 39, 39, 39, 39,
    39, 39, -1, -1, 40, 41, 7, 28, 7, 7,
    7, 29, 9, 29, 29, 29, 29, 29, 29, 29,
    29, 29, 29, 29, -1, -1, 30, 7, 7, 8,
    7, 7, 7, 7, 9, 7, 7, 7, 10, 7,
    7, 7, 11, 7, 7, 12, -1, -1, 7, 7,
    7, -1, 7, 7, 7, 7, 9, 7, 7, 42,
    7, 7, 7, 7, 7, 7, 7, 7, -1, -1,
    7, 7, 7, -1, 7, 7, 7, 7, 9, 7,
    7, 7, 31, 7, 7, 7, 7, 7, 7, 7,
    -1, -1, 7, 7, 7, -1, 7, 7, 7, 7,
    9, 7, 7, 7, 7, 7, 7, 7, 7, 27,
    7, 7, -1, -1, 7, 7, 7, -1, 7, 7,
    7, 7, 9, 7, 7, 7, 7, 26, 7, 7,
    7, 7, 7, 7, -1, -1, 7, 7, 7, -1,
    7, 25, 7, 7, 9, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, -1, -1, 7, 7,
    7, -1, 7, 7, 7, 7, 9, 7, 7, 7,
    24, 7, 7, 7, 7, 7, 7, 7, -1, -1,
    7, 7, 7, -1, 7, 7, 7, 7, 9, 7,
    23, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    -1, -1, 7, 7, 7, -1, 7, 7, 7, 7,
    9, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 22, -1, -1, 7, 7, 7, -1, 7, 7,
    7, 7, 9, 7, 7, 7, 7, 7, 7, 21,
    7, 7, 7, 7, -1, -1, 7, 7, 7, -1,
    7, 7, 7, 7, 9, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 20, -1, -1, 7, 7,
    7, -1, 7, 7, 7, 7, 9, 7, 7, 7,
    7, 7, 19, 7, 7, 7, 7, 7, -1, -1,
    7, 7, 7, -1, 7, 7, 7, 7, 9, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    -1, -1, 7, 7, 1, -1, 1, 1, 1, 1,
    6, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, -1, -1, 1, 1, 7, -1, 7, 7,
    7, 7, 9, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 18, 7, -1, -1, 7, 7, 7, -1,
    7, 7, 7, 7, 9, 17, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, -1, -1, 7, 7,
    7, -1, 7, 7, 7, 7, 9, 7, 7, 7,
    7, 7, 7, 7, 16, 7, 7, 7, -1, -1,
    7, 7, 15, -1, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    -1, -1, 15, 15, 7, -1, 7, 7, 7, 7,
    9, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, -1, -1, 7, 7, 13, -1, 13, 13,
    13, 13, 13, 13, 13, 13, 13, 13, 13, 13,
    13, 13, 13, 13, -1, -1, 13, 13, 1, -1,
    1, 1, 1, 1, 6, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, -1, -1, 1, 1,
    32, 33, -1, 34, 32, -1, 32, 32, 32, 32,
    32, 32, 32, 32, 32, 32, 32, -1, -1, 35,
    36, 32, 33, -1, 34, 32, -1, 32, 32, 32,
    32, 32, 32, 32, 32, 32, 32, 32, -1, -1,
    35, 36, 32, 33, -1, 34, 32, -1, 32, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, -1,
    -1, 35, 36, 32, 33, -1, 34, 32, -1, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    -1, -1, 35, 36, 32, 33, -1, 34, 32, -1,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    32, -1, -1, 35, 36,
];
var jjlexdisnext2 = [
    22, 638, 198, 0, -22, -22, 616, 594, -22, 572,
    550, 528, 506, 484, -22, 462, 440, 418, 396, 374,
    352, 330, 308, 286, 264, 176, 242, -22, 743, 154,
    132, 220, 722, 701, -22, 680, 659, 110, -22, 88,
    66, 44, -22,
];
var jjlexchecknext2 = [
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 41, 41, 41, 41, 41, 41,
    41, 41, 41, 41, 41, 41, 41, 41, 41, 41,
    41, 41, -1, -1, 41, 41, 40, 40, 40, 40,
    40, 40, 40, 40, 40, 40, 40, 40, 40, 40,
    40, 40, 40, 40, -1, -1, 40, 40, 39, 39,
    39, 39, 39, 39, 39, 39, 39, 39, 39, 39,
    39, 39, 39, 39, 39, 39, -1, -1, 39, 39,
    37, 37, 37, 37, 37, 37, 37, 37, 37, 37,
    37, 37, 37, 37, 37, 37, 37, 37, -1, -1,
    37, 37, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    -1, -1, 30, 30, 29, 29, 29, 29, 29, 29,
    29, 29, 29, 29, 29, 29, 29, 29, 29, 29,
    29, 29, -1, -1, 29, 29, 25, 25, 25, 25,
    25, 25, 25, 25, 25, 25, 25, 25, 25, 25,
    25, 25, 25, 25, -1, -1, 25, 25, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, -1, -1, 2, 2,
    31, -1, 31, 31, 31, 31, 31, 31, 31, 31,
    31, 31, 31, 31, 31, 31, 31, 31, -1, -1,
    31, 31, 26, -1, 26, 26, 26, 26, 26, 26,
    26, 26, 26, 26, 26, 26, 26, 26, 26, 26,
    -1, -1, 26, 26, 24, -1, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, -1, -1, 24, 24, 23, -1, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, -1, -1, 23, 23, 22, -1,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, -1, -1, 22, 22,
    21, -1, 21, 21, 21, 21, 21, 21, 21, 21,
    21, 21, 21, 21, 21, 21, 21, 21, -1, -1,
    21, 21, 20, -1, 20, 20, 20, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
    -1, -1, 20, 20, 19, -1, 19, 19, 19, 19,
    19, 19, 19, 19, 19, 19, 19, 19, 19, 19,
    19, 19, -1, -1, 19, 19, 18, -1, 18, 18,
    18, 18, 18, 18, 18, 18, 18, 18, 18, 18,
    18, 18, 18, 18, -1, -1, 18, 18, 17, -1,
    17, 17, 17, 17, 17, 17, 17, 17, 17, 17,
    17, 17, 17, 17, 17, 17, -1, -1, 17, 17,
    16, -1, 16, 16, 16, 16, 16, 16, 16, 16,
    16, 16, 16, 16, 16, 16, 16, 16, -1, -1,
    16, 16, 15, -1, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    -1, -1, 15, 15, 13, -1, 13, 13, 13, 13,
    13, 13, 13, 13, 13, 13, 13, 13, 13, 13,
    13, 13, -1, -1, 13, 13, 12, -1, 12, 12,
    12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
    12, 12, 12, 12, -1, -1, 12, 12, 11, -1,
    11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
    11, 11, 11, 11, 11, 11, -1, -1, 11, 11,
    10, -1, 10, 10, 10, 10, 10, 10, 10, 10,
    10, 10, 10, 10, 10, 10, 10, 10, -1, -1,
    10, 10, 9, -1, 9, 9, 9, 9, 9, 9,
    9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
    -1, -1, 9, 9, 7, -1, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, -1, -1, 7, 7, 6, -1, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, -1, -1, 6, 6, 1, -1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, -1, -1, 1, 1,
    36, 36, -1, 36, 36, -1, 36, 36, 36, 36,
    36, 36, 36, 36, 36, 36, 36, -1, -1, 36,
    36, 35, 35, -1, 35, 35, -1, 35, 35, 35,
    35, 35, 35, 35, 35, 35, 35, 35, -1, -1,
    35, 35, 33, 33, -1, 33, 33, -1, 33, 33,
    33, 33, 33, 33, 33, 33, 33, 33, 33, -1,
    -1, 33, 33, 32, 32, -1, 32, 32, -1, 32,
    32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
    -1, -1, 32, 32, 28, 28, -1, 28, 28, -1,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    28, -1, -1, 28, 28,
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
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
    1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1,
];
var jjlexhasArc2 = [
    1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1,
    1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0,
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
    -1, -1, -1, -1, 1, -1, -1, 24, 25, 30,
    31, 39, 32, -1, 33, 35, 23, 26, 22, 29,
    27, 28, 38, 3, 37, 4, 1, -1, 2, -1,
    -1, 1, 1, 1, 1, 36, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, 2, -1,
    -1, -1, 34, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, 6, -1, -1, -1, -1, -1,
    -1, -1, 11, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, 17, -1, 8, -1, -1, -1,
    16, -1, -1, 15, -1, -1, 14, -1, -1, -1,
    20, -1, -1, -1, 9, 7, 21, -1, 12, 19,
    -1, 5, 18, -1, -1, -1, 10, 13,
];
var jjlexTokens1 = [
    -1, 40, -1, 3, 4, -1, 40, 40,
];
var jjlexTokens2 = [
    -1, 40, 40, -1, 3, 4, -1, 40, 41, -1,
    40, 40, 40, 40, 40, 40, 40, 40, 40, 40,
    40, 40, 40, 40, 40, 40, 40, 42, -1, 40,
    40, 40, -1, -1, 44, -1, -1, 40, 44, 40,
    40, 40, 43,
];
var jjlexTokens3 = [
    -1, 40,
];
var jjtokenCount = 45;
var jjactERR = 209;
var jjpact = [
    9, 7, 15, 16, 17, 18, 202, 10, 11, 116,
    12, 171, 13, 14, 193, 207, 123, 112, 201, 193,
    204, 135, -57, 117, 198, -57, 132, 133, 170, 134,
    123, 5, 169, 167, 98, 135, 168, -57, 111, 197,
    132, 133, -42, 134, 179, 180, 178, -58, 160, -95,
    -58, 188, 189, 190, 191, 192, 188, 189, 190, 191,
    192, -42, -58, 109, 112, 72, 107, 174, -95, -109,
    -95, -109, 72, 69, 27, 112, 27, 112, 146, 80,
    104, 74, 78, 75, 66, 111, 56, 50, 51, 55,
    22, 195, 186, 160, 184, 183, 111, 145, 111, 106,
    173, 67, 71, 172, 164, 163, 129, 123, 150, 71,
    149, 148, 147, 143, -42, 139, 138, 137, 106, 129,
    106, 126, -102, 124, 120, 37, 119, 118, 113, 102,
    101, 96, 92, 90, 89, 83, 82, 77, 73, 68,
    61, 59, 58, 54, 52, 47, 46, 30, 41, 36,
    34, 30, 30, 30, 30, 28, 22, 4,
];
var jjdisact = [
    -45, 157, -5, -45, 155, -45, -45, 75, 152, 151,
    150, 149, 148, 148, 126, -45, -45, -45, 89, -45,
    -45, -45, 125, 73, -45, -45, -45, -45, -45, -45,
    -45, -45, 144, -45, 123, 144, -45, -45, 54, 141,
    142, -45, 85, -45, -45, 141, 119, 100, -45, -45,
    -45, -45, 62, -45, -45, 113, 69, 116, -45, -45,
    -45, 46, -45, 126, 78, -45, 135, 133, -45, -45,
    -45, -45, -45, -45, -45, 120, 109, -45, -45, -45,
    109, -45, -45, -45, -45, -45, 115, 33, -45, 129,
    103, 79, 62, -45, 34, 62, -45, 102, 15, -16,
    -45, 104, 104, 91, -45, -45, -45, -45, -45, -45,
    122, -45, 121, -45, -45, -45, 120, 100, 86, 98,
    -45, -45, -45, 95, 115, -45, 93, -45, 87, 91,
    -45, 111, -45, 110, 108, -45, -45, -45, -45, -45,
    81, 86, 73, -45, -45, 9, -45, -45, -45, -5,
    -45, 102, -45, 67, 25, -45, 9, 64, -45, 68,
    -45, 39, -45, -45, -45, 15, -45, 59, 94, 70,
    -45, 91, 90, -45, -45, 0, -45, -45, -45, -45,
    66, 46, 17, 22, -45, -45, -45, -45, -45, -45,
    -45, -45, -45, -45, -45, -10, -45, -19, -45, 16,
    -45, -45, -45, -45, 11, -45, -45, -45,
];
var jjcheckact = [
    2, 2, 2, 2, 2, 2, 197, 2, 2, 99,
    2, 156, 2, 2, 204, 204, 149, 98, 195, 199,
    199, 149, 175, 99, 183, 175, 149, 149, 156, 149,
    145, 2, 156, 156, 87, 145, 156, 175, 98, 182,
    145, 145, 98, 145, 165, 165, 165, 154, 181, 87,
    154, 204, 204, 204, 204, 204, 199, 199, 199, 199,
    199, 94, 154, 95, 95, 92, 92, 161, 87, 94,
    87, 94, 56, 56, 23, 23, 7, 7, 161, 64,
    91, 61, 64, 61, 52, 95, 42, 38, 38, 42,
    18, 180, 172, 171, 169, 168, 23, 167, 7, 91,
    159, 52, 92, 157, 153, 151, 142, 141, 140, 56,
    134, 133, 131, 129, 128, 126, 124, 123, 119, 118,
    117, 116, 112, 110, 103, 18, 102, 101, 97, 90,
    89, 86, 80, 76, 75, 67, 66, 63, 57, 55,
    47, 46, 45, 40, 39, 35, 34, 32, 22, 14,
    13, 12, 11, 10, 9, 8, 4, 1,
];
var jjdefred = [
    4, -1, -1, 0, -1, 3, 5, -1, -1, -1,
    -1, -1, -1, -1, -1, 19, 20, 21, -1, 80,
    81, 82, 29, 7, 23, 24, 25, 27, 9, 112,
    10, 11, -1, 13, 14, -1, 1, 79, -1, -1,
    -1, 22, -1, 116, 12, -1, -1, 17, 88, 84,
    85, 33, -1, 30, 8, -1, -1, -1, 16, 2,
    18, -1, 87, 91, 38, 28, -1, -1, 113, 115,
    117, 118, 15, 83, 88, 97, -1, 6, 32, 34,
    -1, 31, 26, 114, 116, 86, 107, 99, 95, -1,
    -1, 54, -1, 89, 43, -1, 96, 100, 43, -1,
    93, -1, -1, -1, 52, 54, 119, 109, 110, 111,
    -1, 106, 98, 103, 104, 90, -1, 54, 40, 54,
    53, 120, 125, -1, -1, 92, -1, 36, 43, -1,
    46, -1, 48, -1, -1, 51, 105, 102, 35, 39,
    -1, 126, 40, 60, 71, 126, 47, 49, 50, 126,
    44, -1, 37, 55, 60, 59, -1, 73, 76, 77,
    45, -1, 121, 60, 58, 65, 54, 72, -1, -1,
    70, -1, -1, 42, 122, 60, 61, 62, 63, 64,
    -1, 74, -1, -1, 75, 78, 127, 129, 130, 131,
    132, 133, 134, 128, 66, -1, 68, -1, 135, -1,
    67, 69, 128, 123, -1, 124, 136, 137,
];
var jjpgoto = [
    5, 186, 186, 165, 7, 107, 140, 141, 161, 130,
    160, 114, 140, 141, 102, 104, 143, 98, 96, 69,
    39, 23, 24, 164, 156, 176, 164, 156, 109, 69,
    93, 94, 75, 48, 41, 22, 205, 202, 195, 157,
    158, 193, 184, 181, 113, 139, 140, 141, 135, 135,
    127, 99, 151, 151, 86, 87, 78, 32, 80, 37,
    20, 31, 30, 28, 25, 152, 150, 129, 104, 143,
    151, 126, 104, 143, 124, 90, 25, 85, 63, 64,
    59, 52, 44, 38, 34, 18, 19, 20, 1, 207,
    2, 204, 199, 198, 180, 143, 175, 155, 156, 174,
    153, 154, 155, 156, 121, 120, 143, 92, 84, 83,
    61, 62, 63, 56, 47, 43, 42,
];
var jjdisgoto = [
    87, -72, -4, -72, 48, -72, 30, 12, -72, 8,
    7, 6, 2, -72, 78, -72, -72, -72, 21, -72,
    -72, 43, 8, 24, -72, -72, -72, 105, -72, 59,
    -72, -72, 27, -72, -72, -72, 112, -72, -8, -72,
    68, -72, -72, 55, -72, -72, -72, 73, 68, -72,
    -72, 65, -72, -72, -72, -72, -40, -72, -72, -72,
    -72, -72, -72, -13, 41, -72, -72, -72, 52, -72,
    -72, 48, -72, -72, 34, 7, -72, -72, -72, 59,
    -72, -72, -72, -72, 49, -72, -23, -32, -72, 5,
    -72, -10, -30, -72, -14, -24, -72, -72, -8, -72,
    -72, -72, -72, -72, -72, 80, 43, -72, -72, -72,
    -72, -72, 23, -72, -72, -72, -72, 47, 32, 43,
    -72, -72, -72, -72, -72, -72, -72, -72, 26, -72,
    -72, -72, -72, -72, -72, -72, -72, -72, -72, -72,
    -72, 4, 47, 73, -72, -13, -72, -72, -72, -14,
    -72, -72, -72, -72, -3, -72, -29, -72, -72, -72,
    -72, -72, 36, 68, -72, -6, 69, 10, -72, -72,
    -72, 6, -72, -72, -23, -6, -72, -72, -72, -72,
    -72, 4, -72, -72, -72, -72, -72, -72, -72, -72,
    -72, -72, 24, 25, -72, -72, -72, -72, -33, -66,
    -72, -72, 24, -29, -67, -72, 18, -72,
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
    2, 2, 0, 0, 5, 2, 0, 1, 0, 0,
    5, 0, 0, 0, 7, 1, 0, 2, 0, 1,
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
    54, 54, 56, 57, 55, 58, 58, 59, 60, 61,
    59, 63, 64, 65, 62, 66, 66, 67, 67, 68,
    68, 68, 68, 68, 69, 70, 71, 68,
];
var jjtokenNames = [
    "EOF", "NAME", "STRING",
    "OPEN_BLOCK", "CLOSE_BLOCK", "OPT_DIR",
    "LEX_DIR", "TOKEN_DIR", "LEFT_DIR",
    "RIGHT_DIR", "NONASSOC_DIR", "USE_DIR",
    "HEADER_DIR", "EXTRA_ARG_DIR", "EMPTY",
    "TYPE_DIR", "PREC_DIR", "INIT_DIR",
    "OUTPUT_DIR", "IMPORT_DIR", "LEAST_DIR",
    "ALWAYS", "GT", "LT",
    "BRA", "KET", "EQU",
    "CBRA", "CKET", "QUESTION",
    "STAR", "PLUS", "DASH",
    "COLON", "ARROW", "EOL",
    "SEPERATOR", "OR", "WEDGE",
    "COMMA", "ANY_CODE", "LHS_REF",
    "TOKEN_REF", "MATCHED", "EMIT_TOKEN",
];
var jjtokenAlias = [
    null, null, null,
    "{", "}", "%option",
    "%lex", "%token", "%left",
    "%right", "%nonassoc", "%use",
    "%header", "%extra_arg", "%empty",
    "%type", "%prec", "%init",
    "%output", "%import", "%least",
    "%always", ">", "<",
    "(", ")", "=",
    "[", "]", "?",
    "*", "+", "-",
    ":", "=>", ";",
    "%%", "|", "^",
    ",", null, "$$",
    "$token", "$matched", null,
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


var LineTerm;
(function (LineTerm) {
    LineTerm[LineTerm["NONE"] = 1] = "NONE";
    LineTerm[LineTerm["AUTO"] = 2] = "AUTO";
    LineTerm[LineTerm["CR"] = 3] = "CR";
    LineTerm[LineTerm["LF"] = 4] = "LF";
    LineTerm[LineTerm["CRLF"] = 5] = "CRLF";
})(LineTerm || (LineTerm = {}));

function createParser() {
    var jjlexState;
    var jjstate;
    var jjlastCR;
    var jjmatched;
    var jjmarker = { state: -1, line: 0, column: 0 };
    var jjbackupCount;
    var jjline;
    var jjcolumn;
    var jjtline;
    var jjtcolumn;
    var jjlrState;
    var jjsematicS;
    var jjinput;
    var jjsematicVal;
    var jjtokenQueue;
    var jjtoken;
    var jjstop;
    var jjtokenEmitted;
    var jjenableBlock;
    var jjlineTerm;
    var jjhandlers = {};
    var gb;
    var assoc;
    var lexact;
    var ruleLhs;
    var least;
    var always;
    return {
        init: init,
        on: on,
        setLineTerminator: setLineTerminator,
        getLineTerminator: function () { return jjlineTerm; },
        accept: accept,
        end: end,
        load: load,
        nextToken: nextToken,
        halt: halt,
        enableBlocks: enableBlocks,
        disableBlocks: disableBlocks,
        loadParserState: loadParserState,
        getParserState: getParserState
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
        jjtokenQueue = [];
        jjenableBlock = true;
        jjlineTerm = LineTerm.AUTO;
        jjlastCR = false;
        gb = b;
        jjtryReduce();
    }
    function load(i) {
        jjinput = i;
    }
    function nextToken() {
        jjtokenEmitted = false;
        while (!jjstop && !jjtokenEmitted) {
            var c = jjinput.current();
            if (c !== null) {
                jjacceptChar(c);
            }
            else if (jjinput.isEof()) {
                if (jjacceptEOF()) {
                    break;
                }
            }
            else {
                return null;
            }
        }
        return jjtoken;
    }
    function setLineTerminator(lt) {
        jjlineTerm = lt;
    }
    function enableBlocks() {
        jjenableBlock = true;
    }
    function disableBlocks() {
        jjenableBlock = false;
    }
    function accept(s) {
        var i = 0;
        load({
            current: function () { return i < s.length ? s.charCodeAt(i) : null; },
            next: function () { return i++; },
            isEof: function () { return i >= s.length; },
            backup: function (t) { return i -= t.length; }
        });
        while (nextToken().id !== 0)
            ;
    }
    function end() {
    }
    function halt() {
        jjstop = true;
    }
    function loadParserState(state) {
        jjlexState = state.lexState;
        jjlrState = state.lrState;
        jjsematicS = state.sematicS;
    }
    function getParserState() {
        return {
            lexState: jjlexState,
            lrState: jjlrState,
            sematicS: jjsematicS
        };
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
        jjtokenQueue.push(jjtoken);
        jjtokenEmitted = true;
        jjmatched = '';
        jjtline = jjline;
        jjtcolumn = jjcolumn;
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
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 23:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 25:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 26:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 28:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                    jjsematicVal.val = unescape(jjsematicVal.val.substr(1, jjsematicVal.val.length - 2));
                }
                break;
            case 30:
                jjsetImg("");
                break;
            case 31:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 32:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 33:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 34:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 48:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                    jjsematicVal.val = unescape(jjsematicVal.val.substr(1, jjsematicVal.val.length - 2));
                }
                break;
            case 51:
                jjsetImg("");
                break;
            case 96:
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
                if (jjenableBlock) {
                    jjsematicVal = newNode(jjtoken.val);
                }
                break;
            case 3:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 4:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 6:
                if (jjenableBlock) {
                    jjsematicVal = newNode(jjtoken.val);
                }
                break;
            case 7:
                if (jjenableBlock) {
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
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 2:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 4:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 5:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromTrivalToken(jjtoken);
                }
                break;
            case 7:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 10:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 11:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 12:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 13:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 14:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                    jjsematicVal.val = jjsematicVal.val.charAt(1);
                }
                break;
            case 15:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 16:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 17:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 18:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 19:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 20:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 21:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 22:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 23:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 24:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 25:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 26:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 29:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 30:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 31:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 34:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                    jjsematicVal.val = jjsematicVal.val.substr(6, jjsematicVal.val.length - 7);
                }
                break;
            case 37:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 38:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                    jjsematicVal.val = jjsematicVal.val.substr(6, jjsematicVal.val.length - 7);
                }
                break;
            case 39:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 40:
                if (jjenableBlock) {
                    jjsematicVal = nodeFromToken(jjtoken);
                }
                break;
            case 41:
                if (jjenableBlock) {
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
                if (jjenableBlock) {
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
        jjtokenQueue.length > 0 && jjacceptToken(null);
    }
    function jjrollback() {
        var ret = jjmatched.substr(jjmatched.length - jjbackupCount, jjbackupCount);
        jjinput.backup(ret);
        jjmatched = jjmatched.substr(0, jjmatched.length - jjbackupCount);
        jjbackupCount = 0;
        jjline = jjmarker.line;
        jjcolumn = jjmarker.column;
        jjstate = jjmarker.state;
        jjmarker.state = -1;
    }
    function jjmark() {
        jjmarker.state = jjstate;
        jjmarker.line = jjline;
        jjmarker.column = jjcolumn;
        jjbackupCount = 0;
    }
    function jjconsume(c) {
        switch (jjlineTerm) {
            case LineTerm.NONE:
                jjcolumn += c > 0xff ? 2 : 1;
                break;
            case LineTerm.CR:
                c === jjcr ? (jjline++, jjcolumn = 0) : (jjcolumn += c > 0xff ? 2 : 1);
                break;
            case LineTerm.LF:
                c === jjlf ? (jjline++, jjcolumn = 0) : (jjcolumn += c > 0xff ? 2 : 1);
                break;
            case LineTerm.CRLF:
                if (jjlastCR) {
                    if (c === jjlf) {
                        jjline++, jjcolumn = 0;
                        jjlastCR = false;
                    }
                    else {
                        jjcolumn += c > 0xff ? 2 : 1;
                        jjlastCR = c === jjcr;
                    }
                }
                else {
                    jjcolumn += c > 0xff ? 2 : 1;
                    jjlastCR = c === jjcr;
                }
                break;
            case LineTerm.AUTO:
                if (jjlastCR) {
                    if (c === jjlf) {
                        jjline++, jjcolumn = 0;
                        jjlastCR = false;
                        jjlineTerm = LineTerm.CRLF;
                    }
                    else {
                        jjline++, jjcolumn = 0;
                        jjlineTerm = LineTerm.CR;
                        c === jjcr ? (jjline++, jjcolumn = 0) : (jjcolumn += c > 0xff ? 2 : 1);
                    }
                }
                else if (c === jjlf) {
                    jjline++, jjcolumn = 0;
                    jjlineTerm = LineTerm.LF;
                }
                else {
                    jjcolumn += c > 0xff ? 2 : 1;
                    jjlastCR = c === jjcr;
                }
                break;
        }
        jjmatched += String.fromCharCode(c);
        jjmarker.state !== -1 && (jjbackupCount++);
        jjinput.next();
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
                }
                else {
                    jjmark();
                    jjstate = nstate;
                    jjconsume(ccode);
                }
            }
            else {
                jjdoLexAction(lexstate, jjstate);
                jjmarker.state = -1;
                jjbackupCount = 0;
                jjstate = 0;
            }
        }
        else {
            if (nstate === -1) {
                if (jjmarker.state !== -1) {
                    jjrollback();
                    jjdoLexAction(lexstate, jjstate);
                    jjstate = 0;
                }
                else {
                    jjemit('lexicalerror', String.fromCharCode(ccode), jjline, jjcolumn);
                    jjconsume(ccode);
                }
            }
            else {
                jjstate = nstate;
                jjconsume(ccode);
            }
        }
    }
    function jjacceptEOF() {
        if (jjstate === 0) {
            jjprepareToken(0);
            jjacceptToken(null);
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
                jjrollback();
                jjdoLexAction(lexstate, jjstate);
                jjstate = 0;
                return false;
            }
            else {
                jjemit('lexicalerror', '', jjline, jjcolumn);
                return true;
            }
        }
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
                if (jjenableBlock) {
                    gb.lexBuilder.prepareLex();
                }
                break;
            case 7:
                if (jjenableBlock) {
                    gb.incPr();
                }
                break;
            case 9:
                var b = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.setHeader(b);
                }
                break;
            case 10:
                var b = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.setExtraArg(b);
                }
                break;
            case 11:
                var ty = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.setType(ty);
                }
                break;
            case 12:
                var args = jjsematicS[jjsp - 2];
                var b = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.setInit(args, b);
                }
                break;
            case 13:
                var op = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.setOutput(op);
                }
                break;
            case 15:
                var t = jjsematicS[jjsp - 2];
                if (jjenableBlock) {
                    gb.defToken(t, null);
                }
                break;
            case 16:
                var t = jjsematicS[jjsp - 2];
                if (jjenableBlock) {
                    gb.defToken(t, null);
                }
                break;
            case 18:
                var ep = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.setEpilogue(ep);
                }
                break;
            case 19:
                if (jjenableBlock) {
                    assoc = exports.Assoc.LEFT;
                }
                break;
            case 20:
                if (jjenableBlock) {
                    assoc = exports.Assoc.RIGHT;
                }
                break;
            case 21:
                if (jjenableBlock) {
                    assoc = exports.Assoc.NON;
                }
                break;
            case 24:
                var t = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.defineTokenPrec(t, assoc, t.ext);
                }
                break;
            case 25:
                var t = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.defineTokenPrec(t, assoc, TokenRefType.NAME);
                }
                break;
            case 26:
                var name = jjsematicS[jjsp - 3];
                var val = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.setOpt(name, val);
                }
                break;
            case 29:
                if (jjenableBlock) {
                    gb.lexBuilder.selectState('DEFAULT');
                }
                break;
            case 30:
                var s = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.lexBuilder.selectState(s.val);
                }
                break;
            case 31:
                var s = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.lexBuilder.selectState(s.val);
                }
                break;
            case 34:
                var v = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.lexBuilder.prepareVar(v);
                }
                break;
            case 35:
                var v = jjsematicS[jjsp - 6];
                if (jjenableBlock) {
                    gb.lexBuilder.endVar();
                }
                break;
            case 36:
                if (jjenableBlock) {
                    gb.lexBuilder.end(lexact, least, '(untitled)');
                }
                break;
            case 37:
                var tn = jjsematicS[jjsp - 5];
                if (jjenableBlock) {
                    var tdef = gb.defToken(tn, gb.lexBuilder.getPossibleAlias());
                    lexact.returnToken(tdef);
                    gb.lexBuilder.end(lexact, least, tn.val);
                }
                break;
            case 38:
                if (jjenableBlock) {
                    gb.lexBuilder.newState();
                }
                break;
            case 40:
                if (jjenableBlock) {
                    lexact = new LexAction();
                }
                break;
            case 41:
                if (jjenableBlock) {
                    lexact = new LexAction();
                }
                break;
            case 43:
                if (jjenableBlock) {
                    lexact = new LexAction();
                }
                break;
            case 47:
                var vn = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.addPushStateAction(lexact, vn);
                    lexact.raw('; ');
                }
                break;
            case 48:
                if (jjenableBlock) {
                    lexact.popState();
                    lexact.raw('; ');
                }
                break;
            case 49:
                var sn = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.addSwitchToStateAction(lexact, sn);
                    lexact.raw('; ');
                }
                break;
            case 50:
                var s = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    lexact.setImg(s.val);
                    lexact.raw('; ');
                }
                break;
            case 52:
                if (jjenableBlock) {
                    least = false;
                }
                break;
            case 53:
                if (jjenableBlock) {
                    least = true;
                }
                break;
            case 54:
                if (jjenableBlock) {
                    gb.lexBuilder.enterUnion();
                }
                break;
            case 55:
                if (jjenableBlock) {
                    gb.lexBuilder.leaveUnion();
                }
                break;
            case 56:
                if (jjenableBlock) {
                    gb.lexBuilder.endUnionItem();
                }
                break;
            case 57:
                if (jjenableBlock) {
                    gb.lexBuilder.endUnionItem();
                }
                break;
            case 60:
                if (jjenableBlock) {
                    gb.lexBuilder.enterSimple();
                }
                break;
            case 61:
                var suffix = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.lexBuilder.simplePostfix(suffix.val);
                }
                break;
            case 62:
                if (jjenableBlock) {
                    jjtop = newNode('+');
                }
                break;
            case 63:
                if (jjenableBlock) {
                    jjtop = newNode('?');
                }
                break;
            case 64:
                if (jjenableBlock) {
                    jjtop = newNode('*');
                }
                break;
            case 65:
                if (jjenableBlock) {
                    jjtop = newNode('');
                }
                break;
            case 68:
                var n = jjsematicS[jjsp - 2];
                if (jjenableBlock) {
                    gb.lexBuilder.addVar(n);
                }
                break;
            case 69:
                var i = jjsematicS[jjsp - 2];
                if (jjenableBlock) {
                    gb.lexBuilder.importVar(i);
                }
                break;
            case 70:
                var s = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.lexBuilder.addString(s.val);
                }
                break;
            case 71:
                if (jjenableBlock) {
                    gb.lexBuilder.beginSet(true);
                }
                break;
            case 72:
                if (jjenableBlock) {
                    gb.lexBuilder.beginSet(false);
                }
                break;
            case 77:
                var s = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.lexBuilder.addSetItem(s, s);
                }
                break;
            case 78:
                var from = jjsematicS[jjsp - 3];
                var to = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.lexBuilder.addSetItem(from, to);
                }
                break;
            case 82:
                var n = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    ruleLhs = n;
                }
                break;
            case 88:
                if (jjenableBlock) {
                    gb.prepareRule(ruleLhs);
                }
                break;
            case 89:
                if (jjenableBlock) {
                    gb.commitRule();
                }
                break;
            case 92:
                var vn = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.addRuleUseVar(vn);
                }
                break;
            case 93:
                var vn = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.addRuleUseVar(vn);
                }
                break;
            case 98:
                var itn = jjsematicS[jjsp - 2];
                if (jjenableBlock) {
                    gb.addRuleSematicVar(itn);
                }
                break;
            case 100:
                var t = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.addRuleItem(t, TokenRefType.NAME);
                }
                break;
            case 101:
                var vn = jjsematicS[jjsp - 2];
                if (jjenableBlock) {
                    gb.addRuleSematicVar(vn);
                }
                break;
            case 102:
                var vn = jjsematicS[jjsp - 4];
                var t = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.addRuleItem(t, TokenRefType.NAME);
                }
                break;
            case 103:
                var t = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.addRuleItem(t, t.ext);
                }
                break;
            case 104:
                if (jjenableBlock) {
                    gb.addAction(lexact);
                }
                break;
            case 105:
                var t = jjsematicS[jjsp - 2];
                if (jjenableBlock) {
                    jjtop = t;
                    jjtop.ext = TokenRefType.TOKEN;
                }
                break;
            case 106:
                if (jjenableBlock) {
                    jjtop.ext = TokenRefType.STRING;
                }
                break;
            case 109:
                if (jjenableBlock) {
                    gb.addAction(lexact);
                }
                break;
            case 110:
                var t = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.defineRulePr(t, TokenRefType.NAME);
                }
                break;
            case 111:
                var t = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.defineRulePr(t, t.ext);
                }
                break;
            case 112:
                var open = jjsematicS[jjsp - 1];
                jjlexState.push(1);
                break;
            case 113:
                var open = jjsematicS[jjsp - 4];
                var bl = jjsematicS[jjsp - 2];
                var close = jjsematicS[jjsp - 1];
                jjlexState.pop();
                break;
            case 114:
                var open = jjsematicS[jjsp - 5];
                var bl = jjsematicS[jjsp - 3];
                var close = jjsematicS[jjsp - 2];
                if (jjenableBlock) {
                    jjtop = nodeBetween(open, close, bl.val);
                }
                break;
            case 115:
                var b = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    jjtop.val += b.val;
                }
                break;
            case 116:
                if (jjenableBlock) {
                    jjtop = newNode('');
                }
                break;
            case 118:
                jjlexState.push(1);
                break;
            case 119:
                var b = jjsematicS[jjsp - 2];
                jjlexState.pop();
                break;
            case 120:
                var b = jjsematicS[jjsp - 3];
                if (jjenableBlock) {
                    jjtop = newNode('');
                    jjtop.val = '{' + b.val + '}';
                }
                break;
            case 121:
                var open = jjsematicS[jjsp - 1];
                jjlexState.push(2);
                break;
            case 122:
                var open = jjsematicS[jjsp - 2];
                if (jjenableBlock) {
                    lexact.beginBlock(open, always);
                }
                break;
            case 123:
                var open = jjsematicS[jjsp - 5];
                var t = jjsematicS[jjsp - 3];
                var close = jjsematicS[jjsp - 1];
                jjlexState.pop();
                break;
            case 124:
                var open = jjsematicS[jjsp - 6];
                var t = jjsematicS[jjsp - 4];
                var close = jjsematicS[jjsp - 2];
                if (jjenableBlock) {
                    lexact.endBlock(close);
                }
                break;
            case 125:
                if (jjenableBlock) {
                    always = true;
                }
                break;
            case 126:
                if (jjenableBlock) {
                    always = false;
                }
                break;
            case 129:
                var c = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    lexact.raw(c.val);
                }
                break;
            case 130:
                if (jjenableBlock) {
                    lexact.lhs();
                }
                break;
            case 131:
                if (jjenableBlock) {
                    lexact.tokenObj();
                }
                break;
            case 132:
                if (jjenableBlock) {
                    lexact.matched();
                }
                break;
            case 133:
                var t = jjsematicS[jjsp - 1];
                if (jjenableBlock) {
                    gb.addEmitTokenAction(lexact, t);
                }
                break;
            case 134:
                jjlexState.push(2);
                break;
            case 135:
                if (jjenableBlock) {
                    lexact.raw('{');
                }
                break;
            case 136:
                jjlexState.pop();
                break;
            case 137:
                if (jjenableBlock) {
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
    function jjacceptToken(tk) {
        tk !== null && jjtokenQueue.push(tk);
        while (!jjstop && jjtokenQueue.length > 0) {
            var t = jjtokenQueue[0];
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
                jjtokenQueue.shift();
            }
            else if (act > 0) {
                if (t.id === 0) {
                    jjstop = true;
                    jjemit('accept');
                    jjtokenQueue.shift();
                }
                else {
                    jjlrState.push(act - 1);
                    jjsematicS.push(jjsematicVal);
                    jjsematicVal = null;
                    jjtryReduce();
                    jjtokenQueue.shift();
                }
            }
            else if (act < 0) {
                jjdoReduction(-act - 1);
                jjtryReduce();
            }
            else {
                jjsyntaxError(t);
                jjtokenQueue.shift();
            }
        }
    }
    function jjtryReduce() {
        var cstate = jjlrState[jjlrState.length - 1];
        var act;
        while (jjdisact[cstate] === -jjtokenCount && (act = jjdefred[cstate]) !== -1) {
            jjdoReduction(act);
            cstate = jjlrState[jjlrState.length - 1];
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
            var msg2 = markPosition(token, lines) + '\n' + msg;
            ctx.err(new JsccError(msg2, 'Syntax error'));
        });
        parser.halt();
        err = true;
    });
    var gb = createFileBuilder(ctx);
    parser.init(ctx, gb);
    ctx.beginTime('parse grammar file');
    parser.accept(source);
    parser.end();
    ctx.endTime();
    var eol = parser.getLineTerminator();
    var el = '\n';
    if (eol !== LineTerm.NONE && eol !== LineTerm.AUTO) {
        el = eol === LineTerm.CR ? '\r' :
            eol === LineTerm.LF ? '\n' :
                eol === LineTerm.CRLF ? '\r\n' : null;
        gb.setLineTerminator(el);
    }
    if (err) {
        var ret = new File();
        ret.eol = el;
        return ret;
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
    function lambda(arg, body) {
        if (ists) {
            return arg + " => " + body;
        }
        else {
            var a = arg.charAt(0) === '(' ? arg : "(" + arg + ")";
            return "function" + a + "{ return " + body + "; }";
        }
    }
    echoLine("");
    echoLine("/*");
    echoLine("    constants");
    echoLine("*/");
    echo("var ");
    echo(prefix);
    echoLine("lf = '\\n'.charCodeAt(0);");
    echo("var ");
    echo(prefix);
    echo("cr = '\\r'.charCodeAt(0);");
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
        else if (t.actionType === Action.SHIFT) {
            return (t.shift.stateIndex + 1).toString();
        }
        else if (t.actionType === Action.REDUCE) {
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
            beginBlock: function (pos, always) {
                !always && echo("if(" + prefix + "enableBlock)");
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
                echo(prefix + "tokenQueue.push(new Token(" + tid + ", null, -1, 0, 0, 0))");
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
        echoLine("    load(input: ParserInput);");
        echoLine("    nextToken(): Token;");
        echoLine("");
        echoLine("    setLineTerminator(lt: LineTerm);");
        echoLine("    getLineTerminator(): LineTerm;");
        echoLine("    halt();");
        echoLine("    on(ent: string, cb: (a1?, a2?, a3?) => any);");
        echoLine("    enableBlocks();");
        echoLine("    disableBlocks();");
        echoLine("    loadParserState(state: ParserState);");
        echoLine("    getParserState(): ParserState;");
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
    if (ists) {
        echoLine("");
        echoLine("interface ParserState {");
        echoLine("    lexState: number[];");
        echoLine("    lrState: number[];");
        echo("    sematicS: ");
        echo(stype);
        echoLine("[];");
        echoLine("};");
        echoLine("interface ParserInput {");
        echoLine("    current(): number;");
        echoLine("    next();");
        echoLine("    isEof(): boolean;");
        echoLine("    backup(s: string);");
        echoLine("};");
        echoLine("enum LineTerm{");
        echoLine("    NONE = 1,");
        echoLine("    AUTO,");
        echoLine("    CR,");
        echoLine("    LF,");
        echoLine("    CRLF");
        echo("};");
    }
    else {
        echoLine("");
        echoLine("var LineTerm = {");
        echoLine("    NONE: 1,");
        echoLine("    AUTO: 2,");
        echoLine("    CR: 3,");
        echoLine("    LF: 4,");
        echoLine("    CRLF: 5");
        echo("};");
    }
    echoLine("");
    echoLine("");
    echo("function create");
    echo(className);
    echo("()");
    echo(ts(': ' + className));
    echoLine(" {");
    echoLine("    //#region parser state variables");
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
    echo("lastCR");
    echo(ts(': boolean'));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("matched");
    echo(ts(": string"));
    echoLine(";");
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
    echoLine("    //#endregion");
    echoLine("");
    echo("    var ");
    echo(prefix);
    echo("input");
    echo(ts(': ParserInput'));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("sematicVal");
    echo(ts(': ' + stype));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("tokenQueue");
    echo(ts(": Token[]"));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("token");
    echo(ts(": Token"));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("stop");
    echo(ts(': boolean'));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("tokenEmitted");
    echo(ts(': boolean'));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("enableBlock");
    echo(ts(': boolean'));
    echoLine(";");
    echo("    var ");
    echo(prefix);
    echo("lineTerm");
    echo(ts(': LineTerm'));
    echoLine(";");
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
        echoLine("        setLineTerminator,");
        echo("        getLineTerminator: () => ");
        echo(prefix);
        echoLine("lineTerm,");
        echoLine("        accept,");
        echoLine("        end,");
        echoLine("        load,");
        echoLine("        nextToken,");
        echoLine("        halt,");
        echoLine("        enableBlocks,");
        echoLine("        disableBlocks,");
        echoLine("        loadParserState,");
        echoLine("        getParserState");
        echo("    };");
    }
    else {
        echoLine("");
        echoLine("    return {");
        echoLine("        init: init,");
        echoLine("        on: on,");
        echoLine("        setLineTerminator: setLineTerminator,");
        echo("        getLineTerminator: function() { return ");
        echo(prefix);
        echoLine("lineTerm; },");
        echoLine("        accept: accept,");
        echoLine("        end: end,");
        echoLine("        load: load,");
        echoLine("        nextToken: nextToken,");
        echoLine("        halt: halt,");
        echoLine("        enableBlocks: enableBlocks,");
        echoLine("        disableBlocks: disableBlocks,");
        echoLine("        loadParserState: loadParserState,");
        echoLine("        getParserState: getParserState");
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
    echoLine("tokenQueue = [];");
    echoLine("");
    echo("        ");
    echo(prefix);
    echoLine("enableBlock = true;");
    echo("        ");
    echo(prefix);
    echoLine("lineTerm = LineTerm.AUTO;");
    echo("        ");
    echo(prefix);
    echoLine("lastCR = false;");
    echoLine("");
    echo("        ");
    echo(n(input.file.initBody));
    echoLine("");
    echoLine("");
    echo("        ");
    echo(prefix);
    echoLine("tryReduce();");
    echoLine("    }");
    echo("    function load(i");
    echo(ts(': ParserInput'));
    echoLine("){");
    echo("        ");
    echo(prefix);
    echoLine("input = i;");
    echoLine("    }");
    echo("    function nextToken()");
    echo(ts(': Token'));
    echoLine("{");
    echo("        ");
    echo(prefix);
    echoLine("tokenEmitted = false;");
    echo("        while(!");
    echo(prefix);
    echo("stop && !");
    echo(prefix);
    echoLine("tokenEmitted){");
    echo("            var c = ");
    echo(prefix);
    echoLine("input.current();");
    echoLine("            if(c !== null){");
    echo("                ");
    echo(prefix);
    echoLine("acceptChar(c);");
    echoLine("            }");
    echoLine("            // null means end of file or no input available at present");
    echo("            else if(");
    echo(prefix);
    echoLine("input.isEof()){");
    echo("                if(");
    echo(prefix);
    echoLine("acceptEOF()){");
    echoLine("                    break;");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                return null;");
    echoLine("            }");
    echoLine("        }");
    echo("        return ");
    echo(prefix);
    echoLine("token;");
    echoLine("    }");
    echo("    function setLineTerminator(lt");
    echo(ts(': LineTerm'));
    echoLine("){");
    echo("        ");
    echo(prefix);
    echoLine("lineTerm = lt;");
    echoLine("    }");
    echoLine("    function enableBlocks(){");
    echo("        ");
    echo(prefix);
    echoLine("enableBlock = true;");
    echoLine("    }");
    echoLine("    function disableBlocks(){");
    echo("        ");
    echo(prefix);
    echoLine("enableBlock = false;");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  input a string");
    echoLine("     *  @api public");
    echoLine("     *  @deprecated");
    echoLine("     */");
    echo("    function accept(s");
    echo(ts(": string"));
    echoLine("){");
    echoLine("        var i = 0;");
    echoLine("        load({");
    echo("            current: ");
    echo(lambda('()', 'i < s.length ? s.charCodeAt(i) : null'));
    echoLine(",");
    echo("            next: ");
    echo(lambda('()', 'i++'));
    echoLine(",");
    echo("            isEof: ");
    echo(lambda('()', 'i >= s.length'));
    echoLine(",");
    echo("            backup: ");
    echo(lambda('t', 'i -= t.length'));
    echoLine("");
    echoLine("        });");
    echoLine("        while(nextToken().id !== 0);");
    echoLine("    }");
    echoLine("    /**");
    echoLine("     *  tell the compiler that end of file is reached");
    echoLine("     *  @api public");
    echoLine("     */");
    echoLine("    function end(){");
    echoLine("        ");
    echoLine("    }");
    echoLine("    function halt(){");
    echo("        ");
    echo(prefix);
    echoLine("stop = true;");
    echoLine("    }");
    echo("    function loadParserState(state");
    echo(ts(': ParserState'));
    echoLine("){");
    echo("        ");
    echo(prefix);
    echoLine("lexState = state.lexState;");
    echo("        ");
    echo(prefix);
    echoLine("lrState = state.lrState;");
    echo("        ");
    echo(prefix);
    echoLine("sematicS = state.sematicS;");
    echoLine("    }");
    echo("    function getParserState()");
    echo(ts(': ParserState'));
    echoLine(" {");
    echoLine("        return {");
    echo("            lexState: ");
    echo(prefix);
    echoLine("lexState,");
    echo("            lrState: ");
    echo(prefix);
    echoLine("lrState,");
    echo("            sematicS: ");
    echo(prefix);
    echoLine("sematicS");
    echoLine("        };");
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
    echo("tokenQueue.push(");
    echo(prefix);
    echoLine("token);");
    echo("        ");
    echo(prefix);
    echoLine("tokenEmitted = true;");
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
    echo("tokenQueue.length > 0 && ");
    echo(prefix);
    echoLine("acceptToken(null);");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echoLine("rollback(){");
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
    echoLine("input.backup(ret);");
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
    echo("        // c === ");
    echo(prefix);
    echo("eol ? (");
    echo(prefix);
    echo("line++, ");
    echo(prefix);
    echo("column = 0) : (");
    echo(prefix);
    echoLine("column += c > 0xff ? 2 : 1);");
    echo("        switch(");
    echo(prefix);
    echoLine("lineTerm){");
    echoLine("            case LineTerm.NONE:");
    echo("                ");
    echo(prefix);
    echoLine("column += c > 0xff ? 2 : 1;");
    echoLine("                break;");
    echoLine("            case LineTerm.CR:");
    echo("                c === ");
    echo(prefix);
    echo("cr ? (");
    echo(prefix);
    echo("line++, ");
    echo(prefix);
    echo("column = 0) : (");
    echo(prefix);
    echoLine("column += c > 0xff ? 2 : 1);");
    echoLine("                break;");
    echoLine("            case LineTerm.LF:");
    echo("                c === ");
    echo(prefix);
    echo("lf ? (");
    echo(prefix);
    echo("line++, ");
    echo(prefix);
    echo("column = 0) : (");
    echo(prefix);
    echoLine("column += c > 0xff ? 2 : 1);");
    echoLine("                break;");
    echoLine("            case LineTerm.CRLF:");
    echo("                if(");
    echo(prefix);
    echoLine("lastCR){");
    echo("                    if(c === ");
    echo(prefix);
    echoLine("lf){");
    echo("                        ");
    echo(prefix);
    echo("line++, ");
    echo(prefix);
    echoLine("column = 0;");
    echo("                        ");
    echo(prefix);
    echoLine("lastCR = false;");
    echoLine("                    }");
    echoLine("                    else {");
    echo("                        ");
    echo(prefix);
    echoLine("column += c > 0xff ? 2 : 1;");
    echo("                        ");
    echo(prefix);
    echo("lastCR = c === ");
    echo(prefix);
    echoLine("cr;");
    echoLine("                    }");
    echoLine("                }");
    echoLine("                else {");
    echo("                    ");
    echo(prefix);
    echoLine("column += c > 0xff ? 2 : 1;");
    echo("                    ");
    echo(prefix);
    echo("lastCR = c === ");
    echo(prefix);
    echoLine("cr;");
    echoLine("                }");
    echoLine("                break;");
    echoLine("            case LineTerm.AUTO:");
    echo("                if(");
    echo(prefix);
    echoLine("lastCR){");
    echo("                    if(c === ");
    echo(prefix);
    echoLine("lf){");
    echo("                        ");
    echo(prefix);
    echo("line++, ");
    echo(prefix);
    echoLine("column = 0;");
    echo("                        ");
    echo(prefix);
    echoLine("lastCR = false;");
    echo("                        ");
    echo(prefix);
    echoLine("lineTerm = LineTerm.CRLF;");
    echoLine("                    }");
    echoLine("                    else {");
    echo("                        ");
    echo(prefix);
    echo("line++, ");
    echo(prefix);
    echoLine("column = 0;");
    echo("                        ");
    echo(prefix);
    echoLine("lineTerm = LineTerm.CR;");
    echo("                        c === ");
    echo(prefix);
    echo("cr ? (");
    echo(prefix);
    echo("line++, ");
    echo(prefix);
    echo("column = 0) : (");
    echo(prefix);
    echoLine("column += c > 0xff ? 2 : 1);");
    echoLine("                    }");
    echoLine("                }");
    echo("                else if(c === ");
    echo(prefix);
    echoLine("lf){");
    echo("                    ");
    echo(prefix);
    echo("line++, ");
    echo(prefix);
    echoLine("column = 0;");
    echo("                    ");
    echo(prefix);
    echoLine("lineTerm = LineTerm.LF;");
    echoLine("                }");
    echoLine("                else {");
    echo("                    ");
    echo(prefix);
    echoLine("column += c > 0xff ? 2 : 1;");
    echo("                    ");
    echo(prefix);
    echo("lastCR = c === ");
    echo(prefix);
    echoLine("cr;");
    echoLine("                }");
    echoLine("                break;");
    echoLine("        }");
    echo("        ");
    echo(prefix);
    echoLine("matched += String.fromCharCode(c);");
    echo("        ");
    echo(prefix);
    echo("marker.state !== -1 && (");
    echo(prefix);
    echoLine("backupCount++);");
    echo("        ");
    echo(prefix);
    echoLine("input.next();");
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
    echo("                    ");
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
    echo("                    ");
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
    echoLine("                    // accept(s);");
    echoLine("                    // character not consumed");
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
    echo("                    ");
    echo(prefix);
    echoLine("consume(ccode);");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else {");
    echo("                ");
    echo(prefix);
    echoLine("state = nstate;");
    echoLine("                // character consumed");
    echo("                ");
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
    echoLine("acceptToken(null);");
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
    echo("                ");
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
    echo("    }");
    function printReduceActions() {
        var codegen = {
            raw: function (s) {
                echo(s);
            },
            beginBlock: function (pos, always) {
                !always && echo("if(" + prefix + "enableBlock)");
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
                echo(prefix + "tokenQueue.push(new Token(" + tid + ", null, -1, 0, 0, 0))");
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
    echo("acceptToken(tk");
    echo(ts(": Token"));
    echoLine("){");
    echoLine("        // look up action table");
    echoLine("        var shifted = false;");
    echo("        tk !== null && ");
    echo(prefix);
    echoLine("tokenQueue.push(tk);");
    echo("        while(!");
    echo(prefix);
    echo("stop && ");
    echo(prefix);
    echoLine("tokenQueue.length > 0){");
    echo("            var t = ");
    echo(prefix);
    echoLine("tokenQueue[0];");
    echo("            var cstate = ");
    echo(prefix);
    echo("lrState[");
    echo(prefix);
    echoLine("lrState.length - 1];");
    echo("            var ind = ");
    echo(prefix);
    echoLine("disact[cstate] + t.id;");
    echoLine("            var act = 0;");
    echo("            if(ind < 0 || ind >= ");
    echo(prefix);
    echo("pact.length || ");
    echo(prefix);
    echoLine("checkact[ind] !== cstate){");
    echo("                act = -");
    echo(prefix);
    echoLine("defred[cstate] - 1;");
    echoLine("            }");
    echoLine("            else {");
    echo("                act = ");
    echo(prefix);
    echoLine("pact[ind];");
    echoLine("            }");
    echo("            if(act === ");
    echo(prefix);
    echoLine("actERR){");
    echoLine("                // explicit error");
    echo("                ");
    echo(prefix);
    echoLine("syntaxError(t);");
    echo("                ");
    echo(prefix);
    echoLine("tokenQueue.shift();");
    echoLine("            }");
    echoLine("            else if(act > 0){");
    echoLine("                // shift");
    echoLine("                if(t.id === 0){");
    echoLine("                    // end of file");
    echo("                    ");
    echo(prefix);
    echoLine("stop = true;");
    echo("                    ");
    echo(prefix);
    echoLine("emit('accept');");
    echo("                    ");
    echo(prefix);
    echoLine("tokenQueue.shift();");
    echoLine("                }");
    echoLine("                else {");
    echo("                    ");
    echo(prefix);
    echoLine("lrState.push(act - 1);");
    echo("                    ");
    echo(prefix);
    echo("sematicS.push(");
    echo(prefix);
    echoLine("sematicVal);");
    echo("                    ");
    echo(prefix);
    echoLine("sematicVal = null;");
    echo("                    ");
    echo(prefix);
    echoLine("tryReduce();");
    echoLine("                    // token consumed");
    echo("                    ");
    echo(prefix);
    echoLine("tokenQueue.shift();");
    echoLine("                }");
    echoLine("            }");
    echoLine("            else if(act < 0){");
    echo("                ");
    echo(prefix);
    echoLine("doReduction(-act - 1);");
    echo("                ");
    echo(prefix);
    echoLine("tryReduce();");
    echoLine("            }");
    echoLine("            else {");
    echoLine("                // error");
    echo("                ");
    echo(prefix);
    echoLine("syntaxError(t);");
    echoLine("                // force consume");
    echo("                ");
    echo(prefix);
    echoLine("tokenQueue.shift();");
    echoLine("            }");
    echoLine("        }");
    echoLine("    }");
    echo("    function ");
    echo(prefix);
    echoLine("tryReduce(){");
    echo("        var cstate = ");
    echo(prefix);
    echo("lrState[");
    echo(prefix);
    echoLine("lrState.length - 1];");
    echoLine("        var act;");
    echo("        while(");
    echo(prefix);
    echo("disact[cstate] === -");
    echo(prefix);
    echo("tokenCount && (act = ");
    echo(prefix);
    echoLine("defred[cstate]) !== -1){");
    echo("            ");
    echo(prefix);
    echoLine("doReduction(act);");
    echo("            cstate = ");
    echo(prefix);
    echo("lrState[");
    echo(prefix);
    echoLine("lrState.length - 1];");
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
function generateCode(lang, input, fc) {
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
        var _b = compress(arrayWrapper(this.states.length, r.classCount, rawTable)), len = _b.len, dps = _b.dps;
        this.disnext = dps;
        this.pnext = initArray(len, function (i) { return null; });
        this.checknext = initArray(len, function (i) { return -1; });
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
    DFATable.prototype.print = function (os, escapes) {
        var tab = '    ';
        function char(c) {
            if (c >= 0x20 && c <= 0x7e) {
                return "'" + String.fromCharCode(c) + "'";
            }
            else {
                return "\\x" + c.toString(16);
            }
        }
        function echo(s) {
            for (var _i = 0, escapes_1 = escapes; _i < escapes_1.length; _i++) {
                var e = escapes_1[_i];
                s = s.replace(e.from, e.to);
            }
            os.writeln(s);
        }
        var tl = 0;
        var line = 'class table:\n' + tab;
        for (var c = 0; c < this.classTable.length; c++) {
            if (this.classTable[c] !== -1) {
                line += char(c) + " -> c" + this.classTable[c] + ", ";
                tl++ > 9 && (line += "\n" + tab, tl = 0);
            }
        }
        echo(line + '\n');
        line = 'unicode class table:\n' + tab;
        tl = 0;
        for (var c = 0, _a = this.unicodeClassTable; c < _a.length; c += 3) {
            line += "\\x" + _a[c + 1] + "-\\x" + _a[c + 2] + " -> c" + _a[c] + ", ";
            tl++ > 4 && (line += "\n" + tab, tl = 0);
        }
        echo(line + '\n');
        for (var s = 0; s < this.states.length; s++) {
            line = "state " + s + ":\n";
            var state = this.states[s];
            state.endAction !== null && (line += tab + "end = " + state.endAction.id + "\n");
            for (var c = 0; c < this.classCount; c++) {
                var arc = this.lookup(s, c);
                arc !== null && (line += tab + "c" + c + ": state " + arc.to.index + "\n");
            }
            echo(line);
        }
    };
    return DFATable;
}());

function createContext() {
    var file = null;
    var itemSets = null;
    var iterationCount = 0;
    var parseTable = null;
    var errors = [];
    var warnings = [];
    var needLinecbs = [];
    var terminated = false;
    var timers = [];
    var escapes = [];
    var ctx = {
        warn: warn,
        err: err,
        requireLines: function (cb) { return needLinecbs.push(cb); },
        beginTime: beginTime,
        endTime: endTime
    };
    return {
        compile: compile,
        setEscape: setEscape,
        reset: reset,
        beginTime: beginTime,
        endTime: endTime,
        printItemSets: printItemSets,
        printTable: printTable,
        printDFA: printDFA,
        testParse: function (tokens, onErr) { return testParse(file.grammar, parseTable, tokens, onErr); },
        printError: printError,
        printWarning: printWarning,
        printDetailedTime: printDetailedTime,
        hasWarning: hasWarning,
        hasError: hasError,
        warningSummary: function () { return warnings.length + " warning(s), " + errors.length + " error(s)"; },
        genCode: genCode,
        isTerminated: function () { return terminated; }
    };
    function escape(s) {
        var s = '';
        for (var _i = 0, escapes_1 = escapes; _i < escapes_1.length; _i++) {
            var e = escapes_1[_i];
            s = s.replace(e.from, e.to);
        }
        return s;
    }
    function reset() {
        file = null;
        itemSets = null;
        iterationCount = 0;
        parseTable = null;
        errors.length = 0;
        warnings.length = 0;
        needLinecbs.length = 0;
        terminated = false;
        timers.length = 0;
    }
    function setEscape(e) {
        for (var from in e) {
            escapes.push({ from: from, to: e[from] });
        }
    }
    function compile(source, fname) {
        reset();
        var f = parse(ctx, source);
        var lines = source.split(f.eol);
        for (var _i = 0, needLinecbs_1 = needLinecbs; _i < needLinecbs_1.length; _i++) {
            var cb = needLinecbs_1[_i];
            cb(ctx, lines);
        }
        if (hasError()) {
            terminated = true;
            return;
        }
        f.name = fname;
        var g = f.grammar;
        file = f;
        for (var _a = 0, _b = g.tokens; _a < _b.length; _a++) {
            var s = _b[_a];
            if (!s.used) {
                var msg = "token <" + s.sym + "> is never used, definations are(is):\n";
                for (var _c = 0, _d = s.appears; _c < _d.length; _c++) {
                    var pos = _d[_c];
                    msg += markPosition(pos, lines) + '\n';
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
            var msg = "template for '" + f.output.val + "' is not implemented yet " + markPosition(f.output, lines) + '\n';
            msg += 'available templates are: ' + listTemplates().join(', ');
            err(new JsccError(msg));
        }
        if (hasError()) {
            terminated = true;
            return;
        }
        beginTime('generate first sets');
        g.genFirstSets();
        endTime();
        beginTime('generate item sets');
        var temp = genItemSets(g);
        endTime();
        itemSets = temp.result;
        iterationCount = temp.iterations;
        beginTime('generate parse table');
        var temp2 = genParseTable(g, itemSets);
        endTime();
        temp2.result.findDefAct();
        beginTime('compress parse table');
        parseTable = new CompressedPTable(temp2.result);
        endTime();
        for (var _g = 0, _h = temp2.conflicts; _g < _h.length; _g++) {
            var cf = _h[_g];
            warn(new JsccWarning(cf.toString()));
        }
        beginTime('generate lexical DFA tables');
        for (var _j = 0, _k = file.lexDFA; _j < _k.length; _j++) {
            var dfa = _k[_j];
            file.dfaTables.push(new DFATable(dfa));
        }
        endTime();
    }
    function beginTime(name) {
        timers.push({ name: name, start: new Date(), end: null });
    }
    function endTime() {
        timers[timers.length - 1].end = new Date();
    }
    function warn(w) {
        warnings.push(w);
    }
    function err(e) {
        errors.push(e);
    }
    function printItemSets(os) {
        os.writeln(itemSets.size + " state(s) in total,finished in " + iterationCount + " iteration(s).");
        itemSets.forEach(function (s) {
            os.writeln(escape(s.toString({ showTrailer: true })));
        });
    }
    function printTable(os, showlah, showFullItemsets) {
        printParseTable(os, parseTable, itemSets, showlah, showFullItemsets, escapes);
    }
    function printDetailedTime(os) {
        for (var _i = 0, timers_1 = timers; _i < timers_1.length; _i++) {
            var t = timers_1[_i];
            os.writeln(t.name + ": " + (t.end.valueOf() - t.start.valueOf()) / 1000 + "s");
        }
    }
    function printDFA(os) {
        var i = 0;
        for (var _i = 0, _a = file.dfaTables; _i < _a.length; _i++) {
            var s = _a[_i];
            os.writeln("DFA state " + i);
            s.print(os, escapes);
            os.writeln();
            os.writeln();
            i++;
        }
    }
    function printError(os, opt) {
        for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
            var e = errors_1[_i];
            os.writeln(e.toString(opt).toString(escapes));
        }
        os.writeln();
    }
    function printWarning(os, opt) {
        for (var _i = 0, warnings_1 = warnings; _i < warnings_1.length; _i++) {
            var w = warnings_1[_i];
            os.writeln(w.toString(opt).toString(escapes));
        }
        os.writeln();
    }
    function hasWarning() {
        return warnings.length > 0;
    }
    function hasError() {
        return errors.length > 0;
    }
    function genCode(fc) {
        var tempin = getTemplateInput();
        generateCode(tempin.output, tempin, fc);
    }
    function getTemplateInput() {
        return {
            endl: file.eol,
            output: file.output === null ? 'typescript' : file.output.val,
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

var version = '1.0.2';
function deleteSuffix(s) {
    var i = s.lastIndexOf('.');
    return i === -1 ? s : s.substr(0, i);
}

function main(opt) {
    var stdout = opt.stdout;
    var echo = function (s) { return stdout.writeln(s); };
    var ctx = createContext();
    do {
        var startTime = new Date();
        ctx.compile(opt.input, deleteSuffix(opt.inputFile));
        if (ctx.hasWarning()) {
            ctx.printWarning(stdout);
        }
        if (ctx.hasError()) {
            ctx.printError(stdout);
            ctx.isTerminated() && echo('compilation terminated');
            break;
        }
        if (opt.outputFile) {
            var out = new StringOS();
            ctx.beginTime('generate output file');
            opt.printDFA && ctx.printDFA(out);
            ctx.printTable(out, opt.showlah, opt.showFullItemsets);
            ctx.endTime();
            opt.writeFile(opt.outputFile, out.s);
        }
        var current = new StringOS();
        ctx.beginTime('generate parser code');
        ctx.genCode({
            save: function (fname) {
                opt.writeFile(fname, current.s);
                current = new StringOS();
            },
            write: function (s) { return current.write(s); },
            writeln: function (s) { return current.writeln(s); }
        });
        ctx.endTime();
        if (opt.testInput) {
            echo("preparing for test");
            for (var _i = 0, _a = ctx.testParse(opt.testInput.split(/[ ]+/g), function (msg) { return echo(msg); }); _i < _a.length; _i++) {
                var line = _a[_i];
                echo(line);
            }
        }
        echo("compilation done in " + (new Date().valueOf() - startTime.valueOf()) / 1000 + "s");
        opt.printDetailedTime && ctx.printDetailedTime(stdout);
    } while (false);
    echo(ctx.warningSummary());
    return ctx.hasError() ? -1 : 0;
}

exports.io = io;
exports.createContext = createContext;
exports.generateCode = generateCode;
exports.version = version;
exports.debug = debug;
exports.main = main;
exports.setDebugger = setDebugger;
exports.defineTemplate = defineTemplate;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=tscc.js.map
