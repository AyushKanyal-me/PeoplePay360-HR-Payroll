import { employeesRepository, EmployeesRepository } from './employees.repository.js';
import {
  Employee,
  EmployeeSmartCounts,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto
} from './employees.types.js';
import { NotFoundError } from '../../utils/errors.js';

export class EmployeesService {
  constructor(private readonly repo: EmployeesRepository = employeesRepository) {}

  async getEmployees(query: EmployeeQueryDto) {
    return this.repo.findAll(query);
  }

  async getEmployeeById(id: string): Promise<Employee> {
    const employee = await this.repo.findById(id);
    if (!employee) {
      throw new NotFoundError(`Employee with ID '${id}' not found`);
    }
    return employee;
  }

  async createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
    return this.repo.create(dto);
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.repo.update(id, dto);
    if (!employee) {
      throw new NotFoundError(`Employee with ID '${id}' not found to update`);
    }
    return employee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    await this.getEmployeeById(id);
    return this.repo.delete(id);
  }

  async getSmartCounts(id: string): Promise<EmployeeSmartCounts> {
    await this.getEmployeeById(id);
    return this.repo.getSmartCounts(id);
  }
}

export const employeesService = new EmployeesService();
