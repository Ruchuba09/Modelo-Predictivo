<?php

namespace Tests\Unit;

use App\Console\Commands\ServirModeloPredictivo;
use PHPUnit\Framework\TestCase;

class ServirModeloPredictivoTest extends TestCase
{
    public function test_traduce_la_conexion_de_laravel_a_sqlalchemy(): void
    {
        $url = ServirModeloPredictivo::urlBaseDatos([
            'host' => '127.0.0.1',
            'port' => '5432',
            'database' => 'ava',
            'username' => 'postgres',
            'password' => 'cl@ve/1:2',
        ]);

        $this->assertSame('postgresql+psycopg2://postgres:cl%40ve%2F1%3A2@127.0.0.1:5432/ava', $url);
    }

    public function test_respeta_una_url_de_conexion_ya_definida(): void
    {
        $url = ServirModeloPredictivo::urlBaseDatos(['url' => 'pgsql://usuario:clave@db:5432/ava']);

        $this->assertSame('postgresql+psycopg2://usuario:clave@db:5432/ava', $url);
    }
}
