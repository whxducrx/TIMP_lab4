import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [patronymic, setPatronymic] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !email || !password || !confirmPassword || !firstName || !lastName) {
            setError('Логин, email, пароль, имя и фамилия обязательны');
            return;
        }

        if (username.length < 5) {
            setError('Логин должен содержать минимум 5 символов');
            return;
        }

        if (password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Неверный формат email');
            return;
        }

        try {
            setLoading(true);
            await register(username, email, password, firstName, lastName, patronymic);

            navigate('/login', { state: { message: 'Регистрация успешна! Пожалуйста, авторизуйтесь' } });
        } catch (err) {
            console.error(err);
            const errorMessage = err.error || err.message || 'Ошибка регистрации';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="card shadow" style={{ maxWidth: '500px', width: '100%' }}>
                <div className="card-body p-5">
                    <div className="text-center mb-4">
                        <i className="bi bi-person-plus-fill text-primary" style={{ fontSize: '3rem' }}></i>
                        <h3 className="mt-3">Регистрация</h3>
                        <p className="text-muted small">Создайте новый аккаунт</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            <strong>Ошибка:</strong> {error}
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setError('')}
                            ></button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">
                                Логин <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                maxLength={50}
                                required
                                placeholder="Минимум 5 символов"
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="firstName" className="form-label">
                                    Имя <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    maxLength={50}
                                    required
                                    placeholder="Ваше имя"
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="lastName" className="form-label">
                                    Фамилия <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    maxLength={50}
                                    required
                                    placeholder="Ваша фамилия"
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="patronymic" className="form-label">
                                Отчество
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="patronymic"
                                value={patronymic}
                                onChange={(e) => setPatronymic(e.target.value)}
                                maxLength={50}
                                placeholder="Ваше отчество (опционально)"
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">
                                Email <span className="text-danger">*</span>
                            </label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                maxLength={100}
                                required
                                placeholder="your@email.com"
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">
                                Пароль <span className="text-danger">*</span>
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                maxLength={50}
                                required
                                placeholder="Минимум 6 символов"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="confirmPassword" className="form-label">
                                Подтверждение пароля <span className="text-danger">*</span>
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                maxLength={50}
                                required
                                placeholder="Повторите пароль"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 mb-3"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Регистрация...
                                </>
                            ) : (
                                'Зарегистрироваться'
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-muted small mb-0">
                            Уже есть аккаунт?{' '}
                            <Link to="/login" className="text-decoration-none">
                                Авторизуйтесь
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
