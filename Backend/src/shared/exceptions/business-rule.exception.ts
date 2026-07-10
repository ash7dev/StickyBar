import { DomainException } from './domain.exception';

export class BusinessRuleException extends DomainException {
  constructor(message: string, code: string) {
    super(message, code, 422);
    this.name = 'BusinessRuleException';
  }
}
