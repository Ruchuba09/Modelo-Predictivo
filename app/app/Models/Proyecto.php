<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;


class Proyecto extends Model {
    protected $connection = "usuarios";
    protected $table = "proyectos";
    public $timestamps = false;

    protected $fillable = [
        "centro_costo",
        "nombre",
        "alias",
    ];

}
