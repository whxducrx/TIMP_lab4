require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDatabase } = require('./db/db');
const { verifyToken, requireAdmin } = require('./middlewares/jwtAuth');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const authController = require('./controllers/authController');
const incidentsController = require('./controllers/incidentsController');
const vesselsController = require('./controllers/vesselsController');
const crewController = require('./controllers/crewController');
const usersController = require('./controllers/usersController');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(morgan('combined'));
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb'}));

app.get('/api/health', (req, res) => {
    res.json({status: 'OK', timestamp: new Date().toISOString()});
});

app.post('/api/auth/register', authController.register);

app.post('/api/auth/login', authController.login);

app.post('/api/auth/refresh', authController.refreshAccessToken);

app.get('/api/auth/profile', verifyToken, authController.getProfile);

app.put('/api/auth/profile', verifyToken, authController.updateProfile);

app.post('/api/auth/change-password', verifyToken, authController.changePassword);

app.get('/api/auth/users', verifyToken, requireAdmin, authController.getAllUsers);

app.get('/api/vessels', verifyToken, vesselsController.getVessels);

app.get('/api/vessels/:id', verifyToken, vesselsController.getVesselById);

app.post('/api/vessels', verifyToken, requireAdmin, vesselsController.createVessel);

app.put('/api/vessels/:id', verifyToken, requireAdmin, vesselsController.updateVessel);

app.delete('/api/vessels/:id', verifyToken, requireAdmin, vesselsController.deleteVessel);

app.get('/api/incidents', verifyToken, incidentsController.getIncidents);

app.get('/api/incidents/:id', verifyToken, incidentsController.getIncidentById);

app.post('/api/incidents', verifyToken, incidentsController.createIncident);

app.put('/api/incidents/:id', verifyToken, incidentsController.updateIncident);

app.delete('/api/incidents/:id', verifyToken, incidentsController.deleteIncident);

app.get('/api/positions', verifyToken, crewController.getPositions);

app.post('/api/positions', verifyToken, requireAdmin, crewController.createPosition);

app.get('/api/crew/:vessel_id', verifyToken, crewController.getVesselCrew);

app.get('/api/crew/member/:id', verifyToken, crewController.getCrewMember);

app.post('/api/crew', verifyToken, requireAdmin, crewController.addCrewMember);

app.put('/api/crew/:id', verifyToken, requireAdmin, crewController.updateCrewMember);

app.delete('/api/crew/:id', verifyToken, requireAdmin, crewController.deleteCrewMember);

app.get('/api/admin/users', verifyToken, requireAdmin, usersController.getAllUsers);

app.get('/api/admin/users/:id', verifyToken, requireAdmin, usersController.getUserById);

app.put('/api/admin/users/:id/role', verifyToken, requireAdmin, usersController.changeUserRole);

app.put('/api/admin/users/:id/deactivate', verifyToken, requireAdmin, usersController.deactivateUser);

app.put('/api/admin/users/:id/activate', verifyToken, requireAdmin, usersController.activateUser);

app.use(notFoundHandler);

app.use(errorHandler);

try{
    connectDatabase();
    app.listen(PORT, () => {console.log(`listen on ${PORT}`);});
}catch(error){
    console.error('ошибка:', error);
}


module.exports = app;