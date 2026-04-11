import { IsString, IsNumber, IsArray, IsOptional, ValidateIf, IsIn, ArrayNotEmpty } from 'class-validator';

export class ChatroomDto {
  @IsIn(['dm', 'group'])
  type: 'dm' | 'group';

  @ValidateIf(o => o.type === 'dm')
  @IsNumber()
  @IsOptional()
  member?: number;

  @ValidateIf(o => o.type === 'group')
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @IsOptional()
  membersArray?: number[];

  @ValidateIf(o => o.type === 'group')
  @IsString()
  @IsOptional()
  title?: string;
}
