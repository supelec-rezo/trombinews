
var TROMBINEWSVERSION = "0.7.9b";

var TrombiNewsServer = "http://www.rez-gif.supelec.fr/intra/trombinews/";
var userFile = "prefTrombiNews.txt";
var prefUtilisateur = new Array();


function trim(s) {
  while (s.substring(0,1) == ' ') {
    s = s.substring(1,s.length);
  }
  while (s.substring(s.length-1,s.length) == ' ') {
    s = s.substring(0,s.length-1);
  }
  return s;
}

function LoadUserFile()
{
   var istream;
   try {
       // On cherche le répertoire du profil
       var file = Components.classes["@mozilla.org/file/directory_service;1"].
                  getService(Components.interfaces.nsIProperties).
                  get("ProfD", Components.interfaces.nsIFile);


       file.append(userFile);

       istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                .createInstance(Components.interfaces.nsIFileInputStream);
       istream.init(file, 0x01, 0444, 0);
       istream.QueryInterface(Components.interfaces.nsILineInputStream);
   } catch (e) {
     return;
   }

   var line = {}, hasmore;
   var strLine, virgule;
   var strKey, strValue;
   do {
     hasmore = istream.readLine(line);

     strLine = line.value;
     if (strLine.substr(0,1) == "#") {
       // Commentaire
       continue;
     }

     virgule = strLine.indexOf(",");

     if (virgule == -1) continue; // Pas de virgule, mauvaise ligne !

     strKey   = strLine.substr(0,virgule);
     strValue = strLine.substr(virgule + 1);
     
     prefUtilisateur[strKey] = strValue;
     
   } while(hasmore);

   istream.close();

}

function retireguillemets(chaine) {
   if (chaine.substr(0,1) == "\"" && chaine.substr(chaine.length - 1) == "\"") {
     chaine = chaine.substr(1);
     chaine = chaine.substr(0, chaine.length - 1);
   }
   return chaine;
}

function onLoad() {
     LoadUserFile();

     var photoID = document.getElementById("trombinewsphoto");
     var boiteID = document.getElementById("boitedialogue");
     var mailsUtilisateur, inferieur, nomcomplet, nom, mail, superieur;
     
     nom = unescape(window.arguments[0]);
     
     inferieur = nom.indexOf("<");
     mail = nom.substr(inferieur+1);
     superieur = mail.indexOf(">");
     mail = mail.substr(0,superieur);
     nomcomplet = nom.substr(0,inferieur);
     
     var found = false;

   // Préférences utilisateur
     for (mailsUtilisateur in prefUtilisateur) {
       // Utilisation éventuelle d'un autre serveur par fichier de préférence:
       // s'ajoute par la ligne server,http://.../ (doit se terminer par /)
       if (mailsUtilisateur == "server") TrombiNewsServer = prefUtilisateur[mailsUtilisateur];
       // Images persos
       if (mail.indexOf(mailsUtilisateur) > -1) {
           found = true;
           photoID.setAttribute("src",prefUtilisateur[mailsUtilisateur]);
       }
     }
     
     
     if (TrombiNewsServer.substr(TrombiNewsServer.length - 1) != "/") TrombiNewsServer = TrombiNewsServer + "/";
     
     
     if (!found) photoID.setAttribute("src",TrombiNewsServer + "index.php?mode=large&version=" + TROMBINEWSVERSION + "&mail=" + nom);
     boiteID.setAttribute("title",retireguillemets(trim(nomcomplet)));
}
