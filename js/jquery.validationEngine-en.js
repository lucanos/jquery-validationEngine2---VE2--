

(function($) {

  $.fn.validationEngineLanguage = function() {};

  $.validationEngineLanguage = {
    newLang :  function() {
      $.validationEngineLanguage.allRules = { // Add your regex rules here, you can take telephone as an example
        "required" : {
          "regex"                     : "none" ,
          "alertText"                 : "* This field is required" ,
          "alertTextCheckboxMultiple" : "* Please select an option" ,
          "alertTextCheckboxSingle"   : "* This checkbox is required"
        } ,
        "length" : {
          "regex"      : "none" ,
          "alertText"  : "* Between" ,
          "alertText2" : "and" ,
          "alertText3" : "characters allowed"
        } ,
        "maxCheckbox" : {
          "regex"     : "none" ,
          "alertText" : "* Checks allowed Exceeded"
        } ,
        "minCheckbox" : {
          "regex"      : "none" ,
          "alertText"  : "* Please select" ,
          "alertText2" : "options"
        } ,
        "confirm" : {
          "regex"     : "none" ,
          "alertText" : "* Your fields do not match"
        } ,
        "telephone" : {
          "regex"     : "/^[0-9\-\(\)\ ]+$/" ,
          "alertText" : "* Invalid phone number"
        } ,
          "telephoneAUS" : {
            "regex"     : "/^(?:(?:\(?0[2378]\)?\ ?)?[2-9]\d{3}\ ?\d{4})|(?:04\d{2}(?:\ ?\d{3}\ ?\d{3}|(?:\ ?\d{2}){2}\ ?\d{2}))$/" ,
            "alertText" : "* Invalid Australian phone number"
          } ,
          "telephoneAUSmobile" : {
            "regex"     : "/^04\d{2}(?:\ ?\d{3}\ ?\d{3}|(?:\ ?\d{2}){2}\ ?\d{2})$/" ,
            "alertText" : "* Invalid Australian mobile phone number"
          } ,
        "email" : {
          "regex"     : "/^[a-zA-Z0-9_\.\-]+\@([a-zA-Z0-9\-]+\.)+[a-zA-Z0-9]{2,4}$/" ,
          "alertText" : "* Invalid email address"
        } ,
        "date" : {
          "regex"     : "/^(?:[012]?[0-9]|3[01])[\/\-](?:0?[0-9]|1[0-2])[\/\-](?:[12][0-9]{3})$/" ,
          "alertText" : "* Invalid date, must be in DD/MM/YYYY format"
        } ,
          "dateUS" : {
            "regex"     : "/^(?:[12][0-9]{3})[\/\-](?:0?[0-9]|1[0-2])[\/\-](?:[012]?[0-9]|3[01])$/" ,
            "alertText" : "* Invalid date, must be in YYYY/MM/DD format"
          } ,
          "dateEU" : {
            "regex"     : "/^(?:[012]?[0-9]|3[01])[\/\-](?:0?[0-9]|1[0-2])[\/\-](?:[12][0-9]{3})$/" ,
            "alertText" : "* Invalid date, must be in DD/MM/YYYY format"
          } ,
        "onlyNumber" : {
          "regex"     : "/^[0-9\.\ ]*$/" ,
          "alertText" : "* Numbers only"
        } ,
        "onlyNumberStrict" : {
          "regex"     : "/^[0-9\.]*$/" ,
          "alertText" : "* Numbers only"
        } ,
        "onlyCash" : {
          "regex"     : "/^[\$][0-9]*(?:\.[0-9]*)?$/" ,
          "alertText" : "* Monetary value only"
        } ,
        "onlyLetter" : {
          "regex"     : "/^[a-zA-Z\ \']*$/" ,
          "alertText" : "* Letters only"
        } ,
        "noSpecialCharacters" : {
          "regex"     : "/^[0-9a-zA-Z]*$/" ,
          "alertText" : "* No special characters allowed"
        } ,
        "ajaxUser" : {
          "file"          : "validateUser.php" ,
          "extraData"     : "name=eric" ,
          "alertTextOk"   : "* This user is available" ,
          "alertTextLoad" : "* Loading, please wait" ,
          "alertText"     : "* This user is already taken"
        } ,
        "ajaxName" : {
          "file"          : "validateUser.php" ,
          "alertText"     : "* This name is already taken" ,
          "alertTextOk"   : "* This name is available" ,
          "alertTextLoad" : "* Loading, please wait"
        } ,
        "validate2fields" : {
          "nname"     : "validate2fields" ,
          "alertText" : "* You must have a firstname and a lastname"
        }
      }
    }
  }

})(jQuery);

$( document ).ready( function(){

  $.validationEngineLanguage.newLang();

} );
