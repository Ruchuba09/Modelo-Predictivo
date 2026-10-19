<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Area extends Model
{
    protected $table = 'areas';
    protected $primaryKey = 'id_area';
    public $timestamps = false;

    protected $fillable = [
        'id_faena',
        'codigo_area',
        'descripcion',
    ];

    public function faena(): BelongsTo
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }
}