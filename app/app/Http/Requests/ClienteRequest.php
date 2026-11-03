<?php

namespace App\Http\Requests;

use App\Models\Cliente;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClienteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Policies en la Fase 4
    }

    public function rules(): array
    {
        $cliente  = $this->route('cliente');
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'rut'          => [$required, 'string', 'max:20',
                               Rule::unique(Cliente::class, 'rut')->ignore($cliente?->id_cliente, 'id_cliente')],
            'razon_social' => [$required, 'string', 'max:255'],
            'nombre'       => ['nullable', 'string', 'max:255'],
            'email'        => ['nullable', 'email', 'max:255'],
            'telefono'     => ['nullable', 'string', 'max:50'],
            'direccion'    => ['nullable', 'string', 'max:255'],
            'estado'       => ['nullable', 'string', 'max:30'],
        ];
    }
}
