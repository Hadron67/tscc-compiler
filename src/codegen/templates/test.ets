<% function echo(s: string){
    output.write(s);
}
function echoLine(s: string){
    output.writeln(s);
} %>

let a = [
<% for(let i = 0; i < 10; i++){ -%>
    a<%- i.toString() %>
<% } %>
];
