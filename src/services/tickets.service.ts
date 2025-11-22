import api from './api';

const ticketsService = {
  async getByReservation(reservationId: string) {
    const res = await api.get(`/tickets/reservation/${reservationId}`);
    return res.data;
  },
  async getById(id: string) {
    const res = await api.get(`/tickets/${id}`);
    return res.data;
  },
  async getAll() {
    const res = await api.get('/tickets');
    return res.data;
  },
  async create(payload: any) {
    const res = await api.post('/tickets', payload);
    return res.data;
  },
  async update(id: string, payload: any) {
    const res = await api.patch(`/tickets/${id}`, payload);
    return res.data;
  },
  async remove(id: string) {
    const res = await api.delete(`/tickets/${id}`);
    return res.data;
  },
};

export default ticketsService;
