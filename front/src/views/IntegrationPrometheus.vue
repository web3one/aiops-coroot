<template>
    <v-form v-model="valid" ref="form" style="max-width: 800px">
        <v-alert v-if="form.global" color="primary" outlined text>
            此项目使用全局 Prometheus 配置，无法通过 UI 更改
        </v-alert>

        <v-checkbox v-model="form.use_clickhouse" label="使用 ClickHouse 存储指标" class="my-2" hide-details :disabled="form.global" />
        <div class="caption mb-3">启用后，将使用 ClickHouse 代替 Prometheus 存储指标。</div>

        <div class="subtitle-1">Prometheus URL</div>
        <div class="caption">Coroot 基于存储在 Prometheus 服务器中的遥测数据运行。</div>
        <v-text-field
            outlined
            dense
            v-model="form.url"
            :rules="[$validators.notEmpty, $validators.isUrl]"
            placeholder="https://prom.example.com:9090"
            hide-details="auto"
            class="flex-grow-1"
            single-line
            :disabled="form.global || form.use_clickhouse"
        />
        <v-checkbox
            v-model="form.tls_skip_verify"
            :disabled="!form.url.startsWith('https') || form.global || form.use_clickhouse"
            label="跳过 TLS 验证"
            hide-details
            class="my-2"
        />

        <v-checkbox v-model="basic_auth" label="HTTP 基础认证" class="my-2" hide-details :disabled="form.global || form.use_clickhouse" />
        <div v-if="basic_auth" class="d-flex gap">
            <v-text-field
                outlined
                dense
                v-model="form.basic_auth.user"
                label="用户名"
                hide-details
                single-line
                :disabled="form.global || form.use_clickhouse"
            />
            <v-text-field
                v-model="form.basic_auth.password"
                label="密码"
                type="password"
                outlined
                dense
                hide-details
                single-line
                :disabled="form.global || form.use_clickhouse"
            />
        </div>

        <v-checkbox v-model="custom_headers" label="自定义 HTTP 请求头" class="my-2" hide-details :disabled="form.global || form.use_clickhouse" />
        <template v-if="custom_headers">
            <div v-for="(h, i) in form.custom_headers" :key="i" class="d-flex gap mb-2 align-center">
                <v-text-field outlined dense v-model="h.key" label="请求头" hide-details single-line :disabled="form.global || form.use_clickhouse" />
                <v-text-field
                    outlined
                    dense
                    v-model="h.value"
                    type="password"
                    label="值"
                    hide-details
                    single-line
                    :disabled="form.global || form.use_clickhouse"
                />
                <v-btn @click="form.custom_headers.splice(i, 1)" icon small :disabled="form.global || form.use_clickhouse">
                    <v-icon small>mdi-trash-can-outline</v-icon>
                </v-btn>
            </div>
            <v-btn color="primary" @click="form.custom_headers.push({ key: '', value: '' })" :disabled="form.global || form.use_clickhouse"
                >添加请求头</v-btn
            >
        </template>

        <div class="subtitle-1 mt-3">刷新间隔</div>
        <div class="caption">
            Coroot 从 Prometheus 获取遥测数据的频率。该值必须大于 Prometheus 服务器的
            <a href="https://prometheus.io/docs/prometheus/latest/configuration/configuration/" target="_blank" rel="noopener noreferrer"
                ><var>scrape_interval</var></a
            >。
        </div>
        <v-select v-model="form.refresh_interval" :items="refreshIntervals" outlined dense :menu-props="{ offsetY: true }" :disabled="form.global" />

        <div class="subtitle-1">额外选择器</div>
        <div class="caption">将添加到每个 Prometheus 查询的额外指标选择器（例如：<var>{cluster="us-west-1"}</var>）</div>
        <v-text-field
            outlined
            dense
            v-model="form.extra_selector"
            :rules="[$validators.isPrometheusSelector]"
            single-line
            :disabled="form.global || form.use_clickhouse"
        />

        <div class="subtitle-1">远程写入 (Remote Write) URL</div>
        <div class="caption">
            如果您在集群模式下使用 VictoriaMetrics 等 Prometheus 替代品，可能需要配置不同的远程写入 URL。默认情况下，Coroot 会在上述配置的基础 URL 后附加 <var>/api/v1/write</var>。
        </div>
        <v-text-field
            outlined
            dense
            v-model="form.remote_write_url"
            :rules="[$validators.isUrl]"
            single-line
            :disabled="form.global || form.use_clickhouse"
        />

        <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text>
            {{ error }}
        </v-alert>
        <v-alert v-if="message" color="green" outlined text>
            {{ message }}
        </v-alert>
        <v-btn block color="primary" @click="save" :disabled="(!valid && !form.use_clickhouse) || form.global" :loading="loading">保存</v-btn>
    </v-form>
</template>

<script>
const refreshIntervals = [
    { value: 5000, text: '5 秒' },
    { value: 10000, text: '10 秒' },
    { value: 15000, text: '15 秒' },
    { value: 30000, text: '30 秒' },
    { value: 60000, text: '60 秒' },
];

export default {
    data() {
        return {
            form: {
                url: '',
                tls_skip_verify: false,
                basic_auth: null,
                custom_headers: [],
                refresh_interval: 0,
                extra_selector: '',
                remote_write_url: '',
                use_clickhouse: false,
            },
            basic_auth: false,
            custom_headers: true,
            valid: false,
            loading: false,
            error: '',
            message: '',
        };
    },

    mounted() {
        this.get();
    },

    watch: {
        custom_headers(v) {
            if (v && !this.form.custom_headers.length) {
                this.form.custom_headers.push({ key: '', value: '' });
            }
        },
    },

    computed: {
        refreshIntervals() {
            return refreshIntervals;
        },
    },

    methods: {
        get() {
            this.loading = true;
            this.error = '';
            this.$api.getIntegrations('prometheus', (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.form = Object.assign({}, this.form, data);
                if (!this.form.basic_auth) {
                    this.form.basic_auth = { user: '', password: '' };
                    this.basic_auth = false;
                } else {
                    this.basic_auth = true;
                }
                if (!this.form.custom_headers) {
                    this.form.custom_headers = [];
                }
                this.custom_headers = !!this.form.custom_headers.length;
            });
        },
        save() {
            this.loading = true;
            this.error = '';
            const form = JSON.parse(JSON.stringify(this.form));
            if (!this.basic_auth) {
                form.basic_auth = null;
            }
            if (!this.custom_headers) {
                form.custom_headers = [];
            }
            this.message = '';
            this.$api.saveIntegrations('prometheus', 'save', form, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.$events.emit('refresh');
                this.message = '设置更新成功。更改将在一两分钟内生效。';
                setTimeout(() => {
                    this.message = '';
                }, 3000);
                this.get();
            });
        },
    },
};
</script>

<style scoped>
.gap {
    gap: 16px;
}
</style>
