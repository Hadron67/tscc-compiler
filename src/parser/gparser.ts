import { GBuilder, TokenRefType } from './gbuilder';
import { Assoc } from '../grammar/token-entry';
import { CompilationError as E, CompilationError } from '../util/E';
import { InputStream } from '../util/io';
import { Context } from '../util/context';
import { LexAction, returnToken, blockAction, pushState, popState, setImg } from '../lexer/action';

enum T  {
    EOF = 0,
    NAME,
    STRING,
    // TOKEN_DIR,
    OPT,
    BLOCK,
    ARROW,
    EOL,
    OR,
    //TOKEN,
    SEPERATOR,
    LEFT_DIR,
    RIGHT_DIR,
    NONASSOC_DIR,
    LEX_DIR,
    PREC_DIR,
    USE_DIR,
    HEADER_DIR,
    EXTRA_ARG_DIR,
    TYPE_DIR,
    INIT_DIR,
    // REGEXP,
    // STATE_DIR,
    LINE_COMMENT,
    BLOCK_COMMENT,
    GT,
    LT,
    DASH,
    BRA,
    KET,
    CBRA,
    CKET,
    COMMA,
    PLUS,
    EQU,
    STAR,
    QUESTION,
    WEDGE,
    
    // highlight only
    OPEN_CURLY_BRA,
    CLOSE_CURLY_BRA
};

class Token {
    id: T;
    line: number;
    val: string = null;

    clone(): Token{
        var t = new Token();
        t.id = this.id;
        t.line = this.line;
        t.val = this.val;
        return t;
    }
}

