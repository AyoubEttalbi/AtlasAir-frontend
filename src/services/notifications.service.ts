import api from './api';

const notificationsService = {
  async getByUser(userId: string) {
    const res = await api.get(`/notifications/user/${userId}`);
    return res.data;
  },
  async getByReservation(reservationId: string) {
    const res = await api.get(`/notifications/reservation/${reservationId}`);
    return res.data;
  },
  async getAll() {
    const res = await api.get('/notifications');
    return res.data;
  },
  async create(payload: any) {
    const res = await api.post('/notifications', payload);
    return res.data;
  },
};

export default notificationsService;
