import { useEffect, useState } from 'react';
import { AdminLayout } from '../AdminLayout';
import { usersService, User } from '@services';
import { UserRole } from '@services/types/api.types';
import { ApiError } from '@services/types/api.types';
import { useToast } from '@components/Toast/Toast';
import Button from '@shared/ui/Button';
import { TextField } from '@shared/ui/Input';
import { Modal } from '@shared/ui/Modal/Modal';
import styles from './Users.module.scss';

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CLIENT' as 'ADMIN' | 'CLIENT',
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersService.getAll();
      setUsers(data);
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to load users'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'CLIENT',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role as 'ADMIN' | 'CLIENT',
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const submitData: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        role: formData.role,
      };

      if (editingUser) {
        if (formData.password) {
          submitData.password = formData.password;
        }
        await usersService.update(editingUser.id, submitData);
        showSuccess('User updated successfully');
      } else {
        submitData.password = formData.password;
        await usersService.create(submitData);
        showSuccess('User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to save user'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await usersService.delete(id);
      showSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      const apiError = err as ApiError;
      showError(
        typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to delete user'
      );
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading users...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles['users-page']}>
        <div className={styles['page-header']}>
          <h1>Manage Users</h1>
          <Button onClick={handleCreate}>+ Add User</Button>
        </div>

        <div className={styles['table-container']}>
          <table className={styles['data-table']}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <span
                      className={`${styles['role-badge']} ${
                        user.role === UserRole.ADMIN
                          ? styles['admin']
                          : styles['client']
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles['status-badge']} ${
                        user.isActive ? styles['active'] : styles['inactive']
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles['action-buttons']}>
                      <button
                        onClick={() => handleEdit(user)}
                        className={styles['edit-btn']}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className={styles['delete-btn']}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal opened={showModal} setOpened={setShowModal}>
          <div className={styles['user-form']}>
            <h2>{editingUser ? 'Edit User' : 'Create User'}</h2>
            
            <div className={styles['form-section']}>
              <h3>Account Information</h3>
              <div className={styles['form-grid']}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <TextField
                label={editingUser ? 'New Password (leave empty to keep current)' : 'Password'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              </div>
            </div>

            <div className={styles['form-section']}>
              <h3>Permissions & Status</h3>
              <div className={styles['form-grid']}>
              <div>
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'CLIENT' })
                  }
                  required
                >
                  <option value="CLIENT">CLIENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                  Active User
                </label>
              </div>
              </div>
            </div>
            <div className={styles['form-actions']}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

