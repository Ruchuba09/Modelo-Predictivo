<?php

namespace App\Http\Requests\Auth;

use App\Support\Rut;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rut' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    protected function credentials(): array
    {
        $login = $this->input('rut');

        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'rut';

        return [
            $field => $field === 'rut' ? Rut::clean($login) : $login,
            'password' => $this->input('password'),
        ];
    }

    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->credentials(), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'rut' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'rut' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    public function throttleKey(): string
    {
        $login = filter_var($this->input('rut'), FILTER_VALIDATE_EMAIL)
            ? Str::lower($this->input('rut'))
            : Rut::clean($this->input('rut'));

        return Str::transliterate($login.'|'.$this->ip());
    }
}