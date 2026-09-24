<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'trabajador@ejemplo.com'],
            [
                'rut' => '11111111-1',
                'password' => Hash::make('12345678'),
            ]
        );

        User::firstOrCreate(
            ['email' => 'supervisor@ejemplo.com'],
            [
                'rut' => '22222222-2',
                'password' => Hash::make('12345678'),
            ]
        );

        User::firstOrCreate(
            ['email' => 'administrativo@ejemplo.com'],
            [
                'rut' => '33333333-3',
                'password' => Hash::make('12345678'),
            ]
        );
    }
}