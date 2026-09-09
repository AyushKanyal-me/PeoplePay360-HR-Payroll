import { departmentsRepository, DepartmentsRepository } from './departments.repository.js';
import { Department, CreateDepartmentDto, UpdateDepartmentDto, DepartmentQueryDto } from './departments.types.js';
import { NotFoundError } from '../../utils/errors.js';

export class DepartmentsService {
  constructor(private readonly repo: DepartmentsRepository = departmentsRepository) {}

  async getDepartments(query: DepartmentQueryDto) {
    return this.repo.findAll(query);
  }

  async getDepartmentById(id: string): Promise<Department> {
    const dept = await this.repo.findById(id);
    if (!dept) {
      throw new NotFoundError(`Department with ID '${id}' not found`);
    }
    return dept;
  }

  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    return this.repo.create(dto);
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    const dept = await this.repo.update(id, dto);
    if (!dept) {
      throw new NotFoundError(`Department with ID '${id}' not found to update`);
    }
    return dept;
  }

  async deleteDepartment(id: string): Promise<boolean> {
    await this.getDepartmentById(id);
    return this.repo.delete(id);
  }
}

export const departmentsService = new DepartmentsService();
