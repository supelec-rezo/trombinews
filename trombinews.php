<?
/*
 * Nouvelle version du script de récupération des photos trombis adaptée a la BDD kettu_web, permettant aussi de récuperer la photo à partir d'un nom dns.
 */

/*
 * Le script peut utiliser deux modes de sélection de l'utilisateur : via un DNS
 * ou via une adresse mail.
 */
if(!isset($_GET['mail']) && !isset($_GET['dns'])) die();

mysql_connect('localhost', 'rezo_web', '********');
mysql_select_db('kettu-web');

$mail = $_GET['mail'];
$mode = $_GET['mode'];

if(preg_match('/<.*>$/', $mail))
    $mail = preg_replace('/^.+<(.+)>/', '$1', $mail);

// DNS
if($mode == 'dns')
{
	$dns = mysql_real_escape_string($_GET['dns']);
	$dns = preg_replace('/^[a-zA-Z\-]+/', '$0', $dns);
	$req = mysql_query("SELECT surname AS nom, firstname AS prenom, promotion AS promo, photo1 FROM trombi_entries WHERE LOWER(surname) LIKE '$dns'") or die(mysql_error());
    if(mysql_affected_rows() != 1) die();
    $data = mysql_fetch_array($req);
}
// Adresse mail
else
{
    // On tente d'abord d'identifier l'adresse email
	$req = mysql_query("SELECT surname AS nom, firstname AS prenom, promotion AS promo, photo1 FROM trombi_entries WHERE emails = '$mail'") or die(mysql_error());

    // Si ça a réussi
    if(mysql_affected_rows() == 1)
        $data=mysql_fetch_array($req);
    // Si ça ne marche pas et que l'adresse est @supelec.fr ou @rez-gif.supelec.fr
    else if(in_array(preg_replace('/^.+@(.+)$/', '$1', $mail), array('supelec.fr', 'rez-gif.supelec.fr')))
    {
        // On tente d'identifier le prénom et le nom
        $nom = explode('.', preg_replace('/^(.+)@.+$/', '$1', $mail));
        if(count($nom) != 2) die();
        $nom[0] = preg_replace('/[^a-z0-9]/', '%', $nom[0]);
        $nom[1] = preg_replace('/[^a-z0-9]/', '%', $nom[1]);
        $req = mysql_query("SELECT surname AS nom, firstname AS prenom, promotion AS promo, photo1 FROM trombi_entries WHERE firstname LIKE '$nom[0]%' AND surname LIKE '$nom[1]%'") or die(mysql_error());
        if(mysql_affected_rows() != 1) die();
        $data = mysql_fetch_array($req);
    }
    // Sinon, plus rien à faire
    else if(mysql_affected_rows()!=1) die();
}

/*
 * Il y a plusieurs sorties possibles :
 */
// Le nom : prénom ' ' nom
if($mode == 'nom')
    echo $data['prenom'] . ' ' . $data['nom'];
// La promotion
elseif($mode == 'promo')
    echo $data[2];
// La photo
else
{
    if(isset($_GET['width']) && is_numeric($_GET['width']))
    {
    	$width = $_GET['width'];
    	$height = $width;
    }
    elseif($mode == 'large')
    {
        $width = 200;
        $height = 200;
    } 
    else
    {
        $width = 100;
        $height = 100;
    }

    if($data['photo1'] == null || $data['photo1'] == '') die();
    $filename = '../../trombi/thumbs/' . $data['photo1'];
    if(!file_exists($filename)) die();

    header('Content-type: image/jpg');

    // Cacul des nouvelles dimensions
    list($width_orig, $height_orig, $type) = getimagesize($filename);

    $ratio_orig = $width_orig/$height_orig;

    if($width/$height > $ratio_orig)
        $width = $height*$ratio_orig;
    else
        $height = $width/$ratio_orig;

    // Redimensionnement
    $image_p = imagecreatetruecolor($width, $height);
    if($type == 1)
        $image = imagecreatefromgif($filename);
    else
        $image = imagecreatefromjpeg($filename);
    imagecopyresampled($image_p, $image, 0, 0, 0, 0, $width, $height, $width_orig, $height_orig);

    imagejpeg($image_p);
}

?>
