import { companiesRepository, CompaniesRepository } from './companies.repository.js';
import { Company, UpdateCompanyDto } from './companies.types.js';
import { NotFoundError } from '../../utils/errors.js';

export class CompaniesService {
  constructor(private readonly repo: CompaniesRepository = companiesRepository) {}

  async getCompanies(): Promise<Company[]> {
    return this.repo.findAll();
  }

  async getCompanyById(id: string): Promise<Company> {
    const company = await this.repo.findById(id);
    if (!company) {
      throw new NotFoundError(`Company with ID '${id}' not found`);
    }
    return company;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.repo.update(id, dto);
    if (!company) {
      throw new NotFoundError(`Company with ID '${id}' not found to update`);
    }
    return company;
  }
}

export const companiesService = new CompaniesService();
