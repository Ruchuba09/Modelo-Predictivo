<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Rol extends Model
{
    protected $table = 'roles';
    protected $primaryKey = 'id_rol';
    public $timestamps = false;

    protected $fillable = ['nombre', 'descripcion', 'estado'];

    protected $appends = ['es_sistema', 'todos_los_permisos'];

    public const ESTADO_ACTIVO = 'activo';

    public const ESTADO_INACTIVO = 'inactivo';

    public const ESTADOS = [self::ESTADO_ACTIVO, self::ESTADO_INACTIVO];

    /** Roles de los que depende el sistema: el Administrador tiene todos los permisos y el Supervisor recibe los suyos por defecto. */
    public const ROLES_SISTEMA = ['Administrador', 'Supervisor'];

    /**
     * Nombres que el sistema interpreta como otro rol: un rol llamado así
     * recibe el acceso de ese rol (ver User::rolesArray()).
     */
    private const ALIAS = [
        'admin' => 'Administrador',
        'administrador' => 'Administrador',
        'supervisor' => 'Supervisor',
        'usuario' => 'Usuario',
        'rrhh' => 'RRHH',
    ];

    /** Nombre con el que el control de acceso reconoce al rol. */
    public static function nombreCanonico(string $nombre): string
    {
        return self::ALIAS[mb_strtolower(trim($nombre))] ?? $nombre;
    }

    /** true si un rol con este nombre recibiría el acceso de un rol del sistema. */
    public static function nombreDeSistema(string $nombre): bool
    {
        return in_array(self::nombreCanonico($nombre), self::ROLES_SISTEMA, true);
    }

    /** RF-20.3.3 y RF-22.3.1: estos roles conservan nombre y estado, y no se eliminan. */
    protected function esSistema(): Attribute
    {
        return Attribute::get(fn () => $this->nombre !== null && self::nombreDeSistema($this->nombre));
    }

    /** CA-2: el Administrador tiene todos los permisos sin asignarlos; los suyos no se editan. */
    protected function todosLosPermisos(): Attribute
    {
        return Attribute::get(fn () => $this->nombre !== null && self::nombreCanonico($this->nombre) === 'Administrador');
    }

    public function permisos(): BelongsToMany
    {
        return $this->belongsToMany(Permiso::class, 'rol_permiso', 'id_rol', 'id_permiso');
    }

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'usuario_rol', 'id_rol', 'id_user');
    }
}
