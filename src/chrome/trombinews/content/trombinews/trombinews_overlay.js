// TrombiNews 0.7.8
// (c) Fabien Vinas 2005
// fabien.vinas@student.ecp.fr
// (c) Pierre Pattard 2006


// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//  LE CODE N'EST PAS BEAU DU TOUT, JE LE SAIS
//  C'EST NORMAL J'AI COPIE-COLLE CERTAINES
//  PORTIONS DE PLUG-INS EXISTANTS :p
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// Am�liorations � faire :
// (( - mise en cache des images niveau client pour consultation hors-ligne ))
//    (c�d requ�te sur le LDAP uniquement si image absente)
// Chercher des infos sur le serveur des �l�ves (promo, adresse, t�l�phone, ...)
// Connexion au LDAP directement depuis Javascript (sans passer par le scriph PHP sur le SdE)
//  voir doc XPCOM Mozilla (pas tr�s document� ...) ou sources Mozilla.

// Modifi� par Olivier Gatimel (dit Gagou) pour Sup�lec Rezo


var TROMBINEWSVERSION = "0.8.1";

var orgUpdateMessageHeaders = null;
var theText = null;
var theImage;
var maxHeight = 0; // Que l'on peut changer par le fichier prefTrombiNews.txt
var maxWidth = 0;
var TrombiNewsServer = "http://www.rez-gif.supelec.fr/intra/trombinews/";
var userFile = "prefTrombiNews.txt"; // A mettre dans C:\Documents and Settings\<utilisateur>\Application Data\Thunderbird\Profiles\<profil>\
// Peut contenir des lignes dans les formats suivant :
// prenom.nom@student.ecp.fr,file:///C:/data/grafik/mytbicon.png
// mail@gmail.com,http://example.com/icons/agent.gif

var prefUtilisateur = new Array();

var mfWrapper = {
    init: function() {
    	orgUpdateMessageHeaders = window.UpdateMessageHeaders; 
    	window.UpdateMessageHeaders = this.UpdateMessageHeaders;
        var listener = {};
        listener.onStartHeaders	= noop;
    	listener.onEndHeaders	= showSenderFace;
    	gMessageListeners.push(listener);
    },    

    UpdateMessageHeaders: function()   {
    	orgUpdateMessageHeaders();
    	showSenderFace();
    }
}

function LoadUserFile()
{
   var istream;
   try {
       // On cherche le r�pertoire du profil
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


function noop() { }

function showSenderFace()
{
   theImage.setAttribute("src","");
   var nom = currentHeaderData["from"].headerValue;
   var found = false;
   var mailsUtilisateur, inferieur, mail, superieur;
   
   // On a qqch du style "prenom nom <prenom.nom@student.ecp.fr>"
   inferieur = nom.indexOf("<");
   mail = nom.substr(inferieur+1);
   superieur = mail.indexOf(">");
   mail = mail.substr(0,superieur);
   
   // Pr�f�rences utilisateur
   for (mailsUtilisateur in prefUtilisateur) {
       // Utilisation �ventuelle d'un autre serveur par fichier de pr�f�rence:
       // s'ajoute par la ligne server,http://.../ (doit se terminer par /)
       if (mailsUtilisateur == "server") TrombiNewsServer = prefUtilisateur[mailsUtilisateur];
       if (mailsUtilisateur == "maxHeight") maxHeight = prefUtilisateur[mailsUtilisateur];
       if (mailsUtilisateur == "maxWidth") maxWidth = prefUtilisateur[mailsUtilisateur];
       // Images persos
       if (mail.indexOf(mailsUtilisateur) > -1) {
           found = true;
           theImage.setAttribute("src",prefUtilisateur[mailsUtilisateur]);
       }
   }
   
   
   if (TrombiNewsServer.substr(TrombiNewsServer.length - 1) != "/") TrombiNewsServer = TrombiNewsServer + "/";
   
   // Sinon recherche sur l'annuaire LDAP
   if (!found) theImage.setAttribute("src",TrombiNewsServer + "index.php?version="+TROMBINEWSVERSION+"&mail="+nom);
 
 /*  

POURQUOI CA MARCHE PAS ???????

// On cherche les dimensions de l'images agrandie pour dimensionner la fen�tre qui sera ouverte
   var istream;
   try {
       alert(TrombiNewsServer + "index.php?infos=dimensions&version="+TROMBINEWSVERSION+"&mail="+nom);
       istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
            .createInstance(Components.interfaces.nsIFileInputStream);
       istream.init(TrombiNewsServer + "index.php?infos=dimensions&version="+TROMBINEWSVERSION+"&mail="+nom, 0x01, 0444, 0);
       istream.QueryInterface(Components.interfaces.nsILineInputStream);
   } catch (e) {
     return;
   }
   
   var line = {}, hasmore;
   var dimX, dimY;
   // Les deux premi�res ligne contiennent largeur et hauteur
   hasmore = istream.readLine(line);
   alert(line.value);
   dimX = line.value + 30;
   hasmore = istream.readLine(line);
   diMY = line.value + 30;
   alert(line.value);
   istream.close();
   
   
   theImage.setAttribute("onclick","window.openDialog('chrome://trombinews/content/trombinews_window.xul','dlg','chrome,width="+dimX+",height="+dimY+"','"+nom+"');");
   */
   
   // Correction du "Pep's bug" (on ne peut pas ouvrir l'image zoom�e si le nom contient ')
   nom = escape(nom);//nom.replace("\'","&�&");
   
   // Redimensionnement
  if (maxHeight != 0) {
    theImage.style.maxHeight = maxHeight + "px";
    // Pourquoi �a marche pas ????
    // peut-�tre parce que l'image n'est pas encore charg�e ?
    // et puis pourquoi l'image ne se redimensionne pas toute seule selon largeur et hauteur en m�me temps, comme en html ?
    var ratio = theImage.width / theImage.Height;
    theImage.style.maxWidth = (maxHeight * ratio) + "px";
  }
  if (maxWidth != 0) theImage.style.maxWidth = maxWidth + "px";


theImage.setAttribute("onclick","window.openDialog('chrome://trombinews/content/trombinews_window.xul','dlg','chrome,width=300,height=300','"+nom+"');");

}

function initOverlay()
{
  var hdrView = document.getElementById("msgHeaderView");
  theImage = document.createElement('image');
  hdrView.appendChild(theImage);
  LoadUserFile();
  initializeHeaderViewTables();
  mfWrapper.init();
}

// On intercepte l'affichage de la barre des messages
addEventListener('messagepane-loaded', initOverlay, true);

// On modifie l'useragent pour y faire apparaitre TrombiNews :p
var prefs = Components.classes["@mozilla.org/preferences-service;1"] .getService(Components.interfaces.nsIPrefBranch);
var exUSERAGENT, ignored, nouveauUSERAGENT;
if (pref.prefHasUserValue("general.useragent.override")) { // Si on a d�j� un user agent modifi�
  // On le r�cup�re
  exUSERAGENT = prefs.getCharPref("general.useragent.override");
  // On retire partout "Trombinews/ ..."
  exUSERAGENT = exUSERAGENT.replace(/ TrombiNews\/[.0-9]*/g,"");
  // Et on ajoute celui de la derni�re version
  nouveauUSERAGENT = exUSERAGENT + " TrombiNews/" + TROMBINEWSVERSION;
} else { // Si on n'en utilisait pas auparavant
  nouveauUSERAGENT = navigator.userAgent + " TrombiNews/" + TROMBINEWSVERSION;
}

prefs.setCharPref("general.useragent.override",nouveauUSERAGENT);

