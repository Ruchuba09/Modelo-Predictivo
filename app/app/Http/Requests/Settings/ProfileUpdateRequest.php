<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rut' => [
                'required',
                'string',
                Rule::unique('usuarios.users', 'rut')->ignore($this->user()->id_user, 'id_user'),
            ],
            'email' => [
                'required',
                'email',
                Rule::unique('usuarios.users', 'email')->ignore($this->user()->id_user, 'id_user'),
            ],
        ];
    }
}