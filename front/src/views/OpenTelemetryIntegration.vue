<template>
    <v-dialog v-model="dialog" max-width="800">
        <template #activator="{ on, attrs }">
            <v-btn :color="color" :outlined="outlined" :small="small" v-bind="attrs" v-on="on">
                <slot></slot>
            </v-btn>
        </template>
        <v-card class="pa-5">
            <div class="d-flex align-center text-h5 mb-4">
                OpenTelemetry 集成
                <v-spacer />
                <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
            </div>
            <p>
                <a href="https://opentelemetry.io/" target="_blank">OpenTelemetry</a> 是一个厂商中立的开源项目，提供了一套用于收集和导出遥测数据的 API、SDK 和工具。OpenTelemetry 为许多流行的编程语言提供了 SDK，并提供了一个 Collector，允许您将遥测数据导出到一个或多个开源或商业后端。Coroot 可以作为 OpenTelemetry 的链路追踪 (traces) 和日志 (logs) 后端。遥测数据可以直接摄取到 Coroot 中，也可以通过 OpenTelemetry Collector 摄取。
            </p>

            <v-form v-model="valid">
                <div class="subtitle-2 mt-2">Coroot URL (必须可由检测的应用或 OpenTelemetry Collector 访问)：</div>
                <v-text-field
                    v-model="coroot_url"
                    :rules="[$validators.notEmpty, $validators.isUrl]"
                    placeholder="http://coroot:8080"
                    outlined
                    dense
                    hide-details
                />

                <div class="subtitle-2 mt-2">
                    API Key (可以在
                    <router-link :to="{ name: 'project_settings' }"><span @click="dialog = false">项目设置</span></router-link
                    > 中管理)：
                </div>
                <v-select
                    v-model="api_key"
                    :rules="[$validators.notEmpty]"
                    :items="api_keys === 'permission denied' ? [] : api_keys.map((k) => ({ value: k.key, text: `${k.key} (${k.description})` }))"
                    outlined
                    dense
                    hide-details
                    :menu-props="{ offsetY: true }"
                    :no-data-text="api_keys === 'permission denied' ? '只有项目管理员可以访问 API Key。' : '无可用 Key'"
                />

                <template v-if="tab === 0">
                    <div class="subtitle-2 mt-2">服务名称：</div>
                    <v-text-field v-model="service_name" :rules="[$validators.notEmpty, $validators.isSlug]" placeholder="catalog" outlined dense />
                </template>
            </v-form>

            <v-tabs v-model="tab" height="40" slider-size="2" class="mb-4">
                <v-tab><v-icon class="mr-1">mdi-application-braces-outline</v-icon>SDK</v-tab>
                <v-tab><v-icon class="mr-1">mdi-arrow-decision-outline</v-icon>OpenTelemetry Collector</v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
                <v-tab-item transition="none">
                    <p>使用相关的 OpenTelemetry SDK 检测您的应用：</p>

                    <ul class="my-2">
                        <li><a href="https://docs.coroot.com/tracing/opentelemetry-go" target="_blank">Go</a></li>
                        <li><a href="https://docs.coroot.com/tracing/opentelemetry-java" target="_blank">Java</a></li>
                        <li><a href="https://docs.coroot.com/tracing/opentelemetry-python" target="_blank">Python</a></li>
                        <li><a href="https://opentelemetry.io/docs/languages/cpp/getting-started/" target="_blank">C++</a></li>
                        <li><a href="https://opentelemetry.io/docs/languages/net/getting-started/" target="_blank">.NET</a></li>
                        <li><a href="https://opentelemetry.io/docs/languages/js/getting-started/" target="_blank">JavaScript</a></li>
                        <li><a href="https://opentelemetry.io/docs/languages/php/getting-started/" target="_blank">PHP</a></li>
                        <li><a href="https://opentelemetry.io/docs/languages/ruby/getting-started/" target="_blank">Ruby</a></li>
                        <li><a href="https://opentelemetry.io/docs/languages/rust/getting-started/" target="_blank">Rust</a></li>
                    </ul>

                    <p>使用以下环境变量配置 SDK 直接向 Coroot 发送链路追踪和日志：</p>

                    <Code :disabled="!valid">
                        <pre>
OTEL_SERVICE_NAME="{{ service_name }}" \
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="{{ coroot_url }}/v1/traces" \
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT="{{ coroot_url }}/v1/logs" \
OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf" \
OTEL_METRICS_EXPORTER="none" \
OTEL_EXPORTER_OTLP_HEADERS="x-api-key={{ api_key }}"
                        </pre>
                    </Code>
                </v-tab-item>

                <v-tab-item transition="none">
                    <p>
                        如果您的应用已经配置为向 OpenTelemetry Collector 发送日志和链路，您只需添加一个额外的 Exporter，使用 OTLP 协议将数据发送到 Coroot：
                    </p>

                    <Code :disabled="!valid">
                        <pre>
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:

exporters:
  otlphttp/coroot:
    endpoint: "{{ coroot_url }}"
    encoding: proto
    headers:
      "x-api-key": "{{ api_key }}"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlphttp/coroot]
    logs:
       receivers: [otlp]
       processors: [batch]
       exporters: [otlphttp/coroot]
                        </pre>
                    </Code>
                </v-tab-item>
            </v-tabs-items>
        </v-card>
    </v-dialog>
</template>

<script>
import Code from '../components/Code.vue';

export default {
    props: {
        color: String,
        outlined: Boolean,
        small: Boolean,
    },

    components: { Code },

    data() {
        const local = ['127.0.0.1', 'localhost'].some((v) => location.origin.includes(v));
        return {
            error: '',
            dialog: false,
            tab: null,
            coroot_url: !local ? location.origin : '',
            service_name: '',
            api_keys: [],
            api_key: '',
            valid: false,
        };
    },

    watch: {
        dialog() {
            this.dialog && this.get();
        },
    },

    methods: {
        get() {
            this.$api.getProject(this.$route.params.projectId, (data, error) => {
                if (error) {
                    this.error = error;
                    return;
                }
                this.api_keys = data.api_keys || [];
            });
        },
    },
};
</script>

<style scoped></style>
