<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;
    //protected $connection = "usuarios";

    protected $table = "users";
    protected $primaryKey = "id_user";
    protected $fillable = [
        "id_trabajador",
        "email",
        "password",
        "fecha_creation"
    ];

    protected $hidden = [
        "password",
        "remember_token",
    ];

    protected function casts(): array
    {
        return [
            "email_verified_at" => "datetime",
            "password" => "hashed",
        ];
    }
    public function trabajadorOrFail(): Trabajador
    {
        return $this->trabajador ?? throw new \Illuminate\Auth\Access\AuthorizationException(
            'El usuario autenticado no está vinculado a un trabajador.'
        );
    }

    // ============================================================
    // ROLES
    // ============================================================

    public function roles()
    {
        return $this->belongsToMany(
            Rol::class,
            "usuario_rols",
            "id_user",
            "id_rol"
        );
    }

    // ============================================================
    // PERMISOS
    // ============================================================

    public function tieneRol(string $nombreRol): bool
    {
        return $this->roles()
            ->where("nombre", $nombreRol)
            ->exists();
    }

    public function tienePermiso(string $nombrePermiso): bool
    {
        return $this->roles()
            ->whereHas("permisos", function ($query) use ($nombrePermiso) {
                $query->where("nombre", $nombrePermiso);
            })
            ->exists();
    }
    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }
}