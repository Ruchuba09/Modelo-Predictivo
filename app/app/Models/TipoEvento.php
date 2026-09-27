<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoEvento extends Model
{
    protected $table = 'tipo_eventos';
    protected $primaryKey = 'id_tipo_evento';
    public $timestamps = false;
    protected $fillable = ['nombre'];
}