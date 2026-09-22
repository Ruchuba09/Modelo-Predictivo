<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class administrativo extends Model
{
    protected $table = "administrativos";
    protected $primaryKey = "id_administrativo";
    protected $fillable = ["nombre", "nivel"];
}
