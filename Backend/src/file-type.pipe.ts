import {
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

@Injectable()
export class FileTypeValidationPipe implements PipeTransform {
  async transform(file: Express.Multer.File) {
    if (!file) return file;

    const type = await fileTypeFromBuffer(file.buffer);

    if (!type) {
      throw new BadRequestException('파일 형식을 확인할 수 없습니다.');
    }

    const blockedMimeTypes = [
      'application/x-msdownload',
      'application/x-ms-installer',
      'application/x-sh', 
      'application/x-dosexec',
      'application/java-archive',
      'application/x-msdos-program',
    ];

    if (blockedMimeTypes.includes(type.mime)) {
      throw new BadRequestException('실행 파일은 전송할 수 없습니다.');
    }

    return file;
  }
}
