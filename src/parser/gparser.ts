import { GBuilder, TokenDefType } from './gbuilder';
import { Assoc } from '../grammar/token-entry';
import { CompilationError as E } from '../util/E';
import { InputStream } from '../util/io';

enum T  {
    EOF = 0,
    NAME,
    STRING,
    TOKEN_DIR,
    OPT,
    BLOCK,
    ARROW,
    EOL,
    OR,
    TOKEN,
    SEPERATOR,
    LEFT_DIR,
    RIGHT_DIR,
    NONASSOC_DIR,
    PREC_DIR,
    REGEXP,
    STATE_DIR,
    LINE_COMMENT,
    BLOCK_COMMENT,
    
    // highlight only
    OPEN_CURLY_BRA,
    CLOSE_CURLY_BRA
};

var tokenNames = [];
for(var tname in T){
    tokenNames[T[tname]] = tname;
}

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
            s1 = 'unexpected character "' + c + '"';
        }
        if(c1){
            throw new E(s1 + ' after "' + c1 + '"',line);
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
        't': '\t'
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
                if(iss('token')){
                    token.id = T.TOKEN_DIR;
                    break lex;
                }
                else if(iss('opt')){
                    token.id = T.OPT;
                    break lex;
                }
                else if(iss('left')){
                    token.id = T.LEFT_DIR;
                    break lex;
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
                else if(iss('state')){
                    token.id = T.STATE_DIR;
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
                            throw new E('unclosed block',line);
                        }
                        if(c == '{'){
                            st++;
                        }
                        else if(c == '}'){
                            st--;
                        }
                        token.val += c;
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
                else {
                    token.id = T.REGEXP;
                    token.val = handleRegExp();
                    break lex;
                }
                //err('/');
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
                if(c as string == '>'){
                    nc();
                    token.id = T.ARROW;
                    break lex;
                }
                err('-');
            case '\'':
            case '"':
                token.id = T.STRING;
                token.val = handleString();
                break lex;
            case '<':
                nc();
                token.id = T.TOKEN;
                token.val = '';
                while(c as string !== '>' && !eof()){
                    token.val += c;
                    nc();
                }
                if(eof()){
                    throw new E('unexpected end of file: incomplete token literal',line);
                }
                nc();
                if(token.val === ''){
                    throw new E('unexpected empty token',line);
                }
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

function parse(scanner){
    var token = new Token();
    var gb = new GBuilder();

    function nt(){
        scanner.next(token);
    }

    function expect(id){
        if(token.id !== id){
            throw new E('unexpected token "' + tokenNames[token.id] + '",expecting "' + tokenNames[id] + '"',token.line);
        }
        nt();
    }

    /**
     * file() ->
     * 
     * options() <SEPERATOR> rules() <EOF>
     * 
     */
    function file(){
        options();
        expect(T.SEPERATOR);
        rules();
        expect(T.EOF);
    }

    function prTokens(assoc){
        do{
            if(token.id === T.STRING){
                gb.defineTokenPrec(token.val,assoc,false,token.line);
            }
            else if(token.id === T.NAME){
                gb.defineTokenPrec(token.val,assoc,true,token.line);
            }
            else {
                throw new E('unexpected token "' + tokenNames[token.id] + '",expecting string or name',token.line);
            }
            nt();
        }while(token.id === T.STRING || token.id === T.NAME);
        gb.incPr();
    }

    /**
     * options() ->
     * 
     * '%token' (tokenDef())+
     * | ('%left'|'%right'|'%nonassoc') [<TOKEN>]+
     * | '%opt' <NAME> <STRING>
     * | '%state' <NAME>
     * 
     */
    function options(){
        while(1){
            switch(token.id){
                case T.TOKEN_DIR:
                    nt();
                    do{
                        tokenDef();
                    }while(token.id as number === T.STRING);
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
                    gb.setOpt(name,s);
                    break;
                case T.STATE_DIR:
                    nt();
                    var n = token.val;
                    expect(T.NAME);
                    gb.changeState(n);
                    break;
                default:return;
            }
        }
    }

    /**
     * tokenDef() ->
     * 
     * (<STRING>|<TOKEN>) [<NAME>]
     */
    function tokenDef(){
        var name = token.val;
        var alias: string = '';
        
        var tline = token.line;
        if(token.id !== T.STRING && token.id !== T.TOKEN){
            throw new E('unexpeted token "' + tokenNames[token.id] + '",expecting STRING or TOKEN',token.line);
        }
        var isString = token.id === T.STRING;
        nt();
        if(token.id as T === T.NAME){
            alias = token.val;
            nt();
        }
        gb.defToken(name,alias,tline);
    }

    /**
     * rules() ->
     * 
     * rule() ( rule() )* <SEPERATOR>
     * 
     */
    function rules(){
        rule();
        while(token.id !== T.SEPERATOR){
            rule();
        }
        nt();
    }

    /**
     * rule() ->
     * 
     * <NAME> <ARROW> ruleItems() ( <OR> ruleItems() )* <EOL>
     * 
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
     * ruleItems() ->
     * 
     * ( <NAME> | (<STRING>|<TOKEN>) | <BLOCK> )* [ '%prec' (<STRING>|<NAME>) [ <BLOCK> ] ]
     * 
     */
    function ruleItems(){
        while(token.id === T.NAME || token.id === T.TOKEN || token.id === T.STRING || token.id === T.BLOCK){
            let t = token.clone();
            if(token.id === T.NAME){
                nt();
                gb.addRuleItem(t.val,false,t.line);
            }
            else if(token.id === T.STRING || token.id === T.TOKEN){
                nt();
                gb.addRuleItem(t.val,true,t.line);
            }
            if(token.id === T.BLOCK){
                gb.addAction(token.val);
                nt();
            }
        }
        if(token.id === T.PREC_DIR){
            nt();
            let t = token.val;
            var line = token.line;
            if(token.id as T === T.STRING){
                gb.defineRulePr(t,false,line);
                nt();
            }
            else if(token.id as T === T.NAME){
                gb.defineRulePr(t,true,line);
                nt();
            }
            else {
                throw new E('unexpected token "' + tokenNames[token.id] + '",expecting string or name',token.line);
            }
            
            if(token.id as T === T.BLOCK){
                gb.addAction(token.val);
                nt();
            }
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

function parseSource(source){
    var scanner = scan();
    scanner.init(source);
    // need to filter comments.
    return parse(commentFilter(scanner));
}

export { highlightUtil,parseSource };