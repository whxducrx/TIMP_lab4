import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllVessels, addVessel, updateVessel, deleteVessel, getCurrentUser } from '../services/api';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';

function Vessels() {
    const navigate = useNavigate();
    const [vessels, setVessels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingVessel, setEditingVessel] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        imo_number: '',
        type: '',
        flag: '',
        built_year: new Date().getFullYear(),
        description: ''
    });

    useEffect(() => {
        const user = getCurrentUser();
        if (!user || user.role !== 'admin') {
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        loadVessels();
    }, []);

    const loadVessels = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getAllVessels();
            setVessels(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Ошибка при загрузке судов');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'built_year' ? (value ? parseInt(value) : '') : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setActionError('Название судна обязательно');
            return;
        }

        try {
            setActionError('');
            setSuccessMessage('');
            
            if (editingVessel) {
                await updateVessel(editingVessel.id, formData);
                setSuccessMessage('Судно обновлено');
            } else {
                await addVessel(formData);
                setSuccessMessage('Судно добавлено');
            }
            
            resetForm();
            loadVessels();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setActionError(`Ошибка: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleEdit = (vessel) => {
        setEditingVessel(vessel);
        setFormData({
            name: vessel.name,
            imo_number: vessel.imo_number || '',
            type: vessel.type || '',
            flag: vessel.flag || '',
            built_year: vessel.built_year || new Date().getFullYear(),
            description: vessel.description || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (vesselId) => {
        if (window.confirm('Вы уверены, что хотите удалить это судно?')) {
            try {
                setActionError('');
                setSuccessMessage('');
                await deleteVessel(vesselId);
                setSuccessMessage('Судно удалено');
                loadVessels();
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (err) {
                setActionError(`Ошибка при удалении: ${err.response?.data?.error || err.message}`);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            imo_number: '',
            type: '',
            flag: '',
            built_year: new Date().getFullYear(),
            description: ''
        });
        setEditingVessel(null);
        setShowForm(false);
        setActionError('');
    };

    if (loading && vessels.length === 0) {
        return <Spinner />;
    }

    return (
        <div className="min-vh-100 bg-light">
            <div className="container py-4">
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <h2 style={{ color: '#667eea' }}>Управление судами</h2>
                    <button
                        className="btn"
                        style={{ backgroundColor: '#667eea', color: 'white' }}
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                    >
                        + Добавить судно
                    </button>
                </div>

                {error && <ErrorAlert error={error} />}
                {actionError && <ErrorAlert error={actionError} />}
                {successMessage && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        {successMessage}
                        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                    </div>
                )}

                {showForm && (
                    <div className="card shadow-sm mb-4">
                        <div className="card-header" style={{ backgroundColor: '#667eea', color: 'white' }}>
                            <h5 className="mb-0">
                                {editingVessel ? 'Редактирование судна' : 'Новое судно'}
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Название *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">IMO номер</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="imo_number"
                                            value={formData.imo_number}
                                            onChange={handleFormChange}
                                            maxLength={20}
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Тип судна</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="type"
                                            value={formData.type}
                                            onChange={handleFormChange}
                                            maxLength={50}
                                            placeholder="Танкер, Контейнеровоз и т.д."
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Флаг</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="flag"
                                            value={formData.flag}
                                            onChange={handleFormChange}
                                            maxLength={50}
                                            placeholder="Страна флага"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Год постройки</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="built_year"
                                            value={formData.built_year}
                                            onChange={handleFormChange}
                                            min="1900"
                                            max={new Date().getFullYear()}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Описание</label>
                                    <textarea
                                        className="form-control"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleFormChange}
                                        rows="3"
                                        maxLength={500}
                                    ></textarea>
                                </div>

                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-primary"
                                        style={{ backgroundColor: '#667eea', borderColor: '#667eea' }}>
                                        Сохранить
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="card shadow-sm">
                    <div className="card-header" style={{ backgroundColor: '#667eea', color: 'white' }}>
                        <h5 className="mb-0">Список судов ({vessels.length})</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead style={{ backgroundColor: '#f5f5f5' }}>
                                <tr>
                                    <th>Название</th>
                                    <th>IMO</th>
                                    <th>Тип</th>
                                    <th>Флаг</th>
                                    <th>Год постройки</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vessels.map((vessel) => (
                                    <tr key={vessel.id}>
                                        <td><strong>{vessel.name}</strong></td>
                                        <td>{vessel.imo_number || '-'}</td>
                                        <td>{vessel.type || '-'}</td>
                                        <td>{vessel.flag || '-'}</td>
                                        <td>{vessel.built_year || '-'}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-primary me-2"
                                                onClick={() => handleEdit(vessel)}
                                                style={{ backgroundColor: '#667eea', borderColor: '#667eea' }}
                                            >
                                                Редактировать
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(vessel.id)}
                                            >
                                                Удалить
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {vessels.length === 0 && (
                        <div className="text-center py-5">
                            <p className="text-muted">Суда не найдены</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Vessels;
