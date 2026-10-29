<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CatalogosSeeder::class,
            RolesAndPermisosSeeder::class,
            TrabajadorSeeder::class,
            UserSeeder::class,
            DatosDemoSeeder::class,
        ]);
    }
}
