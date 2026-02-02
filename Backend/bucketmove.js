import { ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import bucketModule from './bucket.js';
const { s3 } = bucketModule;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('./.env') }); // 경로 조정

const SOURCE_BUCKET = "velocibet"; // 옮길 버킷
const TARGET_BUCKET = "velocibet-chats"; // 새 버킷

async function moveAllFiles() {
  let continuationToken = undefined;

  do {
    // 1️⃣ 버킷 안의 파일 목록 가져오기
    const listCommand = new ListObjectsV2Command({
      Bucket: SOURCE_BUCKET,
      ContinuationToken: continuationToken,
    });

    const listResponse = await s3.send(listCommand);
    const objects = listResponse.Contents || [];

    for (const obj of objects) {
      const key = obj.Key;
      if (!key) continue;
      try {
        // 2️⃣ 파일 복사 (CopySource는 버킷/키 형태이며 키는 URI 인코딩 필요)
        const copyCommand = new CopyObjectCommand({
          Bucket: TARGET_BUCKET,
          CopySource: `${SOURCE_BUCKET}/${encodeURIComponent(key)}`,
          Key: key,
        });
        await s3.send(copyCommand);

        // 3️⃣ 원본 파일 삭제 (완전 이동을 원할 경우)
        const deleteCommand = new DeleteObjectCommand({
          Bucket: SOURCE_BUCKET,
          Key: key,
        });
        await s3.send(deleteCommand);

        console.log(`Moved: ${key}`);
      } catch (err) {
        console.error(`Failed to move ${key}:`, err);
      }
    }

    continuationToken = listResponse.NextContinuationToken;
  } while (continuationToken);
}

moveAllFiles()
  .then(() => console.log("All files moved!"))
  .catch(console.error);
