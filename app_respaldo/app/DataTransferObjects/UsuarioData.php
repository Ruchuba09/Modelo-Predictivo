<?php

namespace App\DataTransferObjects;

final class UsuarioData
{
    public function __construct(
        public readonly string $rut,
        public readonly string $email,
        public readonly ?string $password,
        public readonly array $roles,
    ) {}

    public static function fromArray(array $validated): self
    {
        return new self(
            rut: $validated['rut'],
            email: $validated['email'],
            password: $validated['password'] ?? null,
            roles: $validated['roles'],
        );
    }
}