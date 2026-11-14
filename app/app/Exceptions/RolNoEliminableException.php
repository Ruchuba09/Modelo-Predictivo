<?php

namespace App\Exceptions;

use RuntimeException;

/** El Rol no cumple las condiciones de RF-22.3 para eliminarse; el mensaje es el que ve el usuario. */
class RolNoEliminableException extends RuntimeException {}
