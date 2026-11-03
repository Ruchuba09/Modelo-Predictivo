<?php

namespace Database\Factories\Providers;

use Faker\Provider\Base;

class RutProvider extends Base
{
    public function rut(): string
    {
        $number = $this->generator->numberBetween(10000000, 99999999);
        $sum = 0;
        $multiplier = 2;

        foreach (array_reverse(str_split((string) $number)) as $digit) {
            $sum += (int) $digit * $multiplier;
            $multiplier = $multiplier === 7 ? 2 : $multiplier + 1;
        }

        $remainder = 11 - ($sum % 11);
        $checkDigit = match ($remainder) {
            11 => '0',
            10 => 'K',
            default => (string) $remainder,
        };

        return "{$number}-{$checkDigit}";
    }
}
