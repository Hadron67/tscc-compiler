<html>
<head><?php 
// I am a line comment
/* 
    I am a block comment
*/
# I am a of line comment begin with '#'

// a for loop
for($e = 0; $e < 10; $e++){
    echo $e;
    continue;
    echo $e + 1;
}
// an if statement
if($e === 0){
    echo 'hkm';
}
else {
    echo 'soor';
}
$name = 'tstssoor';

// heredoc
echo <<< EOT
BEPC Real Time Chart
Mode: ${$bepc->mode === 0 ? 'BESR' : 'BEPC'}
electron lumisity: $bepc->em
positron lumisity: $bepc->pm
e- current: $bepc->ec mA
e+ current: $bepc->ep mA
Time: $time[0]
<canvas id="tc"></canvas>
EOT;

// nowdoc
echo <<< 'EOT'
The body of a nowdoc won't be parsed, in which case something
like $name, $e->prop, $rt[0] will all be treated literally.
EOT;

// strings
$e = "a double quote string can contain variables $name, property name $foo->bar or subscript $e[5]";
$a = `new lines are allowed in back quote strings.
e+ e- -> q qbar gammar
$p->photonCount photons are emitted
`;

$low_interest = [
    'hkm' => 'soor',
    'rfnj' => '你肯定在'
];
$low_interest[] = 5;
?></head>
</html>