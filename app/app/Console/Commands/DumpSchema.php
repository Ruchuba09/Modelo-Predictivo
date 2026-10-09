<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:dump-schema')]
#[Description('Command description')]
class DumpSchema extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $columns = \Illuminate\Support\Facades\DB::select("
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'eventos'
        ");

        $this->info("=== SCHEMA DE LA TABLA EVENTOS ===");
        foreach ($columns as $c) {
            $this->line("- {$c->column_name}: {$c->data_type} (Nullable: {$c->is_nullable})");
        }
    }
}
