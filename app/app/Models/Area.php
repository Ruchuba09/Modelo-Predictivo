<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    use HasFactory;

    protected $table = 'areas';
    protected $primaryKey = 'id_area';
    public $timestamps = false;

    protected $fillable = [
        'id_faena',
        'codigo_area',
        'descripcion',
    ];

    public function faena()
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }
}
