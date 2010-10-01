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
      $.validationEngine.debug( "Validation engine rules are not loaded check your external file" );
    }

    settings = jQuery.extend( {
      allrules: allRules ,
      validationEventTriggers: "focusout" ,
      inlineValidation: true ,
      returnIsValid: false ,
      liveEvent: true ,
      unbindEngine: true ,
      containerOverflow: false ,
      containerOverflowDOM: "" ,
      ajaxSubmit: false ,
      scroll: true ,
      promptPosition: "topRight" ,	// Error Message Position. Options: topLeft, topRight, bottomLeft, centerRight, bottomRight
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
      if(!settings.returnIsValid ){
        allowReturnIsvalid = false;
        $this = $(this);
       // LIVE event, vast performance improvement over BIND
        if( settings.liveEvent ){
          $this.find( "[class*=validate][type!=checkbox]" )
            .live( settings.validationEventTriggers , function( caller ){ _inlinEvent( this ); } );
          $this.find( "[class*=validate][type=checkbox]" )
            .live( "click" , function( caller ){ _inlinEvent( this ); } );
        }else{
          $this.find( "[class*=validate]" ).not( "[type=checkbox]" )
            .bind( settings.validationEventTriggers , function( caller ){ _inlinEvent( this ); } );
          $this.find( "[class*=validate][type=checkbox]" )
            .bind( "click" , function( caller ){ _inlinEvent( this ); } );
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
    $( this ).bind( "submit" , function( caller ){
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
    $( ".formError" ).live( "click" , function(){
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
        $caller = $( caller );
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
                promptText += $.validationEngine.settings.allrules[rules[i]].alertTextCheckboxe+"<br />";
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
        $caller = $( caller );
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
        $caller = $( caller );
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

        if($.validationEngine.settings.allrules[customAjaxRule].extraData){
          extraData = $.validationEngine.settings.allrules[customAjaxRule].extraData;
        }else{
          extraData = "";
        }
        /* AJAX VALIDATION HAS ITS OWN UPDATE AND BUILD UNLIKE OTHER RULES */
        if(!ajaxisError){
          $.ajax({
              type: "POST",
              url: postfile,
              async: true,
              data: "validateValue="+fieldValue+"&validateId="+fieldId+"&validateError="+customAjaxRule+"&extraData="+extraData,
              beforeSend: function(){		// BUILD A LOADING PROMPT IF LOAD TEXT EXIST
                if($.validationEngine.settings.allrules[customAjaxRule].alertTextLoad){

                  if(!$("div."+fieldId+"formError")[0]){
                  return $.validationEngine.buildPrompt(ajaxCaller,$.validationEngine.settings.allrules[customAjaxRule].alertTextLoad,"load");
                }else{
                  $.validationEngine.updatePromptText(ajaxCaller,$.validationEngine.settings.allrules[customAjaxRule].alertTextLoad,"load");
                }
                }
              },
              error: function(data,transport){ $.validationEngine.debug("error in the ajax: "+data.status+" "+transport) },
            success: function(data){					// GET SUCCESS DATA RETURN JSON
              data = eval( "("+data+")");				// GET JSON DATA FROM PHP AND PARSE IT
              ajaxisError = data.jsonValidateReturn[2];
              customAjaxRule = data.jsonValidateReturn[1];
              ajaxCaller = $("#"+data.jsonValidateReturn[0])[0];
              fieldId = ajaxCaller;
              ajaxErrorLength = $.validationEngine.ajaxValidArray.length;
              existInarray = false;

               if(ajaxisError == "false"){			// DATA FALSE UPDATE PROMPT WITH ERROR;

                _checkInArray(false)				// Check if ajax validation alreay used on this field

                if(!existInarray){		 			// Add ajax error to stop submit
                  $.validationEngine.ajaxValidArray[ajaxErrorLength] =  new Array(2);
                  $.validationEngine.ajaxValidArray[ajaxErrorLength][0] = fieldId;
                  $.validationEngine.ajaxValidArray[ajaxErrorLength][1] = false;
                  existInarray = false;
                }

                $.validationEngine.ajaxValid = false;
                promptText += $.validationEngine.settings.allrules[customAjaxRule].alertText+"<br />";
                $.validationEngine.updatePromptText(ajaxCaller,promptText,"",true);
               }else{
                _checkInArray(true);
                $.validationEngine.ajaxValid = true;
                if(!customAjaxRule)	{$.validationEngine.debug("wrong ajax response, are you on a server or in xampp? if not delete de ajax[ajaxUser] validating rule from your form ")}
                if($.validationEngine.settings.allrules[customAjaxRule].alertTextOk){	// NO OK TEXT MEAN CLOSE PROMPT
                          $.validationEngine.updatePromptText(ajaxCaller,$.validationEngine.settings.allrules[customAjaxRule].alertTextOk,"pass",true);
                }else{
                  ajaxValidate = false;
                  $.validationEngine.closePrompt(ajaxCaller);
                }
               }
              function  _checkInArray(validate){
                for(x=0;x<ajaxErrorLength;x++){
                  if($.validationEngine.ajaxValidArray[x][0] == fieldId){
                    $.validationEngine.ajaxValidArray[x][1] = validate;
                    existInarray = true;

                  }
                }
              }
            }
          });
        }
      }
      function _confirm(caller,rules,position){		 // VALIDATE FIELD MATCH
        confirmField = rules[position+1];

        if($(caller).attr('value') != $("#"+confirmField).attr('value')){
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules["confirm"].alertText+"<br />";
        }
      }
      function _length(caller,rules,position){    	  // VALIDATE LENGTH

        startLength = eval(rules[position+1]);
        endLength = eval(rules[position+2]);
        fieldLength = $(caller).attr('value').length;

        if(fieldLength<startLength || fieldLength>endLength){
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules["length"].alertText+startLength+$.validationEngine.settings.allrules["length"].alertText2+endLength+$.validationEngine.settings.allrules["length"].alertText3+"<br />"
        }
      }
      function _maxCheckbox(caller,rules,position){  	  // VALIDATE CHECKBOX NUMBER

        nbCheck = eval(rules[position+1]);
        groupname = $(caller).attr("name");
        groupSize = $("input[name='"+groupname+"']:checked").size();
        if(groupSize > nbCheck){
          $.validationEngine.showTriangle = false;
          $.validationEngine.isError = true;
          promptText += $.validationEngine.settings.allrules["maxCheckbox"].alertText+"<br />";
        }
      }
      function _minCheckbox(caller,rules,position){  	  // VALIDATE CHECKBOX NUMBER

        nbCheck = eval(rules[position+1]);
        groupname = $(caller).attr("name");
        groupSize = $("input[name='"+groupname+"']:checked").size();
        if(groupSize < nbCheck){

          $.validationEngine.isError = true;
          $.validationEngine.showTriangle = false;
          promptText += $.validationEngine.settings.allrules["minCheckbox"].alertText+" "+nbCheck+" "+$.validationEngine.settings.allrules["minCheckbox"].alertText2+"<br />";
        }
      }
      return ($.validationEngine.isError) ? $.validationEngine.isError : false;
    },
    submitForm : function(caller){
      if($.validationEngine.settings.ajaxSubmit){
        if($.validationEngine.settings.ajaxSubmitExtraData){
          extraData = $.validationEngine.settings.ajaxSubmitExtraData;
        }else{
          extraData = "";
        }
        $.ajax({
            type: "POST",
            url: $.validationEngine.settings.ajaxSubmitFile,
            async: true,
            data: $(caller).serialize()+"&"+extraData,
            error: function(data,transport){ $.validationEngine.debug("error in the ajax: "+data.status+" "+transport) },
            success: function(data){
              if(data == "true"){			// EVERYTING IS FINE, SHOW SUCCESS MESSAGE
                $(caller).css("opacity",1)
                $(caller).animate({opacity: 0, height: 0}, function(){
                  $(caller).css("display","none");
                  $(caller).before("<div class='ajaxSubmit'>"+$.validationEngine.settings.ajaxSubmitMessage+"</div>");
                  $.validationEngine.closePrompt(".formError",true);
                  $(".ajaxSubmit").show("slow");
                  if ($.validationEngine.settings.success){	// AJAX SUCCESS, STOP THE LOCATION UPDATE
                  $.validationEngine.settings.success && $.validationEngine.settings.success();
                  return false;
                }
                })
              }else{						// HOUSTON WE GOT A PROBLEM (SOMETING IS NOT VALIDATING)
                data = eval( "("+data+")");
                if(!data.jsonValidateReturn){
                   $.validationEngine.debug("you are not going into the success fonction and jsonValidateReturn return nothing");
                }
                errorNumber = data.jsonValidateReturn.length
                for(index=0; index<errorNumber; index++){
                  fieldId = data.jsonValidateReturn[index][0];
                  promptError = data.jsonValidateReturn[index][1];
                  type = data.jsonValidateReturn[index][2];
                  $.validationEngine.buildPrompt(fieldId,promptError,type);
                }
              }
            }
        })
        return true;
      }
      // LOOK FOR BEFORE SUCCESS METHOD
        if(!$.validationEngine.settings.beforeSuccess()){
          if ($.validationEngine.settings.success){	// AJAX SUCCESS, STOP THE LOCATION UPDATE
            if($.validationEngine.settings.unbindEngine){ $(caller).unbind("submit") }
            $.validationEngine.settings.success && $.validationEngine.settings.success();
            return true;
          }
        }else{
          return true;
        }
      return false;
    },
    buildPrompt : function(caller,promptText,type,ajaxed) {			// ERROR PROMPT CREATION AND DISPLAY WHEN AN ERROR OCCUR
      if(!$.validationEngine.settings){
        $.validationEngine.defaultSetting()
      }
      deleteItself = "." + $(caller).attr("id") + "formError"

      if($(deleteItself)[0]){
        $(deleteItself).stop();
        $(deleteItself).remove();
      }
      var divFormError = document.createElement('div');
      var formErrorContent = document.createElement('div');
      linkTofield = $.validationEngine.linkTofield(caller)
      $(divFormError).addClass("formError")

      if(type == "pass") $(divFormError).addClass("greenPopup")
      if(type == "load") $(divFormError).addClass("blackPopup")
      if(ajaxed) $(divFormError).addClass("ajaxed")

      $(divFormError).addClass(linkTofield);
      $(formErrorContent).addClass("formErrorContent");

      if($.validationEngine.settings.containerOverflow){		// Is the form contained in an overflown container?
        $(caller).before(divFormError);
      }else{
        $("body").append(divFormError);
      }

      $(divFormError).append(formErrorContent);

      if($.validationEngine.showTriangle != false){		// NO TRIANGLE ON MAX CHECKBOX AND RADIO
        var arrow = document.createElement('div');
        $(arrow).addClass("formErrorArrow");
        $(divFormError).append(arrow);
        if($.validationEngine.settings.promptPosition == "bottomLeft" || $.validationEngine.settings.promptPosition == "bottomRight"){
        $(arrow).addClass("formErrorArrowBottom")
        $(arrow).html('<div class="line1"><!-- --></div><div class="line2"><!-- --></div><div class="line3"><!-- --></div><div class="line4"><!-- --></div><div class="line5"><!-- --></div><div class="line6"><!-- --></div><div class="line7"><!-- --></div><div class="line8"><!-- --></div><div class="line9"><!-- --></div><div class="line10"><!-- --></div>');
      }
        if($.validationEngine.settings.promptPosition == "topLeft" || $.validationEngine.settings.promptPosition == "topRight"){
          $(divFormError).append(arrow);
          $(arrow).html('<div class="line10"><!-- --></div><div class="line9"><!-- --></div><div class="line8"><!-- --></div><div class="line7"><!-- --></div><div class="line6"><!-- --></div><div class="line5"><!-- --></div><div class="line4"><!-- --></div><div class="line3"><!-- --></div><div class="line2"><!-- --></div><div class="line1"><!-- --></div>');
        }
      }
      $(formErrorContent).html(promptText)

      var calculatedPosition = $.validationEngine.calculatePosition(caller,promptText,type,ajaxed,divFormError)

      calculatedPosition.callerTopPosition +="px";
      calculatedPosition.callerleftPosition +="px";
      calculatedPosition.marginTopSize +="px"
      $(divFormError).css({
        "top":calculatedPosition.callerTopPosition,
        "left":calculatedPosition.callerleftPosition,
        "marginTop":calculatedPosition.marginTopSize,
        "opacity":0
      })
      return $(divFormError).animate({"opacity":0.87},function(){return true;});
    },
    updatePromptText : function(caller,promptText,type,ajaxed) {	// UPDATE TEXT ERROR IF AN ERROR IS ALREADY DISPLAYED

      linkTofield = $.validationEngine.linkTofield(caller);
      var updateThisPrompt =  "."+linkTofield;

      if(type == "pass") { $(updateThisPrompt).addClass("greenPopup") }else{ $(updateThisPrompt).removeClass("greenPopup")};
      if(type == "load") { $(updateThisPrompt).addClass("blackPopup") }else{ $(updateThisPrompt).removeClass("blackPopup")};
      if(ajaxed) { $(updateThisPrompt).addClass("ajaxed") }else{ $(updateThisPrompt).removeClass("ajaxed")};

      $(updateThisPrompt).find(".formErrorContent").html(promptText);

      var calculatedPosition = $.validationEngine.calculatePosition(caller,promptText,type,ajaxed,updateThisPrompt)

      calculatedPosition.callerTopPosition +="px";
      calculatedPosition.callerleftPosition +="px";
      calculatedPosition.marginTopSize +="px"
      $(updateThisPrompt).animate({ "top":calculatedPosition.callerTopPosition,"marginTop":calculatedPosition.marginTopSize });
    },
    calculatePosition : function(caller,promptText,type,ajaxed,divFormError){

      if($.validationEngine.settings.containerOverflow){		// Is the form contained in an overflown container?
        callerTopPosition = 0;
        callerleftPosition = 0;
        callerWidth =  $(caller).width();
        inputHeight = $(divFormError).height();					// compasation for the triangle
        var marginTopSize = "-"+inputHeight;
      }else{
        callerTopPosition = $(caller).offset().top;
        callerleftPosition = $(caller).offset().left;
        callerWidth =  $(caller).width();
        inputHeight = $(divFormError).height();
        var marginTopSize = 0;
      }

      /* POSITIONNING */
      if($.validationEngine.settings.promptPosition == "topRight"){
        if($.validationEngine.settings.containerOverflow){		// Is the form contained in an overflown container?
          callerleftPosition += callerWidth -30;
        }else{
          callerleftPosition +=  callerWidth -30;
          callerTopPosition += -inputHeight;
        }
      }
      if($.validationEngine.settings.promptPosition == "topLeft"){ callerTopPosition += -inputHeight -10; }

      if($.validationEngine.settings.promptPosition == "centerRight"){ callerleftPosition +=  callerWidth +13; }

      if($.validationEngine.settings.promptPosition == "bottomLeft"){
        callerHeight =  $(caller).height();
        callerTopPosition = callerTopPosition + callerHeight + 15;
      }
      if($.validationEngine.settings.promptPosition == "bottomRight"){
        callerHeight =  $(caller).height();
        callerleftPosition +=  callerWidth -30;
        callerTopPosition +=  callerHeight +5;
      }
      return {
        "callerTopPosition":callerTopPosition,
        "callerleftPosition":callerleftPosition,
        "marginTopSize":marginTopSize
      }
    },
    linkTofield : function(caller){
      var linkTofield = $(caller).attr("id") + "formError";
      linkTofield = linkTofield.replace(/\[/g,"");
      linkTofield = linkTofield.replace(/\]/g,"");
      return linkTofield;
    },
    closePrompt : function(caller,outside) {						// CLOSE PROMPT WHEN ERROR CORRECTED
      if(!$.validationEngine.settings){
        $.validationEngine.defaultSetting()
      }
      if(outside){
        $(caller).fadeTo("fast",0,function(){
          $(caller).remove();
        });
        return false;
      }
      if(typeof(ajaxValidate)=='undefined'){ajaxValidate = false}
      if(!ajaxValidate){
        linkTofield = $.validationEngine.linkTofield(caller);
        closingPrompt = "."+linkTofield;
        $(closingPrompt).fadeTo("fast",0,function(){
          $(closingPrompt).remove();
        });
      }
    },
    debug : function(error) {
      if(!$("#debugMode")[0]){
        $("body").append("<div id='debugMode'><div class='debugError'><strong>This is a debug mode, you got a problem with your form, it will try to help you, refresh when you think you nailed down the problem</strong></div></div>");
      }
      $(".debugError").append("<div class='debugerror'>"+error+"</div>");
    },
    submitValidation : function(caller) {					// FORM SUBMIT VALIDATION LOOPING INLINE VALIDATION
      var stopForm = false;
      $.validationEngine.ajaxValid = true;
      var toValidateSize = $(caller).find("[class*=validate]").size();

      $(caller).find("[class*=validate]").each(function(){
        linkTofield = $.validationEngine.linkTofield(this);

        if(!$("."+linkTofield).hasClass("ajaxed")){	// DO NOT UPDATE ALREADY AJAXED FIELDS (only happen if no normal errors, don't worry)
          var validationPass = $.validationEngine.loadValidation(this);
          return(validationPass) ? stopForm = true : "";
        };
      });
      ajaxErrorLength = $.validationEngine.ajaxValidArray.length;		// LOOK IF SOME AJAX IS NOT VALIDATE
      for(x=0;x<ajaxErrorLength;x++){
        if($.validationEngine.ajaxValidArray[x][1] == false) $.validationEngine.ajaxValid = false;
      }
      if(stopForm || !$.validationEngine.ajaxValid){		// GET IF THERE IS AN ERROR OR NOT FROM THIS VALIDATION FUNCTIONS
        if($.validationEngine.settings.scroll){
          if(!$.validationEngine.settings.containerOverflow){
            var destination = $(".formError:not('.greenPopup'):first").offset().top;
            $(".formError:not('.greenPopup')").each(function(){
              testDestination = $(this).offset().top;
              if(destination>testDestination) destination = $(this).offset().top;
            })
            $("html:not(:animated),body:not(:animated)").animate({ scrollTop: destination}, 1100);
          }else{
            var destination = $(".formError:not('.greenPopup'):first").offset().top;
            var scrollContainerScroll = $($.validationEngine.settings.containerOverflowDOM).scrollTop();
            var scrollContainerPos = - parseInt($($.validationEngine.settings.containerOverflowDOM).offset().top);
            var destination = scrollContainerScroll + destination + scrollContainerPos -5
            var scrollContainer = $.validationEngine.settings.containerOverflowDOM+":not(:animated)"

            $(scrollContainer).animate({ scrollTop: destination}, 1100);
          }
        }
        return true;
      }else{
        return false;
      }
    }
  }
})(jQuery);