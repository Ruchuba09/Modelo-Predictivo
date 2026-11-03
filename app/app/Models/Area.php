<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function faena(): BelongsTo
    {
        return $this->belongsTo(Faena::class, 'id_faena', 'id_faena');
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class, 'id_area', 'id_area');
    }
}
