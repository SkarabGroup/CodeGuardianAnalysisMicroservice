import { Injectable, Logger } from '@nestjs/common';
import { IGitClonePort } from '../../../application/ports/externals/github-clone-port.port';
import { CloneRepoResponse } from '../../../application/DTOs/models/responses/clone-repo-response-model.model';
import { CloneRepoRequest } from '../../../application/DTOs/models/requests/clone-repo-request-model.model';
import { S3Client, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { ConfigurationService } from '../../configuration/configuration.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as tar from 'tar';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class S3Adapter implements IGitClonePort {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(S3Adapter.name);

  constructor(private readonly configService: ConfigurationService) {
    const s3Config: S3ClientConfig = {
      region: this.configService.awsRegion,
    };

    if (this.configService.awsAccessKeyId && this.configService.awsSecretAccessKey) {
      s3Config.credentials = {
        accessKeyId: this.configService.awsAccessKeyId,
        secretAccessKey: this.configService.awsSecretAccessKey,
      };
    }

    this.s3Client = new S3Client(s3Config);
  }

  private extractRepoPath(repositoryUrl: string): string {
    return repositoryUrl.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
  }

  public async clone(request: CloneRepoRequest): Promise<CloneRepoResponse> {
    this.logger.log('Inside S3 Adapter');
    const analysisId = request.analysisId.value;
    const tempPath = path.join('/tmp', analysisId);
    const tarPath = path.join('/tmp', `${analysisId}.tar.gz`);
    const bucketName = this.configService.s3BucketName;

    try {
      await execAsync(`rm -rf ${tempPath}`);

      const token = request.patToken?.value || this.configService.codeGuardianToken;
      const authPart = token ? `${token}@` : '';
      const repoPath = this.extractRepoPath(request.repoUrl.value);
      const repoUrlWithAuth = `https://${authPart}github.com/${repoPath}.git`;

      this.logger.log(`Cloning: ${repoPath}`);

      if (request.commit) {
        await execAsync(`git clone --quiet ${repoUrlWithAuth} ${tempPath}`);
        await execAsync(`git -C ${tempPath} checkout --quiet ${request.commit.value}`);
      } else if (request.branch) {
        await execAsync(
          `git clone --quiet --depth 1 --branch ${request.branch.value} ${repoUrlWithAuth} ${tempPath}`,
        );
      } else {
        await execAsync(`git clone --quiet --depth 1 ${repoUrlWithAuth} ${tempPath}`);
      }

      await tar.c(
        {
          gzip: true,
          file: tarPath,
          cwd: tempPath,
        },
        ['.'],
      );

      const fileBuffer = fs.readFileSync(tarPath);
      const s3Key = `jobs/${analysisId}/input.tar.gz`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: fileBuffer,
          ContentType: 'application/gzip',
        }),
      );

      this.logger.log(`S3 Upload successful: ${s3Key}`);

      await execAsync(`rm -rf ${tempPath}`);
      if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);

      return CloneRepoResponse.success(s3Key);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`S3Adapter Failure: ${errorMessage}`);

      if (fs.existsSync(tempPath)) await execAsync(`rm -rf ${tempPath}`);
      if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);

      return CloneRepoResponse.failure(errorMessage);
    }
  }
}
