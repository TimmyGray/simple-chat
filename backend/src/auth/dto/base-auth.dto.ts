import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class BaseAuthDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email: string;
}
