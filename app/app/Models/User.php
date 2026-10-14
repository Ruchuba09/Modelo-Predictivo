<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = "users";
    protected $primaryKey = "id_user";

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        "id_trabajador",
        "email",
        "password",
        "fecha_creacion",
    ];

    protected $hidden = [
        "password",
        "remember_token",
    ];

    protected ?array $permisosCache = null;

    protected function casts(): array
    {
        return [
            "email_verified_at" => "datetime",
            "fecha_creacion" => "datetime",
            "password" => "hashed",
        ];
    }

    public function trabajador(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }

    public function trabajadorOrFail(): Trabajador
    {
        return $this->trabajador ?? throw new \Illuminate\Auth\Access\AuthorizationException(
            'El usuario autenticado no está vinculado a un trabajador.'
        );
    }

    // ROLES

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'usuario_rol', 'id_user', 'id_rol');
    }

    public function rolesActivos(): BelongsToMany
    {
        return $this->roles()->where('roles.estado', 'activo');
    }

    public function rolesArray(): array
    {
        return $this->rolesActivos()
            ->pluck('roles.nombre')
            ->all();
    }

    // PERMISOS

    public function permisosArray(): array
    {
        return $this->permisosCache ??= $this->rolesActivos()
            ->with('permisos')
            ->get()
            ->flatMap(fn ($rol) => $rol->permisos->pluck('nombre'))
            ->unique()
            ->values()
            ->all();
    }

    public function tieneRol(string $nombreRol): bool
    {
        return $this->rolesActivos()
            ->where('roles.nombre', $nombreRol)
            ->exists();
    }

    public function tienePermiso(string $permiso): bool
    {
        return $this->rolesActivos()
            ->whereHas('permisos', fn ($q) => $q->where('permisos.nombre', $permiso))
            ->exists();
    }
}