<?php

/* RECEIVE VALUE */
$validateValue = $_POST['validateValue'];
$validateId    = $_POST['validateId'];
$validateError = $_POST['validateError'];

/* RETURN VALUE */
$arrayToJs = array();
$arrayToJs[0] = $validateId;
$arrayToJs[1] = $validateError;

if( $validateValue=='karnius' ){

 // Valid
 // Return TRUE
	$arrayToJs[2] = 'true';
 // Return array with Success
  echo '{"jsonValidateReturn":'.json_encode( $arrayToJs ).'}';

}else{

 // Invalid
	for( $x=0 ; $x<1000000 ; $x++ ){
		if( $x==990000 ){
			$arrayToJs[2] = 'false';
     // Return array with Error
			echo '{"jsonValidateReturn":'.json_encode($arrayToJs).'}';
		}
	}

}

?>