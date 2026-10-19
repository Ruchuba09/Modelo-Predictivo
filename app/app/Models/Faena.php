<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Faena extends Model
{
    protected $table = 'public.faenas';
    protected $primaryKey = 'id_faena';
    public $timestamps = false;

    protected $fillable = [
        'codigo_faena',
        'nombre',
    ];

    public function areas(): HasMany
    {
        return $this->hasMany(Area::class, 'id_faena', 'id_faena');
    }
}