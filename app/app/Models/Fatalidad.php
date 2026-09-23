<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fatalidad extends Model
{
    protected $table = 'fatalidades';
    protected $primaryKey = 'id_evento';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = ['id_evento', 'causa_muerte', 'id_victima'];

    public function evento()
    {
        return $this->belongsTo(Evento::class, 'id_evento', 'id_evento');
    }
}