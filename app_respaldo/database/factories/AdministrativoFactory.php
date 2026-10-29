<?php

namespace Database\Factories;

use App\Models\Trabajador;
use Illuminate\Database\Eloquent\Factories\Factory;

class AdministrativoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id_trabajador' => Trabajador::factory(),
        ];
    }
}
