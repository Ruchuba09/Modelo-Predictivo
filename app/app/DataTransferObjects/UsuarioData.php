<?php

namespace App\DataTransferObjects;

/** Datos de un Usuario (RF-27, RF-28). En la edición no hay RUT: no se modifica. */
final readonly class UsuarioData
{
    /**
     * @param  array<int, int>  $roles
     */
    public function __construct(
        public ?string $rut,
        public string $email,
        public ?string $password,
        public array $roles,
    ) {}

    public static function fromArray(array $validated): self
    {
        $password = $validated['password'] ?? null;

        return new self(
            rut: $validated['rut'] ?? null,
            email: $validated['email'],
            password: $password === '' ? null : $password,
            roles: array_values(array_unique(array_map('intval', $validated['roles']))),
        );
    }
}
