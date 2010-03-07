<?
/* Nouvelle version du script de recuperation des photos trombis adaptee a la BDD kettu_web permettant aussi de recuperer la photo a partir d'un nom dns
*/
if(!isset($_GET['mail'])&& !isset($_GET['dns'])) die();

mysql_connect("localhost","rezo_web","********");
mysql_select_db("kettu-web");

$mail=$_GET['mail'];
$mode=$_GET['mode'];

if(ereg(".*<.*>$",$mail)) {
  ereg(".*<(.*)@(.*)>",$mail,$regs);
} else {
  ereg("(.*)@(.*)",$mail,$regs);
}

$mail1=$regs[1];
if($mode=='dns'){
  dns=mysql_real_escape_string($_GET['dns']);
  ereg("[a-zA-Z-]+",$dns,$res);
  $dns=$res[0];
  $req=mysql_query("SELECT surname AS nom, firstname AS prenom, promotion AS promo, photo1 FROM trombi_entries WHERE LOWER(surname) LIKE '$dns'") or die(mysql_error());
}
else{
  $req=mysql_query("SELECT surname AS nom, firstname AS prenom, promotion AS promo, photo1 FROM trombi_entries WHERE emails LIKE '$mail1%'") or die(mysql_error());
}

if(mysql_affected_rows()!=1) die();
$data=mysql_fetch_array($req);

if($mode=="nom") {
echo $data[1]." ".$data[0];
}
elseif($mode=="promo") {
echo $data[2];
}
else{

if(isset($_GET['width']) && is_numeric($_GET['width'])){
  $width = $_GET['width'];
  $height = $width;
}
elseif($mode=="large") {
  $width=200;
  $height=200;
} else {
  $width = 100;
  $height = 100;
}

$filename="../../trombi/thumbs/".$data['photo1'];

header("Content-type: image/jpg");

// Cacul des nouvelles dimensions
list($width_orig, $height_orig, $type) = getimagesize($filename);

$ratio_orig = $width_orig/$height_orig;

if ($width/$height > $ratio_orig) {
  $width = $height*$ratio_orig;
} else {
  $height = $width/$ratio_orig;
}

// Redimensionnement
$image_p = imagecreatetruecolor($width, $height);
if ($type==1) {
  $image = imagecreatefromgif($filename);
} else {
  $image = imagecreatefromjpeg($filename);
}
imagecopyresampled($image_p, $image, 0, 0, 0, 0, $width, $height, $width_orig, $height_orig);

imagegif($image_p);
}

?>
