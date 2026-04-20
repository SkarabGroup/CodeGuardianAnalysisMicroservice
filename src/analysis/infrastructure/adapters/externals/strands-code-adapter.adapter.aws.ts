import { Injectable, Logger } from '@nestjs/common';
import {
  ECSClient,
  ECSClientConfig,
  RunTaskCommand,
  DescribeTasksCommand,
  Task,
} from '@aws-sdk/client-ecs';
import { S3Client, S3ClientConfig, GetObjectCommand } from '@aws-sdk/client-s3';
import { ICodeAgentPort } from '../../../application/ports/externals/code-agent-port.port';
import { AgentRequest } from '../../../application/DTOs/models/requests/agent-request-model.model';
import {
  CodeAgentResponse,
  CodeAgentResponsePayload,
} from '../../../application/DTOs/models/responses/code-agent-response-model.model';
import { ConfigurationService } from '../../configuration/configuration.service';

@Injectable()
export class ECSCodeAnalysisAdapter implements ICodeAgentPort {
  private readonly logger = new Logger(ECSCodeAnalysisAdapter.name);
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

  public async runAnalysis(model: AgentRequest): Promise<CodeAgentResponse> {
    const analysisId: string = String(model.id.value);
    this.logger.log(`[ECS Adapter] Executing AWS ECS Agent for: ${analysisId}`);

    try {
      await this.runEcsTask(analysisId);

      const rawJson = await this.fetchResultFromS3(analysisId);
      const parsed = JSON.parse(rawJson) as Record<string, unknown>;

      if (!parsed['analysis_report']) {
        throw new Error('Retrieved JSON does not contain a valid analysis report.');
      }

      this.logger.log('[ECS Adapter] Analysis result successfully retrieved from S3.');

      const report = parsed['analysis_report'] as Record<string, unknown>;
      report['metadata'] = {
        ...(report['metadata'] as Record<string, unknown>),
        repository: analysisId,
        status: 'success',
      };

      return new CodeAgentResponse(parsed as unknown as CodeAgentResponsePayload);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ECS Adapter] Critical error during execution: ${errorMessage}`);
      return this.createFallbackResponse(errorMessage);
    }
  }

  private createFallbackResponse(reason: string): CodeAgentResponse {
    this.logger.warn("I have failed and I'm now in createFallbackResponse");
    return new CodeAgentResponse({
      analysis_report: {
        metadata: { status: 'error' },
        ai_interpretation: {
          verdict: 'Critical',
          executive_summary: `The automated analysis failed. Details: ${reason}`,
          static_analysis_evaluation: { total_issues_analyzed: 0, key_issues_reasoning: [] },
          coverage_evaluation: { overall_health: 'Unknown', critical_files_reasoning: [] },
        },
      },
    });
  }

  private async runEcsTask(analysisId: string): Promise<void> {
    const cluster = this.configService.ecsClusterName;
    const taskDefinition = this.configService.ecsTaskDefinitionCode;
    const subnet = this.configService.ecsSubnet;
    const securityGroup = this.configService.ecsSecurityGroup;
    const containerName = 'code-agent-container';

    const runCommand = new RunTaskCommand({
      cluster,
      taskDefinition,
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
      throw new Error('Failed to launch ECS task.');
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
          throw new Error(`ECS Task failed with non-zero exit code. Reason: ${reason}`);
        }
      }
    }
  }

  private async fetchResultFromS3(analysisId: string): Promise<string> {
    const bucketName = this.configService.s3BucketName;
    const s3Key = `jobs/${analysisId}/code_report.json`;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const response = await this.s3Client.send(command);
    const body = await response.Body?.transformToString('utf-8');

    if (!body) {
      throw new Error('Downloaded file from S3 is empty.');
    }

    return body;
  }
}
