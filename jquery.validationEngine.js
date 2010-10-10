/*
 * Inline Form Validation Engine 2.0.0, jQuery plugin
 *
 * Copyright(c) 2010, Cedric Dugas [http://www.position-relative.net]
 * Copyright(c) 2010, Luke Stevenson [http://www.lucanos.com]
 *
 * Form validation engine allowing custom regex rules to be added.
 * Thanks to Francois Duquette and Teddy Limousin
 * and everyone helping me find bugs on the forum
 * Licenced under the MIT Licence
 */

(function( $ ){

	$.fn.validationEngine = function( settings ){
;;; //console.groupCollapsed( "validationEngine( %o )" , settings );

   // IS THERE A LANGUAGE LOCALISATION ?
;;; //console.log( 'Checking Language Localisation' );
    if( $.validationEngineLanguage ){
;;;   //console.log( 'Language Localisation Detected - Loaded' );
      allRules = $.validationEngineLanguage.allRules;
    }else{
;;;   //console.error( 'No Language Localisation Detected' );
     // TODO - Include a Default Language/Rules Set
      $.validationEngine.debug( 'Validation engine rules are not loaded check your external file' );
    }

    settings = jQuery.extend( {
      allrules: allRules ,
      validationEventTriggers: 'focusout' ,
      inlineValidation: true ,
      returnIsValid: false ,
      /* liveEvent: true , - Defaulting to this now. No point keeping it as a setting */
      unbindEngine: true ,
      containerOverflow: false ,
      containerOverflowDOM: '' ,
      ajaxSubmit: false ,
      triggerOnSubmit: false ,
      scroll: true ,
      promptPosition: 'topRight' ,	// Error Message Position. Options: topLeft, topRight, bottomLeft, centerRight, bottomRight
      success: false ,
      beforeSuccess:  function(){} ,
      failure: function(){}
    } , settings );
    $.validationEngine.settings = settings;

   // Array for AJAX: Validation Memory
    $.validationEngine.ajaxValidArray = new Array();

   // Validating Inline ?
    if( settings.inlineValidation==true ){
;;;   //console.log( 'Inline Validation (Validation as you go) is Enabled' );

     // NEEDED FOR THE SETTING returnIsValid
      if( !settings.returnIsValid ){
;;;     //console.log( 'Not Executed as a "returnIsValid" request' );
        allowReturnIsvalid = false;
        $this = $(this);
       // LIVE event, vast performance improvement over BIND
;;;     //console.log( 'Binding (Live) Validation to All Non-Checkboxes' );
        $this.find( '[class*="validate"][type!="checkbox"]' )
          .live( settings.validationEventTriggers , function(){
            caller = $( this );
;;;         //console.groupCollapsed( '%o.%s()' , caller , settings.validationEventTriggers );
            if( !caller.is( ':disabled, :hidden' ) ){
;;;           //console.log( 'Element is not Disabled or Hidden - Validating' );
              _inlineEvent( caller );
            }else{
;;;           //console.log( 'Element is Disabled or Hidden - Not Validating' );
            }
;;;         //console.groupEnd();
          } );
;;;     //console.log( 'Binding (Live) Validation to All Checkboxes & Select Elements' );
        $this.find( '[class*="validate"][type="checkbox"], [class*="validate"][type^="select"]' )
          .live( 'change' , function(){
            caller = $( this );
;;;         //console.groupCollapsed( '%o.change()' , caller );
            if( !caller.is( ':disabled, :hidden' ) ){
;;;           //console.log( 'Element is not Disabled or Hidden - Validating' );
              _inlineEvent( caller );
            }else{
;;;           //console.log( 'Element is Disabled or Hidden - Not Validating' );
            }
;;;         //console.groupEnd();
          } );
        //console.log( 'Binding (Live) Action to All Inputs, for when an Error has been Generated and the Field is Revisited
        $this.find( '[class*="validate"][formerrorclass]' )
          .live( 'focus' , function(){
;;;         //console.groupCollapsed( '%o.focus()' , caller );
;;;         //console.log( 'Previously Errored Field has been Focused - Partially Fade the Error Message' );
            var $field = $( this );
            $( '.'+$field.attr( 'formerrorclass' ) )
              .fadeTo( 'slow' , 0.67 );
;;;         //console.groupEnd();
          } )
          .live( 'blur' , function(){
;;;         //console.groupCollapsed( '%o.blur()' , caller );
;;;         //console.log( 'Previously Errored Field has been Unfocused - Restore the Error Message to Normal Opacity' );
            var $field = $( this );
            $( '.'+$field.attr( 'formerrorclass' ) )
              .fadeTo( 'fast' , 0.87 );
;;;         //console.groupEnd();
          } )
          .live( 'keyup click' , function(){
            caller = $( this );
;;;         //console.groupCollapsed( '%o.keyup()' , caller );
;;;         //console.log( 'Performing Re-Validation' );
            _inlineEvent( caller );
;;;         //console.log( 'Re-Fading the Error Message' );
            $( '.'+caller.attr( 'formerrorclass' ) )
              .css( 'opacity' , 0.67 );
;;;         //console.groupEnd();
          } );
        firstvalid = false;
      }else{
;;;     //console.log( 'Executed as a "returnIsValid" request' );
      }

      function _inlineEvent( caller ){
        caller = $( caller );
;;;     //console.groupCollapsed( "_inlineEvent( %o )" , caller );
        $.validationEngine.settings = settings;
       // Stop Inline Validation This Time Only
        if( $.validationEngine.intercept==false
            || !$.validationEngine.intercept ){
;;;       //console.log( 'Do Not Intercept' );
          $.validationEngine.onSubmitValid = false;
;;;       //console.log( 'Perform Field Validation' );
          $.validationEngine.getValidationRules( caller );
        }else{
;;;       //console.log( 'Intercept' );
          $.validationEngine.intercept = false;
        }
;;;     //console.groupEnd();
      }

    }else{
;;;   //console.log( 'Inline Validation (Validation as you go) is NOT Enabled' );
    }

   // Do validation and return true or false, it bypass everything
    if( settings.returnIsValid ){
;;;   //console.log( 'Executed as a "returnIsValid" request - Running submitValidation()' )
      return !$.validationEngine.submitValidation( this , settings );
    }

    if( $.validationEngine.settings.triggerOnSubmit===true ){
     // On FORM Submit, Control AJAX function if specified on DOCUMENT READY
      $( this ).bind( 'submit' , function(){
        caller = $( this );
;;;     //console.groupCollapsed( '%o.submit()' , caller );
        $.validationEngine.onSubmitValid = true;
        $.validationEngine.settings = settings;
        if( $.validationEngine.submitValidation( this , settings )!=false ){
          settings.failure && settings.failure();
;;;       //console.groupEnd();
          return false;
        }
        if( $.validationEngine.submitForm( this , settings )==true ){
;;;       //console.groupEnd();
          return false;
        }
      } );
    }

   // Fade Out and Remove Error Message, when Clicked
    $( '.formError' ).live( 'click' , function(){
;;;   //console.log( '.formError.click() detected' );
      $( this ).fadeOut( 150 ,function(){
;;      //console.log( '.formError.click() completed' );
        $( this ).remove();
      } );
    } );
;;;   //console.groupEnd();
  }


  $.validationEngine = {

   // Not generally used, needed for the API, DO NOT TOUCH
    defaultSetting : function( caller ){
;;;   //console.groupCollapsed( 'defaultSetting( %o )' , caller );

      if( $.validationEngineLanguage ){
        allRules = $.validationEngineLanguage.allRules;
      }else{
        $.validationEngine.debug( 'Validation engine rules are not loaded check your external file' );
      }

      settings = {
        allrules: allRules ,
        validationEventTriggers: 'focusout' ,
        inlineValidation: true ,
        containerOverflow: false ,
        containerOverflowDOM: '' ,
        returnIsValid: false ,
        scroll: true ,
        unbindEngine: true ,
        ajaxSubmit: false ,
        promptPosition: 'topRight' ,	// Error Message Position. Options: topLeft, topRight, bottomLeft, centerRight, bottomRight
        success : false ,
        failure : function(){}
      };
      $.validationEngine.settings = settings;
;;;     //console.groupEnd();
    } ,

   // Get Validation Rules to be Tested
    getValidationRules : function( caller ){
;;;   //console.groupCollapsed( "getValidationRules( %o )" , caller );
      var $caller = $( caller );

      if( !$.validationEngine.settings )
        $.validationEngine.defaultSetting();
      rulesParsing = $caller.attr( 'class' );
;;;   //console.log( 'Field Class = "%s"' , rulesParsing );
      rulesRegExp = /\[(.*)\]/;
      getRules = rulesRegExp.exec( rulesParsing );
;;;   //console.log( 'Rules Array = %o' , getRules );
      if( getRules==null ){
;;;     //console.log( 'No Rules Array - Returning False' );
;;;     //console.groupEnd();
        return false;
      }
      str = getRules[1];
      pattern = /\[|,|\]/;
      result = str.split( pattern );
;;;   //console.log( 'result = "%o"' , result );
;;;   //console.log( 'Running processFieldValidation()' );  
;;;   //console.groupEnd();
      return $.validationEngine.processFieldValidation( caller , result );
    } ,

   // Execute Validation for This Field
    processFieldValidation : function( caller , rules ){
;;;   //console.groupCollapsed( "processFieldValidation( %o , %o )" , caller , rules );
      var promptText = '';
      var $caller = $( caller );
      ajaxValidate = false;
      $.validationEngine.isError = false;
      $.validationEngine.showTriangle = true;
      var callerName = $caller.attr( 'name' );
      callerType = $caller.attr( 'type' );

     // If there is No ID attached to this field, create a new, hopefully unique, one.
      if( !$caller.attr( 'id' ) ){
        var newID = 'validationEngine_'+( new Date ).getTime()+( Math.random()+'' ).replace( '0.' , '' );
        $caller.attr( 'id' , newID );
        //console.log( 'Element had No ID. New ID = "%s"' , newID );
      }

      for( i=0 ; i<rules.length ; i++ ){
;;;     //console.log( 'Processing Rule#%s - %s' , i , rules[i] );
       // Empty rule - Skip
        if( rules[i]=='' )
          continue;
        switch( rules[i] ){
          case 'optional' :
            if( !$caller.val() ){
              $.validationEngine.closePrompt( caller );
              return $.validationEngine.isError;
            }else{
;;;           //console.log( 'Field is Not Empty - Valid' );
            }
            break;
          case 'required' :
            _required( caller , rules );
            break;
          case 'custom' :
            _customRegex( caller , rules , i );
            break;
          case 'exemptString' :
            _exemptString( caller , rules , i );
            break;
          case 'ajax' :
            if( !$.validationEngine.onSubmitValid )
              _ajax( caller , rules , i );
            break;
          case 'length' :
             _length( caller , rules , i );
            break;
          case 'maxCheckbox' :
            _maxCheckbox( caller , rules , i );
            caller = $( 'input[name="'+callerName+'"]' );
          break;
          case 'minCheckbox' :
            _minCheckbox( caller , rules , i );
            caller = $( 'input[name="'+callerName+'"]' );
          break;
          case 'confirm' :
            _confirm( caller , rules , i );
            break;
          case 'funcCall' :
            _funcCall( caller , rules , i );
            break;
        }
       // If the field has an "errormsg" attribute, and we have at least one error
        if( $caller.attr( 'errormsg' ) && $.validationEngine.isError ){
         // Set the Error Message content to the "errormsg" attribute.
          promptText = $caller.attr( 'errormsg' );
         // Do not perform any further tests.
          break;
        }
      }

      if( callerType=='radio' || callerType=='checkbox' )
        radioHack();

      if( $.validationEngine.isError==true ){
        var linkTofieldText = '.'+$.validationEngine.linkTofield( caller );
        if( linkTofieldText=='.' ){
          $.validationEngine.updatePromptText( caller , promptText , false , false , linkTofieldText );
        }else if( !$( linkTofieldText )[0] ){
          $.validationEngine.buildPrompt( caller , promptText , 'error' , false , linkTofieldText );
        }else{
          $.validationEngine.updatePromptText( caller , promptText );
        }
      }else{
        $.validationEngine.closePrompt( caller );
      }

     /* UNFORTUNATE RADIO AND CHECKBOX GROUP HACKS */
     /* As my validation is looping input with id's we need a hack for my validation to understand to group these inputs */
      function radioHack(){
;;;     //console.groupCollapsed( 'radioHack()' );
       // Hack for radio/checkbox group button, the validation go the first radio/checkbox of the group
        if( $( 'input[name="'+callerName+'"]' ).size()>1 ){
;;;       //console.log( 'More than 1 Radio/Checkbox Element' );
          $caller = ( caller = $( 'input[name="'+callerName+'"][type!=hidden]:first' ) );
          $.validationEngine.showTriangle = false;
        }else{
;;;       //console.log( '1 or Less Radio/Checkbox Element' );
        }
;;;     //console.groupEnd();
      }

     /* VALIDATION FUNCTIONS */

     // VALIDATE BLANK FIELD
      function _required( caller , rules ){
;;;     //console.groupEnd( "_required( %o , %o )" , caller , rules );
        var $caller = $( caller );
        callerType = $caller.attr( 'type' );
        var reqResult = true;

        switch( callerType ){
          case 'text' :
          case 'password' :
          case 'textarea' :
            if( !$caller.val() ){
              reqResult = false;
              promptText += $.validationEngine.settings.allrules[rules[i]].alertText+'<br />';
            }
            break;
          case 'radio' :
          case 'checkbox' :
            callerName = $caller.attr( 'name' );
            if( $( 'input[name="'+callerName+'"]:checked' ).size()==0 ){
              reqResult = false;
              if( $( 'input[name="'+callerName+'"]' ).size()==1 ){
                promptText += $.validationEngine.settings.allrules[rules[i]].alertTextCheckboxSingle+'<br />';
              }else{
                promptText += $.validationEngine.settings.allrules[rules[i]].alertTextCheckboxMultiple+'<br />';
              }
            }
            break;
          case 'select-one' :
          case 'select-multiple' :
           // added by paul@kinetek.net for select boxes, Thank you
            if( !$caller.find( 'option:selected' ).val() ) {
              reqResult = false;
              promptText += $.validationEngine.settings.allrules[rules[i]].alertText+'<br />';
            }
            break;
        }

        if( !reqResult ){
          $.validationEngine.isError = true;
        }
;;;     //console.log( 'Returning %o', reqResult );
;;;     //console.groupEnd();
        return reqResult;
      }

     // Validate Regular Expression Rules
      function _customRegex( caller , rules , position ){
;;;     //console.groupCollapsed( "_customRegex( %o , %o , %s )" , caller , rules , position );
        var $caller = $( caller );
        customRule = rules[position+1];
        pattern = $.validationEngine.settings.allrules[customRule].regex;
;;;       //console.log( 'customRule = %o' , customRule );
;;;     //console.log( 'RegExp = %o' , pattern );
        if( !pattern.test( $caller.val() ) ){
;;;       //console.log( 'Pattern did not match "%s"' , $caller.val() );
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules[customRule].alertText+'<br />';
        }else{
;;;       //console.log( 'Pattern matched "%s"' , $caller.val() );
        }
;;;     //console.groupEnd();
      }

     // Validate "exemptString" Rules
     // TODO: Explain this better
      function _exemptString( caller , rules , position ){
;;;     //console.groupCollapsed( "_exemptString( %o , %o , %s )" , caller , rules , position );
        var $caller = $( caller );
        customString = rules[position+1];

        if( customString==$caller.val() ){
          $.validationEngine.isError = true;
         // TODO: Check whether this should be using the "required" alertText
          promptText += $.validationEngine.settings.allrules['required'].alertText+'<br />';
        }
;;;     //console.groupEnd();
      }

     // Validate by calling Function outside of the Engine
      function _funcCall( caller , rules , position ){
;;;     //console.groupCollapsed( "_funcCall( %o , %o , %s )" , caller , rules , position );
        customRule = rules[position+1];
        var fn = window[ $.validationEngine.settings.allrules[customRule].nname ];

        if( typeof( fn )==='function' ){
          var fn_result = fn( caller );
          switch( typeof( fn_result ) ){
            case 'boolean' :
;;;           //console.log( 'Result is Boolean : %s' , fn_result );
              if( fn_result===false ){
                $.validationEngine.isError = true;
                promptText += $.validationEngine.settings.allrules[customRule].alertText+'<br />';
              }
              break;
            case 'string' :
;;;           //console.log( 'Result is String : %s' , fn_result );
              if( fn_result!=='' ){
                $.validationEngine.isError = true;
                promptText += ( !/^\*\s+/.test( fn_result ) ? '* ' : '' )+fn_result+'<br />';
              }
          }
        }
;;;     //console.groupEnd();
      }

      function _ajax( caller , rules , position ){
;;;     //console.groupCollapsed( "_ajax( %o , %o , %s )" , caller , rules , position );
        $caller = $( caller );

        customAjaxRule = rules[position+1];
        postfile = $.validationEngine.settings.allrules[customAjaxRule].file;
        fieldValue = $caller.val();
        ajaxCaller = caller;
        fieldId = $caller.attr( 'id' );
        ajaxValidate = true;
        ajaxisError = $.validationEngine.isError;

        extraData = $.validationEngine.settings.allrules[customAjaxRule].extraData || '';

       /* AJAX VALIDATION HAS ITS OWN UPDATE AND BUILD UNLIKE OTHER RULES */
        if( !ajaxisError ){
          $.ajax({
            type: 'POST' ,
            url: postfile ,
            async: true ,
            data: 'validateValue='+fieldValue+'&validateId='+fieldId+'&validateError='+customAjaxRule+'&extraData='+extraData ,
            beforeSend: function(){
             // BUILD A LOADING PROMPT IF LOAD TEXT EXIST
              if( $.validationEngine.settings.allrules[customAjaxRule].alertTextLoad ){
                if( !$( 'div.'+fieldId+'formError' )[0] ){
                  return $.validationEngine.buildPrompt( ajaxCaller , $.validationEngine.settings.allrules[customAjaxRule].alertTextLoad , 'load' );
                }else{
                  $.validationEngine.updatePromptText( ajaxCaller , $.validationEngine.settings.allrules[customAjaxRule].alertTextLoad , 'load' );
                }
              }
            } ,
            error: function( data , transport ){
              $.validationEngine.debug( 'Error in the AJAX [_ajax()]: '+data.status+' '+transport );
            } ,
            success: function( data ){
             // GET SUCCESS DATA RETURN JSON
             // GET JSON DATA FROM PHP AND PARSE IT
              data = eval( '('+data+')' );
              ajaxisError = data.jsonValidateReturn[2];
              customAjaxRule = data.jsonValidateReturn[1];
              ajaxCaller = $( '#'+data.jsonValidateReturn[0] )[0];
              fieldId = ajaxCaller;
              ajaxErrorLength = $.validationEngine.ajaxValidArray.length;
              existInarray = false;

              if( ajaxisError=='false' ){
               // DATA FALSE UPDATE PROMPT WITH ERROR
               // Check if ajax validation already used on this field
                _setInArray( false );

                if( !existInarray ){
                 // Add ajax error to stop submit
                  $.validationEngine.ajaxValidArray[ajaxErrorLength] =  new Array(2);
                  $.validationEngine.ajaxValidArray[ajaxErrorLength][0] = fieldId;
                  $.validationEngine.ajaxValidArray[ajaxErrorLength][1] = false;
                  existInarray = false;
                }

                $.validationEngine.ajaxValid = false;
                promptText += $.validationEngine.settings.allrules[customAjaxRule].alertText+'<br />';
                $.validationEngine.updatePromptText( ajaxCaller , promptText , '' , true );

              }else{

                _setInArray( true );
                $.validationEngine.ajaxValid = true;
                if( !customAjaxRule )
                  $.validationEngine.debug( 'Wrong ajax response, are you on a server or in xampp? if not delete de ajax[ajaxUser] validating rule from your form' );
                if( $.validationEngine.settings.allrules[customAjaxRule].alertTextOk ){
                 // OK Text exists - Display It
                  $.validationEngine.updatePromptText( ajaxCaller , $.validationEngine.settings.allrules[customAjaxRule].alertTextOk , 'pass' , true );
                 // Set an Auto Close on the Prompt
                  setTimeout( '$.validationEngine.closePrompt( ".'+$caller.attr( 'id' )+'formError" , true )' , 3000 );
                }else{
                  ajaxValidate = false;
                 // Close the prompt, if it exists
                  $.validationEngine.closePrompt( ajaxCaller );
                }

              }

              function  _setInArray( validate ){
                for( x=0 ; x<ajaxErrorLength ; x++ ){
                  if( $.validationEngine.ajaxValidArray[x][0]==fieldId ){
                    $.validationEngine.ajaxValidArray[x][1] = validate;
                    existInarray = true;
                  }
                }
              }

            }
          });
        }
;;;     //console.groupEnd();
      }

     // Validate Matching Field Values
      function _confirm( caller , rules , position ){
;;;     //console.groupCollapsed( "_confirm( %o , %o , %s )" , caller , rules , position );
        var $caller = $( caller );
        confirmField = rules[position+1];

        if( $caller.val()!=$( '#'+confirmField ).val() ){
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules['confirm'].alertText+'<br />';
        }
;;;     //console.groupEnd();
      }

     // Validate Value Length
      function _length( caller , rules , position ){
;;;     //console.groupCollapsed( "_length( %o , %o , %s )" , caller , rules , position );
        startLength = ( rules[position+1]=='' ? -1 : parseInt( rules[position+1] ) );
        endLength   = ( rules[position+2]=='' ? -1 : parseInt( rules[position+2] ) );
        fieldLength = $( caller ).val().length;
;;;     //console.log( 'startLength = %s' , startLength );
;;;     //console.log( 'endLength = %s' , endLength );
;;;     //console.log( 'fieldLength = %s' , fieldLength );

        if( startLength==-1 ){
         // Less than or equal to X characters
          if( fieldLength>endLength ){
            $.validationEngine.isError = true;
            promptText += $.validationEngine.settings.allrules['length'].alertTextMax+' '+endLength+' '+
                          $.validationEngine.settings.allrules['length'].alertTextMax2+'<br />';
          }
        }else if( endLength==-1 ){
         // More than, or equal to X characters
          if( fieldLength<startLength ){
            $.validationEngine.isError = true;
            promptText += $.validationEngine.settings.allrules['length'].alertTextMin+' '+startLength+' '+
                          $.validationEngine.settings.allrules['length'].alertTextMin2+'<br />';
          }
        }else if( fieldLength<startLength || fieldLength>endLength ){
         // Between X and Y characters (inclusive)
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules['length'].alertText+' '+startLength+' '+
                        $.validationEngine.settings.allrules['length'].alertText2+' '+endLength+' '+
                        $.validationEngine.settings.allrules['length'].alertText3+'<br />';
        }
;;;     //console.groupEnd();
      }

     // Validate Checkbox (Maximum Number of Checked Elements)
      function _maxCheckbox( caller , rules , position ){
;;;     //console.groupCollapsed( "_maxCheckbox( %o , %o , %s )" , caller , rules , position );
        nbCheck = eval( rules[position+1] );
        groupSize = $( 'input[name="'+( $( caller ).attr( 'name' ) )+'"]:checked' ).size();

        if( groupSize>nbCheck ){
          $.validationEngine.showTriangle = false;
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules['maxCheckbox'].alertText+' '+nbCheck+' '+
                        $.validationEngine.settings.allrules['maxCheckbox'].alertText2+'<br />';
        }
;;;     //console.groupEnd();
      }

     // Validate Checkbox (Minimum Number of Checked Elements)
      function _minCheckbox( caller , rules , position ){
;;;     //console.groupCollapsed( "_minCheckbox( %o , %o , %s )" , caller , rules , position );
        nbCheck = eval( rules[position+1] );
        groupSize = $( 'input[name="'+$( caller ).attr( 'name' )+'"]:checked' ).size();
;;;     //console.log( 'nbCheck = %s, groupSize = %s' , nbCheck , groupSize );
        if( groupSize<nbCheck ){
;;;       //console.log( 'Insufficient Checkboxes Detected' );
          $.validationEngine.isError = true;
          $.validationEngine.showTriangle = false;
          promptText += $.validationEngine.settings.allrules['minCheckbox'].alertText+' '+nbCheck+' '+
                        $.validationEngine.settings.allrules['minCheckbox'].alertText2+'<br />';
        }else{
;;;       //console.log( 'Sufficient Checkboxes Detected' );
        }
;;;     //console.groupEnd();
      }

;;;   //console.groupEnd();
      return ( $.validationEngine.isError ? $.validationEngine.isError : false );
    } ,

    submitForm : function( caller ){
;;;   //console.groupCollapsed( "submitForm( %o )" , caller );
      var $caller = $( caller );

      if( $.validationEngine.settings.ajaxSubmit ){

        extraData = $.validationEngine.settings.ajaxSubmitExtraData || '';

        $.ajax({
          type: 'POST' ,
          url: $.validationEngine.settings.ajaxSubmitFile ,
          async: true ,
          data: $caller.serialize()+"&"+extraData ,
          error: function( data , transport ){
            $.validationEngine.debug( 'Error in the AJAX [submitForm()]: '+data.status+' '+transport );
          } ,
          success: function( data ){
            if( data=='true' ){
             // All is well, Show Success Message
              $caller
                .css( 'opacity' , 1 )
                .animate( { opacity : 0 , height : 0 } , function(){
                  $( this )
                    .hide()
                    .before( '<div class="ajaxSubmit">'+$.validationEngine.settings.ajaxSubmitMessage+'</div>' );
                  $.validationEngine.closePrompt( '.formError' , true );
                  $( '.ajaxSubmit' ).show( 'slow' );
                  if( $.validationEngine.settings.success ){
                   // AJAX success, stop the Location Update
                    $.validationEngine.settings.success && $.validationEngine.settings.success();
;;;                 //console.groupEnd();
                    return false;
                  }
                } );
            }else{
             // Houston, we got a problem. Something is not validating.
              data = eval( '('+data+')' );
              if( !data.jsonValidateReturn )
                $.validationEngine.debug( 'You are not going into the success function and jsonValidateReturn return nothing' );
              errorNumber = data.jsonValidateReturn.length
              for( index=0 ; index<errorNumber ; index++ ){
                fieldId = data.jsonValidateReturn[index][0];
                promptError = data.jsonValidateReturn[index][1];
                type = data.jsonValidateReturn[index][2];
                $.validationEngine.buildPrompt(fieldId,promptError,type);
              }
            }
          }
        } );
;;;     //console.groupEnd();
        return true;
      }

     // LOOK FOR BEFORE SUCCESS METHOD
      if( !$.validationEngine.settings.beforeSuccess() ){
       // AJAX Success - Stop the Location Update
        if( $.validationEngine.settings.success ){
          if( $.validationEngine.settings.unbindEngine )
            $caller.unbind( 'submit' );
          $.validationEngine.settings.success && $.validationEngine.settings.success();
;;;       //console.groupEnd();
          return true;
        }
;;;     //console.groupEnd();
        return false;
      }
;;;   //console.groupEnd();
      return true;
    } ,

   // Error Prompt - Creation amd Display when an Error Occurs
    buildPrompt : function( caller , promptText , type , ajaxed , fieldLink ){
;;;   //console.groupCollapsed( "buildPrompt( %o , %s , %s , %s , %s )" , caller , promptText , type , ajaxed , fieldLink );
      var $caller = $( caller );
      linkTofield = ( fieldLink || '.'+$.validationEngine.linkTofield( caller ) ).replace( /^\./ , '' );
      var topPositionAdjust = 0;

      if( !$.validationEngine.settings )
        $.validationEngine.defaultSetting();

      $deleteItself = $( '.'+$caller.attr( 'id' )+'formError' );
      if( $deleteItself.length ){
        $deleteItself
          .stop()
          .remove();
      }
      var $divFormError = $( '<div class="formError"></div>' )
        .toggleClass( 'greenPopup' , type=='pass' )
        .toggleClass( 'blackPopup' , type=='load' )
        .toggleClass( 'ajaxed'     , ajaxed )
        .addClass( linkTofield )
        .attr( 'parentelementid'   , $caller.attr( 'id' ) );

     // Is the form contained in an overflown container?
      $( caller ).after( $divFormError );

      var $formErrorContent = $( '<div class="formErrorContent"></div>' )
        .html( promptText );
      $divFormError
        .append( $formErrorContent );

      if( $.validationEngine.showTriangle!=false ){		// NO TRIANGLE ON MAX CHECKBOX AND RADIO
        var $arrow = $( '<div class="formErrorArrow"></div>' );
        $divFormError.append( $arrow );
        var arrowHTML = '';
        if( /^bottom(?:Lef|Righ)t$/.test( $field.attr('errorposition') || $.validationEngine.settings.promptPosition ) ){
          $arrow
            .addClass( 'formErrorArrowUp' )
          for( l=1 ; l<11 ; l++ )
            arrowHTML += '<div class="line'+l+'"><!-- --></div>';
          topPositionAdjust = -11;
        }
        if( /^top(?:Lef|Righ)t$/.test( $field.attr('errorposition') || $.validationEngine.settings.promptPosition ) ){
          for( l=10 ; l>0 ; l-- )
            arrowHTML += '<div class="line'+l+'"><!-- --></div>';
          topPositionAdjust = 15;
        }
        $arrow
          .html( arrowHTML );

      }else{
       // Adjustments for Radio Buttons and Checkboxes ONLY
        if( /^bottom(?:Lef|Righ)t$/.test( $field.attr('errorposition') || $.validationEngine.settings.promptPosition ) )
          topPositionAdjust = -13;
        if( /^top(?:Lef|Righ)t$/.test( $field.attr('errorposition') || $.validationEngine.settings.promptPosition ) )
          topPositionAdjust = 8;
      }

      var calculatedPosition = $.validationEngine.calculatePosition( caller , $divFormError );

      calculatedPosition['top'] = ( parseInt( calculatedPosition['top'] ) + topPositionAdjust )+ 'px';
      $divFormError
        .css( 'opacity' , 0 )
        .css( calculatedPosition );
      $divFormError.find('.formErrorArrow')
        .css( 'z-index' , calculatedPosition['z-index']+1 );

     // Add Attribute to Field, specifying the Form Error Element
      $caller.attr( 'formerrorclass' , linkTofield );
;;;   //console.groupEnd();
      return $divFormError.animate( { 'opacity' : 0.87 } , function(){ return true; } );
    } ,

   // Error Box already Displayed - Update the Error Message
    updatePromptText : function( caller , promptText , type , ajaxed , fieldLink ){
;;;   //console.groupCollapsed( "updatePromptText( %o , %s , %s , %s )" , caller , promptText , type , ajaxed );
      var updateThisPrompt = fieldLink || '.'+$.validationEngine.linkTofield( caller );

      $updateThisPrompt = $( updateThisPrompt )
        .toggleClass( 'greenPopup' , type=='pass' )
        .toggleClass( 'blackPopup' , type=='load' )
        .toggleClass( 'ajaxed'     , ajaxed )
        .find( '.formErrorContent' )
          .html( promptText );

      if( $.validationEngine.showTriangle!=false ){
        if( /^bottom(?:Lef|Righ)t$/.test( $field.attr('errorposition') || $.validationEngine.settings.promptPosition ) )
          topPositionAdjust = -11;
        if( /^top(?:Lef|Righ)t$/.test( $field.attr('errorposition') || $.validationEngine.settings.promptPosition ) )
          topPositionAdjust = 15;
      }else{
       // Adjustments for Radio Buttons and Checkboxes ONLY
        if( /^bottom(?:Lef|Righ)t$/.test( $field.attr('errorposition') || $.validationEngine.settings.promptPosition ) )
          topPositionAdjust = -13;
        if( /^top(?:Lef|Righ)t$/.test( $field.attr('errorposition') || $.validationEngine.settings.promptPosition ) )
          topPositionAdjust = 8;
      }

      var calculatedPosition = $.validationEngine.calculatePosition( caller , updateThisPrompt );

      $updateThisPrompt.animate( {
        'top'       : ( parseInt( calculatedPosition['top'] ) + topPositionAdjust )+'px'
      } );
;;;   //console.groupEnd();
    } ,

    calculatePosition : function( field , errorMessage ){
;;;   //console.groupCollapsed( "calculatePosition( %o , %s , %s , %s , %o )" , field , promptText , type , ajaxed , errorMessage );
      var $field = $( field );
      var $parent = $field.parent().css( 'position' , 'relative' );
      fieldWidth = $field.width();
      fieldHeight = $field.height();
;;;   //console.log( 'Field : H %s , W %s' , fieldHeight , fieldWidth );
      fieldOffsetTop = ( $field.offset().top - $parent.offset().top );
      fieldOffsetLeft = ( $field.offset().left - $parent.offset().left );
;;;   //console.log( 'Field Offset : T %s , L %s' , fieldOffsetTop , fieldOffsetLeft );
      var $errorMessage = $( errorMessage );
      messageHeight = $errorMessage.height();
;;;   //console.log( 'Height of Error Message : %s' , messageHeight );

     /* POSITIONING */
     /* Default Position - Over the top of the Field */
      fieldTopPosition  = fieldOffsetTop;
      fieldLeftPosition = fieldOffsetLeft;
      var marginTopSize = 0;
     /* Adjust Position based on settings.promptPosition */
      switch( $field.attr('errorposition') || $.validationEngine.settings.promptPosition ){
        case 'topRight' :
          fieldTopPosition  += -messageHeight -10;
          fieldLeftPosition +=  fieldWidth -35;
          break;
        case 'topLeft' :
          fieldTopPosition  += -messageHeight -10;
          break;
        case 'centerRight' :
          fieldLeftPosition += fieldWidth +13;
          fieldTopPosition  += -( messageHeight - fieldHeight )/2;
          break;
        case 'bottomLeft' :
          fieldTopPosition  += fieldHeight +15;
          break;
        case 'bottomRight' :
          //console.log( 'case bottomRight = %s' , fieldTopPosition );
          fieldLeftPosition += fieldWidth -35;
          fieldTopPosition  += fieldHeight +15;
          break;
      }
      var returnVal = {
        'z-index'    : ( 10000 - $field.offset().top ) ,
        'top'        : fieldTopPosition+'px' ,
        'left'       : fieldLeftPosition+'px' ,
        'margin-top' : marginTopSize+'px'
      };
      
      //console.log( 'Returning Results of: %o' , returnVal );
;;;   //console.groupEnd();
      return returnVal;
    } ,

    linkTofield : function( caller ){
;;;   //console.groupCollapsed( "linkTofield( %o )" , caller );
      var formErrorLink = ( $( caller ).attr( 'id' )+'formError' ).replace( /\[|\]/g , '' );
      //console.log( 'Returning "%s"' , formErrorLink );
;;;   //console.groupEnd();
      return formErrorLink;
    } ,

   // Close Prompt when Error Corrected
    closePrompt : function( caller , outside ){
;;;   //console.groupCollapsed( "closePrompt( %o , %s )" , caller , outside );
      if( !$.validationEngine.settings )
        $.validationEngine.defaultSetting();
      if( outside ){
        $( caller ).fadeOut( 'fast' , function(){
          $( this ).remove();
        } );
;;;     //console.groupEnd();
        return false;
      }
      if( typeof( ajaxValidate )=='undefined' )
        ajaxValidate = false;
      if( !ajaxValidate ){
        linkTofield = $.validationEngine.linkTofield( caller );
        $( "."+linkTofield ).fadeOut( 'fast' , function(){
          $( this ).remove();
        } );
      }
;;;   //console.groupEnd();
    } ,

    debug : function( error ){
      if( $( '#debugMode' ).length==0 )
        $( 'body' )
          .append( '<div id="debugMode"><div class="debugError"><strong>This is a debug mode, you got a problem with your form, it will try to help you, refresh when you think you nailed down the problem</strong></div></div>' );
      $( '#debugMode .debugError' ).append( '<div class="debugError">'+error+'</div>' );
    } ,

   // FORM SUBMIT VALIDATION LOOPING INLINE VALIDATION
    submitValidation : function( caller ){
;;;   //console.groupCollapsed( 'submitValidation( %o )' , caller );
      var $caller = $( caller );
      var stopForm = false;
      $.validationEngine.ajaxValid = true;

      $caller.find( '[class*="validate["]' ).each( function(){
        if( $( this ).is( ':disabled, :hidden' ) )
          return true;
       // If there is No ID attached to this field, create a new, hopefully unique, one.
        if( !$( this ).attr( 'id' ) ){
          var newID = 'validationEngine_'+( new Date ).getTime()+( Math.random()+'' ).replace( '0.' , '' );
          $( this ).attr( 'id' , newID );
          //console.log( 'Element had No ID. New ID = "%s"' , newID );
        }else{
          //console.log( 'Element ID is "%s"' , $( this ).attr( 'id' ) );
        }
        linkTofield = $.validationEngine.linkTofield( this );
        if( !$( '.'+linkTofield+'.ajaxed' ).length ){
         // DO NOT UPDATE ALREADY AJAXED FIELDS (only happen if no normal errors, don't worry)
          var validationPass = $.validationEngine.getValidationRules( this );
;;;       //console.groupEnd();
          return ( validationPass ? stopForm = true : '' );
        }
      } );
     // LOOK IF SOME AJAX IS NOT VALIDATE
      ajaxErrorLength = $.validationEngine.ajaxValidArray.length;
      for( x=0 ; x<ajaxErrorLength ; x++ ){
        if( $.validationEngine.ajaxValidArray[x][1]==false )
          $.validationEngine.ajaxValid = false;
      }
     // GET IF THERE IS AN ERROR OR NOT FROM THIS VALIDATION FUNCTIONS
      if( stopForm || !$.validationEngine.ajaxValid ){
        if( $.validationEngine.settings.scroll ){
          if( !$.validationEngine.settings.containerOverflow ){
            var destination = Math.min( ( aFormError = $( '.formError:not(".greenPopup"):first' ) ).offset().top , $( '#'+aFormError.attr( 'parentelementid' ) ).offset().top );
            $( '.formError:not(".greenPopup")' ).each( function(){
              destination = Math.min( destination , $( this ).offset().top , $( '#'+$( this ).attr( 'parentelementid' ) ).offset().top );
            });
            destination += 20; // Scroll to X above the topmost element
            $( 'html:not(:animated), body:not(:animated)' )
              .animate( { scrollTop : destination } , 1100 );
          }else{
            var destination = $( '.formError:not(".greenPopup"):first' ).offset().top;
            var scrollContainerScroll = $( $.validationEngine.settings.containerOverflowDOM ).scrollTop();
            var scrollContainerPos = - parseInt( $( $.validationEngine.settings.containerOverflowDOM ).offset().top );
            var destination = scrollContainerScroll + destination + scrollContainerPos -5;
            var scrollContainer = $.validationEngine.settings.containerOverflowDOM+':not(:animated)';

            $( scrollContainer )
              .animate( { scrollTop : destination } , 1100 );
          }
        }
;;;     //console.groupEnd();
        return true;
      }
;;;   //console.groupEnd();
      return false;
    }

  }

})(jQuery);