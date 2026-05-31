import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {getIncidentById, deleteIncident} from '../services/api';
import Spinner from '../components/Spinner';
import ErrorAlert from '../components/ErrorAlert';

function Detail(){
    const {id} = useParams();
    const navigate = useNavigate();
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const getIncident = async () => {
        try{
            setLoading(true);
            setError('');
            const data = await getIncidentById(parseInt(id));
            setIncident(data);
        }catch(err){
            const status = err.response?.status;
            let errorMsg = `Ошибка при загрузке данных (${status})`;
            if(status === 404){
                errorMsg = `Инцидент не найден (404)`;
            }else if(status === 500){
                errorMsg = `Ошибка сервера (500)`;
            }
            setError(errorMsg);
            setIncident(null);
        }finally{
            setLoading(false);
        }
    };

    useEffect(() => {
        getIncident();
    }, [id]);

    const handleDelete = async () => {
        if(!window.confirm('Вы уверены, что хотите удалить этот инцидент?')){
            return;
        }
        try{
            setDeleting(true);
            setError('');
            await deleteIncident(parseInt(id));
            navigate('/');
        }catch(err){
            setError('Ошибка при удалении инцидента');
            setDeleting(false);
        }
    };

    const getStatusClass = (status) => {
        switch(status){
            case 'Открыт':
                return 'bg-success';
            case 'В работе':
                return 'bg-warning';
            case 'Закрыт':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    const getSeverityColor = (criticality) => {
        switch(criticality){
            case 'Высокая':
                return '#dc3545';
            case 'Средняя':
                return '#ffc107';
            case 'Низкая':
                return '#28a745';
            default:
                return '#6c757d';
        }
    };

    return(
        <div className="min-vh-100 bg-light">
            <div className="container py-4">
                <ErrorAlert error={error} />
                {loading ? (
                    <Spinner />
                ) : !incident ? (
                    <div className="text-center mt-4"></div>
                ) : (
                    <div className="row">
                        <div className="col-md-8 mx-auto">
                            <button 
                                className="btn btn-secondary btn-sm mb-3"
                                onClick={() => navigate('/')}
                            >
                                Назад
                            </button>
                            <div className="card shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div>
                                            <h2 className="card-title mb-0">{incident.title}</h2>
                                            <span className={`badge ${getStatusClass(incident.status)}`}>
                                                {incident.status}
                                            </span>
                                        </div>
                                        <div>
                                            <button 
                                                className="btn btn-sm me-2"
                                                onClick={() => navigate(`/form?edit=${incident.id}`)}
                                                style={{backgroundColor: '#7c3aed', color: 'white', borderColor: '#7c3aed'}}
                                            >
                                                Редактировать
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger"
                                                onClick={handleDelete}
                                                disabled={deleting}
                                            >
                                                {deleting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                                        Удаление...
                                                    </>
                                                ) : (
                                                    <>
                                                        Удалить
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Судно:</label>
                                        <p className="text-muted">{incident.vessel_name || 'Судно не указано'}</p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Место:</label>
                                        <p className="text-muted">{incident.placement}</p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Тип инцидента:</label>
                                        <p className="text-muted">{incident.type}</p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Критичность:</label>
                                        <p>
                                            <span className="badge" style={{backgroundColor: getSeverityColor(incident.criticality)}}>
                                                {incident.criticality}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Дата создания:</label>
                                        <p className="text-muted">{incident.created_at}</p>
                                    </div>

                                    {incident.resolved_at && (
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Дата устранения:</label>
                                            <p className="text-muted">{incident.resolved_at}</p>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Описание:</label>
                                        <div className="p-3 bg-light border rounded">
                                            <p className="text-muted mb-0">{incident.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Detail;