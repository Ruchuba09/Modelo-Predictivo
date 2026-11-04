<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TarjetaPareRegistrada extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $idEvento,
        public readonly string $proyecto,
        public readonly ?string $area,
        public readonly string $referencia,
        public readonly string $condicion,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Tarjeta PARE #{$this->idEvento} - {$this->proyecto}")
            ->line('Se activó una Tarjeta PARE que requiere revisión antes de reiniciar el trabajo.')
            ->line("Proyecto: {$this->proyecto}")
            ->line('Área: '.($this->area ?? 'Sin área registrada'))
            ->line("Lugar: {$this->referencia}")
            ->line("Condición: {$this->condicion}")
            ->action('Revisar reporte', url("/eventos/{$this->idEvento}"));
    }
}