function scan(opt: { isHighlight?: boolean } = {}){
    var highlight = !!opt.isHighlight;
    var line = 1;
    var stream: InputStream = null;
    var c: string = null;

    function eof(){
        return c === null;
    }
    function isBlank(c){
        return c == ' ' || c == '\n' || c == '\t';
    }
    function nc(){

        if(c === '\n'){
            line++;
        }
        stream.next();
        c = stream.peek();
    }
    function err(c1?: string){
        var s1 = '';
        if(eof()){
            s1 = 'unexpected end of file';
        }
        else {
            s1 = `unexpected character "${c}"`;
        }
        if(c1){
            throw new E(`${s1} after "${c1}"`,line);
        }
        else{
            throw new E(s1,line);                
        }
    }
    function iss(s: string){
        var ii = 0;
        while(ii < s.length){
            if(s.charAt(ii++) !== c){
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
    function escapeChar(regexp: boolean){
        var tc = c;
        if(eof()){
            return '';
        }
        nc();
        var ret = escapes[tc];
        if(ret !== undefined){
            return ret;
        }
        else {
            if(regexp){
                return '\\' + tc;
            }
            else {
                if(tc === '\\'){
                    return '\\';
                }
                else {
                    return '\\' + tc;
                }
            }
        }
    }
    function handleString(){
        var eos = c;
        var ret = '';
        nc();
        while(c != eos){
            if(eof()){
                throw new E('unterminated string literal',line);
            }
            else if(c === '\\'){
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
    function handleRegExp(){
        var ret = '';
        while(c !== '/'){
            if(eof()){
                throw new E('unterminated regular expression literal',line);
            }
            else if(c === '\\'){
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
    function next(token: Token){
        token.val = null;
        while(isBlank(c) && !eof()){
            nc();
        }
        token.line = line;
        if(eof()){
            token.id = T.EOF;
            return token;
        }
        lex:
        switch(c){
            case '%':
                nc();
                if(iss('opt')){
                    token.id = T.OPT;
                    break lex;
                }
                else if(iss('le')){
                    if(iss('ft')){
                        token.id = T.LEFT_DIR;
                        break lex;
                    }
                    else if(iss('x')){
                        token.id = T.LEX_DIR;
                        break lex;
                    }
                }
                else if(iss('right')){
                    token.id = T.RIGHT_DIR;
                    break lex;
                }
                else if(iss('nonassoc')){
                    token.id = T.NONASSOC_DIR;
                    break lex;
                }
                else if(iss('prec')){
                    token.id = T.PREC_DIR;
                    break lex;
                }
                else if(iss('use')){
                    token.id = T.USE_DIR;
                    break lex;
                }
                else if(iss('header')){
                    token.id = T.HEADER_DIR
                    break lex;
                }
                else if(iss('extra_arg')){
                    token.id = T.EXTRA_ARG_DIR;
                    break lex;
                }
                else if(iss('init')){
                    token.id = T.INIT_DIR;
                    break lex;
                }
                else if(iss('type')){
                    token.id = T.TYPE_DIR;
                    break lex;
                }
                else if(c == '%'){
                    nc();
                    token.id = T.SEPERATOR;
                    break lex;
                }
                err('%');
            case '{':
                nc();
                if(highlight){
                    token.id = T.OPEN_CURLY_BRA;
                    break lex;
                }
                else {
                    token.id = T.BLOCK;
                    token.val = '';
                    var st = 1;
                    while(st > 0){
                        if(eof()){
                            throw new E('unclosed block', line);
                        }
                        if(c == '{'){
                            st++;
                            token.val += c;
                        }
                        // XXX: disable CFA
                        else if(c == '}' as string){
                            st--;
                            st > 0 && (token.val += c);
                        }
                        else {
                            token.val += c;
                        }
                        nc();
                    }
                    break lex;
                }
            case '/':
                nc();
                if(c === '/'){
                    nc();
                    token.val = '//';
                    while(c as string !== '\n' && !eof()){
                        token.val += c;
                        nc();
                    }
                    token.id = T.LINE_COMMENT;
                    break lex;
                }
                else if(c === '*'){
                    nc();
                    token.val = '/*';
                    while(!eof()){
                        if(c === '*'){
                            nc();
                            if(c === '/'){
                                nc();
                                break;
                            }
                            else if(eof()){
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
                if(c as string == '>'){
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
                if(/[A-Za-z_$]/.test(c)){
                    token.id = T.NAME;
                    token.val = c;
                    nc();
                    while(/[A-Za-z0-9_$]/.test(c) && !eof()){
                        token.val += c;
                        nc();
                    }
                    break lex;
                }
                nc();
                err();
        };

    };
    return {
        next: next,
        init: function(s: InputStream){
            stream = s;
            c = s.peek();
        }
    };
}

function parse(scanner, ctx: Context){
    var token = new Token();
    var gb = new GBuilder(ctx);

    function nt(){
        scanner.next(token);
    }

    function expect(id: T){
        if(token.id !== id){
            throw new E(`unexpected token "${T[token.id]}", expecting "${T[id]}"`,token.line);
        }
        nt();
    }

    function expectToken(id: T, cb: (val: string, line: number) => any){
        let val = token.val;
        let line = token.line;
        expect(id);
        cb(val, line);
    }

    /**
     * options() <SEPERATOR> rules() <EOF>
     */
    function file(){
        options();
        expect(T.SEPERATOR);
        rules();
        expect(T.EOF);
    }

    function prTokens(assoc: Assoc){
        do{
            if(token.id === T.STRING){
                gb.defineTokenPrec(token.val,assoc,TokenRefType.STRING,token.line);
            }
            else if(token.id === T.NAME){
                gb.defineTokenPrec(token.val,assoc,TokenRefType.NAME,token.line);
            }
            else if(token.id === T.LT){
                nt();
                let tname = token.val;
                let tline = token.line;
                expect(T.NAME);
                expect(T.GT);
                gb.defineTokenPrec(tname, assoc, TokenRefType.TOKEN, tline);
            }
            else {
                throw new E(`unexpected token "${T[token.id]}", expecting string or name or "<"`,token.line);
            }
            nt();
        }while(token.id === T.STRING || token.id === T.NAME || token.id === T.LT);
        gb.incPr();
    }

    /**
     * '%token' (tokenDef())+
     * | ('%left'|'%right'|'%nonassoc') [<TOKEN>]+
     * | '%opt' <NAME> <STRING>
     * | '%lex' lexRule()
     * | '%header' <BLOCK>
     * | '%extra_arg' <BLOCK>
     */
    function options(){
        while(1){
            switch(token.id){
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
                    gb.setOpt(name,s);
                    break;
                case T.LEX_DIR:
                    nt();
                    lexRule();
                    break;
                case T.HEADER_DIR:
                    nt();
                    expectToken(T.BLOCK, (val, line) => gb.setHeader(val));
                    break;
                case T.EXTRA_ARG_DIR:
                    nt();
                    expectToken(T.BLOCK, (val, line) => gb.setExtraArg(val));
                    break;
                case T.TYPE_DIR:
                    nt();
                    var tline = token.line;
                    var tname = token.val;
                    expect(T.NAME);
                    gb.setType(tname);
                    break;
                default:return;
            }
        }
    }

    /**
     * ['<' states() '>'] '[' (lexItem())* ']'
     */
    function lexRule(){
        gb.lexBuilder.prepareLex();        
        if(token.id === T.LT){
            nt();
            states();
            expect(T.GT);
        }
        else {
            gb.lexBuilder.selectState('DEFAULT');
        }
        expect(T.CBRA);
        while(token.id !== T.CKET){
            lexItem();
        }
        expect(T.CKET);
    }

    /**
     * <NAME> '=' '<' regexp() '>'
     * | '<' <NAME> ':' regexp() '>' [ ':' lexActions() ]
     * | '<' regexp() '>' [ ':' lexActions() ]
     */
    function lexItem(){
        if(token.id + 0 === T.NAME){
            let vname = token.val;
            let line = token.line;
            nt();
            expect(T.EQU);
            expect(T.LT);
            gb.lexBuilder.prepareVar(vname, line);
            regexp();
            gb.lexBuilder.endVar();
            expect(T.GT);
        }
        else if(token.id +0=== T.LT){
            nt();
            gb.lexBuilder.newState();
            let label = 'untitled';
            let acts: LexAction[] = [];
            if(token.id === T.NAME){
                let tname = token.val;
                let tline = token.line;
                label = tname;
                // gb.defToken(tname, '', token.line);
                nt();
                expect(T.ARROW);
                regexp();
                let tdef = gb.defToken(tname, gb.lexBuilder.possibleAlias, tline);
                acts.push(returnToken(tdef));
            }
            else {
                regexp();
            }
            expect(T.GT);
            if(token.id === T.ARROW){
                nt();
                lexActions(acts);
            }
            gb.lexBuilder.end(acts, label);
        }
    }

    /**
     * '[' lexAction() (',' lexAction())* ']'
     * | <BLOCK>
     */
    function lexActions(acts: LexAction[]){
        if(token.id === T.CBRA){
            // XXX: disable CFA
            token.id += 0;
            nt();
            lexAction(acts);
            while(token.id === T.COMMA){
                nt();
                lexAction(acts);
            }
            expect(T.CKET);
        }
        else if(token.id === T.BLOCK){
            acts.push(blockAction(token.val, token.line));
            nt();
        }
        else {
            throw new E(`unexpected token "${T[token.id]}"`, token.line);
        }
    }

    /**
     * '+' <NAME>
     * | '-'
     * | <BLOCK>
     * | '=' <STRING>
     */
    function lexAction(acts: LexAction[]): void{
        if(token.id === T.PLUS){
            nt();
            let vn = token.val;
            let line = token.line;
            expect(T.NAME);
            gb.lexBuilder.requiringState.wait(vn, (su, sn) => {
                if(su){
                    acts.push(pushState(sn));
                }
                else {
                    ctx.err(new CompilationError(`state "${vn}" is undefined`, line));
                }
            });
        }
        else if(token.id === T.DASH){
            nt();
            acts.push(popState());
        }
        else if(token.id === T.BLOCK){
            let b = token.val;
            nt();
            acts.push(blockAction(token.val, token.line));
        }
        else if(token.id === T.EQU){
            nt();
            let s = token.val;
            expect(T.STRING);
            acts.push(setImg(s));
        }
        else {
            throw new E(`unexpected token "${T[token.id]}"`, token.line);
        }
    }

    /**
     * <NAME> (',' <NAME>)*
     */
    function states(){
        let tname = token.val;
        let tline = token.line;
        expect(T.NAME);
        gb.lexBuilder.selectState(tname);
        while(token.id === T.COMMA){
            nt();
            tname = token.val;
            tline = token.line;
            expect(T.NAME);
            gb.lexBuilder.selectState(tname);
        }
    }

    /**
     * simpleRE() ('|' simpleRE())*
     */
    function regexp(){
        gb.lexBuilder.enterUnion();
        simpleRE();
        gb.lexBuilder.endUnionItem();
        while(token.id === T.OR){
            nt();
            simpleRE();
            gb.lexBuilder.endUnionItem();
        }
        gb.lexBuilder.leaveUnion();
    }

    /**
     * (basicRE())+
     */
    function simpleRE(){
        do{
            basicRE();
        }while(token.id !== T.GT && token.id !== T.OR && token.id !== T.KET);
    }

    /**
     * primitiveRE() ['+'|'*'|'?']
     */
    function basicRE(){
        gb.lexBuilder.enterSimple();
        primitiveRE();
        switch(token.id){
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

    /**
     * '(' regexp() ')'
     * | '[' setRE() ']'
     * | <STRING>
     * | '<' <NAME> '>'
     */
    function primitiveRE(){
        if(token.id === T.BRA){
            nt();
            regexp();
            expect(T.KET);
        }
        else if(token.id === T.CBRA){
            nt();
            setRE();
            expect(T.CKET);
        }
        else if(token.id === T.STRING){
            let s = token.val;
            nt();
            gb.lexBuilder.addString(s);
        }
        else if(token.id === T.LT){
            nt();
            let vname = token.val;
            let line = token.line;
            expect(T.NAME);
            expect(T.GT);
            gb.lexBuilder.addVar(vname, line);
        }
        else {
            throw new E(`unexpected token "${T[token.id]}"`, token.line);
        }
    }

    /**
     * ['^'] [ setREItem() (',' setREItem())* ]
     */
    function setRE(){
        if(token.id === T.WEDGE){
            nt();
            gb.lexBuilder.beginSet(true);
        }
        else {
            gb.lexBuilder.beginSet(false);
        }
        if(token.id !== T.CKET){
            setREItem();
            while(token.id === T.COMMA){
                nt();
                setREItem();
            }
        }
    }

    /**
     * <STRING> [ '-' <STRING> ] 
     */
    function setREItem(){
        let from = token.val;
        let line1 = token.line;
        let to = from;
        let line2 = line1;
        expect(T.STRING);
        if(token.id === T.DASH){
            nt();
            to = token.val;
            line2 = token.line;
            expect(T.STRING);
        }
        gb.lexBuilder.addSetItem(from, to, line1, line2);
    }

    /**
     * rule() ( rule() )* <SEPERATOR>
     */
    function rules(){
        rule();
        while(token.id !== T.SEPERATOR){
            rule();
        }
        nt();
    }

    /**
     * <NAME> <ARROW> ruleItems() ( <OR> ruleItems() )* <EOL>
     */
    function rule(){
        var lhs = token.clone();
        expect(T.NAME);
        expect(T.ARROW);
        gb.prepareRule(lhs.val,lhs.line);
        ruleItems();
        gb.commitRule();
        while(token.id === T.OR){
            nt();
            gb.prepareRule(lhs.val,lhs.line);
            ruleItems();
            gb.commitRule();
        }
        expect(T.EOL);
    }

    /**
     * [ '%use' '(' useList() ')' ] 
     * ( ruleItem() )* [ '%prec' (<STRING>|<NAME>) [ <BLOCK> ] ]
     */
    function ruleItems(){
        if(token.id === T.USE_DIR){
            nt();
            expect(T.BRA);
            useList();
            expect(T.KET);
        }
        while(token.id === T.NAME 
            || token.id === T.LT 
            || token.id === T.STRING 
            || token.id === T.BLOCK 
            || token.id === T.CBRA){
            ruleItem();
        }
        if(token.id === T.PREC_DIR){
            nt();
            let t = token.val;
            let line = token.line;
            // XXX: disable CFA
            if(token.id as T === T.STRING){
                gb.defineRulePr(t,TokenRefType.STRING,line);
                nt();
            }
            // XXX: disable CFA
            else if(token.id as T === T.LT){
                nt();
                t = token.val;
                line = token.line;
                expect(T.NAME);
                expect(T.GT);
                gb.defineRulePr(t, TokenRefType.TOKEN, line);
            }
            // XXX: disable CFA
            else if(token.id as T === T.NAME){
                gb.defineRulePr(t,TokenRefType.NAME,line);
                nt();
            }
            else {
                throw new E(`unexpected token "${T[token.id]}",expecting string or name`,token.line);
            }
            // XXX: disable CFA
            if(token.id as T === T.BLOCK || token.id as T === T.CBRA){
                let acts: LexAction[] = [];
                lexActions(acts);
                gb.addAction(acts);
            }
        }
    }

    /**
     * <NAME> (',' <NAME>)*
     */
    function useList(){
        let tname = token.val;
        let tline = token.line;
        expect(T.NAME);
        gb.addRuleUseVar(tname, tline);
        while(token.id === T.COMMA){
            nt();
            tname = token.val;
            tline = token.line;
            expect(T.NAME);
            gb.addRuleUseVar(tname, tline);
        }
    }

    /**
     * <NAME> '=' (<NAME> | <STRING> | "<" <NAME> ">" | lexAction())
     */
    function ruleItem(){
        let t = token.clone();
        if(token.id === T.NAME){
            nt();
            // XXX: disable CFA
            if(token.id as T === T.EQU){
                nt();
                gb.addRuleSematicVar(t.val, t.line);
                t = token.clone();
            }
            else {
                gb.addRuleItem(t.val,TokenRefType.NAME,t.line);
                return;
            }
        }
        if(token.id === T.NAME){
            nt();
            gb.addRuleItem(t.val,TokenRefType.NAME,t.line);
        }
        else if(token.id === T.STRING){
            nt();
            gb.addRuleItem(t.val,TokenRefType.STRING,t.line);
        }
        else if(token.id === T.LT){
            nt();
            t = token.clone();
            expect(T.NAME);
            expect(T.GT);
            gb.addRuleItem(t.val,TokenRefType.TOKEN,t.line);
        }
        if(token.id === T.BLOCK || token.id === T.CBRA){
            let acts: LexAction[] = [];
            lexActions(acts);
            gb.addAction(acts);
            // nt();
        }
    }

    /**
     * [ <NAME> '=' ]
     */
    function sematicVar(){
        if(token.id = T.NAME){
            
        }
    }

    nt();
    file();

    return gb.build();
}

function commentFilter(scanner){
    return {
        next: function(token: Token){
            do{
                scanner.next(token);
            }while(token.id === T.BLOCK_COMMENT || token.id === T.LINE_COMMENT);
        },
        init: function(s){
            scanner.init(s);
        }
    };
}

var highlightUtil = {
    T: T,
    Token: Token,
    scanner: scan
};

function parseSource(source: InputStream, ctx: Context){
    var scanner = scan();
    scanner.init(source);
    // need to filter comments.
    return parse(commentFilter(scanner), ctx);
}

export { highlightUtil,parseSource };