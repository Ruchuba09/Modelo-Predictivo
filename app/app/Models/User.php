<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = "users";

    protected $fillable = [
        "rut",
        "email",
        "password",
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

    // ============================================================
    // ROLES
    // ============================================================

    public function roles()
    {
        return $this->belongsToMany(
            Role::class,
            "usuarios_tienen_roles",
            "id_usuario",
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
}