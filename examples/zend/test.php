<html>
<head><?php 
for($e = 0; $e < 10; $e++){
    echo $e;
    continue;
    echo $e + 1;
}
if($e === 0){
    echo 'hkm';
}
else {
    echo 'soor';
    break;
}
?></head>
</html>