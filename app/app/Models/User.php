<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

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

    /** Eventos que registró; si se elimina la cuenta quedan sin autor (RF-30.2). */
    public function eventosRegistrados(): HasMany
    {
        return $this->hasMany(Evento::class, 'id_autor', 'id_user');
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
            ->map(fn (string $nombre) => Rol::nombreCanonico($nombre))
            ->all();
    }

    // PERMISOS

    /** El Administrador tiene todos los permisos sin asignarlos (CA-2). */
    public function esAdministrador(): bool
    {
        return $this->tieneRol('Administrador');
    }

    /** Permisos efectivos: los de sus roles activos, o todos si es Administrador. */
    public function permisosArray(): array
    {
        return $this->permisosCache ??= $this->esAdministrador()
            ? Permiso::orderBy('nombre')->pluck('nombre')->all()
            : $this->rolesActivos()
                ->with('permisos:id_permiso,nombre')
                ->get()
                ->flatMap(fn ($rol) => $rol->permisos->pluck('nombre'))
                ->unique()
                ->sort()
                ->values()
                ->all();
    }

    public function tieneRol(string ...$nombresRoles): bool
    {
        $userRoles = array_map('mb_strtolower', $this->rolesArray());
        foreach ($nombresRoles as $rol) {
            if (in_array(mb_strtolower($rol), $userRoles, true)) {
                return true;
            }
        }
        return false;
    }

    /** true si alguno de sus roles activos otorga alguno de los permisos indicados. */
    public function tienePermiso(string ...$permisos): bool
    {
        if ($this->esAdministrador()) {
            return true;
        }

        return array_intersect($permisos, $this->permisosArray()) !== [];
    }

    /** Olvida los permisos calculados (tras cambiar sus roles en la misma petición). */
    public function olvidarPermisos(): void
    {
        $this->permisosCache = null;
    }
}
