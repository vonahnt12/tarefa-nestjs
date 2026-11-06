import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  author: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;

  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
