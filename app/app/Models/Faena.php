<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faena extends Model
{
    protected $table = 'public.faenas';   // esquema correcto
    protected $primaryKey = 'id_faena';   // el nombre real de tu PK
    public $timestamps = false;
}