<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faena extends Model
{
    use HasFactory;

    protected $table = 'faenas';
    protected $primaryKey = 'id_faena';
    public $timestamps = false;

    protected $fillable = [
        'codigo_faena',
        'nombre',
    ];
}
