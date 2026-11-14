<?php

namespace App\Exceptions;

use RuntimeException;

/** El Permiso no cumple las condiciones de RF-26.3 para eliminarse; el mensaje es el que ve el usuario. */
class PermisoNoEliminableException extends RuntimeException {}
