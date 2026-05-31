import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getAllVessels, 
    getPositions, 
    getVesselCrew, 
    addCrewMember, 
    updateCrewMember, 
    deleteCrewMember,
    getCurrentUser 
} from '../services/api';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';

function Crew() {
    const navigate = useNavigate();
    const [vessels, setVessels] = useState([]);
    const [positions, setPositions] = useState([]);
    const [crew, setCrew] = useState([]);
    const [selectedVessel, setSelectedVessel] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        patronymic: '',
        position_id: '',
        passport_number: '',
        nationality: '',
        date_of_birth: '',
        hire_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const user = getCurrentUser();
        if (!user || user.role !== 'admin') {
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedVessel) {
            loadCrew();
        } else {
            setCrew([]);
        }
    }, [selectedVessel]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError('');
            const [vesselsData, positionsData] = await Promise.all([
                getAllVessels(),
                getPositions()
            ]);
            setVessels(Array.isArray(vesselsData) ? vesselsData : []);
            setPositions(Array.isArray(positionsData) ? positionsData : []);
        } catch (err) {
            setError('Ошибка при загрузке данных');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCrew = async () => {
        try {
            const data = await getVesselCrew(selectedVessel);
            setCrew(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Ошибка при загрузке экипажа');
            console.error(err);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'position_id' ? (value ? parseInt(value) : '') : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.position_id) {
            setActionError('Требуются: Имя, Фамилия, Должность');
            return;
        }

        try {
            setActionError('');
            setSuccessMessage('');

            const submitData = {
                vessel_id: parseInt(selectedVessel),
                position_id: parseInt(formData.position_id),
                first_name: formData.first_name,
                last_name: formData.last_name,
                patronymic: formData.patronymic || null,
                passport_number: formData.passport_number || null,
                nationality: formData.nationality || null,
                date_of_birth: formData.date_of_birth || null,
                hire_date: formData.hire_date || null
            };

            if (editingMember) {
                await updateCrewMember(editingMember.id, submitData);
                setSuccessMessage('Член экипажа обновлен');
            } else {
                await addCrewMember(submitData);
                setSuccessMessage('Член экипажа добавлен');
            }

            resetForm();
            loadCrew();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setActionError(`Ошибка: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleEdit = (member) => {
        setEditingMember(member);
        setFormData({
            first_name: member.first_name,
            last_name: member.last_name,
            patronymic: member.patronymic || '',
            position_id: member.position_id,
            passport_number: member.passport_number || '',
            nationality: member.nationality || '',
            date_of_birth: member.date_of_birth ? member.date_of_birth.split('T')[0] : '',
            hire_date: member.hire_date ? member.hire_date.split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setShowForm(true);
    };

    const handleDelete = async (memberId) => {
        if (window.confirm('Вы уверены, что хотите удалить члена экипажа?')) {
            try {
                setActionError('');
                setSuccessMessage('');
                await deleteCrewMember(memberId);
                setSuccessMessage('Член экипажа удален');
                loadCrew();
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (err) {
                setActionError(`Ошибка при удалении: ${err.response?.data?.error || err.message}`);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            patronymic: '',
            position_id: '',
            passport_number: '',
            nationality: '',
            date_of_birth: '',
            hire_date: new Date().toISOString().split('T')[0]
        });
        setEditingMember(null);
        setShowForm(false);
        setActionError('');
    };

    if (loading) {
        return <Spinner />;
    }

    const selectedVesselName = vessels.find(v => v.id === parseInt(selectedVessel))?.name || '';

    return (
        <div className="min-vh-100 bg-light">
            <div className="container py-4">
                <div className="mb-4">
                    <h2 style={{ color: '#667eea' }}>Управление экипажем</h2>
                </div>

                {error && <ErrorAlert error={error} />}
                {actionError && <ErrorAlert error={actionError} />}
                {successMessage && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        {successMessage}
                        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                    </div>
                )}

                <div className="card shadow-sm mb-4">
                    <div className="card-header" style={{ backgroundColor: '#667eea', color: 'white' }}>
                        <h5 className="mb-0">Выберите судно</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-8">
                                <select
                                    className="form-select"
                                    value={selectedVessel}
                                    onChange={(e) => setSelectedVessel(e.target.value)}
                                >
                                    <option value="">Выберите судно</option>
                                    {vessels.map(vessel => (
                                        <option key={vessel.id} value={vessel.id}>
                                            {vessel.name} {vessel.imo_number ? `(IMO: ${vessel.imo_number})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedVessel && (
                                <div className="col-md-4">
                                    <button
                                        className="btn w-100"
                                        style={{ backgroundColor: '#667eea', color: 'white' }}
                                        onClick={() => {
                                            resetForm();
                                            setShowForm(true);
                                        }}
                                    >
                                        + Добавить члена экипажа
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {selectedVessel && (
                    <>
                        {showForm && (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header" style={{ backgroundColor: '#667eea', color: 'white' }}>
                                    <h5 className="mb-0">
                                        {editingMember ? 'Редактирование члена экипажа' : 'Новый член экипажа'}
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleSubmit}>
                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Имя *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="first_name"
                                                    value={formData.first_name}
                                                    onChange={handleFormChange}
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Фамилия *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="last_name"
                                                    value={formData.last_name}
                                                    onChange={handleFormChange}
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Отчество</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="patronymic"
                                                    value={formData.patronymic}
                                                    onChange={handleFormChange}
                                                    maxLength={50}
                                                />
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Должность *</label>
                                                <select
                                                    className="form-select"
                                                    name="position_id"
                                                    value={formData.position_id}
                                                    onChange={handleFormChange}
                                                >
                                                    <option value="">Выберите должность</option>
                                                    {positions.map(pos => (
                                                        <option key={pos.id} value={pos.id}>
                                                            {pos.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Национальность</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="nationality"
                                                    value={formData.nationality}
                                                    onChange={handleFormChange}
                                                    maxLength={50}
                                                />
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Паспорт</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="passport_number"
                                                    value={formData.passport_number}
                                                    onChange={handleFormChange}
                                                    maxLength={20}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Дата рождения</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    name="date_of_birth"
                                                    value={formData.date_of_birth}
                                                    onChange={handleFormChange}
                                                />
                                            </div>
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
                                <h5 className="mb-0">Экипаж судна "{selectedVesselName}" ({crew.length})</h5>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead style={{ backgroundColor: '#f5f5f5' }}>
                                        <tr>
                                            <th>ФИО</th>
                                            <th>Должность</th>
                                            <th>Национальность</th>
                                            <th>Паспорт</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {crew.map((member) => (
                                            <tr key={member.id}>
                                                <td>
                                                    <strong>
                                                        {member.last_name} {member.first_name}
                                                        {member.patronymic && ` ${member.patronymic}`}
                                                    </strong>
                                                </td>
                                                <td>{member.position_name}</td>
                                                <td>{member.nationality || '-'}</td>
                                                <td>{member.passport_number || '-'}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-primary me-2"
                                                        onClick={() => handleEdit(member)}
                                                        style={{ backgroundColor: '#667eea', borderColor: '#667eea' }}
                                                    >
                                                        Редактировать
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(member.id)}
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {crew.length === 0 && (
                                <div className="text-center py-5">
                                    <p className="text-muted">Нет членов экипажа для этого судна</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Crew;
