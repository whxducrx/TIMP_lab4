import React, {useState, useEffect} from 'react';
import {useNavigate, useLocation, Link} from 'react-router-dom';
import {login} from '../services/api';

function Login(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.message) {
            setError(location.state.message);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Логин и пароль обязательны');
            return;
        }

        if (username.length < 5) {
            setError('Логин должен содержать минимум 5 символов');
            return;
        }

        try {
            setLoading(true);
            await login(username, password);
            navigate('/');
        }catch(e){
            console.error(e);
            const errorMessage = e.error || e.message || 'неверный логин или пароль';
            setError(errorMessage);
        }finally {
            setLoading(false);
        }
    };

    return(
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="card shadow" style={{maxWidth: '400px', width: '100%'}}>
                <div className="card-body p-5">
                    <div className="text-center mb-4">
                        <i className="bi bi-shield-lock-fill text-primary" style={{fontSize: '3rem'}}></i>
                        <h3 className="mt-3">Вход в систему</h3>
                    </div>

                    {error && (
                        <div className={`alert ${error.includes('успешна') ? 'alert-success' : 'alert-danger'}`} role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">
                                Логин
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                maxLength={50}
                                required
                                autoFocus
                                placeholder="Введите ваш логин"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="form-label">
                                Пароль
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                maxLength={50}
                                required
                                placeholder="Введите ваш пароль"
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
                                    Вход...
                                </>
                            ) : (
                                'Войти'
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-muted small mb-0">
                            Нет аккаунта?{' '}
                            <Link to="/register" className="text-decoration-none">
                                Зарегистрируйтесь
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login;