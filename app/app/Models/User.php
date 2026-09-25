<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'usuario_rol', 'id_user', 'id_rol');
    }

    /**
     * Solo los roles con estado 'activo'. Úsalo en vez de roles()
     * para cualquier chequeo de permisos/autorización.
     */
    public function rolesActivos(): BelongsToMany
    {
        return $this->roles()->where('estado', 'activo');
    }

    // ============================================================
    // PERMISOS
    // ============================================================
    protected ?array $permisosCache = null;

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
            ->where("nombre", $nombreRol)
            ->exists();
    }

    public function tienePermiso(string $permiso): bool
    {
        return $this->rolesActivos()
            ->whereHas('permisos', fn ($q) => $q->where('nombre', $permiso))
            ->exists();
    }

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class, 'id_trabajador', 'id_trabajador');
    }
}