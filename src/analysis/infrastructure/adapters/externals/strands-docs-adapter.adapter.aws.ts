import { Injectable, Logger } from '@nestjs/common';
import {
  ECSClient,
  ECSClientConfig,
  RunTaskCommand,
  DescribeTasksCommand,
  Task,
} from '@aws-sdk/client-ecs';
import { S3Client, S3ClientConfig, GetObjectCommand } from '@aws-sdk/client-s3';
import { IDocumentationAgentPort } from '../../../application/ports/externals/docs-agent-port.port';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import {
  DocsAgentResponse,
  DocsAgentResponsePayload,
} from '../../../application/DTOs/models/responses/docs-agent-response-model.model';
import { ConfigurationService } from '../../configuration/configuration.service';

@Injectable()
export class ECSDocumentationAnalysisAdapter implements IDocumentationAgentPort {
  private readonly logger = new Logger(ECSDocumentationAnalysisAdapter.name);
  private readonly ecsClient: ECSClient;
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigurationService) {
    const clientConfig: Partial<ECSClientConfig & S3ClientConfig> = {
      region: this.configService.awsRegion,
    };

    if (this.configService.awsAccessKeyId && this.configService.awsSecretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: this.configService.awsAccessKeyId,
        secretAccessKey: this.configService.awsSecretAccessKey,
      };
    }

    this.ecsClient = new ECSClient(clientConfig as ECSClientConfig);
    this.s3Client = new S3Client(clientConfig as S3ClientConfig);
  }

  public async runAnalysis(model: AgentRequest): Promise<DocsAgentResponse> {
    const analysisId = String(model.id.value);
    this.logger.log(`[ECS Docs] Executing AWS ECS Agent for: ${analysisId}`);

    try {
      await this.runEcsTask(analysisId);

      const rawJson = await this.fetchResultFromS3(analysisId);
      const parsed = JSON.parse(rawJson) as Record<string, unknown>;

      if (!parsed['analysis_report']) {
        throw new Error('Retrieved JSON does not contain a valid documentation analysis report.');
      }

      this.logger.log('[ECS Docs] Analysis result successfully retrieved from S3.');

      const report = parsed['analysis_report'] as Record<string, unknown>;
      report['metadata'] = {
        ...(report['metadata'] as Record<string, unknown>),
        repository: analysisId,
        status: 'success',
      };

      return new DocsAgentResponse(parsed as unknown as DocsAgentResponsePayload);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ECS Docs] Critical error during execution: ${errorMessage}`);
      return this.createFallbackResponse(analysisId);
    }
  }

  private async runEcsTask(analysisId: string): Promise<void> {
    const cluster = this.configService.ecsClusterName;
    const taskDefinition = this.configService.ecsTaskDefinitionDocs;
    const subnet = this.configService.ecsSubnet;
    const securityGroup = this.configService.ecsSecurityGroup;
    const containerName = 'docs-agent-container';

    const runCommand = new RunTaskCommand({
      cluster,
      taskDefinition: taskDefinition,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [subnet],
          securityGroups: [securityGroup],
          assignPublicIp: 'ENABLED',
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: containerName,
            environment: [
              { name: 'ANALYSIS_ID', value: analysisId },
              { name: 'S3_BUCKET_NAME', value: this.configService.s3BucketName },
            ],
          },
        ],
      },
    });

    const runResult = await this.ecsClient.send(runCommand);

    if (!runResult.tasks || runResult.tasks.length === 0) {
      throw new Error('Failed to launch ECS Docs task.');
    }

    const taskArn = runResult.tasks[0].taskArn as string;
    await this.waitForTaskCompletion(cluster, taskArn);
  }

  private async waitForTaskCompletion(cluster: string, taskArn: string): Promise<void> {
    let isRunning = true;
    while (isRunning) {
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const describeCommand = new DescribeTasksCommand({ cluster, tasks: [taskArn] });
      const response = await this.ecsClient.send(describeCommand);
      const task: Task | undefined = response.tasks?.[0];

      if (task && task.lastStatus === 'STOPPED') {
        isRunning = false;
        if (task.containers?.[0]?.exitCode !== 0) {
          const reason = task.containers?.[0]?.reason || 'Unknown error';
          throw new Error(`ECS Docs Task failed with non-zero exit code. Reason: ${reason}`);
        }
      }
    }
  }

  private async fetchResultFromS3(analysisId: string): Promise<string> {
    const bucketName = this.configService.s3BucketName;
    const s3Key = `jobs/${analysisId}/docs_report.json`;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const response = await this.s3Client.send(command);
    const body = await response.Body?.transformToString('utf-8');

    if (!body) {
      throw new Error('Downloaded docs report from S3 is empty.');
    }

    return body;
  }

  private createFallbackResponse(repository: string): DocsAgentResponse {
    return new DocsAgentResponse({
      analysis_report: {
        metadata: {
          repository: repository,
          status: 'error',
        },
        API_standard_violations: [],
        docs_discrepancies: [],
        missing_files: [],
        dependency_audit: {
          readme_defined: [],
          config_defined: [],
          missing_in_config: [],
          undocumented_in_readme: [],
          version_mismatches: [],
        },
      },
    });
  }
}
