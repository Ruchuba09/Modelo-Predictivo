<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('eventos', function (Blueprint $table) {
            $table->string('evidencia')->nullable()->after('referencia');
        });
    }
    
    public function down()
    {
        Schema::table('eventos', function (Blueprint $table) {
            $table->dropColumn('evidencia');
        });
    }
};
