import { contractsRepository, ContractsRepository } from './contracts.repository.js';
import { Contract, CreateContractDto, UpdateContractDto, ContractQueryDto } from './contracts.types.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export class ContractsService {
  constructor(private readonly repo: ContractsRepository = contractsRepository) {}

  async getContracts(query: ContractQueryDto) {
    return this.repo.findAll(query);
  }

  async getContractById(id: string): Promise<Contract> {
    const contract = await this.repo.findById(id);
    if (!contract) {
      throw new NotFoundError(`Contract with ID '${id}' not found`);
    }
    return contract;
  }

  async createContract(dto: CreateContractDto): Promise<Contract> {
    return this.repo.create(dto);
  }

  async updateContract(id: string, dto: UpdateContractDto): Promise<Contract> {
    const contract = await this.repo.update(id, dto);
    if (!contract) {
      throw new NotFoundError(`Contract with ID '${id}' not found to update`);
    }
    return contract;
  }

  async closeContract(id: string): Promise<Contract> {
    const existing = await this.getContractById(id);
    if (existing.status === 'EXPIRED' || existing.status === 'TERMINATED') {
      throw new BadRequestError(`Contract is already in '${existing.status}' status`);
    }

    const today = new Date().toISOString().split('T')[0]!;
    const closed = await this.repo.close(id, today);
    if (!closed) {
      throw new NotFoundError(`Contract with ID '${id}' not found to close`);
    }
    return closed;
  }
}

export const contractsService = new ContractsService();
