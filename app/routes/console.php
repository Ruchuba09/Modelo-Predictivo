<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// RF-31.5: borra los tokens de la aplicación móvil vencidos hace más de un día.
Schedule::command('sanctum:prune-expired --hours=24')->daily();
