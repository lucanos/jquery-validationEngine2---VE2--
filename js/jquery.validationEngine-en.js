

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
          "regex"      : "none" ,
          "alertText"  : "* Please select no more than" ,
          "alertText2" : "option(s)"
        } ,
        "minCheckbox" : {
          "regex"      : "none" ,
          "alertText"  : "* Please select at least" ,
          "alertText2" : "option(s)"
        } ,
        "confirm" : {
          "regex"     : "none" ,
          "alertText" : "* Your fields do not match"
        } ,
        "telephone" : {
          "regex"     : /^[\d\-\(\)\ ]+$/ ,
          "alertText" : "* Invalid phone number"
        } ,
          "telephoneAUS" : {
            "regex"     : /^(?:(?:\(?0[2378]\)?\ ?)?[2-9]\d{3}\ ?\d{4})|(?:04\d{2}(?:\ ?\d{3}\ ?\d{3}|(?:\ ?\d{2}){2}\ ?\d{2}))$/ ,
            "alertText" : "* Invalid Australian phone number"
          } ,
          "telephoneAUSmobile" : {
            "regex"     : /^04\d{2}(?:\ ?\d{3}\ ?\d{3}|(?:\ ?\d{2}){2}\ ?\d{2})$/ ,
            "alertText" : "* Invalid Australian mobile phone number"
          } ,
        "email" : {
          "regex"     : /^(?:[A-Z0-9][\w\d\.\-]+)(?:[\+\/]?(?:[\w\d\.\-]+))?@(?:[A-Z0-9][\w\-]*\.)+[A-Z0-9][\w\-]*[A-Z]$/i ,
          "alertText" : "* Invalid email address"
        } ,
        "date" : {
          "regex"     : /^(?:[012]?\d|3[01])[\/\-](?:0?\d|1[0-2])[\/\-](?:[12]\d{3})$/ ,
          "alertText" : "* Invalid date, must be in DD/MM/YYYY format"
        } ,
          "dateUS" : {
            "regex"     : /^(?:[12]\d{3})[\/\-](?:0?\d|1[012])[\/\-](?:[012]?\d|3[01])$/ ,
            "alertText" : "* Invalid date, must be in YYYY/MM/DD format"
          } ,
          "dateEU" : {
            "regex"     : /^(?:[012]?\d|3[01])[\/\-](?:0?\d|1[0-2])[\/\-](?:[12]\d{3})$/ ,
            "alertText" : "* Invalid date, must be in DD/MM/YYYY format"
          } ,
        "onlyNumber" : {
          "regex"     : /^[\d\.\ ]*$/ ,
          "alertText" : "* Numbers only"
        } ,
        "onlyNumberStrict" : {
          "regex"     : /^[\d\.]*$/ ,
          "alertText" : "* Numbers only"
        } ,
        "onlyCash" : {
          "regex"     : /^[\$]?\d+(?:\,\d{3})*(?:\.\d*)?$/ ,
          "alertText" : "* Monetary value only"
        } ,
        "onlyLetter" : {
          "regex"     : /^[A-Z\ \']*$/i ,
          "alertText" : "* Letters only"
        } ,
        "noSpecialCharacters" : {
          "regex"     : /^[\dA-Z]*$/i ,
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
