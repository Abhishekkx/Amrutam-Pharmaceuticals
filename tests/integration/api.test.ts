import request from 'supertest';
import { createApp } from '../../src/app';
import { authService } from '../../src/services/auth.service';
import { doctorService } from '../../src/services/doctor.service';
import { Role } from '../../src/constants/enums';

const app = createApp();

jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/doctor.service');
jest.mock('../../src/repositories/prisma');

describe('API Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 OK with server uptime', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register user and return 201 Created', async () => {
      const mockRegisterResult = {
        user: { id: 'user-1', email: 'patient@amrutam.com', role: Role.PATIENT },
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
      };
      (authService.register as jest.Mock).mockResolvedValue(mockRegisterResult);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'patient@amrutam.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('mock_access_token');
    });
  });

  describe('GET /api/v1/doctors/search', () => {
    it('should return list of doctors with 200 OK', async () => {
      (doctorService.searchDoctors as jest.Mock).mockResolvedValue([
        { id: 'doc-1', specialty: 'Ayurveda General', rating: 4.9 },
      ]);

      const res = await request(app).get('/api/v1/doctors/search?specialty=Ayurveda');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });
});
