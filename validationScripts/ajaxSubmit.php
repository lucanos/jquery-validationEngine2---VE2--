<?php

/*  RECEIVE POST   */
$email = $_POST['email'];
$age   = $_POST['age'];

/* VALIDATE HOW YOU NEED TO VALIDATE */


/* RETURN ERROR */
$arrayError[0] = array(
  0 => '#email' , // Field ID
  1 => 'Your email do not match.. whatever it need to match' , // Error Message
  2 => 'error' // Box Color
);
$arrayError[1] = array(
  0 => '#age' , // FieldID
  1 => 'Your email do not match.. whatever it need to match' , // Error Message
  2 => 'error' // Box Color
);


$isValidate = true;  // RETURN TRUE FROM VALIDATING, NO ERROR DETECTED
/* RETURN ARRAY FROM YOUR VALIDATION  */

/* THIS NEED TO BE IN YOUR FILE NO MATTERS WHAT */
if( $isValidate==true ){
	echo 'true';
}else{
	echo '{"jsonValidateReturn":'.json_encode($arrayError).'}';		// RETURN ARRAY WITH ERROR
}

?>