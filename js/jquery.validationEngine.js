/*
 * Inline Form Validation Engine 1.7, jQuery plugin
 *
 * Copyright(c) 2010, Cedric Dugas
 * http://www.position-relative.net
 *
 * Form validation engine allowing custom regex rules to be added.
 * Thanks to Francois Duquette and Teddy Limousin
 * and everyone helping me find bugs on the forum
 * Licenced under the MIT Licence
 */

(function( $ ){

	$.fn.validationEngine = function( settings ){

   // IS THERE A LANGUAGE LOCALISATION ?
    if( $.validationEngineLanguage ){
      allRules = $.validationEngineLanguage.allRules;
    }else{
      $.validationEngine.debug( 'Validation engine rules are not loaded check your external file' );
    }

    settings = jQuery.extend( {
      allrules: allRules ,
      validationEventTriggers: 'focusout' ,
      inlineValidation: true ,
      returnIsValid: false ,
      liveEvent: true ,
      unbindEngine: true ,
      containerOverflow: false ,
      containerOverflowDOM: '' ,
      ajaxSubmit: false ,
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

     // NEEDED FOR THE SETTING returnIsValid
      if( !settings.returnIsValid ){
        allowReturnIsvalid = false;
        $this = $(this);
       // LIVE event, vast performance improvement over BIND
        if( settings.liveEvent ){
          $this.find( "[class*=validate][type!=checkbox]" )
            .live( settings.validationEventTriggers , function( caller ){
              _inlinEvent( this );
            } );
          $this.find( "[class*=validate][type=checkbox]" )
            .live( "click" , function( caller ){
              _inlinEvent( this );
            } );
        }else{
          $this.find( "[class*=validate]" ).not( "[type=checkbox]" )
            .bind( settings.validationEventTriggers , function( caller ){
              _inlinEvent( this );
            } );
          $this.find( "[class*=validate][type=checkbox]" )
            .bind( "click" , function( caller ){
              _inlinEvent( this );
            } );
        }
        firstvalid = false;
      }

      function _inlinEvent( caller ){
        $.validationEngine.settings = settings;
       // Stop Inline Validation This Time Only
        if( $.validationEngine.intercept==false
            || !$.validationEngine.intercept ){
          $.validationEngine.onSubmitValid = false;
          $.validationEngine.loadValidation( caller );
        }else{
          $.validationEngine.intercept = false;
        }
      }

    }

   // Do validation and return true or false, it bypass everything
    if( settings.returnIsValid )
      return !$.validationEngine.submitValidation( this , settings );

   // On FORM Submit, Control AJAX function if specified on DOCUMENT READY
    $( this ).bind( 'submit' , function( caller ){
      $.validationEngine.onSubmitValid = true;
      $.validationEngine.settings = settings;
      if( $.validationEngine.submitValidation( this , settings )==false ){
        if( $.validationEngine.submitForm( this , settings )==true )
          return false;
      }else{
        settings.failure && settings.failure();
        return false;
      }
    } );

   // Fade Out and Remove Error Message, when Clicked
    $( '.formError' ).live( 'click' , function(){
      $( this ).fadeOut( 150 ,function(){
        $(this).remove();
      } );
    } );

  }


  $.validationEngine = {

   // Not generally used, needed for the API, DO NOT TOUCH
    defaultSetting : function( caller ){

      if( $.validationEngineLanguage ){
        allRules = $.validationEngineLanguage.allRules;
      }else{
        $.validationEngine.debug( "Validation engine rules are not loaded check your external file" );
      }

      settings = {
        allrules: allRules,
        validationEventTriggers: "blur",
        inlineValidation: true,
        containerOverflow: false,
        containerOverflowDOM: "",
        returnIsValid: false,
        scroll: true,
        unbindEngine: true,
        ajaxSubmit: false,
        promptPosition: "topRight" ,	// Error Message Position. Options: topLeft, topRight, bottomLeft, centerRight, bottomRight
        success : false,
        failure : function(){}
      };
      $.validationEngine.settings = settings;
    } ,

   // Get Validation Rules to be Tested
    loadValidation : function( caller ){
      var $caller = $( caller );

      if( !$.validationEngine.settings )
        $.validationEngine.defaultSetting();
      rulesParsing = $caller.attr('class');
      rulesRegExp = /\[(.*)\]/;
      getRules = rulesRegExp.exec( rulesParsing );
      if( getRules==null )
        return false;
      str = getRules[1];
      pattern = /\[|,|\]/;
      result= str.split( pattern );
      return $.validationEngine.validateCall( caller , result );
    } ,

   // Execute Validation for This Field
    validateCall : function( caller , rules ){
      var promptText = "";
      var $caller = $( caller );
      ajaxValidate = false;
      $.validationEngine.isError = false;
      $.validationEngine.showTriangle = true;
      var callerName = $caller.attr( "name" );
      callerType = $caller.attr( "type" );

     // If there is No ID attached to this field, create a new, hopefully unique, one.
      if( !$caller.attr( "id" ) )
        $caller.attr( "id" , "validationEngine_"+( new Date ).getTime()+( Math.random()+'' ).replace( '0.' , '' ) );

      for( i=0 ; i<rules.length ; i++ ){
        switch( rules[i] ){
          case "optional" :
            if( !$caller.val() ){
              $.validationEngine.closePrompt( caller );
              return $.validationEngine.isError;
            }
            break;
          case "required":
            _required( caller , rules );
            break;
          case "custom" :
             _customRegex( caller , rules , i );
            break;
          case "exemptString" :
             _exemptString( caller , rules , i );
            break;
          case "ajax" :
            if( !$.validationEngine.onSubmitValid )
              _ajax( caller , rules , i );
            break;
          case "length" :
             _length( caller , rules , i );
            break;
          case "maxCheckbox" :
            _maxCheckbox( caller , rules , i );
            caller = $( "input[name='"+callerName+"']" );
          break;
          case "minCheckbox":
            _minCheckbox( caller , rules , i );
            caller = $( "input[name='"+callerName+"']" );
          break;
          case "confirm" :
             _confirm( caller , rules , i );
            break;
          case "funcCall" :
              _funcCall( caller , rules , i );
            break;
          default :;
        }
      }

      radioHack();

      if( $.validationEngine.isError==true ){
        var linkTofieldText = "." +$.validationEngine.linkTofield( caller );
        if( linkTofieldText=="." ){
          $.validationEngine.updatePromptText( caller , promptText );
        }else if( !$( linkTofieldText )[0] ){
          $.validationEngine.buildPrompt( caller , promptText , "error" );
        }else{
          $.validationEngine.updatePromptText( caller , promptText );
        }
      }else{
        $.validationEngine.closePrompt( caller );
      }

     /* UNFORTUNATE RADIO AND CHECKBOX GROUP HACKS */
     /* As my validation is looping input with id's we need a hack for my validation to understand to group these inputs */
      function radioHack(){
       // Hack for radio/checkbox group button, the validation go the first radio/checkbox of the group
        if( $( "input[name='"+callerName+"']" ).size()>1
          && ( callerType=="radio"
               || callerType=="checkbox" ) ){
          caller = $( "input[name='"+callerName+"'][type!=hidden]:first" );
          $.validationEngine.showTriangle = false;
        }
      }

     /* VALIDATION FUNCTIONS */

     // VALIDATE BLANK FIELD
      function _required( caller , rules ){
        var $caller = $( caller );
        callerType = $caller.attr( "type" );

        switch( callerType ){
          case "text" :
          case "password" :
          case "textarea" :
            if( !$caller.val() ){
              $.validationEngine.isError = true;
              promptText += $.validationEngine.settings.allrules[rules[i]].alertText+"<br />";
            }
            break;
          case "radio" :
          case "checkbox" :
            callerName = $caller.attr( "name" );

            if( $( "input[name='"+callerName+"']:checked" ).size()==0 ){
              $.validationEngine.isError = true;
              if( $( "input[name='"+callerName+"']" ).size()==1 ){
                promptText += $.validationEngine.settings.allrules[rules[i]].alertTextCheckboxSingle+"<br />";
              }else{
                promptText += $.validationEngine.settings.allrules[rules[i]].alertTextCheckboxMultiple+"<br />";
              }
            }
            break;
          case "select-one" :
           // added by paul@kinetek.net for select boxes, Thank you
            if( !$caller.val() ){
              $.validationEngine.isError = true;
              promptText += $.validationEngine.settings.allrules[rules[i]].alertText+"<br />";
            }
            break;
          case "select-multiple" :
           // added by paul@kinetek.net for select boxes, Thank you
            if( !$caller.find( "option:selected" ).val() ) {
              $.validationEngine.isError = true;
              promptText += $.validationEngine.settings.allrules[rules[i]].alertText+"<br />";
            }
            break;
        }
      }

     // Validate Regular Expression Rules
      function _customRegex( caller , rules , position ){
        var $caller = $( caller );
        customRule = rules[position+1];
        pattern = eval( $.validationEngine.settings.allrules[customRule].regex );

        if( !pattern.test( $caller.val() ) ){
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules[customRule].alertText+"<br />";
        }
      }

     // Validate "exemptString" Rules
     // TODO: Explain this better
      function _exemptString( caller , rules , position ){
        var $caller = $( caller );
        customString = rules[position+1];

        if( customString==$caller.val() ){
          $.validationEngine.isError = true;
         // TODO: Check whether this should be using the "required" alertText
          promptText += $.validationEngine.settings.allrules['required'].alertText+"<br />";
        }
      }

     // Validate by calling Function outside of the Engine
      function _funcCall( caller , rules , position ){
        customRule = rules[position+1];
        var fn = window[ $.validationEngine.settings.allrules[customRule].nname ];

        if( typeof( fn )==='function' ){
          var fn_result = fn();
          if( !fn_result )
            $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules[customRule].alertText+"<br />";
        }
      }

      function _ajax(caller,rules,position){				 // VALIDATE AJAX RULES

        customAjaxRule = rules[position+1];
        postfile = $.validationEngine.settings.allrules[customAjaxRule].file;
        fieldValue = $(caller).val();
        ajaxCaller = caller;
        fieldId = $(caller).attr("id");
        ajaxValidate = true;
        ajaxisError = $.validationEngine.isError;

        extraData = $.validationEngine.settings.allrules[customAjaxRule].extraData || '';

       /* AJAX VALIDATION HAS ITS OWN UPDATE AND BUILD UNLIKE OTHER RULES */
        if(!ajaxisError){
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
              data = eval( "("+data+")" );
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
                  $.validationEngine.debug( "wrong ajax response, are you on a server or in xampp? if not delete de ajax[ajaxUser] validating rule from your form " );
                if( $.validationEngine.settings.allrules[customAjaxRule].alertTextOk ){
                 // OK Text exists - Display It
                  $.validationEngine.updatePromptText( ajaxCaller , $.validationEngine.settings.allrules[customAjaxRule].alertTextOk , 'pass' , true );
                }else{
                  ajaxValidate = false;
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
      }

     // Validate Matching Field Values
      function _confirm( caller , rules , position ){
        var $caller = $( caller );
        confirmField = rules[position+1];

        if( $caller.val()!=$( '#'+confirmField ).val() ){
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules['confirm'].alertText+'<br />';
        }
      }

     // Validate Value Length
      function _length( caller , rules , position ){
        startLength = eval( rules[position+1] );
        endLength = eval( rules[position+2] );
        fieldLength = $( caller ).val().length;

        if( fieldLength<startLength || fieldLength>endLength ){
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules['length'].alertText+' '+startLength+' '+
                        $.validationEngine.settings.allrules['length'].alertText2+' '+endLength+' '+
                        $.validationEngine.settings.allrules['length'].alertText3+'<br />';
        }
      }

     // Validate Checkbox (Maximum Number of Checked Elements)
      function _maxCheckbox( caller , rules , position ){
        nbCheck = eval( rules[position+1] );
        groupSize = $( 'input[name="'+( $( caller ).attr( 'name' ) )+'"]:checked' ).size();

        if( groupSize>nbCheck ){
          $.validationEngine.showTriangle = false;
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules['maxCheckbox'].alertText+'<br />';
        }
      }

     // Validate Checkbox (Minimum Number of Checked Elements)
      function _minCheckbox( caller , rules , position ){
        nbCheck = eval( rules[position+1] );
        groupSize = $( 'input[name="'+$( caller ).attr( 'name' )+'"]:checked' ).size();

        if( groupSize<nbCheck ){
          $.validationEngine.isError = true;
          $.validationEngine.showTriangle = false;
          promptText += $.validationEngine.settings.allrules['minCheckbox'].alertText+' '+nbCheck+' '+
                        $.validationEngine.settings.allrules['minCheckbox'].alertText2+'<br />';
        }
      }

      return ( $.validationEngine.isError ? $.validationEngine.isError : false );

    } ,

    submitForm : function( caller ){
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
                    return false;
                  }
                } );
            }else{
             // Houston, we got a problem. Something is not validating.
              data = eval( "("+data+")" );
              if( !data.jsonValidateReturn )
                $.validationEngine.debug( "you are not going into the success function and jsonValidateReturn return nothing" );
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

        return true;
      }

     // LOOK FOR BEFORE SUCCESS METHOD
      if( !$.validationEngine.settings.beforeSuccess() ){
       // AJAX Success - Stop the Location Update
        if( $.validationEngine.settings.success ){
          if( $.validationEngine.settings.unbindEngine )
            $caller.unbind( 'submit' );
          $.validationEngine.settings.success && $.validationEngine.settings.success();
          return true;
        }
        return false;
      }

      return true;
    } ,

   // Error Prompt - Creation amd Display when an Error Occurs
    buildPrompt : function( caller , promptText , type , ajaxed ){
      var $caller = $( caller );
      linkTofield = $.validationEngine.linkTofield( caller );

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
        .addClass( linkTofield );

     // Is the form contained in an overflown container?
      if( $.validationEngine.settings.containerOverflow ){
        $( caller ).before( $divFormError );
      }else{
        $( 'body' ).append( $divFormError );
      }

      var $formErrorContent = $( '<div class="formErrorContent"></div>' )
        .html( promptText );
      $divFormError
        .append( $formErrorContent );

      if( $.validationEngine.showTriangle!=false ){		// NO TRIANGLE ON MAX CHECKBOX AND RADIO
        var $arrow = $( '<div class="formErrorArrow"></div>' );
        $divFormError.append( $arrow );
        var arrowHTML = '';
        if( /^bottom(?:Lef|Righ)t$/.test( $.validationEngine.settings.promptPosition ) ){
          $arrow
            .addClass( "formErrorArrowBottom" )
          for( l=1 ; l<11 ; l++ )
            arrowHTML += '<div class="line'+l+'"><!-- --></div>';
        }
        if( /^top(?:Lef|Righ)t$/.test( $.validationEngine.settings.promptPosition ) ){
          for( l=10 ; l>0 ; l-- )
            arrowHTML += '<div class="line'+l+'"><!-- --></div>';
        }
        $arrow
          .html( arrowHTML );
      }

      var calculatedPosition = $.validationEngine.calculatePosition( caller , promptText , type , ajaxed , $divFormError );

      calculatedPosition.callerTopPosition += "px";
      calculatedPosition.callerleftPosition += "px";
      calculatedPosition.marginTopSize += "px"
      $divFormError.css({
        "top": calculatedPosition.callerTopPosition ,
        "left": calculatedPosition.callerleftPosition ,
        "marginTop": calculatedPosition.marginTopSize ,
        "opacity": 0
      });
      return $divFormError.animate( { "opacity" : 0.87 } , function(){ return true; } );
    } ,

   // Error Box already Displayed - Update the Error Message
    updatePromptText : function( caller , promptText , type , ajaxed ){
      linkTofield = $.validationEngine.linkTofield( caller );
      var updateThisPrompt =  "."+linkTofield;

      $updateThisPrompt = $( updateThisPrompt )
        .toggleClass( 'greenPopup' , type=='pass' )
        .toggleClass( 'blackPopup' , type=='load' )
        .toggleClass( 'ajaxed'     , ajaxed )
        .find( '.formErrorContent' )
          .html( promptText );

      var calculatedPosition = $.validationEngine.calculatePosition( caller , promptText , type , ajaxed , updateThisPrompt );

      calculatedPosition.callerTopPosition += "px";
      calculatedPosition.callerleftPosition += "px";
      calculatedPosition.marginTopSize += "px";
      $updateThisPrompt.animate( {
        "top": calculatedPosition.callerTopPosition ,
        "marginTop": calculatedPosition.marginTopSize
      } );
    } ,

    calculatePosition : function( caller , promptText , type , ajaxed , divFormError ){
      var $caller = $( caller );
      callerWidth = $caller.width();
      callerHeight = $caller.height();
      inputHeight = $( divFormError ).height();

     // Is the form contained in an overflown container?
      if( $.validationEngine.settings.containerOverflow ){
        callerTopPosition = 0;
        callerleftPosition = 0;
        var marginTopSize = "-"+inputHeight; // compensation for the triangle
      }else{
        callerTopPosition = $caller.offset().top;
        callerleftPosition = $caller.offset().left;
        var marginTopSize = 0;
      }

     /* POSITIONING */
      switch( $.validationEngine.settings.promptPosition ){
        case "topRight" :
          callerleftPosition +=  callerWidth -30;
         // Is the form contained in an overflown container?
          if( !$.validationEngine.settings.containerOverflow )
            callerTopPosition += -inputHeight;
          break;
        case "topLeft" :
          callerTopPosition += -inputHeight -10;
          break;
        case "centerRight" :
          callerleftPosition +=  callerWidth +13;
          break;
        case "bottomLeft" :
          callerTopPosition = callerTopPosition + callerHeight +15;
          break;
        case "bottomRight" :
          callerleftPosition +=  callerWidth -30;
          callerTopPosition +=  callerHeight +5;
          break;
      }

      return {
        "callerTopPosition": callerTopPosition ,
        "callerleftPosition": callerleftPosition ,
        "marginTopSize": marginTopSize
      }
    } ,

    linkTofield : function( caller ){
      return ( $( caller ).attr( 'id' )+'formError' ).replace( /\[|\]/g , '' );
    } ,

   // Close Prompt when Error Corrected
    closePrompt : function( caller , outside ){
      if( !$.validationEngine.settings )
        $.validationEngine.defaultSetting();
      if( outside ){
        $( caller ).fadeOut( "fast" , function(){
          $( this ).remove();
        } );
        return false;
      }
      if( typeof( ajaxValidate )=='undefined' )
        ajaxValidate = false;
      if( !ajaxValidate ){
        linkTofield = $.validationEngine.linkTofield( caller );
        $( "."+linkTofield ).fadeOut( "fast" , function(){
          $( this ).remove();
        } );
      }
    } ,

    debug : function( error ){
      if( $( "#debugMode" ).length==0 )
        $( "body" )
          .append( "<div id='debugMode'><div class='debugError'><strong>This is a debug mode, you got a problem with your form, it will try to help you, refresh when you think you nailed down the problem</strong></div></div>" );
      $( "#debugMode .debugError" ).append( "<div class='debugError'>"+error+"</div>" );
    } ,

   // FORM SUBMIT VALIDATION LOOPING INLINE VALIDATION
    submitValidation : function( caller ){
      var $caller = $( caller );
      var stopForm = false;
      $.validationEngine.ajaxValid = true;

      $caller.find( '[class*="validate["]' ).each( function(){
        linkTofield = $.validationEngine.linkTofield( this );
        if( !$( "."+linkTofield+".ajaxed" ) ){
         // DO NOT UPDATE ALREADY AJAXED FIELDS (only happen if no normal errors, don't worry)
          var validationPass = $.validationEngine.loadValidation( this );
          return ( validationPass ? stopForm = true : "" );
        }
      } );
     // LOOK IF SOME AJAX IS NOT VALIDATE
      ajaxErrorLength = $.validationEngine.ajaxValidArray.length;
      for( x=0 ; x<ajaxErrorLength ; x++ ){
        if( $.validationEngine.ajaxValidArray[x][1]==false)
          $.validationEngine.ajaxValid = false;
      }
     // GET IF THERE IS AN ERROR OR NOT FROM THIS VALIDATION FUNCTIONS
      if( stopForm || !$.validationEngine.ajaxValid ){
        if( $.validationEngine.settings.scroll ){
          if( !$.validationEngine.settings.containerOverflow ){
            var destination = $( ".formError:not('.greenPopup'):first" ).offset().top;
            $( ".formError:not('.greenPopup')" ).each( function(){
              testDestination = $( this ).offset().top;
              if( destination>testDestination ) destination = $( this ).offset().top;
            })
            $( "html:not(:animated),body:not(:animated)" )
              .animate( { scrollTop : destination } , 1100 );
          }else{
            var destination = $( ".formError:not('.greenPopup'):first" ).offset().top;
            var scrollContainerScroll = $( $.validationEngine.settings.containerOverflowDOM ).scrollTop();
            var scrollContainerPos = - parseInt( $( $.validationEngine.settings.containerOverflowDOM ).offset().top );
            var destination = scrollContainerScroll + destination + scrollContainerPos -5;
            var scrollContainer = $.validationEngine.settings.containerOverflowDOM+":not(:animated)";

            $( scrollContainer )
              .animate( { scrollTop : destination } , 1100 );
          }
        }
        return true;
      }
      return false;
    }

  }

})(jQuery);